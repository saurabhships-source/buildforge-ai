/**
 * Generator Improver — uses feedback to derive improvement rules for generators.
 * Produces a set of GeneratorRules that are injected into generator system prompts.
 */

import { generatorFeedback } from './generator-feedback'
import { logger } from '@/lib/core/logger'
import type { GeneratorTarget } from './generator-feedback'

export interface GeneratorRule {
  id: string
  target: GeneratorTarget
  instruction: string       // injected into generator system prompt
  priority: 'high' | 'medium' | 'low'
  derivedFrom: string       // feedback pattern that triggered this rule
  appliedCount: number
}

// In-memory rule store
const rules = new Map<string, GeneratorRule>()
let ruleCounter = 0

/** Derive rules from current feedback and update the rule store */
export function deriveRules(): GeneratorRule[] {
  const issues = generatorFeedback.getTopIssues(20)
  const positive = generatorFeedback.getTopPositive(10)

  const newRules: GeneratorRule[] = []

  for (const issue of issues) {
    const ruleId = `rule-${issue.pattern}`
    if (rules.has(ruleId)) {
      rules.get(ruleId)!.appliedCount++
      continue
    }

    const rule: GeneratorRule = {
      id: ruleId,
      target: issue.target,
      instruction: issue.suggestion,
      priority: issue.frequency >= 5 ? 'high' : issue.frequency >= 2 ? 'medium' : 'low',
      derivedFrom: issue.pattern,
      appliedCount: 0,
    }
    rules.set(ruleId, rule)
    newRules.push(rule)
  }

  for (const pos of positive) {
    const ruleId = `rule-reinforce-${pos.pattern}`
    if (rules.has(ruleId)) continue
    const rule: GeneratorRule = {
      id: ruleId,
      target: pos.target,
      instruction: `REINFORCE: ${pos.suggestion}`,
      priority: 'low',
      derivedFrom: pos.pattern,
      appliedCount: 0,
    }
    rules.set(ruleId, rule)
    newRules.push(rule)
  }

  if (newRules.length > 0) {
    logger.info('system', `Generator improver: derived ${newRules.length} new rules`)
  }

  return [...rules.values()]
}

/** Get improvement instructions for a specific generator as a string block */
export function getImprovementInstructions(target: GeneratorTarget): string {
  const applicable = [...rules.values()].filter(
    r => r.target === target || r.target === 'all'
  ).sort((a, b) => {
    const p = { high: 0, medium: 1, low: 2 }
    return p[a.priority] - p[b.priority]
  })

  if (applicable.length === 0) return ''

  const lines = applicable.map(r => `- [${r.priority.toUpperCase()}] ${r.instruction}`)
  return `\n\nLEARNED IMPROVEMENTS (apply these):\n${lines.join('\n')}`
}

/** Get all current rules */
export function getAllRules(): GeneratorRule[] {
  return [...rules.values()].sort((a, b) => {
    const p = { high: 0, medium: 1, low: 2 }
    return p[a.priority] - p[b.priority]
  })
}

/** Mark a rule as applied (increment counter) */
export function markRuleApplied(ruleId: string) {
  const rule = rules.get(ruleId)
  if (rule) rule.appliedCount++
}

export function getRuleStats() {
  const all = [...rules.values()]
  return {
    total: all.length,
    high: all.filter(r => r.priority === 'high').length,
    medium: all.filter(r => r.priority === 'medium').length,
    low: all.filter(r => r.priority === 'low').length,
    totalApplied: all.reduce((sum, r) => sum + r.appliedCount, 0),
  }
}
