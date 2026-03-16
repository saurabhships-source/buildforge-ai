// Chat context summarizer — keeps conversation history from growing too large.
// Summarizes older messages while keeping recent ones intact.

import type { ChatMessage } from '@/components/builder/prompt-panel'

const MAX_MESSAGES_BEFORE_SUMMARY = 20
const MESSAGES_TO_KEEP_RECENT = 6
const MAX_CONTENT_LENGTH = 300 // chars per message before truncation

/**
 * Summarize a list of chat messages into a single assistant message.
 * Used when history grows too large to fit in context.
 */
export function summarizeMessages(messages: ChatMessage[]): ChatMessage {
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content.slice(0, 100))
  const assistantMessages = messages.filter(m => m.role === 'assistant').map(m => m.content.slice(0, 100))

  const summary = [
    `[Conversation summary — ${messages.length} messages]`,
    userMessages.length > 0 ? `User requests: ${userMessages.slice(0, 5).join(' | ')}` : '',
    assistantMessages.length > 0 ? `AI actions: ${assistantMessages.slice(0, 5).join(' | ')}` : '',
  ].filter(Boolean).join('\n')

  return {
    role: 'assistant',
    content: summary,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Trim chat history to stay within context limits.
 * Keeps the most recent N messages and summarizes the rest.
 */
export function trimChatHistory(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length <= MAX_MESSAGES_BEFORE_SUMMARY) return messages

  const toSummarize = messages.slice(0, messages.length - MESSAGES_TO_KEEP_RECENT)
  const toKeep = messages.slice(messages.length - MESSAGES_TO_KEEP_RECENT)

  const summary = summarizeMessages(toSummarize)
  return [summary, ...toKeep]
}

/**
 * Build a compact context string from chat history for AI prompts.
 * Truncates long messages to keep prompt size manageable.
 */
export function buildChatContext(messages: ChatMessage[]): string {
  const trimmed = trimChatHistory(messages)
  return trimmed
    .map(m => {
      const content = m.content.length > MAX_CONTENT_LENGTH
        ? m.content.slice(0, MAX_CONTENT_LENGTH) + '...'
        : m.content
      return `${m.role === 'user' ? 'User' : 'AI'}: ${content}`
    })
    .join('\n')
}

/**
 * Estimate token count (rough: 1 token ≈ 4 chars).
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}
