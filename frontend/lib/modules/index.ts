// Module System — each module is a self-contained feature unit
// Modules define their own DB tables, API routes, pages, components, and services

import type { ModuleSpec } from '@/lib/templates/types'

// ── Auth Module ───────────────────────────────────────────────────────────────
export const authModule: ModuleSpec = {
  id: 'auth',
  name: 'Authentication',
  description: 'User authentication with Clerk — sign in, sign up, session management',
  tables: [
    {
      name: 'users',
      columns: [
        { name: 'id', type: 'String', required: true, unique: true },
        { name: 'clerkId', type: 'String', required: true, unique: true },
        { name: 'email', type: 'String', required: true, unique: true },
        { name: 'name', type: 'String', required: false },
        { name: 'role', type: 'String', required: true },
        { name: 'createdAt', type: 'DateTime', required: true },
      ],
    },
  ],
  routes: [
    { method: 'GET', path: '/api/user/me', description: 'Get current user', auth: true },
    { method: 'POST', path: '/api/webhooks/clerk', description: 'Clerk webhook', auth: false },
  ],
  pages: [
    { name: 'Login', path: '/login', auth: false, components: ['LoginForm', 'SocialButtons'], description: 'Sign in page' },
    { name: 'Signup', path: '/signup', auth: false, components: ['SignupForm', 'SocialButtons'], description: 'Sign up page' },
  ],
  components: [
    { name: 'LoginForm', type: 'form', description: 'Email/password login form' },
    { name: 'SignupForm', type: 'form', description: 'Registration form' },
    { name: 'UserAvatar', type: 'ui', description: 'User avatar with dropdown' },
  ],
  services: [
    { name: 'AuthService', description: 'Auth utilities and session helpers', methods: ['getCurrentUser', 'requireAuth', 'requireRole'] },
  ],
  dependencies: [],
}

// ── Users Module ──────────────────────────────────────────────────────────────
export const usersModule: ModuleSpec = {
  id: 'users',
  name: 'User Management',
  description: 'User profiles, roles, and admin management',
  tables: [
    {
      name: 'profiles',
      columns: [
        { name: 'id', type: 'String', required: true, unique: true },
        { name: 'userId', type: 'String', required: true, unique: true, relation: 'users' },
        { name: 'bio', type: 'String', required: false },
        { name: 'avatarUrl', type: 'String', required: false },
        { name: 'updatedAt', type: 'DateTime', required: true },
      ],
    },
  ],
  routes: [
    { method: 'GET', path: '/api/users', description: 'List users (admin)', auth: true, roles: ['admin'] },
    { method: 'GET', path: '/api/users/[id]', description: 'Get user profile', auth: true },
    { method: 'PUT', path: '/api/users/[id]', description: 'Update user profile', auth: true },
    { method: 'DELETE', path: '/api/users/[id]', description: 'Delete user (admin)', auth: true, roles: ['admin'] },
  ],
  pages: [
    { name: 'Profile', path: '/dashboard/profile', auth: true, components: ['ProfileForm', 'AvatarUpload'], description: 'User profile page' },
    { name: 'AdminUsers', path: '/admin/users', auth: true, roles: ['admin'], components: ['UsersTable', 'UserFilters'], description: 'Admin user management' },
  ],
  components: [
    { name: 'ProfileForm', type: 'form', description: 'Edit profile form' },
    { name: 'UsersTable', type: 'table', description: 'Admin users data table' },
    { name: 'UserCard', type: 'ui', description: 'User card component' },
  ],
  services: [
    { name: 'UserService', description: 'User CRUD operations', methods: ['getUser', 'updateUser', 'deleteUser', 'listUsers'] },
  ],
  dependencies: ['auth'],
}

