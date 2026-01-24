import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { withAdminAuth, logAdminAction } from '@/src/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(
    request,
    async (admin) => {
      const { id } = await params
      const alert = await prisma.securityAlert.findUnique({ where: { id } })
      if (!alert) {
        return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
      }

      const updated = await prisma.securityAlert.update({
        where: { id },
        data: {
          resolved: true,
          resolvedBy: admin.id,
          resolvedAt: new Date(),
        },
      })

      await logAdminAction(
        admin.id,
        'SECURITY_ALERT_RESOLVED',
        'SecurityAlert',
        id,
        { severity: alert.severity, type: alert.type },
        request.headers.get('x-forwarded-for') || undefined
      )

      return NextResponse.json({ success: true, alert: updated })
    },
    ['SUPER_ADMIN', 'ADMIN']
  )
}
