/**
 * Product Pattern Library — SaaS archetypes with entities, features, pages, and API routes.
 * Used by the Product Brain to match user intent to known patterns.
 */

export type PatternId =
  | 'crm' | 'booking' | 'analytics' | 'task-manager' | 'marketplace'
  | 'ecommerce' | 'hrm' | 'lms' | 'invoicing' | 'social'

export interface SaaSPattern {
  id: PatternId
  name: string
  description: string
  keywords: string[]
  entities: string[]
  features: string[]
  pages: string[]
  apiRoutes: string[]
  dbTables: string[]
  authRequired: boolean
  hasPayments: boolean
}

export const SAAS_PATTERNS: SaaSPattern[] = [
  {
    id: 'crm',
    name: 'CRM',
    description: 'Customer relationship management system',
    keywords: ['crm', 'customer', 'contact', 'lead', 'sales', 'pipeline', 'deal', 'client'],
    entities: ['Contact', 'Company', 'Deal', 'Activity', 'Note'],
    features: ['contact management', 'deal pipeline', 'activity tracking', 'email integration', 'reporting'],
    pages: ['/', '/dashboard', '/contacts', '/contacts/[id]', '/deals', '/companies', '/reports'],
    apiRoutes: ['/api/contacts', '/api/deals', '/api/companies', '/api/activities'],
    dbTables: ['contacts', 'companies', 'deals', 'activities', 'notes'],
    authRequired: true,
    hasPayments: false,
  },
  {
    id: 'booking',
    name: 'Booking System',
    description: 'Appointment and reservation management',
    keywords: ['booking', 'appointment', 'reservation', 'schedule', 'calendar', 'slot', 'availability'],
    entities: ['Booking', 'Service', 'Provider', 'TimeSlot', 'Customer'],
    features: ['calendar view', 'availability management', 'booking confirmation', 'reminders', 'payments'],
    pages: ['/', '/book', '/dashboard', '/bookings', '/services', '/providers', '/calendar'],
    apiRoutes: ['/api/bookings', '/api/services', '/api/availability', '/api/providers'],
    dbTables: ['bookings', 'services', 'providers', 'time_slots', 'customers'],
    authRequired: true,
    hasPayments: true,
  },
  {
    id: 'analytics',
    name: 'Analytics Dashboard',
    description: 'Data analytics and visualization platform',
    keywords: ['analytics', 'dashboard', 'metrics', 'chart', 'report', 'data', 'insight', 'kpi', 'tracking'],
    entities: ['Event', 'Metric', 'Report', 'Dashboard', 'DataSource'],
    features: ['real-time charts', 'custom dashboards', 'data export', 'alerts', 'team sharing'],
    pages: ['/', '/dashboard', '/reports', '/reports/[id]', '/settings', '/integrations'],
    apiRoutes: ['/api/events', '/api/metrics', '/api/reports', '/api/dashboards'],
    dbTables: ['events', 'metrics', 'reports', 'dashboards', 'data_sources'],
    authRequired: true,
    hasPayments: false,
  },
  {
    id: 'task-manager',
    name: 'Task Manager',
    description: 'Project and task management tool',
    keywords: ['task', 'todo', 'project', 'kanban', 'board', 'sprint', 'issue', 'ticket', 'workflow'],
    entities: ['Task', 'Project', 'Board', 'Column', 'Label', 'Comment'],
    features: ['kanban board', 'task assignment', 'due dates', 'labels', 'comments', 'file attachments'],
    pages: ['/', '/dashboard', '/projects', '/projects/[id]', '/board', '/tasks', '/team'],
    apiRoutes: ['/api/tasks', '/api/projects', '/api/boards', '/api/comments'],
    dbTables: ['tasks', 'projects', 'boards', 'columns', 'labels', 'comments'],
    authRequired: true,
    hasPayments: false,
  },
  {
    id: 'marketplace',
    name: 'Marketplace',
    description: 'Two-sided marketplace platform',
    keywords: ['marketplace', 'buy', 'sell', 'listing', 'vendor', 'product', 'shop', 'store'],
    entities: ['Listing', 'Seller', 'Buyer', 'Order', 'Review', 'Category'],
    features: ['product listings', 'search & filter', 'seller profiles', 'checkout', 'reviews', 'messaging'],
    pages: ['/', '/listings', '/listings/[id]', '/sell', '/dashboard', '/orders', '/profile/[id]'],
    apiRoutes: ['/api/listings', '/api/orders', '/api/reviews', '/api/sellers'],
    dbTables: ['listings', 'sellers', 'orders', 'reviews', 'categories', 'messages'],
    authRequired: true,
    hasPayments: true,
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce',
    description: 'Online store with product catalog and checkout',
    keywords: ['ecommerce', 'shop', 'store', 'product', 'cart', 'checkout', 'inventory', 'order'],
    entities: ['Product', 'Category', 'Order', 'Cart', 'Customer', 'Review'],
    features: ['product catalog', 'shopping cart', 'checkout', 'inventory management', 'order tracking'],
    pages: ['/', '/products', '/products/[id]', '/cart', '/checkout', '/orders', '/admin'],
    apiRoutes: ['/api/products', '/api/cart', '/api/orders', '/api/checkout'],
    dbTables: ['products', 'categories', 'orders', 'order_items', 'carts', 'customers'],
    authRequired: true,
    hasPayments: true,
  },
  {
    id: 'hrm',
    name: 'HR Management',
    description: 'Human resources management system',
    keywords: ['hr', 'employee', 'payroll', 'leave', 'attendance', 'recruitment', 'onboarding', 'staff'],
    entities: ['Employee', 'Department', 'LeaveRequest', 'Payroll', 'JobPosting'],
    features: ['employee directory', 'leave management', 'payroll', 'recruitment', 'performance reviews'],
    pages: ['/', '/dashboard', '/employees', '/employees/[id]', '/leaves', '/payroll', '/recruitment'],
    apiRoutes: ['/api/employees', '/api/leaves', '/api/payroll', '/api/departments'],
    dbTables: ['employees', 'departments', 'leave_requests', 'payroll', 'job_postings'],
    authRequired: true,
    hasPayments: false,
  },
  {
    id: 'lms',
    name: 'Learning Management System',
    description: 'Online course and learning platform',
    keywords: ['course', 'learning', 'education', 'lesson', 'quiz', 'student', 'instructor', 'lms', 'training'],
    entities: ['Course', 'Lesson', 'Enrollment', 'Quiz', 'Certificate', 'Instructor'],
    features: ['course creation', 'video lessons', 'quizzes', 'progress tracking', 'certificates'],
    pages: ['/', '/courses', '/courses/[id]', '/dashboard', '/learn/[courseId]', '/certificates'],
    apiRoutes: ['/api/courses', '/api/lessons', '/api/enrollments', '/api/quizzes'],
    dbTables: ['courses', 'lessons', 'enrollments', 'quizzes', 'quiz_attempts', 'certificates'],
    authRequired: true,
    hasPayments: true,
  },
  {
    id: 'invoicing',
    name: 'Invoicing & Billing',
    description: 'Invoice and billing management for freelancers and businesses',
    keywords: ['invoice', 'billing', 'payment', 'client', 'freelance', 'quote', 'expense', 'accounting'],
    entities: ['Invoice', 'Client', 'LineItem', 'Payment', 'Expense'],
    features: ['invoice creation', 'PDF export', 'payment tracking', 'client portal', 'recurring invoices'],
    pages: ['/', '/dashboard', '/invoices', '/invoices/[id]', '/clients', '/expenses', '/reports'],
    apiRoutes: ['/api/invoices', '/api/clients', '/api/payments', '/api/expenses'],
    dbTables: ['invoices', 'clients', 'line_items', 'payments', 'expenses'],
    authRequired: true,
    hasPayments: true,
  },
  {
    id: 'social',
    name: 'Social Platform',
    description: 'Community and social networking platform',
    keywords: ['social', 'community', 'post', 'feed', 'follow', 'like', 'comment', 'profile', 'network'],
    entities: ['Post', 'User', 'Comment', 'Like', 'Follow', 'Notification'],
    features: ['user profiles', 'post feed', 'comments', 'likes', 'follow system', 'notifications'],
    pages: ['/', '/feed', '/profile/[username]', '/post/[id]', '/explore', '/notifications'],
    apiRoutes: ['/api/posts', '/api/comments', '/api/follows', '/api/notifications'],
    dbTables: ['posts', 'comments', 'likes', 'follows', 'notifications'],
    authRequired: true,
    hasPayments: false,
  },
]

/** Find the best matching pattern for a set of keywords */
export function matchPattern(keywords: string[]): { pattern: SaaSPattern; score: number } | null {
  const kw = keywords.map(k => k.toLowerCase())
  let best: { pattern: SaaSPattern; score: number } | null = null

  for (const pattern of SAAS_PATTERNS) {
    const matches = pattern.keywords.filter(pk => kw.some(k => k.includes(pk) || pk.includes(k)))
    const score = matches.length / pattern.keywords.length
    if (!best || score > best.score) {
      best = { pattern, score }
    }
  }

  return best
}

/** Get a pattern by ID */
export function getPattern(id: PatternId): SaaSPattern | undefined {
  return SAAS_PATTERNS.find(p => p.id === id)
}
