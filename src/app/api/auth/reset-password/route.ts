import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { hashPassword, validatePassword, destroyAllUserSessions } from '@/src/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Reset token is required' },
        { status: 400 }
      )
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required' },
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

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
        deletedAt: null,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Reset token is invalid or has expired' },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(password)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    })

    await destroyAllUserSessions(user.id)

    return NextResponse.json({
      success: true,
      message: 'Your password has been reset. You can now sign in.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Unable to reset your password right now. Please try again.' },
      { status: 500 }
    )
  }
}
