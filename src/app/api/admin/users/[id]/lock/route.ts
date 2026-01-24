import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { withAdminAuth, logAdminAction, canModifyUser } from '@/src/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (admin) => {
    const { id } = await params
    const { reason } = await request.json()

    if (!canModifyUser(admin, id)) {
      return NextResponse.json({ error: 'Cannot modify this user' }, { status: 403 })
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        lockedAt: new Date(),
        lockedReason: reason || null,
        lockedBy: admin.email,
      },
    })

    await logAdminAction(
      admin.id,
      'USER_LOCKED',
      'User',
      id,
      { reason },
      request.headers.get('x-forwarded-for') || undefined
    )

    return NextResponse.json({ success: true, user })
  }, ['SUPER_ADMIN', 'ADMIN'])
}
