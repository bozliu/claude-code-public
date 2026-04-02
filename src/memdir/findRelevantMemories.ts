import { feature } from 'bun:bundle'
import { logForDebugging } from '../utils/debug.js'
import { errorMessage } from '../utils/errors.js'
import { getDefaultSonnetModel } from '../utils/model/model.js'
import { sideQuery } from '../utils/sideQuery.js'
import { jsonParse } from '../utils/slowOperations.js'
import type { MemoryType } from './memoryTypes.js'
import {
  formatRecallMemoryManifest,
  type MemoryHeader,
  scanMemoryFiles,
} from './memoryScan.js'

export type RelevantMemory = {
  path: string
  mtimeMs: number
  type: MemoryType | undefined
  localScore: number
  localRank: number
  sideQueryRank?: number
}

export type RelevantMemorySearchResult = {
  selected: RelevantMemory[]
  localTopCandidates: RelevantMemory[]
}

type ScoredMemory = MemoryHeader & {
  localScore: number
  localRank: number
}

const MAX_SIDEQUERY_CANDIDATES = 40
const MAX_LOCAL_TOP_CANDIDATES = 10

const TYPE_WEIGHTS: Partial<Record<MemoryType, number>> = {
  feedback: 3,
  user: 2,
  project: 1,
  reference: 0,
}

const QUERY_DOMAIN_TERMS: Record<string, string[]> = {
  planning: ['plan', 'approach', 'design', 'refactor'],
  coding: ['implement', 'change', 'edit', 'write'],
  testing: ['test', 'spec', 'integration', 'mock'],
  verification: ['verify', 'validate', 'check', 'run'],
  communication: ['explain', 'respond', 'message', 'summary'],
  'tool-use': ['tool', 'command', 'bash', 'grep', 'read', 'edit'],
}

const SELECT_MEMORIES_SYSTEM_PROMPT = `You are selecting memories that will be useful to Claude Code as it processes a user's query. You will be given the user's query and a list of candidate memory files with structured hints such as type, freshness, description, preview text, and feedback metadata.

Return a list of filenames for the memories that will clearly be useful to Claude Code as it processes the user's query (up to 5). Only include memories that you are certain will be helpful based on the evidence in the manifest.
- If you are unsure if a memory will be useful in processing the user's query, then do not include it in your list. Be selective and discerning.
- If there are no memories in the list that would clearly be useful, feel free to return an empty list.
- Prefer feedback memories when they contain behavior guidance that directly matches the user's current request, but do not force in weakly-related feedback.
- If a list of recently-used tools is provided, do not select memories that are usage reference or API documentation for those tools (Claude Code is already exercising them). DO still select memories containing warnings, gotchas, or known issues about those tools — active use is exactly when those matter.
`

function tokenize(text: string): Set<string> {
  const matches = text.toLowerCase().match(/[a-z0-9-]+/g) ?? []
  return new Set(matches.filter(token => token.length >= 2))
}

function hasTokenIntersection(lhs: Set<string>, rhs: Set<string>): boolean {
  for (const token of lhs) {
    if (rhs.has(token)) {
      return true
    }
  }
  return false
}

function scoreRecency(mtimeMs: number): number {
  const ageMs = Date.now() - mtimeMs
  const oneDayMs = 24 * 60 * 60 * 1000
  if (ageMs <= 7 * oneDayMs) {
    return 1
  }
  if (ageMs <= 30 * oneDayMs) {
    return 0
  }
  return -1
}

function recentToolPenalty(
  memory: MemoryHeader,
  recentTools: readonly string[],
): number {
  if (memory.type !== 'reference' || recentTools.length === 0) {
    return 0
  }

  const memoryTokens = new Set<string>([
    ...tokenize(memory.filename),
    ...tokenize(memory.description ?? ''),
    ...tokenize(memory.preview ?? ''),
    ...memory.signals.flatMap(signal => [...tokenize(signal)]),
  ])

  for (const tool of recentTools) {
    if (hasTokenIntersection(memoryTokens, tokenize(tool))) {
      return -2
    }
  }

  return 0
}

function matchingDomains(queryTokens: Set<string>): string[] {
  return Object.entries(QUERY_DOMAIN_TERMS)
    .filter(([, keywords]) =>
      keywords.some(keyword => queryTokens.has(keyword)),
    )
    .map(([domain]) => domain)
}

export function scoreMemoryForRecall(
  query: string,
  memory: MemoryHeader,
  recentTools: readonly string[] = [],
): number {
  const queryTokens = tokenize(query)
  const descriptionTokens = tokenize(memory.description ?? '')
  const filenameTokens = tokenize(memory.filename)
  const previewTokens = tokenize(memory.preview ?? '')
  const signalTokens = new Set(memory.signals.flatMap(signal => [...tokenize(signal)]))
  const activeDomains = new Set(matchingDomains(queryTokens))

  let score = TYPE_WEIGHTS[memory.type ?? 'reference'] ?? 0

  if (hasTokenIntersection(queryTokens, signalTokens)) {
    score += 4
  }
  if (hasTokenIntersection(queryTokens, descriptionTokens)) {
    score += 3
  }
  if (hasTokenIntersection(queryTokens, filenameTokens)) {
    score += 2
  }
  if (hasTokenIntersection(queryTokens, previewTokens)) {
    score += 2
  }
  if (memory.appliesTo.some(domain => activeDomains.has(domain))) {
    score += 3
  }
  if (memory.strength === 'hard') {
    score += 2
  }

  score += scoreRecency(memory.mtimeMs)
  score += recentToolPenalty(memory, recentTools)

  return score
}

