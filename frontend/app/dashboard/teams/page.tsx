'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Crown, Shield, User, Copy, Check, Trash2, FolderOpen, Mail } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer'

interface TeamMember {
  id: string
  name: string
  email: string
  role: TeamRole
  joinedAt: string
  avatarInitials: string
}

interface TeamProject {
  id: string
  name: string
  appType: string
  updatedAt: string
  memberCount: number
}

interface Team {
  id: string
  name: string
  description: string
  plan: 'free' | 'pro' | 'enterprise'
  members: TeamMember[]
  projects: TeamProject[]
  inviteCode: string
  createdAt: string
}

const STORAGE_KEY = 'buildforge_teams'

function loadTeams(): Team[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveTeams(teams: Team[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(teams)) } catch { /* quota */ }
}

function generateInviteCode(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase()
}

const ROLE_ICONS: Record<TeamRole, React.ElementType> = {
  owner: Crown,
  admin: Shield,
  editor: User,
  viewer: User,
}

const ROLE_COLORS: Record<TeamRole, string> = {
  owner: 'text-yellow-500',
  admin: 'text-blue-500',
  editor: 'text-green-500',
  viewer: 'text-muted-foreground',
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [activeTeam, setActiveTeam] = useState<Team | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamDesc, setNewTeamDesc] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<TeamRole>('editor')
  const [copiedCode, setCopiedCode] = useState(false)
  const [tab, setTab] = useState<'members' | 'projects' | 'settings'>('members')

  useEffect(() => {
    const loaded = loadTeams()
    setTeams(loaded)
    if (loaded.length > 0) setActiveTeam(loaded[0])
  }, [])

  const handleCreateTeam = () => {
    if (!newTeamName.trim()) return
    const team: Team = {
      id: `team-${Date.now()}`,
      name: newTeamName.trim(),
      description: newTeamDesc.trim(),
      plan: 'free',
      inviteCode: generateInviteCode(),
      createdAt: new Date().toISOString(),
      members: [{
        id: 'me',
        name: 'You',
        email: 'you@example.com',
        role: 'owner',
        joinedAt: new Date().toISOString(),
        avatarInitials: 'YO',
      }],
      projects: [],
    }
    const updated = [team, ...teams]
    setTeams(updated)
    saveTeams(updated)
    setActiveTeam(team)
    setShowCreateModal(false)
    setNewTeamName('')
    setNewTeamDesc('')
    toast.success(`Team "${team.name}" created`)
  }

  const handleInviteMember = () => {
    if (!inviteEmail.trim() || !activeTeam) return
    const name = inviteEmail.split('@')[0]
    const member: TeamMember = {
      id: `m-${Date.now()}`,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      email: inviteEmail.trim(),
      role: inviteRole,
      joinedAt: new Date().toISOString(),
      avatarInitials: name.slice(0, 2).toUpperCase(),
    }
    const updated = teams.map(t =>
      t.id === activeTeam.id ? { ...t, members: [...t.members, member] } : t
    )
    setTeams(updated)
    saveTeams(updated)
    setActiveTeam(updated.find(t => t.id === activeTeam.id) ?? activeTeam)
    setInviteEmail('')
    setShowInviteModal(false)
    toast.success(`Invited ${inviteEmail}`)
  }

  const handleRemoveMember = (memberId: string) => {
    if (!activeTeam) return
    const updated = teams.map(t =>
      t.id === activeTeam.id
        ? { ...t, members: t.members.filter(m => m.id !== memberId) }
        : t
    )
    setTeams(updated)
    saveTeams(updated)
    setActiveTeam(updated.find(t => t.id === activeTeam.id) ?? null)
    toast.success('Member removed')
  }

  const handleCopyInviteCode = () => {
    if (!activeTeam) return
    navigator.clipboard.writeText(activeTeam.inviteCode).catch(() => {})
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
    toast.success('Invite code copied')
  }

  const handleDeleteTeam = (teamId: string) => {
    const updated = teams.filter(t => t.id !== teamId)
    setTeams(updated)
    saveTeams(updated)
    setActiveTeam(updated[0] ?? null)
    toast.success('Team deleted')
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <div className="w-56 shrink-0 border-r border-border/50 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <span className="text-sm font-semibold">Teams</span>
          <button
            onClick={() => setShowCreateModal(true)}
            className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {teams.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6 px-2">No teams yet. Create one to collaborate.</p>
          ) : teams.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTeam(t)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                activeTeam?.id === t.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-foreground'
              }`}
            >
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-white">{t.name.slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium truncate">{t.name}</div>
                <div className="text-[10px] text-muted-foreground">{t.members.length} members</div>
              </div>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-border/50">
          <Button size="sm" className="w-full h-7 text-xs gap-1.5" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-3 w-3" /> New Team
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {!activeTeam ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h2 className="text-lg font-semibold mb-2">No team selected</h2>
            <p className="text-sm text-muted-foreground mb-4">Create a team to collaborate on projects</p>
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Create Team
            </Button>
          </div>
        ) : (
          <>
            {/* Team header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold">{activeTeam.name}</h1>
                {activeTeam.description && <p className="text-muted-foreground text-sm mt-1">{activeTeam.description}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="capitalize text-xs">{activeTeam.plan}</Badge>
                  <span className="text-xs text-muted-foreground">{activeTeam.members.length} members · {activeTeam.projects.length} projects</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setShowInviteModal(true)}>
                  <Mail className="h-3.5 w-3.5" /> Invite
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs text-destructive hover:text-destructive" onClick={() => handleDeleteTeam(activeTeam.id)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-border/50">
              {(['members', 'projects', 'settings'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                    tab === t ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >{t}</button>
              ))}
            </div>

            {tab === 'members' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Members</CardTitle>
                    <CardDescription>{activeTeam.members.length} people in this team</CardDescription>
                  </div>
                  <Button size="sm" className="gap-1.5 text-xs" onClick={() => setShowInviteModal(true)}>
                    <Plus className="h-3.5 w-3.5" /> Add Member
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {activeTeam.members.map(m => {
                      const RoleIcon = ROLE_ICONS[m.role]
                      return (
                        <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:bg-muted/20 transition-colors">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-border/50 flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold">{m.avatarInitials}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{m.name}</div>
                            <div className="text-xs text-muted-foreground">{m.email}</div>
                          </div>
                          <div className={`flex items-center gap-1 text-xs font-medium ${ROLE_COLORS[m.role]}`}>
                            <RoleIcon className="h-3 w-3" />
                            <span className="capitalize">{m.role}</span>
                          </div>
                          {m.role !== 'owner' && (
                            <button onClick={() => handleRemoveMember(m.id)} className="text-muted-foreground hover:text-destructive transition-colors ml-2">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {tab === 'projects' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Team Projects</CardTitle>
                  <CardDescription>Projects shared with this team</CardDescription>
                </CardHeader>
                <CardContent>
                  {activeTeam.projects.length === 0 ? (
                    <div className="text-center py-8">
                      <FolderOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No shared projects yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Share projects from the AI Builder</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeTeam.projects.map(p => (
                        <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/40">
                          <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{p.name}</div>
                            <div className="text-xs text-muted-foreground">{p.memberCount} collaborators</div>
                          </div>
                          <Badge variant="outline" className="text-xs capitalize">{p.appType}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {tab === 'settings' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Team Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Invite Code</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 rounded-lg bg-muted/50 border border-border/50 text-sm font-mono tracking-widest">
                        {activeTeam.inviteCode}
                      </code>
                      <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={handleCopyInviteCode}>
                        {copiedCode ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedCode ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">Share this code to invite members to your team</p>
                  </div>
                  <div className="border-t border-border/50 pt-4">
                    <p className="text-sm font-medium mb-1">Danger Zone</p>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive gap-1.5" onClick={() => handleDeleteTeam(activeTeam.id)}>
                      <Trash2 className="h-3.5 w-3.5" /> Delete Team
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Create team modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-md bg-background border border-border rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Create Team</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">Team Name</label>
                <input value={newTeamName} onChange={e => setNewTeamName(e.target.value)}
                  placeholder="e.g. Acme Engineering"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Description (optional)</label>
                <input value={newTeamDesc} onChange={e => setNewTeamDesc(e.target.value)}
                  placeholder="What does this team work on?"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleCreateTeam} disabled={!newTeamName.trim()}>Create Team</Button>
            </div>
          </div>
        </div>
      )}

      {/* Invite modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowInviteModal(false)}>
          <div className="w-full max-w-md bg-background border border-border rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Invite Member</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">Email Address</label>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Role</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value as TeamRole)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="viewer">Viewer — can view projects</option>
                  <option value="editor">Editor — can edit projects</option>
                  <option value="admin">Admin — can manage team</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <Button variant="outline" className="flex-1" onClick={() => setShowInviteModal(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleInviteMember} disabled={!inviteEmail.trim()}>Send Invite</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
