// Centralized API helpers — standard response format, input validation, retry logic

import { NextResponse } from 'next/server'

/** Standard API response shape */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/** Return a successful JSON response */
export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data } satisfies ApiResponse<T>, { status })
}

/** Return an error JSON response */
export function err(message: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, error: message } satisfies ApiResponse, { status })
}

/** Validate required fields in a request body */
export function validateBody<T extends Record<string, unknown>>(
  body: Partial<T>,
  required: (keyof T)[],
): string | null {
  for (const key of required) {
    if (body[key] === undefined || body[key] === null || body[key] === '') {
      return `Missing required field: ${String(key)}`
    }
  }
  return null
}

/** Retry an async function up to `attempts` times with exponential backoff */
export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  baseDelayMs = 500,
): Promise<T> {
  let lastError: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (i < attempts - 1) {
        await new Promise(r => setTimeout(r, baseDelayMs * Math.pow(2, i)))
      }
    }
  }
  throw lastError
}

/** Wrap an AI call with a timeout */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs = 30_000,
  fallback?: () => T,
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
  )
  try {
    return await Promise.race([fn(), timeout])
  } catch (err) {
    if (fallback) return fallback()
    throw err
  }
}

/** Parse JSON body safely */
export async function parseBody<T>(req: Request): Promise<T | null> {
  try {
    return await req.json() as T
  } catch {
    return null
  }
}
