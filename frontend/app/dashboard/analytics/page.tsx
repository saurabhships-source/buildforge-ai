'use client'

import { useState, useEffect, useMemo } from 'react'
import { Eye, Heart, GitFork, Rocket, TrendingUp, BarChart3, Activity, Zap, Clock, Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { repoService } from '@/lib/hub/repo-service'
import type { ProjectRepo } from '@/lib/hub/types'

interface StatCard {
  label: string
  value: number | string
  icon: React.ElementType
  color: string
  delta?: string
}

function StatCard({ label, value, icon: Icon, color, delta }: StatCard) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {delta && <p className="text-xs text-muted-foreground mt-1">{delta}</p>}
      </CardContent>
    </Card>
  )
}

function MiniBar({ value, max, color = 'bg-primary' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function AnalyticsPage() {
  const [repos, setRepos] = useState<ProjectRepo[]>([])
  const [tab, setTab] = useState<'overview' | 'projects' | 'activity'>('overview')

  useEffect(() => {
    try {
      const all = repoService.listRepos()
      setRepos(all)
    } catch { /* no repos yet */ }
  }, [])

  const stats = useMemo(() => {
    const totalViews = repos.reduce((s, r) => s + (r.viewCount ?? 0), 0)
    const totalLikes = repos.reduce((s, r) => s + (r.likeCount ?? 0), 0)
    const totalRemixes = repos.reduce((s, r) => s + (r.remixCount ?? 0), 0)
    const totalDeploys = repos.reduce((s, r) => s + r.deployments.length, 0)
    const publicCount = repos.filter(r => r.visibility === 'public').length
    const avgHealth = repos.length > 0
      ? Math.round(repos.reduce((s, r) => s + (r.healthScore ?? 0), 0) / repos.length)
      : 0
    return { totalViews, totalLikes, totalRemixes, totalDeploys, publicCount, avgHealth }
  }, [repos])

  const topByViews = useMemo(() =>
    [...repos].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)).slice(0, 5),
    [repos])

  const topByLikes = useMemo(() =>
    [...repos].sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0)).slice(0, 5),
    [repos])

  const recentActivity = useMemo(() =>
    [...repos]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 10)
      .flatMap(r => r.prompts.slice(-2).map(p => ({ ...p, repoName: r.name, repoId: r.id }))),
    [repos])

  const maxViews = Math.max(...repos.map(r => r.viewCount ?? 0), 1)
  const maxLikes = Math.max(...repos.map(r => r.likeCount ?? 0), 1)

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'projects', label: 'Projects' },
    { id: 'activity', label: 'Activity' },
  ] as const

  return (
    <div className="space-y-6 p-6 overflow-auto h-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Track your project performance and engagement.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/50">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Total Views" value={stats.totalViews.toLocaleString()} icon={Eye} color="bg-blue-500/10 text-blue-500" delta="across all projects" />
            <StatCard label="Total Likes" value={stats.totalLikes.toLocaleString()} icon={Heart} color="bg-pink-500/10 text-pink-500" delta="community engagement" />
            <StatCard label="Remixes" value={stats.totalRemixes.toLocaleString()} icon={GitFork} color="bg-violet-500/10 text-violet-500" delta="times forked" />
            <StatCard label="Deployments" value={stats.totalDeploys.toLocaleString()} icon={Rocket} color="bg-green-500/10 text-green-500" delta="live deploys" />
            <StatCard label="Public Apps" value={stats.publicCount} icon={Star} color="bg-yellow-500/10 text-yellow-500" delta={`of ${repos.length} total`} />
            <StatCard label="Avg Health" value={`${stats.avgHealth}%`} icon={Activity} color="bg-teal-500/10 text-teal-500" delta="project quality score" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Top by views */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye className="h-4 w-4 text-blue-500" /> Top by Views
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topByViews.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No projects yet</p>
                ) : topByViews.map((r, i) => (
                  <div key={r.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                        <span className="font-medium truncate max-w-[160px]">{r.name}</span>
                      </span>
                      <span className="text-muted-foreground text-xs">{(r.viewCount ?? 0).toLocaleString()}</span>
                    </div>
                    <MiniBar value={r.viewCount ?? 0} max={maxViews} color="bg-blue-500" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top by likes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Heart className="h-4 w-4 text-pink-500" /> Top by Likes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topByLikes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No projects yet</p>
                ) : topByLikes.map((r, i) => (
                  <div key={r.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                        <span className="font-medium truncate max-w-[160px]">{r.name}</span>
                      </span>
                      <span className="text-muted-foreground text-xs">{(r.likeCount ?? 0).toLocaleString()}</span>
                    </div>
                    <MiniBar value={r.likeCount ?? 0} max={maxLikes} color="bg-pink-500" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* App type breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" /> Projects by Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              {repos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Build your first project to see analytics</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(
                    repos.reduce<Record<string, number>>((acc, r) => {
                      acc[r.appType] = (acc[r.appType] ?? 0) + 1
                      return acc
                    }, {})
                  ).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                    <div key={type} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50">
                      <span className="text-sm font-medium capitalize">{type}</span>
                      <Badge variant="secondary" className="text-xs h-4 px-1.5">{count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {tab === 'projects' && (
        <Card>
          <CardHeader>
            <CardTitle>All Projects</CardTitle>
            <CardDescription>{repos.length} projects total</CardDescription>
          </CardHeader>
          <CardContent>
            {repos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No projects yet. Build something in the AI Builder.</p>
            ) : (
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Project</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Views</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Likes</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Remixes</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Health</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {repos.map(r => (
                      <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium truncate max-w-[180px]">{r.name}</div>
                          <div className="text-xs text-muted-foreground">{new Date(r.updatedAt).toLocaleDateString()}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="capitalize text-xs">{r.appType}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{(r.viewCount ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{(r.likeCount ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{(r.remixCount ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-xs font-medium ${r.healthScore >= 70 ? 'text-green-500' : r.healthScore >= 40 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                            {r.healthScore ?? 0}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={r.visibility === 'public' ? 'default' : 'secondary'} className="text-xs capitalize">
                            {r.visibility}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'activity' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> Recent Activity
            </CardTitle>
            <CardDescription>Latest AI generations and edits</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((a, i) => (
                  <div key={`${a.id}-${i}`} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/30">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Zap className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.repoName}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.prompt}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <Badge variant="outline" className="text-[10px] capitalize">{a.agent}</Badge>
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(a.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick stats footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Projects', value: repos.length, icon: TrendingUp },
          { label: 'Versions Created', value: repos.reduce((s, r) => s + r.versions.length, 0), icon: GitFork },
          { label: 'Build Runs', value: repos.reduce((s, r) => s + r.buildRuns.length, 0), icon: Activity },
          { label: 'Agents Used', value: [...new Set(repos.flatMap(r => r.agents))].length, icon: Zap },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card/50">
            <s.icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
