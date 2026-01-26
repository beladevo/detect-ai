export function getClientIp(request: Request): string | null {
  const headers = request.headers
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim()
    if (firstIp) {
      return firstIp
    }
  }

  const realIp = headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  const cfIp = headers.get('cf-connecting-ip')
  if (cfIp) {
    return cfIp
  }

  return null
}
