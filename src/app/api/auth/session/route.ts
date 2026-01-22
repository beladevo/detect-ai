import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/src/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        emailVerified: user.emailVerified,
        apiKey: user.apiKey,
        apiKeyEnabled: user.apiKeyEnabled,
        monthlyDetections: user.monthlyDetections,
        totalDetections: user.totalDetections,
        lastDetectionAt: user.lastDetectionAt,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ user: null })
  }
}
