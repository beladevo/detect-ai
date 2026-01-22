import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set')
  }
  return new TextEncoder().encode(secret)
}

async function verifyAccessToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getJwtSecret())
    return true
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value
  const refreshToken = request.cookies.get('refresh_token')?.value

  const hasValidSession = accessToken ? await verifyAccessToken(accessToken) : false
  const hasRefreshToken = !!refreshToken

  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!hasValidSession && !hasRefreshToken) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (request.nextUrl.pathname.startsWith('/api/premium/')) {
    const globalPremium = process.env.NEXT_PUBLIC_PREMIUM_FEATURES_ENABLED === 'true'

    if (!hasValidSession && !hasRefreshToken && !globalPremium) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/premium/:path*'],
}
