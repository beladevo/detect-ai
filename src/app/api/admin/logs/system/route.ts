import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/src/lib/auth'

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const level = searchParams.get('level')
    const dateRange = searchParams.get('dateRange') || '24h'

    const mockLogs = generateMockLogs(page, pageSize, level, dateRange)

    return NextResponse.json({
      logs: mockLogs.logs,
      total: mockLogs.total,
      page,
      pageSize,
    })
  })
}

function generateMockLogs(
  page: number,
  pageSize: number,
  level: string | null,
  dateRange: string
) {
  const levels: Array<'DEBUG' | 'INFO' | 'WARN' | 'ERROR'> = ['DEBUG', 'INFO', 'WARN', 'ERROR']
  const sources = ['api/detect', 'api/auth', 'pipeline/ml', 'pipeline/frequency', 'database', 'cache']
  const messages = [
    'Request processed successfully',
    'User authentication completed',
    'Detection pipeline started',
    'Model inference completed',
    'Cache miss, fetching from database',
    'Rate limit check passed',
    'Session refreshed',
    'File upload received',
    'Image preprocessing completed',
    'Connection timeout, retrying',
    'Invalid input format',
    'Database query slow',
  ]

  const now = new Date()
  let hours = 24
  switch (dateRange) {
    case '1h': hours = 1; break
    case '7d': hours = 168; break
    case '30d': hours = 720; break
  }

  const totalLogs = 500
  const logs = []

  for (let i = 0; i < pageSize; i++) {
    const index = (page - 1) * pageSize + i
    if (index >= totalLogs) break

    const logLevel = levels[Math.floor(Math.random() * levels.length)]
    if (level && level !== 'all' && logLevel !== level) continue

    const timestamp = new Date(now.getTime() - Math.random() * hours * 60 * 60 * 1000)

    logs.push({
      id: `log-${index}`,
      level: logLevel,
      message: messages[Math.floor(Math.random() * messages.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      metadata: null,
      createdAt: timestamp.toISOString(),
    })
  }

  logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return { logs, total: totalLogs }
}
