import { prisma } from '@/src/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import type { User, AdminRole } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { verifyToken } from './jwt'

export type AdminUser = User & {
  isAdmin: true
  adminRole: AdminRole
}

export async function authenticateAdmin(request: NextRequest): Promise<AdminUser | null> {
  try {
    const accessToken = request.cookies.get('access_token')?.value
    const refreshToken = request.cookies.get('refresh_token')?.value

    let userId: string | null = null

    if (accessToken) {
      const payload = await verifyToken(accessToken)
      if (payload) {
        userId = payload.userId
      }
    }

    if (!userId && refreshToken) {
      const payload = await verifyToken(refreshToken)
      if (payload) {
        const storedToken = await prisma.refreshToken.findUnique({
          where: { token: refreshToken },
        })

        if (storedToken && storedToken.expiresAt > new Date()) {
          userId = payload.userId
        }
      }
    }

    if (!userId) {
      return null
    }

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
        isAdmin: true,
        adminRole: { not: null },
      }
    })

    if (!user || !user.isAdmin || !user.adminRole) {
      return null
    }

    return user as AdminUser
  } catch (error) {
    console.error('Admin auth failed:', error)
    return null
  }
}

export function requireAdminRole(
  user: AdminUser | null,
  requiredRoles: AdminRole[]
): boolean {
  if (!user || !user.adminRole) {
    return false
  }
  return requiredRoles.includes(user.adminRole)
}

export function canModifyUser(admin: AdminUser, targetUserId: string): boolean {
  if (admin.id === targetUserId) {
    return false
  }
  return ['SUPER_ADMIN', 'ADMIN'].includes(admin.adminRole)
}

export function canManageAdmins(admin: AdminUser): boolean {
  return admin.adminRole === 'SUPER_ADMIN'
}

export function canViewLogs(admin: AdminUser): boolean {
  return ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'READONLY'].includes(admin.adminRole)
}

export function canModifySettings(admin: AdminUser): boolean {
  return ['SUPER_ADMIN', 'ADMIN'].includes(admin.adminRole)
}

export function canDeleteUsers(admin: AdminUser): boolean {
  return admin.adminRole === 'SUPER_ADMIN'
}

export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  try {
    const normalizedDetails = details
      ? (details as Prisma.InputJsonValue)
      : Prisma.JsonNull
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId,
        details: normalizedDetails,
        ipAddress: ipAddress ?? null,
      }
    })
  } catch (error) {
    console.error('Failed to log admin action:', error)
  }
}

export function createAdminErrorResponse(
  message: string,
  status: number = 401
): NextResponse {
  return NextResponse.json(
    { error: message, errorType: 'ADMIN_AUTH_ERROR' },
    { status }
  )
}

export async function withAdminAuth(
  request: NextRequest,
  handler: (admin: AdminUser, request: NextRequest) => Promise<NextResponse>,
  requiredRoles?: AdminRole[]
): Promise<NextResponse> {
  const admin = await authenticateAdmin(request)

  if (!admin) {
    return createAdminErrorResponse('Admin authentication required', 401)
  }

  if (requiredRoles && !requireAdminRole(admin, requiredRoles)) {
    return createAdminErrorResponse('Insufficient permissions', 403)
  }

  return handler(admin, request)
}
