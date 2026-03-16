'use client'

import { useEffect, useState } from 'react'
import { Flame, RefreshCw, Users, Zap } from 'lucide-react'
import type { CommunityProject } from '@/lib/hub/types'
import type { ActivityEvent } from '@/lib/services/activity-feed'

interface CommunityData {
  recentActivity: ActivityEvent[]
  recentApps: CommunityProject[]
  mostRemixed: CommunityProject[]
  topCreators: Array<{ userId: string; userName: string; count: number }>
}

function AppCard({ app }: { app: CommunityProject }) {
  return (
    <a href={`/apps/${app.id}`} className="block bg-gray-900 border border-white/10 rounded-xl p-4 hover:border-indigo-500/50 transition group">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{app.icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition">{app.name}</p>
          <p className="text-xs text-gray-500">{app.ownerName}</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 line-clamp-2">{app.description}</p>
      <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
        <span>🔁 {app.remixCount}</span>
        <span>❤️ {app.likeCount}</span>
        <span>👁 {app.viewCount}</span>
      </div>
    </a>
  )
}

function ActivityItem({ event }: { event: ActivityEvent }) {
  const icons: Record<string, string> = { build: '🔨', remix: '🔁', deploy: '🚀', improve: '✨', publish: '📢' }
  const timeAgo = (ts: string) => {
    const d = Date.now() - new Date(ts).getTime()
    if (d < 60000) return 'just now'
    if (d < 3600000) return `${Math.floor(d / 60000)}m ago`
    return `${Math.floor(d / 3600000)}h ago`
  }
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="text-lg">{icons[event.type] ?? '⚡'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-300 truncate">
          <span className="text-white font-medium">{event.userName}</span> {event.description}
        </p>
        <p className="text-xs text-gray-500">{timeAgo(event.timestamp)}</p>
      </div>
    </div>
  )
}

export default function CommunityPage() {
  const [data, setData] = useState<CommunityData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/community')
      .then(r => r.json())
      .then(j => { if (j.success) setData(j.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        <div>
          <h1 className="text-3xl font-bold">Community</h1>
          <p className="text-gray-400 mt-1">Discover what builders are creating with BuildForge AI</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Most remixed */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <RefreshCw className="w-4 h-4 text-indigo-400" />
                <h2 className="text-lg font-semibold">Most Remixed</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {data?.mostRemixed.map(app => <AppCard key={app.id} app={app} />)}
              </div>
            </section>

            {/* Recent apps */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-yellow-400" />
                <h2 className="text-lg font-semibold">Recently Built</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {data?.recentApps.slice(0, 6).map(app => <AppCard key={app.id} app={app} />)}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Activity feed */}
            <div className="bg-gray-900 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-semibold">Live Activity</h3>
              </div>
              {data?.recentActivity.length === 0 ? (
                <p className="text-xs text-gray-500">No activity yet — be the first to build!</p>
              ) : (
                <div className="divide-y divide-white/5">
                  {data?.recentActivity.slice(0, 10).map(e => <ActivityItem key={e.id} event={e} />)}
                </div>
              )}
            </div>

            {/* Top creators */}
            <div className="bg-gray-900 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold">Top Creators</h3>
              </div>
              {data?.topCreators.length === 0 ? (
                <p className="text-xs text-gray-500">No creators yet.</p>
              ) : (
                <div className="space-y-2">
                  {data?.topCreators.map((c, i) => (
                    <div key={c.userId} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-4">{i + 1}</span>
                      <div className="w-6 h-6 rounded-full bg-indigo-600/30 flex items-center justify-center text-xs text-indigo-300">
                        {c.userName[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-300 flex-1 truncate">{c.userName}</span>
                      <span className="text-xs text-gray-500">{c.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
