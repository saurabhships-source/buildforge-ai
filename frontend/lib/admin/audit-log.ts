// Audit logger — writes to admin_logs table
import { db } from '@/lib/db'

export type AdminAction =
  | 'credit_update'
  | 'user_suspend'
  | 'user_unsuspend'
  | 'user_delete'
  | 'data_export'
  | 'role_change'
  | 'issue_resolve'
  | 'issue_create'
  | 'cache_invalidate'
  | 'system_action'

export async function logAdminAction(params: {
  adminId: string
  action: AdminAction
  targetId?: string
  targetType?: 'user' | 'project' | 'subscription' | 'system'
  details?: Record<string, unknown>
}): Promise<void> {
  try {
    await (db as any).adminLog.create({
      data: {
        adminId: params.adminId,
        action: params.action,
        targetId: params.targetId ?? null,
        targetType: params.targetType ?? null,
        details: params.details ?? {},
      },
    })
  } catch (err) {
    // Never let audit logging crash the main operation
    console.error('[audit-log] failed to write log:', err)
  }
}
