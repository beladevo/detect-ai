import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { getStripeClient } from '@/src/lib/stripe'
import { withAdminAuth, canModifyUser, logAdminAction } from '@/src/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(
    request,
    async (admin) => {
      const { id } = await params

      if (!canModifyUser(admin, id)) {
        return NextResponse.json({ error: 'Cannot modify this user' }, { status: 403 })
      }

      const user = await prisma.user.findUnique({ where: { id } })
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      if (user.stripeSubscriptionId) {
        try {
          const stripe = getStripeClient()
          await stripe.subscriptions.cancel(user.stripeSubscriptionId)
        } catch (error) {
          console.error('Stripe cancel failed for admin request:', error)
        }
      }

      await prisma.user.update({
        where: { id },
        data: {
          tier: 'FREE',
          stripeSubscriptionId: null,
          stripePriceId: null,
          stripeCurrentPeriodEnd: null,
        },
      })

      await logAdminAction(
        admin.id,
        'USER_BILLING_CANCELLED',
        'User',
        id,
        { action: 'cancel_billing', userId: id },
        request.headers.get('x-forwarded-for') || undefined
      )

      return NextResponse.json({ ok: true })
    },
    ['SUPER_ADMIN', 'ADMIN']
  )
}
