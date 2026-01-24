import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { verifyPassword } from '@/src/lib/auth/password'
import { generateSecureToken } from '@/src/lib/auth/session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        tier: true,
        deletedAt: true,
        lockedAt: true,
        suspendedUntil: true,
        apiKey: true,
        apiKeyEnabled: true,
        monthlyDetections: true,
        totalDetections: true,
      },
    })

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (user.deletedAt) {
      return NextResponse.json(
        { error: 'Account has been deleted' },
        { status: 401 }
      )
    }

    if (user.lockedAt) {
      return NextResponse.json(
        { error: 'Account is locked. Please contact support.' },
        { status: 403 }
      )
    }

    if (user.suspendedUntil && user.suspendedUntil > new Date()) {
      return NextResponse.json(
        { error: `Account suspended until ${user.suspendedUntil.toISOString()}` },
        { status: 403 }
      )
    }

    const passwordValid = await verifyPassword(password, user.passwordHash)
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Generate API key if user doesn't have one
    let apiKey = user.apiKey
    if (!apiKey) {
      apiKey = `imag_${generateSecureToken()}`
      await prisma.user.update({
        where: { id: user.id },
        data: {
          apiKey,
          apiKeyEnabled: true,
          lastLoginAt: new Date(),
        },
      })
    } else if (!user.apiKeyEnabled) {
      // Enable API key if it was disabled
      await prisma.user.update({
        where: { id: user.id },
        data: {
          apiKeyEnabled: true,
          lastLoginAt: new Date(),
        },
      })
    } else {
      // Just update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        monthlyDetections: user.monthlyDetections,
        totalDetections: user.totalDetections,
      },
      apiKey,
    })
  } catch (error) {
    console.error('Extension auth failed:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

// Endpoint to regenerate API key
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        passwordHash: true,
        deletedAt: true,
      },
    })

    if (!user || !user.passwordHash || user.deletedAt) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const passwordValid = await verifyPassword(password, user.passwordHash)
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const newApiKey = `imag_${generateSecureToken()}`
    await prisma.user.update({
      where: { id: user.id },
      data: {
        apiKey: newApiKey,
        apiKeyEnabled: true,
      },
    })

    return NextResponse.json({
      success: true,
      apiKey: newApiKey,
    })
  } catch (error) {
    console.error('API key regeneration failed:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate API key' },
      { status: 500 }
    )
  }
}
