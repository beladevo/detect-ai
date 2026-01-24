import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { withAdminAuth, logAdminAction } from '@/src/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (admin) => {
    const { id } = await params

    await prisma.waitlist.update({
      where: { id },
      data: { status: 'REMOVED' },
    })

    await logAdminAction(
      admin.id,
      'WAITLIST_REMOVED',
      'Waitlist',
      id,
      { action: 'remove_waitlist_entry' },
      request.headers.get('x-forwarded-for') || undefined
    )

    return NextResponse.json({ success: true })
  }, ['SUPER_ADMIN', 'ADMIN'])
}
