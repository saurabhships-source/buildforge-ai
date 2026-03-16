/**
 * Product Confidence — scores how well we understand the user's intent.
 * If confidence < 0.6, returns clarification questions instead of proceeding.
 */

import type { InterpretedIdea } from './idea-interpreter'

export interface ConfidenceResult {
  score: number             // 0–1
  confident: boolean        // true if score >= 0.6
  clarificationQuestions: string[]
  reasoning: string
}

export function assessConfidence(
  idea: InterpretedIdea,
  patternMatchScore: number,
): ConfidenceResult {
  let score = 0
  const issues: string[] = []

  // Prompt clarity (0–0.4): based on keyword count and entity detection
  const keywordScore = Math.min(0.4, idea.keywords.length * 0.05)
  score += keywordScore

  // Pattern match strength (0–0.4)
  score += patternMatchScore * 0.4

  // Feature completeness (0–0.2): entities detected
  const entityScore = Math.min(0.2, idea.entities.length * 0.05)
  score += entityScore

  // Deductions for vagueness
  if (idea.rawPrompt.split(' ').length < 4) {
    score -= 0.2
    issues.push('Prompt is very short')
  }
  if (idea.domain === 'General') {
    score -= 0.1
    issues.push('Domain is unclear')
  }
  if (idea.entities.length === 0 || (idea.entities.length === 1 && idea.entities[0] === 'Record')) {
    score -= 0.1
    issues.push('No specific entities detected')
  }

  score = Math.max(0, Math.min(1, score))

  const clarificationQuestions: string[] = []
  if (score < 0.6) {
    if (idea.domain === 'General') {
      clarificationQuestions.push('What type of business or industry is this for?')
    }
    if (idea.entities.length <= 1) {
      clarificationQuestions.push('What are the main things you want to manage? (e.g. customers, orders, tasks)')
    }
    if (!idea.coreAction || idea.coreAction.length < 10) {
      clarificationQuestions.push('What is the primary action users will take in this app?')
    }
    if (idea.targetUser === 'individuals') {
      clarificationQuestions.push('Who is the target user? (e.g. freelancers, sales teams, small businesses)')
    }
    if (clarificationQuestions.length === 0) {
      clarificationQuestions.push('Can you describe the main features you need?')
    }
  }

  return {
    score: Math.round(score * 100) / 100,
    confident: score >= 0.6,
    clarificationQuestions,
    reasoning: issues.length > 0 ? issues.join('; ') : 'Sufficient clarity to proceed',
  }
}
