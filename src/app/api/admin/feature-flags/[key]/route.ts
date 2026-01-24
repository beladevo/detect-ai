import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { withAdminAuth, logAdminAction } from '@/src/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  return withAdminAuth(request, async (admin) => {
    const { key } = await params
    const updates = await request.json()

    const allowedUpdates = ['enabled', 'freeEnabled', 'premiumEnabled', 'enterpriseEnabled']
    const filteredUpdates: Record<string, boolean> = {}

    for (const field of allowedUpdates) {
      if (typeof updates[field] === 'boolean') {
        filteredUpdates[field] = updates[field]
      }
    }

    const feature = await prisma.featureFlag.update({
      where: { key },
      data: filteredUpdates,
    })

    await logAdminAction(
      admin.id,
      'FEATURE_FLAG_UPDATED',
      'FeatureFlag',
      key,
      filteredUpdates,
      request.headers.get('x-forwarded-for') || undefined
    )

    return NextResponse.json(feature)
  }, ['SUPER_ADMIN', 'ADMIN'])
}
