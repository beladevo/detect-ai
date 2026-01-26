import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { verifyPassword, createSession } from '@/src/lib/auth'
import { getClientIp } from '@/src/lib/utils/getClientIp'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    const user = await prisma.user.findFirst({
      where: { email: normalizedEmail, deletedAt: null },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const verificationSetting = await prisma.systemSetting.findUnique({
      where: { key: 'emailVerificationRequired' },
    })
    let emailVerificationRequired = false
    if (verificationSetting) {
      const value = verificationSetting.value
      if (typeof value === 'boolean') {
        emailVerificationRequired = value
      } else if (typeof value === 'string') {
        emailVerificationRequired = value === 'true'
      }
    }

    if (emailVerificationRequired && !user.emailVerified) {
      return NextResponse.json(
        { error: 'Please verify your email before logging in.' },
        { status: 403 }
      )
    }

    const ipAddress = getClientIp(request)

    await createSession(
      { id: user.id, email: user.email },
      { ipAddress: ipAddress ?? undefined }
    )

    const firstName = user.name ? user.name.split(" ")[0] : null

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName,
        emailVerified: user.emailVerified,
        registerIp: user.registerIp,
        lastLoginIp: user.lastLoginIp,
        tier: user.tier,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}
