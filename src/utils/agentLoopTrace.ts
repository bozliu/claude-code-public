import type {
  BetaMessageParam,
  BetaMessageStreamParams,
} from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
import type { ToolUseBlock } from '@anthropic-ai/sdk/resources/index.mjs'
import type { Message } from '../types/message.js'
import type { DebugLogLevel } from './debug.js'
import { logForDebugging } from './debug.js'

const MAX_PREVIEW_CHARS = 96

function truncate(value: string, max = MAX_PREVIEW_CHARS): string {
  return value.length > max ? `${value.slice(0, max)}...` : value
}

function summarizeBlock(block: unknown): Record<string, unknown> {
  if (!block || typeof block !== 'object') {
    return { type: typeof block }
  }

  const value = block as Record<string, unknown>
  const summary: Record<string, unknown> = {
    type: typeof value.type === 'string' ? value.type : 'unknown',
  }

  if (typeof value.id === 'string') {
    summary.id = value.id
  }

  if (typeof value.name === 'string') {
    summary.name = value.name
  }

  if (typeof value.text === 'string') {
    summary.text = truncate(value.text)
  }

  if (typeof value.tool_use_id === 'string') {
    summary.toolUseId = value.tool_use_id
  }

  if (typeof value.is_error === 'boolean') {
    summary.isError = value.is_error
  }

  if ('input' in value) {
    const input = value.input
    if (input && typeof input === 'object' && !Array.isArray(input)) {
      summary.inputKeys = Object.keys(input).slice(0, 8)
    } else if (typeof input === 'string') {
      summary.input = truncate(input)
    } else if (input !== undefined) {
      summary.inputType = Array.isArray(input) ? 'array' : typeof input
    }
  }

  if ('content' in value) {
    const content = value.content
    if (typeof content === 'string') {
      summary.content = truncate(content)
    } else if (Array.isArray(content)) {
      summary.contentBlocks = content.length
    } else if (content && typeof content === 'object') {
      summary.contentType = 'object'
    }
  }

  return summary
}

function summarizeContent(content: unknown): unknown {
  if (typeof content === 'string') {
    return truncate(content)
  }

  if (Array.isArray(content)) {
    return content.slice(0, 6).map(summarizeBlock)
  }

  if (!content || typeof content !== 'object') {
    return content
  }

  return { type: typeof content }
}

function summarizeMessageLike(
  message: Record<string, unknown>,
): Record<string, unknown> {
  const summary: Record<string, unknown> = {}

  if (typeof message.type === 'string') {
    summary.type = message.type
  }
  if (typeof message.role === 'string') {
    summary.role = message.role
  }
  if (typeof message.uuid === 'string') {
    summary.uuid = message.uuid
  }
  if (typeof message.subtype === 'string') {
    summary.subtype = message.subtype
  }
  if (typeof message.stop_reason === 'string') {
    summary.stopReason = message.stop_reason
  }
  if (typeof message.isMeta === 'boolean') {
    summary.isMeta = message.isMeta
  }
  if (typeof message.isApiErrorMessage === 'boolean') {
    summary.isApiErrorMessage = message.isApiErrorMessage
  }

  const nestedMessage =
    'message' in message && message.message && typeof message.message === 'object'
      ? (message.message as Record<string, unknown>)
      : undefined
  const content =
    nestedMessage && 'content' in nestedMessage
      ? nestedMessage.content
      : 'content' in message
        ? message.content
        : undefined

  if (content !== undefined) {
    summary.content = summarizeContent(content)
  }

  if ('attachment' in message && message.attachment && typeof message.attachment === 'object') {
    const attachment = message.attachment as Record<string, unknown>
    summary.attachmentType =
      typeof attachment.type === 'string' ? attachment.type : 'unknown'
  }

  return summary
}

export function summarizeMessagesForTrace(
  messages: Message[],
  limit = 5,
): Array<Record<string, unknown>> {
  return messages.slice(-limit).map(message =>
    summarizeMessageLike(message as unknown as Record<string, unknown>),
  )
}

export function summarizeApiMessagesForTrace(
  messages: BetaMessageParam[],
  limit = 5,
): Array<Record<string, unknown>> {
  return messages.slice(-limit).map(message =>
    summarizeMessageLike(message as unknown as Record<string, unknown>),
  )
}

export function summarizeSystemPromptForTrace(
  system: BetaMessageStreamParams['system'],
): Array<Record<string, unknown>> {
  if (!Array.isArray(system)) {
    return []
  }

  return system.map((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      return { index, type: typeof entry }
    }

    const record = entry as Record<string, unknown>
    const text = typeof record.text === 'string' ? record.text : ''

    return {
      index,
      type: typeof record.type === 'string' ? record.type : 'unknown',
      cacheControl:
        record.cache_control && typeof record.cache_control === 'object'
          ? 'present'
          : 'absent',
      length: text.length,
      preview: text ? truncate(text) : '',
    }
  })
}

export function summarizeToolUseBlocksForTrace(
  blocks: ToolUseBlock[],
): Array<Record<string, unknown>> {
  return blocks.map(block => summarizeBlock(block))
}

function safeStringify(payload: unknown): string {
  try {
    return JSON.stringify(payload)
  } catch {
    return JSON.stringify({ error: 'trace-payload-not-serializable' })
  }
}

export function traceAgentLoop(
  stage: string,
  payload: Record<string, unknown>,
  level: DebugLogLevel = 'debug',
): void {
  logForDebugging(
    `[AGENT_LOOP_TRACE:${stage}] ${safeStringify(payload)}`,
    { level },
  )
}