// ── Billing Module ────────────────────────────────────────────────────────────
export const billingModule: ModuleSpec = {
  id: 'billing',
  name: 'Billing & Subscriptions',
  description: 'Stripe-powered subscription billing with plans and usage tracking',
  tables: [
    {
      name: 'subscriptions',
      columns: [
        { name: 'id', type: 'String', required: true, unique: true },
        { name: 'userId', type: 'String', required: true, unique: true, relation: 'users' },
        { name: 'plan', type: 'String', required: true },
        { name: 'status', type: 'String', required: true },
        { name: 'stripeCustomerId', type: 'String', required: false },
        { name: 'stripeSubscriptionId', type: 'String', required: false },
        { name: 'currentPeriodEnd', type: 'DateTime', required: false },
        { name: 'creditsRemaining', type: 'Int', required: true },
      ],
    },
  ],
  routes: [
    { method: 'POST', path: '/api/billing/checkout', description: 'Create Stripe checkout session', auth: true },
    { method: 'POST', path: '/api/billing/portal', description: 'Open Stripe billing portal', auth: true },
    { method: 'POST', path: '/api/webhooks/stripe', description: 'Stripe webhook handler', auth: false },
  ],
  pages: [
    { name: 'Billing', path: '/dashboard/billing', auth: true, components: ['PlanCard', 'UsageBar', 'InvoiceList'], description: 'Billing and subscription management' },
    { name: 'Pricing', path: '/pricing', auth: false, components: ['PricingTable', 'PlanComparison'], description: 'Public pricing page' },
  ],
  components: [
    { name: 'PricingTable', type: 'feature', description: '3-tier pricing table with toggle' },
    { name: 'PlanCard', type: 'ui', description: 'Current plan status card' },
    { name: 'UsageBar', type: 'chart', description: 'Credit/usage progress bar' },
  ],
  services: [
    { name: 'BillingService', description: 'Stripe integration helpers', methods: ['createCheckout', 'createPortal', 'handleWebhook', 'getSubscription'] },
  ],
  dependencies: ['auth', 'users'],
}

// ── Dashboard Module ──────────────────────────────────────────────────────────
export const dashboardModule: ModuleSpec = {
  id: 'dashboard',
  name: 'Dashboard',
  description: 'Main app dashboard with KPIs, charts, and activity feed',
  tables: [],
  routes: [
    { method: 'GET', path: '/api/dashboard/stats', description: 'Get dashboard statistics', auth: true },
  ],
  pages: [
    { name: 'Dashboard', path: '/dashboard', auth: true, components: ['KPICards', 'ActivityChart', 'RecentActivity', 'QuickActions'], description: 'Main dashboard' },
  ],
  components: [
    { name: 'KPICards', type: 'feature', description: 'Key performance indicator cards row' },
    { name: 'ActivityChart', type: 'chart', description: 'Line/bar chart for activity over time' },
    { name: 'RecentActivity', type: 'feature', description: 'Recent activity feed' },
    { name: 'QuickActions', type: 'ui', description: 'Quick action buttons panel' },
    { name: 'DashboardSidebar', type: 'layout', description: 'Collapsible sidebar navigation' },
  ],
  services: [
    { name: 'StatsService', description: 'Aggregate statistics queries', methods: ['getDashboardStats', 'getActivityData'] },
  ],
  dependencies: ['auth'],
}

// ── Analytics Module ──────────────────────────────────────────────────────────
export const analyticsModule: ModuleSpec = {
  id: 'analytics',
  name: 'Analytics',
  description: 'Usage analytics, event tracking, and reporting',
  tables: [
    {
      name: 'events',
      columns: [
        { name: 'id', type: 'String', required: true, unique: true },
        { name: 'userId', type: 'String', required: false, relation: 'users' },
        { name: 'event', type: 'String', required: true },
        { name: 'properties', type: 'Json', required: false },
        { name: 'createdAt', type: 'DateTime', required: true },
      ],
    },
  ],
  routes: [
    { method: 'POST', path: '/api/analytics/track', description: 'Track an event', auth: false },
    { method: 'GET', path: '/api/analytics/report', description: 'Get analytics report', auth: true, roles: ['admin'] },
  ],
  pages: [
    { name: 'Analytics', path: '/dashboard/analytics', auth: true, roles: ['admin'], components: ['MetricsGrid', 'FunnelChart', 'EventsTable'], description: 'Analytics dashboard' },
  ],
  components: [
    { name: 'MetricsGrid', type: 'chart', description: 'Grid of metric cards with trends' },
    { name: 'FunnelChart', type: 'chart', description: 'Conversion funnel visualization' },
    { name: 'EventsTable', type: 'table', description: 'Raw events data table' },
  ],
  services: [
    { name: 'AnalyticsService', description: 'Event tracking and reporting', methods: ['track', 'getReport', 'getFunnel'] },
  ],
  dependencies: ['auth'],
}

