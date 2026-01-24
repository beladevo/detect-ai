import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { withAdminAuth, logAdminAction } from '@/src/lib/auth'

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (admin) => {
    const { ids } = await request.json()

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
    }

    await prisma.waitlist.updateMany({
      where: { id: { in: ids } },
      data: {
        status: 'INVITED',
        invitedAt: new Date(),
      },
    })

    await logAdminAction(
      admin.id,
      'WAITLIST_INVITED',
      'Waitlist',
      ids.join(','),
      { count: ids.length },
      request.headers.get('x-forwarded-for') || undefined
    )

    return NextResponse.json({ success: true, invited: ids.length })
  }, ['SUPER_ADMIN', 'ADMIN'])
}
