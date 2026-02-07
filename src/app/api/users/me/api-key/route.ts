import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { getCurrentUser, generateSecureToken } from '@/src/lib/auth/session'

export async function POST() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const newApiKey = `imag_${generateSecureToken()}`
    await prisma.user.update({
      where: { id: user.id },
      data: {
        apiKey: newApiKey,
        apiKeyEnabled: true,
      },
    })

    return NextResponse.json({ success: true, apiKey: newApiKey })
  } catch (error) {
    console.error('API key generation failed:', error)
    return NextResponse.json(
      { error: 'Unable to generate API key' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await request.json().catch(() => ({}))
    const requestedEnabled = payload?.enabled
    const enabled =
      typeof requestedEnabled === 'boolean' ? requestedEnabled : !user.apiKeyEnabled

    await prisma.user.update({
      where: { id: user.id },
      data: { apiKeyEnabled: enabled },
    })

    return NextResponse.json({ success: true, apiKeyEnabled: enabled })
  } catch (error) {
    console.error('API key toggle failed:', error)
    return NextResponse.json(
      { error: 'Unable to update API access' },
      { status: 500 }
    )
  }
}