// ── Notifications Module ──────────────────────────────────────────────────────
export const notificationsModule: ModuleSpec = {
  id: 'notifications',
  name: 'Notifications',
  description: 'In-app and email notifications system',
  tables: [
    {
      name: 'notifications',
      columns: [
        { name: 'id', type: 'String', required: true, unique: true },
        { name: 'userId', type: 'String', required: true, relation: 'users' },
        { name: 'type', type: 'String', required: true },
        { name: 'title', type: 'String', required: true },
        { name: 'body', type: 'String', required: false },
        { name: 'read', type: 'Boolean', required: true },
        { name: 'createdAt', type: 'DateTime', required: true },
      ],
    },
  ],
  routes: [
    { method: 'GET', path: '/api/notifications', description: 'Get user notifications', auth: true },
    { method: 'PUT', path: '/api/notifications/[id]/read', description: 'Mark as read', auth: true },
    { method: 'DELETE', path: '/api/notifications/[id]', description: 'Delete notification', auth: true },
  ],
  pages: [],
  components: [
    { name: 'NotificationBell', type: 'ui', description: 'Bell icon with unread count badge' },
    { name: 'NotificationDropdown', type: 'feature', description: 'Notification list dropdown' },
    { name: 'NotificationItem', type: 'ui', description: 'Single notification row' },
  ],
  services: [
    { name: 'NotificationService', description: 'Notification CRUD and email sending', methods: ['create', 'markRead', 'sendEmail', 'getUnread'] },
  ],
  dependencies: ['auth', 'users'],
}

// ── Bookings Module ───────────────────────────────────────────────────────────
export const bookingsModule: ModuleSpec = {
  id: 'bookings',
  name: 'Bookings & Scheduling',
  description: 'Appointment and class booking system with calendar',
  tables: [
    {
      name: 'bookings',
      columns: [
        { name: 'id', type: 'String', required: true, unique: true },
        { name: 'userId', type: 'String', required: true, relation: 'users' },
        { name: 'serviceId', type: 'String', required: true },
        { name: 'startTime', type: 'DateTime', required: true },
        { name: 'endTime', type: 'DateTime', required: true },
        { name: 'status', type: 'String', required: true },
        { name: 'notes', type: 'String', required: false },
        { name: 'createdAt', type: 'DateTime', required: true },
      ],
    },
    {
      name: 'services',
      columns: [
        { name: 'id', type: 'String', required: true, unique: true },
        { name: 'name', type: 'String', required: true },
        { name: 'duration', type: 'Int', required: true },
        { name: 'price', type: 'Float', required: true },
        { name: 'description', type: 'String', required: false },
      ],
    },
  ],
  routes: [
    { method: 'GET', path: '/api/bookings', description: 'List bookings', auth: true },
    { method: 'POST', path: '/api/bookings', description: 'Create booking', auth: true },
    { method: 'PUT', path: '/api/bookings/[id]', description: 'Update booking', auth: true },
    { method: 'DELETE', path: '/api/bookings/[id]', description: 'Cancel booking', auth: true },
    { method: 'GET', path: '/api/services', description: 'List services', auth: false },
  ],
  pages: [
    { name: 'BookingCalendar', path: '/book', auth: false, components: ['CalendarView', 'ServiceSelector', 'TimeSlotPicker'], description: 'Public booking page' },
    { name: 'MyBookings', path: '/dashboard/bookings', auth: true, components: ['BookingsList', 'BookingCard'], description: 'User bookings list' },
    { name: 'AdminBookings', path: '/admin/bookings', auth: true, roles: ['admin'], components: ['BookingsTable', 'BookingFilters'], description: 'Admin booking management' },
  ],
  components: [
    { name: 'CalendarView', type: 'feature', description: 'Monthly/weekly calendar view' },
    { name: 'TimeSlotPicker', type: 'form', description: 'Available time slot selector' },
    { name: 'BookingCard', type: 'ui', description: 'Booking summary card' },
  ],
  services: [
    { name: 'BookingService', description: 'Booking CRUD and availability', methods: ['create', 'cancel', 'getAvailability', 'listByUser'] },
  ],
  dependencies: ['auth', 'users', 'notifications'],
}

