import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/safe-auth'
import { installFeature, installFromCommand, detectFeature, type FeatureId } from '@/lib/services/ai/feature-installer'
import { enforceCredits } from '@/lib/credits-server'

export async function POST(req: NextRequest) {
  // Auth required
  const userIdOrResponse = await requireUserId()
  if (userIdOrResponse instanceof NextResponse) return userIdOrResponse
  const userId = userIdOrResponse

  try {
    const body = await req.json() as {
      featureId?: FeatureId
      command?: string
      files: Record<string, string>
      projectName?: string
      modelId?: string
    }

    const { files, projectName = 'My App', modelId = 'gemini_flash' } = body

    if (!files || typeof files !== 'object') {
      return NextResponse.json({ error: 'files required' }, { status: 400 })
    }

    // Enforce credits (same cost as improveCode — 2 credits)
    const creditError = await enforceCredits(userId, 'improveCode', {
      route: '/api/install-feature',
      feature: body.featureId ?? body.command,
    })
    if (creditError) return NextResponse.json({ error: creditError }, { status: 402 })

    // Command-based install
    if (body.command) {
      const result = await installFromCommand(body.command, files, projectName, modelId as never)
      if (!result) {
        const detected = detectFeature(body.command)
        if (!detected) {
          return NextResponse.json({
            message: 'Could not detect feature from command. Try: "add authentication", "add payments", etc.',
          })
        }
        const fallback = await installFeature(detected, files, projectName, modelId as never)
        return NextResponse.json({
          files: fallback.files,
          description: fallback.description,
          envVars: fallback.envVars,
          feature: fallback.feature,
        })
      }
      return NextResponse.json({
        files: result.files,
        description: result.description,
        envVars: result.envVars,
        feature: result.feature,
      })
    }

    // Direct feature ID install
    if (body.featureId) {
      const result = await installFeature(body.featureId, files, projectName, modelId as never)
      return NextResponse.json({
        files: result.files,
        description: result.description,
        envVars: result.envVars,
        feature: result.feature,
      })
    }

    return NextResponse.json({ error: 'featureId or command required' }, { status: 400 })
  } catch (err) {
    console.error('[install-feature]', err)
    return NextResponse.json({ error: 'Feature installation failed' }, { status: 500 })
  }
}
