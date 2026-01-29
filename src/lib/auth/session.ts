import { prisma } from '@/src/lib/prisma'
import { verifyToken, getTokensFromCookies, createAccessToken, createRefreshToken, setAuthCookies, type TokenPayload } from './jwt'
import type { UserTier } from '@prisma/client'
import crypto from 'crypto'

export type SessionUser = {
  id: string
  email: string
  name: string | null
  tier: UserTier
  deletedAt: Date | null
  emailVerified: boolean
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  stripePriceId: string | null
  stripeCurrentPeriodEnd: Date | null
  apiKey: string | null
  apiKeyEnabled: boolean
  monthlyDetections: number
  totalDetections: number
  lastDetectionAt: Date | null
  createdAt: Date
  updatedAt: Date
  lastLoginAt: Date | null
  firstName: string | null
  registerIp: string | null
  lastLoginIp: string | null
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const { accessToken, refreshToken } = await getTokensFromCookies()

  if (accessToken) {
    const payload = await verifyToken(accessToken)
    if (payload) {
      return getUserById(payload.userId)
    }
  }

  if (refreshToken) {
    const refreshed = await refreshSession(refreshToken)
    if (refreshed) {
      return refreshed.user
    }
  }

  return null
}

async function getUserById(userId: string): Promise<SessionUser | null> {
  try {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        tier: true,
        emailVerified: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        stripePriceId: true,
        stripeCurrentPeriodEnd: true,
        apiKey: true,
        apiKeyEnabled: true,
        monthlyDetections: true,
        totalDetections: true,
      lastDetectionAt: true,
      deletedAt: true,
      createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        registerIp: true,
        lastLoginIp: true,
      },
    })
    return user
  } catch {
    return null
  }
}

async function refreshSession(refreshToken: string): Promise<{ user: SessionUser; accessToken: string } | null> {
  const payload = await verifyToken(refreshToken)
  if (!payload) {
    return null
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  })

  if (!storedToken || storedToken.expiresAt < new Date()) {
    if (storedToken) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } })
    }
    return null
  }

  const user = await getUserById(payload.userId)
  if (!user) {
    return null
  }

  const newAccessToken = await createAccessToken({ userId: user.id, email: user.email })
  const newRefreshToken = await createRefreshToken({ userId: user.id, email: user.email })

  await prisma.refreshToken.deleteMany({ where: { id: storedToken.id } })
  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  await setAuthCookies(newAccessToken, newRefreshToken)

  return { user, accessToken: newAccessToken }
}

export async function createSession(
  user: { id: string; email: string },
  options?: { ipAddress?: string }
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = await createAccessToken({ userId: user.id, email: user.email })
  const refreshToken = await createRefreshToken({ userId: user.id, email: user.email })

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  await setAuthCookies(accessToken, refreshToken)

  const updateData: { lastLoginAt: Date; lastLoginIp?: string | null } = {
    lastLoginAt: new Date(),
  }

  if (options?.ipAddress) {
    updateData.lastLoginIp = options.ipAddress
  }

  await prisma.user.update({
    where: { id: user.id },
    data: updateData,
  })

  return { accessToken, refreshToken }
}

export async function destroySession(): Promise<void> {
  const { refreshToken } = await getTokensFromCookies()

  if (refreshToken) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    })
  }

  const { clearAuthCookies } = await import('./jwt')
  await clearAuthCookies()
}

export async function destroyAllUserSessions(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  })
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex')
}
