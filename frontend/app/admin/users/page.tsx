'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Trash2, Ban, CheckCircle, CreditCard } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { safeFetch } from '@/lib/safe-fetch'

interface User {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
  subscription: { plan: string; creditsRemaining: number } | null
  _count: { projects: number }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [creditInput, setCreditInput] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    const data = await safeFetch<{ users: User[]; total: number }>(
      `/api/admin/users?search=${encodeURIComponent(search)}`
    )
    setUsers(data?.users ?? [])
    setTotal(data?.total ?? 0)
    setLoading(false)
  }, [search])

  useEffect(() => { load() }, [load])

  async function action(id: string, act: string, extra?: Record<string, unknown>) {
    await fetch(`/api/admin/users/${id}`, {
      method: act === 'delete' ? 'DELETE' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: act !== 'delete' ? JSON.stringify({ action: act, ...extra }) : undefined,
    })
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground text-sm">{total} total users</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{user.subscription?.plan ?? 'free'}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input
                        className="w-20 h-7 text-xs"
                        value={creditInput[user.id] ?? String(user.subscription?.creditsRemaining ?? 0)}
                        onChange={e => setCreditInput(p => ({ ...p, [user.id]: e.target.value }))}
                      />
                      <Button
                        size="sm" variant="outline" className="h-7 px-2"
                        onClick={() => action(user.id, 'set_credits', { credits: parseInt(creditInput[user.id] ?? '0') })}
                      >
                        <CreditCard className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{user._count.projects}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : user.role === 'suspended' ? 'destructive' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {user.role === 'suspended' ? (
                        <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => action(user.id, 'unsuspend')}>
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => action(user.id, 'suspend')}>
                          <Ban className="h-3 w-3" />
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" className="h-7 px-2"
                        onClick={() => confirm('Delete this user?') && action(user.id, 'delete')}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
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
