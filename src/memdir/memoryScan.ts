/**
 * Memory-directory scanning primitives. Split out of findRelevantMemories.ts
 * so extractMemories can import the scan without pulling in sideQuery and
 * the API-client chain (which closed a cycle through memdir.ts — #25372).
 */

import { readdir } from 'fs/promises'
import { basename, join } from 'path'
import { parseFrontmatter } from '../utils/frontmatterParser.js'
import { readFileInRange } from '../utils/readFileInRange.js'
import {
  type FeedbackAppliesTo,
  type FeedbackPolarity,
  type FeedbackStrength,
  type MemoryType,
  parseFeedbackAppliesTo,
  parseFeedbackPolarity,
  parseFeedbackSignals,
  parseFeedbackStrength,
  parseMemoryType,
} from './memoryTypes.js'

export type MemoryHeader = {
  filename: string
  filePath: string
  mtimeMs: number
  description: string | null
  preview: string | null
  type: MemoryType | undefined
  polarity?: FeedbackPolarity
  appliesTo: FeedbackAppliesTo[]
  strength?: FeedbackStrength
  signals: string[]
}

const MAX_MEMORY_FILES = 200
const FRONTMATTER_MAX_LINES = 50
const PREVIEW_MAX_LINES = 8
const RECENT_POOL_SIZE = 120
const TYPE_POOL_SIZES: Record<MemoryType, number> = {
  feedback: 30,
  user: 20,
  project: 20,
  reference: 10,
}

function stripMarkdownForPreview(line: string): string {
  return line
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/^[#>*\-\s`]+/g, '')
    .replace(/[*_`~[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildPreview(content: string): string | null {
  const preview = content
    .split('\n')
    .slice(0, PREVIEW_MAX_LINES)
    .map(stripMarkdownForPreview)
    .filter(Boolean)
    .join(' ')

  return preview.length > 0 ? preview : null
}

function dedupeHeaders(memories: MemoryHeader[]): MemoryHeader[] {
  const deduped: MemoryHeader[] = []
  const seen = new Set<string>()

  for (const memory of memories) {
    if (seen.has(memory.filePath)) {
      continue
    }
    seen.add(memory.filePath)
    deduped.push(memory)
    if (deduped.length >= MAX_MEMORY_FILES) {
      break
    }
  }

  return deduped
}

function buildCandidatePool(memories: MemoryHeader[]): MemoryHeader[] {
  const sorted = [...memories].sort((a, b) => b.mtimeMs - a.mtimeMs)
  const byType = new Map<MemoryType, MemoryHeader[]>(
    Object.keys(TYPE_POOL_SIZES).map(type => [type as MemoryType, []]),
  )

  for (const memory of sorted) {
    if (!memory.type) {
      continue
    }
    byType.get(memory.type)?.push(memory)
  }

  const typedSelections = (
    Object.entries(TYPE_POOL_SIZES) as Array<[MemoryType, number]>
  ).flatMap(([type, limit]) => (byType.get(type) ?? []).slice(0, limit))

  return dedupeHeaders([
    ...sorted.slice(0, RECENT_POOL_SIZE),
    ...typedSelections,
  ])
}

/**
 * Scan a memory directory for .md files, read their frontmatter, and return
 * a candidate pool capped at MAX_MEMORY_FILES. Shared by findRelevantMemories
 * (query-time recall) and extractMemories (pre-injects the listing so the
 * extraction agent doesn't spend a turn on `ls`).
 *
 * The pool is intentionally not just "latest 200". We keep a recent slice plus
 * per-type reserves so older but high-value feedback/user memories can still
 * compete during recall.
 */
export async function scanMemoryFiles(
  memoryDir: string,
  signal: AbortSignal,
): Promise<MemoryHeader[]> {
  try {
    const entries = await readdir(memoryDir, { recursive: true })
    const mdFiles = entries.filter(
      f => f.endsWith('.md') && basename(f) !== 'MEMORY.md',
    )

    const headerResults = await Promise.allSettled(
      mdFiles.map(async (relativePath): Promise<MemoryHeader> => {
        const filePath = join(memoryDir, relativePath)
        const { content, mtimeMs } = await readFileInRange(
          filePath,
          0,
          FRONTMATTER_MAX_LINES,
          undefined,
          signal,
        )
        const { frontmatter, content: body } = parseFrontmatter(content, filePath)
        const type = parseMemoryType(frontmatter.type)
        return {
          filename: relativePath,
          filePath,
          mtimeMs,
          description: frontmatter.description || null,
          preview: buildPreview(body),
          type,
          polarity:
            type === 'feedback'
              ? parseFeedbackPolarity(frontmatter.polarity)
              : undefined,
          appliesTo:
            type === 'feedback'
              ? parseFeedbackAppliesTo(frontmatter.applies_to)
              : [],
          strength:
            type === 'feedback'
              ? parseFeedbackStrength(frontmatter.strength)
              : undefined,
          signals:
            type === 'feedback' ? parseFeedbackSignals(frontmatter.signals) : [],
        }
      }),
    )

    const headers = headerResults
      .filter(
        (result): result is PromiseFulfilledResult<MemoryHeader> =>
          result.status === 'fulfilled',
      )
      .map(result => result.value)

    return buildCandidatePool(headers)
  } catch {
    return []
  }
}

/**
 * Format memory headers as a text manifest: one line per file with
 * [type] filename (timestamp): description. Used by the extraction-agent
 * prompt, which still benefits from a terse listing.
 */
export function formatMemoryManifest(memories: MemoryHeader[]): string {
  return memories
    .map(memory => {
      const tag = memory.type ? `[${memory.type}] ` : ''
      const ts = new Date(memory.mtimeMs).toISOString()
      return memory.description
        ? `- ${tag}${memory.filename} (${ts}): ${memory.description}`
        : `- ${tag}${memory.filename} (${ts})`
    })
    .join('\n')
}

export function formatRecallMtimeBucket(mtimeMs: number): string {
  const ageMs = Date.now() - mtimeMs
  const oneDayMs = 24 * 60 * 60 * 1000
  if (ageMs <= 7 * oneDayMs) {
    return 'fresh'
  }
  if (ageMs <= 30 * oneDayMs) {
    return 'recent'
  }
  return 'older'
}

export function formatRecallMemoryManifest(memories: MemoryHeader[]): string {
  return memories
    .map(memory => {
      const tag = memory.type ? `[${memory.type}] ` : ''
      const description = memory.description ?? 'no description'
      const preview = memory.preview ?? 'no preview'
      const polarity = memory.polarity ? ` polarity=${memory.polarity};` : ''
      const appliesTo =
        memory.appliesTo.length > 0
          ? ` applies_to=${memory.appliesTo.join('|')};`
          : ''
      const strength = memory.strength ? ` strength=${memory.strength};` : ''
      const signals =
        memory.signals.length > 0
          ? ` signals=${memory.signals.join('|')};`
          : ''
      return `- ${tag}${memory.filename}; mtime=${formatRecallMtimeBucket(memory.mtimeMs)}; description=${description};${polarity}${appliesTo}${strength}${signals} preview=${preview}`
    })
    .join('\n')
}
