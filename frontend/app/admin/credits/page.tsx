'use client'

import { useEffect, useState } from 'react'
import { CreditCard, Plus, Minus, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { safeFetch } from '@/lib/safe-fetch'

interface User {
  id: string
  email: string
  name: string
  subscription: { plan: string; creditsRemaining: number; creditsTotal: number } | null
}

export default function AdminCreditsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    safeFetch<{ users: User[] }>(`/api/admin/users?search=${encodeURIComponent(search)}`)
      .then(d => { setUsers(d?.users ?? []); setLoading(false) })
  }, [search])

  async function creditAction(userId: string, action: 'add' | 'remove' | 'reset') {
    const amount = parseInt(amounts[userId] ?? '100')
    const data = await safeFetch<{ success: boolean; creditsRemaining: number }>('/api/admin/credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action, amount }),
    })
    if (data?.success) {
      setMsg(`Credits updated — new balance: ${data.creditsRemaining}`)
      setUsers(prev => prev.map(u => u.id === userId && u.subscription
        ? { ...u, subscription: { ...u.subscription, creditsRemaining: data.creditsRemaining } }
        : u
      ))
    }
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Credit Management</h1>
        <p className="text-muted-foreground text-sm">Add, remove, or reset user credits</p>
      </div>

      {msg && <div className="text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-4 py-2">{msg}</div>}

      <div className="relative">
        <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Credits Remaining</TableHead>
                <TableHead>Credits Total</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{user.subscription?.plan ?? 'free'}</Badge></TableCell>
                  <TableCell className="font-mono">{user.subscription?.creditsRemaining ?? 0}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{user.subscription?.creditsTotal ?? 0}</TableCell>
                  <TableCell>
                    <Input
                      className="w-24 h-7 text-xs"
                      type="number"
                      placeholder="100"
                      value={amounts[user.id] ?? ''}
                      onChange={e => setAmounts(p => ({ ...p, [user.id]: e.target.value }))}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" className="h-7 px-2 text-green-400" onClick={() => creditAction(user.id, 'add')}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 px-2 text-red-400" onClick={() => creditAction(user.id, 'remove')}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => creditAction(user.id, 'reset')}>
                        <RotateCcw className="h-3 w-3" />
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
