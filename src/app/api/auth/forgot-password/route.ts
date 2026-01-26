import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { generateSecureToken } from '@/src/lib/auth'
import { sendPasswordResetEmail, supportsSmtp } from '@/src/lib/email'
import { env } from '@/src/lib/env'

const RESET_TOKEN_EXPIRATION_MS = 60 * 60 * 1000

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findFirst({
      where: { email: normalizedEmail, deletedAt: null },
      select: { id: true, email: true, firstName: true },
    })

    const baseUrl = env.BASE_URL.replace(/\/$/, '')
    let resetUrl: string | undefined

    if (user) {
      const token = generateSecureToken()
      const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRATION_MS)

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: token,
          passwordResetExpires: expiresAt,
        },
      })

      resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`

      try {
        await sendPasswordResetEmail({
          email: user.email,
          token,
          firstName: user.firstName,
        })
      } catch (error) {
        console.error('Failed to send password reset email:', error)
      }
    }

    return NextResponse.json({
      success: true,
      message:
        'If an account exists for that email, we sent password reset instructions.',
      showResetLink: Boolean((!supportsSmtp || env.IS_DEV) && resetUrl),
      resetUrl: (!supportsSmtp || env.IS_DEV) ? resetUrl : undefined,
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Unable to process password reset right now. Please try again.' },
      { status: 500 }
    )
  }
}
