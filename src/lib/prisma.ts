import { PrismaClient } from '@prisma/client'

const safeValue = (value?: string) => value?.trim()

const buildDatabaseUrlFromParts = () => {
  const user =
    safeValue(process.env.DATABASE_USER) ||
    safeValue(process.env.POSTGRES_USER) ||
    safeValue(process.env.PGUSER)
  const password =
    safeValue(process.env.DATABASE_PASSWORD) ||
    safeValue(process.env.POSTGRES_PASSWORD) ||
    safeValue(process.env.PGPASSWORD)
  const host =
    safeValue(process.env.DATABASE_HOST) ||
    safeValue(process.env.POSTGRES_HOST) ||
    safeValue(process.env.PGHOST)
  const port =
    safeValue(process.env.DATABASE_PORT) ||
    safeValue(process.env.POSTGRES_PORT) ||
    safeValue(process.env.PGPORT) ||
    '5432'
  const database =
    safeValue(process.env.DATABASE_NAME) ||
    safeValue(process.env.POSTGRES_DB) ||
    safeValue(process.env.PGDATABASE)
  if (!(user && password && host && database)) {
    return undefined
  }
  const sslMode =
    safeValue(process.env.DATABASE_SSLMODE) || safeValue(process.env.PGSSLMODE)
  const params = sslMode ? `?sslmode=${encodeURIComponent(sslMode)}` : ''
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(
    password
  )}@${host}:${port}/${database}${params}`
}

const ensureDatabaseUrl = () => {
  const configured = safeValue(process.env.DATABASE_URL)
  if (configured) {
    return configured
  }

  const derived = buildDatabaseUrlFromParts()
  if (derived) {
    console.info(
      "Prisma: resolved DATABASE_URL from POSTGRES_* / PG* variables."
    )
    return derived
  }

  throw new Error(
    "Prisma requires a DATABASE_URL (or POSTGRES_* / PG* vars) to connect to Postgres."
  )
}

const resolvedDatabaseUrl = ensureDatabaseUrl()
process.env.DATABASE_URL = resolvedDatabaseUrl

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
