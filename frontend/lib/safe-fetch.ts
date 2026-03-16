/**
 * Safe fetch wrapper — prevents crashes from empty responses, invalid JSON,
 * or non-200 status codes. Returns null on any failure instead of throwing.
 */
export async function safeFetch<T = unknown>(
  url: string,
  options?: RequestInit,
): Promise<T | null> {
  try {
    const res = await fetch(url, options)
    if (!res.ok) {
      console.warn(`[safeFetch] ${res.status} ${res.statusText} — ${url}`)
      return null
    }
    const text = await res.text()
    if (!text || !text.trim()) return null
    return JSON.parse(text) as T
  } catch (err) {
    console.error('[safeFetch] error:', url, err)
    return null
  }
}

/**
 * Safe POST helper — wraps safeFetch with JSON body.
 */
export async function safePost<T = unknown>(
  url: string,
  body: unknown,
  options?: RequestInit,
): Promise<T | null> {
  return safeFetch<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    body: JSON.stringify(body),
    ...options,
  })
}