export function rankMemoriesForRecall(
  query: string,
  memories: MemoryHeader[],
  recentTools: readonly string[] = [],
): ScoredMemory[] {
  return memories
    .map(memory => ({
      ...memory,
      localScore: scoreMemoryForRecall(query, memory, recentTools),
      localRank: -1,
    }))
    .sort((lhs, rhs) => {
      if (rhs.localScore !== lhs.localScore) {
        return rhs.localScore - lhs.localScore
      }
      if (rhs.mtimeMs !== lhs.mtimeMs) {
        return rhs.mtimeMs - lhs.mtimeMs
      }
      return lhs.filename.localeCompare(rhs.filename)
    })
    .map((memory, index) => ({
      ...memory,
      localRank: index,
    }))
}

function toRelevantMemory(memory: ScoredMemory, sideQueryRank?: number): RelevantMemory {
  return {
    path: memory.filePath,
    mtimeMs: memory.mtimeMs,
    type: memory.type,
    localScore: memory.localScore,
    localRank: memory.localRank,
    ...(sideQueryRank !== undefined ? { sideQueryRank } : {}),
  }
}

/**
 * Find memory files relevant to a query by scanning memory file headers,
 * doing a lightweight local pre-rank, and then asking Sonnet to select the
 * best matches from that narrowed pool.
 *
 * Returns both the selector-approved set and the local top candidates so the
 * surfacing layer can apply feedback-aware quotas without re-ranking files.
 */
export async function findRelevantMemories(
  query: string,
  memoryDir: string,
  signal: AbortSignal,
  recentTools: readonly string[] = [],
  alreadySurfaced: ReadonlySet<string> = new Set(),
): Promise<RelevantMemorySearchResult> {
  const memories = (await scanMemoryFiles(memoryDir, signal)).filter(
    memory => !alreadySurfaced.has(memory.filePath),
  )
  if (memories.length === 0) {
    return { selected: [], localTopCandidates: [] }
  }

  const ranked = rankMemoriesForRecall(query, memories, recentTools)
  const localTopCandidates = ranked
    .slice(0, MAX_LOCAL_TOP_CANDIDATES)
    .map(memory => toRelevantMemory(memory))
  const sideQueryCandidates = ranked.slice(0, MAX_SIDEQUERY_CANDIDATES)

  const selectedFilenames = await selectRelevantMemories(
    query,
    sideQueryCandidates,
    signal,
    recentTools,
  )
  const byFilename = new Map(
    sideQueryCandidates.map(memory => [memory.filename, memory]),
  )
  const selectedHeaders = selectedFilenames
    .map(filename => byFilename.get(filename))
    .filter((memory): memory is ScoredMemory => memory !== undefined)
  const selected = selectedFilenames
    .map((filename, index) => {
      const memory = byFilename.get(filename)
      return memory ? toRelevantMemory(memory, index) : undefined
    })
    .filter((memory): memory is RelevantMemory => memory !== undefined)

  if (feature('MEMORY_SHAPE_TELEMETRY')) {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { logMemoryRecallShape } =
      require('./memoryShapeTelemetry.js') as typeof import('./memoryShapeTelemetry.js')
    /* eslint-enable @typescript-eslint/no-require-imports */
    logMemoryRecallShape(sideQueryCandidates, selectedHeaders)
  }

  return { selected, localTopCandidates }
}

async function selectRelevantMemories(
  query: string,
  memories: ScoredMemory[],
  signal: AbortSignal,
  recentTools: readonly string[],
): Promise<string[]> {
  const validFilenames = new Set(memories.map(memory => memory.filename))
  const manifest = formatRecallMemoryManifest(memories)

  const toolsSection =
    recentTools.length > 0
      ? `\n\nRecently used tools: ${recentTools.join(', ')}`
      : ''

  try {
    const result = await sideQuery({
      model: getDefaultSonnetModel(),
      system: SELECT_MEMORIES_SYSTEM_PROMPT,
      skipSystemPromptPrefix: true,
      messages: [
        {
          role: 'user',
          content: `Query: ${query}\n\nAvailable memories:\n${manifest}${toolsSection}`,
        },
      ],
      max_tokens: 256,
      output_format: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: {
            selected_memories: { type: 'array', items: { type: 'string' } },
          },
          required: ['selected_memories'],
          additionalProperties: false,
        },
      },
      signal,
      querySource: 'memdir_relevance',
    })

    const textBlock = result.content.find(block => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return []
    }

    const parsed: { selected_memories: string[] } = jsonParse(textBlock.text)
    return parsed.selected_memories.filter(filename =>
      validFilenames.has(filename),
    )
  } catch (error) {
    if (signal.aborted) {
      return []
    }
    logForDebugging(
      `[memdir] selectRelevantMemories failed: ${errorMessage(error)}`,
      { level: 'warn' },
    )
    return []
  }
}
