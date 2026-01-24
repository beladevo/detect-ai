import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { withAdminAuth } from '@/src/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (admin) => {
    const { id } = await params
    const { content } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 })
    }

    const note = await prisma.adminNote.create({
      data: {
        userId: id,
        content: content.trim(),
        createdBy: admin.email,
      },
    })

    return NextResponse.json(note)
  }, ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'])
}
