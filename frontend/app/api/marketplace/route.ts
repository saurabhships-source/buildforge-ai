import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { BUILTIN_AGENTS_DATA } from '@/lib/agent-marketplace-server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })
  return NextResponse.json({ agents: BUILTIN_AGENTS_DATA })
}
