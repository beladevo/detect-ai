import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import {
  hashPassword,
  validatePassword,
  generateSecureToken,
} from '@/src/lib/auth'
import { sendVerificationEmail, supportsSmtp } from '@/src/lib/email'
import { getClientIp } from '@/src/lib/utils/getClientIp'
import { env } from '@/src/lib/env'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, firstName } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    const trimmedFirstName = firstName?.trim()

    if (!trimmedFirstName) {
      return NextResponse.json(
        { error: 'First name is required' },
        { status: 400 }
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    const passwordHash = await hashPassword(password)
    const verificationToken = generateSecureToken()
    const ipAddress = getClientIp(request)

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: trimmedFirstName,
        firstName: trimmedFirstName,
        tier: 'FREE',
        emailVerified: false,
        emailVerifyToken: verificationToken,
        registerIp: ipAddress,
      },
    })

    let verificationUrl: string | null = null

    try {
      verificationUrl = await sendVerificationEmail({
        email: user.email,
        token: verificationToken,
        firstName: user.firstName,
      })
    } catch (error) {
      console.error('Failed to send verification email:', error)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        emailVerified: user.emailVerified,
        registerIp: user.registerIp,
        lastLoginIp: user.lastLoginIp,
        tier: user.tier,
      },
      message: 'Account created! Please confirm your email address.',
      showVerificationLink: !supportsSmtp || env.IS_DEV,
      verificationUrl:
        (!supportsSmtp || env.IS_DEV) && verificationUrl
          ? verificationUrl
          : undefined,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}
