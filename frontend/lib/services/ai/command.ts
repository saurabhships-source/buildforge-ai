// AI Command Processor — handles natural language commands in the builder
// Feature 2: Natural Language Command Bar
// Feature 10: AI Feature Adder ("add payments", "add login", etc.)

import { generateText } from 'ai'
import { getModel } from '@/lib/ai-engine/model-router'
import type { ModelId } from '@/lib/ai-engine/model-router'

export type CommandType =
  | 'add_feature'
  | 'modify_ui'
  | 'fix_bug'
  | 'add_page'
  | 'add_component'
  | 'change_style'
  | 'add_auth'
  | 'add_payments'
  | 'add_database'
  | 'add_api'
  | 'general'

export interface ParsedCommand {
  type: CommandType
  intent: string
  targetFiles: string[]
  newFiles: string[]
  instruction: string
}

export interface CommandResult {
  updatedFiles: Record<string, string>
  newFiles: Record<string, string>
  description: string
  commandType: CommandType
}

const COMMAND_SYSTEM = `You are an AI command processor for a web builder. Parse user commands and apply them to project files.

Return JSON:
{
  "updatedFiles": { "filename": "complete updated content" },
  "newFiles": { "filename": "complete new file content" },
  "description": "what was done"
}

Rules:
- Only include files that actually changed or are new
- Return complete file content, not diffs
- Use HTML, Tailwind CSS, and vanilla JavaScript
- No markdown fences in response`

/** Detect command type from natural language */
export function detectCommandType(command: string): CommandType {
  const c = command.toLowerCase()
  if (/add.*login|add.*auth|add.*signup|authentication/.test(c)) return 'add_auth'
  if (/add.*payment|add.*stripe|add.*checkout|billing/.test(c)) return 'add_payments'
  if (/add.*database|add.*db|add.*storage/.test(c)) return 'add_database'
  if (/add.*api|add.*endpoint|add.*route/.test(c)) return 'add_api'
  if (/add.*page|new.*page|create.*page/.test(c)) return 'add_page'
  if (/add.*component|add.*section|add.*widget/.test(c)) return 'add_component'
  if (/dark mode|light mode|color|theme|style|design/.test(c)) return 'change_style'
  if (/fix|error|bug|broken/.test(c)) return 'fix_bug'
  if (/add.*feature|implement|build/.test(c)) return 'add_feature'
  return 'general'
}

/** Process a command against existing project files */
export async function processCommand(
  command: string,
  existingFiles: Record<string, string>,
  modelId: ModelId = 'gemini_flash',
): Promise<CommandResult> {
  const commandType = detectCommandType(command)
  const filesContext = Object.entries(existingFiles)
    .map(([k, v]) => `=== ${k} ===\n${v.slice(0, 1500)}`)
    .join('\n\n')

  const prompt = `Command: "${command}"

Existing project files:
${filesContext}

Apply the command to the project. Return only changed/new files.`

  try {
    const { text } = await generateText({
      model: getModel(modelId),
      system: COMMAND_SYSTEM,
      prompt,
      maxOutputTokens: 8000,
    })

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const result = JSON.parse(cleaned) as { updatedFiles: Record<string, string>; newFiles: Record<string, string>; description: string }

    return {
      updatedFiles: result.updatedFiles ?? {},
      newFiles: result.newFiles ?? {},
      description: result.description ?? `Applied: ${command}`,
      commandType,
    }
  } catch (err) {
    console.warn('[command] AI failed:', err)
    return {
      updatedFiles: {},
      newFiles: {},
      description: `Command failed: ${command}`,
      commandType,
    }
  }
}

/** Quick command suggestions based on current project */
export function getCommandSuggestions(files: Record<string, string>): string[] {
  const hasAuth = Object.values(files).some(f => /login|auth|signup/.test(f))
  const hasPayments = Object.values(files).some(f => /stripe|payment|checkout/.test(f))
  const hasDarkMode = Object.values(files).some(f => /dark.*mode|darkMode/.test(f))

  const suggestions: string[] = []
  if (!hasAuth) suggestions.push('add login system')
  if (!hasPayments) suggestions.push('add payment page')
  if (!hasDarkMode) suggestions.push('add dark mode toggle')
  suggestions.push('add admin dashboard', 'add contact form', 'add newsletter signup', 'make UI more modern', 'add loading animations')
  return suggestions.slice(0, 6)
}
