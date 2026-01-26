import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { createSession } from '@/src/lib/auth'
import { getClientIp } from '@/src/lib/utils/getClientIp'

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 })
    }

    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: token, deletedAt: null },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired verification link' }, { status: 404 })
    }

    if (!user.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerifyToken: null,
        },
      })
    }

    const ipAddress = getClientIp(request)
    await createSession(
      { id: user.id, email: user.email },
      { ipAddress: ipAddress ?? undefined }
    )

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully. You are now signed in.',
    })
  } catch (error) {
    console.error('Email verification failed:', error)
    return NextResponse.json(
      { error: 'Unable to verify email right now. Please try again.' },
      { status: 500 }
    )
  }
}
