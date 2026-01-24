import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/src/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request)

    if (!admin) {
      return NextResponse.json(
        { error: 'Not authenticated as admin' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        isAdmin: true,
        adminRole: admin.adminRole,
        createdAt: admin.createdAt,
        lastLoginAt: admin.lastLoginAt,
      },
    })
  } catch (error) {
    console.error('Admin session error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
