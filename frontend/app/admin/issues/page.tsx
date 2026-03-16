'use client'

import { useEffect, useState, useCallback } from 'react'
import { AlertTriangle, CheckCircle, Clock, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { safeFetch } from '@/lib/safe-fetch'

interface Issue {
  id: string
  type: string
  title: string
  description: string
  status: string
  severity: string
  userId?: string
  projectId?: string
  createdAt: string
  resolvedAt?: string
}

const severityColor: Record<string, string> = {
  low: 'secondary', medium: 'outline', high: 'default', critical: 'destructive',
}

export default function AdminIssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [filter, setFilter] = useState<string>('open')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await safeFetch<{ issues: Issue[] }>(`/api/admin/issues?status=${filter}`)
    setIssues(data?.issues ?? [])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  async function resolve(id: string) {
    await fetch('/api/admin/issues', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'resolved' }),
    })
    load()
  }

  const counts = { open: 0, in_progress: 0, resolved: 0 }
  issues.forEach(i => { if (i.status in counts) counts[i.status as keyof typeof counts]++ })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Issue Tracker</h1>
          <p className="text-muted-foreground text-sm">Generation, repair, and deployment failures</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(['open', 'in_progress', 'resolved'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${filter === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground border border-border'}`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : issues.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No issues found</TableCell></TableRow>
              ) : issues.map(issue => (
                <TableRow key={issue.id}>
                  <TableCell>
                    <Badge variant={severityColor[issue.severity] as any}>{issue.severity}</Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{issue.type}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{issue.title}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-xs">{issue.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={issue.status === 'resolved' ? 'default' : issue.status === 'in_progress' ? 'secondary' : 'outline'}>
                      {issue.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {issue.status !== 'resolved' && (
                      <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => resolve(issue.id)}>
                        <CheckCircle className="h-3 w-3 mr-1" /> Resolve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
