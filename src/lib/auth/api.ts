import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { prisma } from '@/src/lib/prisma'
import { NextRequest } from 'next/server'
import type { User } from '@prisma/client'
import { getRateLimits } from '@/src/lib/features'

export async function authenticateRequest(request: NextRequest): Promise<User | null> {
  // Check for API key first
  const apiKey = request.headers.get('x-api-key')
  if (apiKey) {
    try {
      const user = await prisma.user.findUnique({
        where: { apiKey, apiKeyEnabled: true }
      })
      return user
    } catch (error) {
      console.error('API key auth failed:', error)
    }
  }

  // Check for Supabase session
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user: supabaseUser } } = await supabase.auth.getUser()

    if (!supabaseUser) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { email: supabaseUser.email! }
    })

    return user
  } catch (error) {
    console.error('Session auth failed:', error)
    return null
  }
}

export async function checkRateLimit(user: User | null, ipAddress: string): Promise<boolean> {
  const limits = getRateLimits(user?.tier ?? 'FREE')

  // Check daily limit
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    const count = await prisma.usageLog.count({
      where: {
        ...(user ? { userId: user.id } : { ipAddress }),
        createdAt: { gte: today }
      }
    })

    return count < limits.daily
  } catch (error) {
    console.error('Rate limit check failed:', error)
    // If database fails, allow the request
    return true
  }
}
