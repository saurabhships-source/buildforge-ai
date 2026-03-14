'use client'

import { Users, DollarSign, CreditCard, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Mock data for admin dashboard
const stats = {
  totalUsers: 1247,
  totalRevenue: 48520,
  activeSubscriptions: 892,
  monthlyGrowth: 12.5,
}

const users = [
  { id: '1', name: 'Sarah Chen', email: 'sarah@techstart.io', plan: 'pro', credits: 234, status: 'active', joined: '2024-01-10' },
  { id: '2', name: 'Marcus Rodriguez', email: 'marcus@growthlabs.co', plan: 'enterprise', credits: 9999, status: 'active', joined: '2024-01-08' },
  { id: '3', name: 'Emily Watson', email: 'emily@company.com', plan: 'starter', credits: 45, status: 'active', joined: '2024-01-05' },
  { id: '4', name: 'James Lee', email: 'james@startup.io', plan: 'pro', credits: 120, status: 'active', joined: '2024-01-03' },
  { id: '5', name: 'Anna Smith', email: 'anna@design.co', plan: 'starter', credits: 0, status: 'churned', joined: '2023-12-20' },
]

const payments = [
  { id: 'PAY001', user: 'Sarah Chen', amount: 49, plan: 'Pro', status: 'completed', date: '2024-01-15' },
  { id: 'PAY002', user: 'Marcus Rodriguez', amount: 99, plan: 'Enterprise', status: 'completed', date: '2024-01-14' },
  { id: 'PAY003', user: 'James Lee', amount: 49, plan: 'Pro', status: 'completed', date: '2024-01-13' },
  { id: 'PAY004', user: 'Emily Watson', amount: 19, plan: 'Starter', status: 'completed', date: '2024-01-12' },
  { id: 'PAY005', user: 'New User', amount: 49, plan: 'Pro', status: 'pending', date: '2024-01-16' },
]

const subscriptions = [
  { id: 'SUB001', user: 'Sarah Chen', plan: 'Pro', status: 'active', startDate: '2024-01-10', nextBilling: '2024-02-10' },
  { id: 'SUB002', user: 'Marcus Rodriguez', plan: 'Enterprise', status: 'active', startDate: '2024-01-08', nextBilling: '2024-02-08' },
  { id: 'SUB003', user: 'James Lee', plan: 'Pro', status: 'active', startDate: '2024-01-03', nextBilling: '2024-02-03' },
  { id: 'SUB004', user: 'Emily Watson', plan: 'Starter', status: 'active', startDate: '2024-01-05', nextBilling: '2024-02-05' },
  { id: 'SUB005', user: 'Anna Smith', plan: 'Starter', status: 'cancelled', startDate: '2023-12-20', nextBilling: '-' },
]

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of platform statistics and user management.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +180 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +$5,230 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              71.5% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">+{stats.monthlyGrowth}%</div>
            <p className="text-xs text-muted-foreground">
              Compared to last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage all registered users</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {user.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.credits}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.joined}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Recent transactions and payment records</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-sm">{payment.id}</TableCell>
                      <TableCell>{payment.user}</TableCell>
                      <TableCell>${payment.amount}</TableCell>
                      <TableCell>{payment.plan}</TableCell>
                      <TableCell>
                        <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{payment.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Management</CardTitle>
              <CardDescription>Active and cancelled subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subscription ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Next Billing</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-mono text-sm">{sub.id}</TableCell>
                      <TableCell>{sub.user}</TableCell>
                      <TableCell>{sub.plan}</TableCell>
                      <TableCell>
                        <Badge variant={sub.status === 'active' ? 'default' : 'destructive'}>
                          {sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{sub.startDate}</TableCell>
                      <TableCell>{sub.nextBilling}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
