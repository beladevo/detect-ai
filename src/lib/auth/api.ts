import { prisma } from '@/src/lib/prisma'
import { NextRequest } from 'next/server'
import type { User } from '@prisma/client'
import { getRateLimits } from '@/src/lib/features'
import { verifyToken } from './jwt'

export async function authenticateRequest(request: NextRequest): Promise<User | null> {
  const apiKey = request.headers.get('x-api-key')
  if (apiKey) {
    try {
      const user = await prisma.user.findFirst({
        where: { apiKey, apiKeyEnabled: true, deletedAt: null }
      })
      return user
    } catch (error) {
      console.error('API key auth failed:', error)
    }
  }

  try {
    const accessToken = request.cookies.get('access_token')?.value
    const refreshToken = request.cookies.get('refresh_token')?.value

    if (accessToken) {
      const payload = await verifyToken(accessToken)
      if (payload) {
        const user = await prisma.user.findFirst({
          where: { id: payload.userId, deletedAt: null }
        })
        return user
      }
    }

    if (refreshToken) {
      const payload = await verifyToken(refreshToken)
      if (payload) {
        const storedToken = await prisma.refreshToken.findUnique({
          where: { token: refreshToken },
        })

        if (storedToken && storedToken.expiresAt > new Date()) {
          const user = await prisma.user.findFirst({
            where: { id: payload.userId, deletedAt: null }
          })
          return user
        }
      }
    }

    return null
  } catch (error) {
    console.error('Session auth failed:', error)
    return null
  }
}

export async function checkRateLimit(user: User | null, ipAddress: string): Promise<boolean> {
  const limits = getRateLimits(user?.tier ?? 'FREE')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    const count = await prisma.usageLog.count({
      where: {
        ...(user ? { userId: user.id } : { ipAddress }),
        createdAt: { gte: today },
        credited: true,
      }
    })

    return count < limits.daily
  } catch (error) {
    console.error('Rate limit check failed:', error)
    return true
  }
}
