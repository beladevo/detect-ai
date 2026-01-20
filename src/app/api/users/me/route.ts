import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { prisma } from '@/src/lib/prisma'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user: supabaseUser } } = await supabase.auth.getUser()

    if (!supabaseUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { email: supabaseUser.email! }
    })

    if (!user) {
      // Create user if doesn't exist
      user = await prisma.user.create({
        data: {
          email: supabaseUser.email!,
          name: supabaseUser.user_metadata?.name || null,
          tier: 'FREE',
          lastLoginAt: new Date(),
        }
      })
    } else {
      // Update last login
      user = await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Get user failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}
