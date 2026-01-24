import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { verifyPassword, createAccessToken, createRefreshToken, setAuthCookies } from '@/src/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        deletedAt: null,
        isAdmin: true,
        adminRole: { not: null },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials or not an admin' },
        { status: 401 }
      )
    }

    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (user.lockedAt) {
      return NextResponse.json(
        { error: 'Account is locked', reason: user.lockedReason },
        { status: 403 }
      )
    }

    const accessToken = await createAccessToken({ userId: user.id })
    const refreshToken = await createRefreshToken({ userId: user.id })

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    const response = NextResponse.json({
      admin: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: true,
        adminRole: user.adminRole,
      },
    })

    await setAuthCookies(accessToken, refreshToken)
    return response
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
