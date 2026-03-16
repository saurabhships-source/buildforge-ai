/**
 * Project Scorer — assigns a quality score (0–100) to generated projects.
 * Factors: build success, repair count, deploy success, code complexity.
 */

import type { ProjectAnalysis } from './project-analyzer'
import type { ExtractedPattern } from './pattern-extractor'

export interface ProjectScore {
  projectId: string
  total: number           // 0–100
  breakdown: {
    buildSuccess: number  // 0–30
    repairCount: number   // 0–20 (fewer repairs = higher score)
    deploySuccess: number // 0–20
    codeQuality: number   // 0–30 (based on patterns)
  }
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  summary: string
}

export interface ScoringInput {
  projectId: string
  analysis: ProjectAnalysis
  patterns: ExtractedPattern[]
  buildSuccess: boolean
  repairIterations: number
  deploySuccess: boolean
}

export function scoreProject(input: ScoringInput): ProjectScore {
  const { projectId, analysis, patterns, buildSuccess, repairIterations, deploySuccess } = input

  // Build success: 0 or 30
  const buildScore = buildSuccess ? 30 : 0

  // Repair count: 20 for 0 repairs, -5 per repair iteration
  const repairScore = Math.max(0, 20 - repairIterations * 5)

  // Deploy success: 0 or 20
  const deployScore = deploySuccess ? 20 : 0

  // Code quality: based on patterns
  const goodPatterns = patterns.filter(p => p.type === 'good').length
  const badPatterns = patterns.filter(p => p.type === 'bad').length
  const apiConsistency = analysis.apiConsistencyScore * 10
  const reuseBonus = analysis.componentReuseScore * 10
  const duplicationPenalty = analysis.duplicateLogicScore * 10
  const codeQuality = Math.max(0, Math.min(30,
    goodPatterns * 3 - badPatterns * 2 + apiConsistency + reuseBonus - duplicationPenalty
  ))

  const total = Math.round(buildScore + repairScore + deployScore + codeQuality)

  const grade: ProjectScore['grade'] =
    total >= 90 ? 'A' :
    total >= 75 ? 'B' :
    total >= 60 ? 'C' :
    total >= 40 ? 'D' : 'F'

  const summary = buildSuccess
    ? `${grade} grade project — ${goodPatterns} good patterns, ${badPatterns} issues found`
    : `Build failed — ${repairIterations} repair attempts`

  return {
    projectId,
    total,
    breakdown: {
      buildSuccess: buildScore,
      repairCount: repairScore,
      deploySuccess: deployScore,
      codeQuality: Math.round(codeQuality),
    },
    grade,
    summary,
  }
}
