'use client'

import { useEffect, useState, useCallback } from 'react'
import { Shield, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { safeFetch } from '@/lib/safe-fetch'

interface AdminLog {
  id: string
  adminId: string
  action: string
  targetId?: string
  targetType?: string
  details: Record<string, unknown>
  createdAt: string
}

const actionColor: Record<string, string> = {
  credit_update: 'default',
  user_suspend: 'destructive',
  user_unsuspend: 'secondary',
  user_delete: 'destructive',
  data_export: 'outline',
  role_change: 'default',
  issue_resolve: 'secondary',
  cache_invalidate: 'outline',
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (actionFilter) params.set('action', actionFilter)
    const data = await safeFetch<{ logs: AdminLog[]; total: number }>(`/api/admin/logs?${params}`)
    setLogs(data?.logs ?? [])
    setTotal(data?.total ?? 0)
    setLoading(false)
  }, [page, actionFilter])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Activity Log</h1>
          <p className="text-muted-foreground text-sm">{total} total audit entries</p>
        </div>
        <a
          href="/api/admin/export?dataset=analytics&format=csv"
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted transition-colors"
        >
          <Download className="h-4 w-4" /> Export CSV
        </a>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'credit_update', 'user_suspend', 'user_delete', 'data_export', 'role_change', 'issue_resolve'].map(a => (
          <button
            key={a}
            onClick={() => { setActionFilter(a); setPage(1) }}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${actionFilter === a ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground border border-border'}`}
          >
            {a || 'All'}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Admin ID</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : logs.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No logs found</TableCell></TableRow>
              ) : logs.map(log => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge variant={(actionColor[log.action] ?? 'outline') as any}>{log.action}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{log.adminId.slice(0, 12)}...</TableCell>
                  <TableCell className="text-xs">
                    {log.targetId ? (
                      <span className="font-mono">{log.targetType}: {log.targetId.slice(0, 12)}...</span>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                    {JSON.stringify(log.details)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Page {page} of {Math.ceil(total / 100)}</span>
        <div className="flex gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-40">Prev</button>
          <button disabled={page * 100 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  )
}
