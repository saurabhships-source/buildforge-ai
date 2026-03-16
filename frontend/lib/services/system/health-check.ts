// System Health Check Service — monitors API latency, pipeline duration, error rates

export interface HealthSample {
  route: string
  latencyMs: number
  ok: boolean
  timestamp: string
}

export interface SystemHealthReport {
  score: number          // 0–100
  status: 'healthy' | 'degraded' | 'down'
  avgApiLatencyMs: number
  errorRate: number      // 0–1
  samples: HealthSample[]
  checkedAt: string
}

const PROBE_ROUTES = [
  { route: '/api/health-check', method: 'GET' },
  { route: '/api/cache/stats', method: 'GET' },
]

async function probe(route: string, method: string): Promise<HealthSample> {
  const start = Date.now()
  try {
    const res = await fetch(route, {
      method,
      signal: AbortSignal.timeout(4000),
    })
    return {
      route,
      latencyMs: Date.now() - start,
      ok: res.ok || res.status === 405, // 405 = route exists but wrong method
      timestamp: new Date().toISOString(),
    }
  } catch {
    return {
      route,
      latencyMs: Date.now() - start,
      ok: false,
      timestamp: new Date().toISOString(),
    }
  }
}

export async function checkSystemHealth(): Promise<SystemHealthReport> {
  const samples = await Promise.all(
    PROBE_ROUTES.map(r => probe(r.route, r.method))
  )

  const errorRate = samples.filter(s => !s.ok).length / samples.length
  const avgLatency = samples.reduce((sum, s) => sum + s.latencyMs, 0) / samples.length

  // Score: start at 100, deduct for errors and latency
  let score = 100
  score -= errorRate * 50                          // up to -50 for errors
  if (avgLatency > 3000) score -= 30
  else if (avgLatency > 1500) score -= 15
  else if (avgLatency > 800) score -= 5
  score = Math.max(0, Math.min(100, Math.round(score)))

  const status: SystemHealthReport['status'] =
    score >= 80 ? 'healthy' : score >= 50 ? 'degraded' : 'down'

  return {
    score,
    status,
    avgApiLatencyMs: Math.round(avgLatency),
    errorRate,
    samples,
    checkedAt: new Date().toISOString(),
  }
}
