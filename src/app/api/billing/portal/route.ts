import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/src/lib/auth'
import { getStripeClient } from '@/src/lib/stripe'

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.BASE_URL ||
  'http://localhost:3000'

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No billing customer found for user' },
        { status: 400 }
      )
    }

    const stripe = getStripeClient()
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${BASE_URL}/dashboard`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('Billing portal creation failed:', error)
    return NextResponse.json(
      { error: 'Failed to open billing portal' },
      { status: 500 }
    )
  }
}
