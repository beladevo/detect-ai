import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { withAdminAuth } from '@/src/lib/auth'

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const features = await prisma.featureFlag.findMany({
      orderBy: { key: 'asc' },
    })

    return NextResponse.json(features)
  })
}