// ── AI Generator Module ───────────────────────────────────────────────────────
export const aiGeneratorModule: ModuleSpec = {
  id: 'ai-generator',
  name: 'AI Generator',
  description: 'AI-powered content/code generation with streaming and history',
  tables: [
    {
      name: 'generations',
      columns: [
        { name: 'id', type: 'String', required: true, unique: true },
        { name: 'userId', type: 'String', required: true, relation: 'users' },
        { name: 'prompt', type: 'String', required: true },
        { name: 'output', type: 'String', required: true },
        { name: 'model', type: 'String', required: true },
        { name: 'tokensUsed', type: 'Int', required: false },
        { name: 'createdAt', type: 'DateTime', required: true },
      ],
    },
  ],
  routes: [
    { method: 'POST', path: '/api/generate', description: 'Generate AI content', auth: true },
    { method: 'GET', path: '/api/generations', description: 'Get generation history', auth: true },
  ],
  pages: [
    { name: 'Generator', path: '/dashboard/generate', auth: true, components: ['PromptInput', 'StreamingOutput', 'GenerationHistory'], description: 'AI generation interface' },
  ],
  components: [
    { name: 'PromptInput', type: 'form', description: 'Prompt textarea with settings' },
    { name: 'StreamingOutput', type: 'feature', description: 'Streaming text output with markdown' },
    { name: 'GenerationHistory', type: 'feature', description: 'Past generations list' },
  ],
  services: [
    { name: 'AIService', description: 'AI model calls and streaming', methods: ['generate', 'stream', 'getHistory'] },
  ],
  dependencies: ['auth', 'billing'],
}

// ── Module Registry ───────────────────────────────────────────────────────────
export const MODULE_REGISTRY: Record<string, ModuleSpec> = {
  auth: authModule,
  users: usersModule,
  billing: billingModule,
  dashboard: dashboardModule,
  analytics: analyticsModule,
  notifications: notificationsModule,
  bookings: bookingsModule,
  'ai-generator': aiGeneratorModule,
}

export function getModule(id: string): ModuleSpec | undefined {
  return MODULE_REGISTRY[id]
}

export function resolveModules(moduleIds: string[]): ModuleSpec[] {
  // Resolve with dependencies (topological order)
  const resolved = new Set<string>()
  const result: ModuleSpec[] = []

  function resolve(id: string) {
    if (resolved.has(id)) return
    const mod = MODULE_REGISTRY[id]
    if (!mod) return
    for (const dep of mod.dependencies) resolve(dep)
    resolved.add(id)
    result.push(mod)
  }

  for (const id of moduleIds) resolve(id)
  return result
}

/** Merge all module specs into a unified architecture fragment */
export function mergeModuleSpecs(modules: ModuleSpec[]) {
  return {
    tables: modules.flatMap(m => m.tables),
    routes: modules.flatMap(m => m.routes),
    pages: modules.flatMap(m => m.pages),
    components: modules.flatMap(m => m.components),
    services: modules.flatMap(m => m.services),
  }
}
