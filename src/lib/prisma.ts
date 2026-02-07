import { PrismaClient } from "@prisma/client"
import { Signer } from "@aws-sdk/rds-signer"

const trimValue = (value?: string) => value?.trim()

/**
 * Detect if running on Vercel (any environment: production, preview, or development)
 */
const isVercel = () => {
  return process.env.VERCEL === "1"
}

/**
 * Check if AWS IAM credentials are available for OIDC-based authentication
 */
const hasAwsIamCredentials = () => {
  return Boolean(
    trimValue(process.env.AWS_REGION) &&
    trimValue(process.env.AWS_ROLE_ARN) &&
    trimValue(process.env.PGHOST) &&
    trimValue(process.env.PGUSER)
  )
}

type UrlParts = {
  user: string
  password: string
  host: string
  port: string
  database: string
  sslMode?: string
}

const buildPostgresUrl = (parts: UrlParts) => {
  const encodedUser = encodeURIComponent(parts.user)
  const encodedPassword = encodeURIComponent(parts.password)
  const base = `postgresql://${encodedUser}:${encodedPassword}@${parts.host}:${parts.port}/${parts.database}`
  return parts.sslMode ? `${base}?sslmode=${encodeURIComponent(parts.sslMode)}` : base
}

const buildFromEnvParts = () => {
  const user =
    trimValue(process.env.DATABASE_USER) ||
    trimValue(process.env.POSTGRES_USER) ||
    trimValue(process.env.PGUSER)
  const password =
    trimValue(process.env.DATABASE_PASSWORD) ||
    trimValue(process.env.POSTGRES_PASSWORD) ||
    trimValue(process.env.PGPASSWORD)
  const host =
    trimValue(process.env.DATABASE_HOST) ||
    trimValue(process.env.POSTGRES_HOST) ||
    trimValue(process.env.PGHOST)
  const port =
    trimValue(process.env.DATABASE_PORT) ||
    trimValue(process.env.POSTGRES_PORT) ||
    trimValue(process.env.PGPORT) ||
    "5432"
  const database =
    trimValue(process.env.DATABASE_NAME) ||
    trimValue(process.env.POSTGRES_DB) ||
    trimValue(process.env.PGDATABASE)
  const sslMode =
    trimValue(process.env.DATABASE_SSLMODE) || trimValue(process.env.PGSSLMODE)

  if (!(user && password && host && database)) {
    return undefined
  }

  return buildPostgresUrl({ user, password, host, port, database, sslMode })
}

/**
 * Generate a database URL using AWS IAM authentication via Vercel OIDC
 * This is used when deployed to Vercel with AWS Aurora PostgreSQL integration
 */
const resolveAwsIamUrl = async () => {
  const host = trimValue(process.env.PGHOST)
  const port = trimValue(process.env.PGPORT) || "5432"
  const user = trimValue(process.env.PGUSER)
  const database = trimValue(process.env.PGDATABASE) || "postgres"
  const region = trimValue(process.env.AWS_REGION)
  const roleArn = trimValue(process.env.AWS_ROLE_ARN)
  const sslMode = trimValue(process.env.PGSSLMODE) || "require"

  if (!host || !user || !region || !roleArn) {
    return undefined
  }

  // Dynamically import @vercel/functions/oidc only when needed (Vercel environment)
  // This avoids errors in local development where the module may not work
  const { awsCredentialsProvider } = await import("@vercel/functions/oidc")

  const signer = new Signer({
    hostname: host,
    port: Number(port) || 5432,
    username: user,
    region,
    credentials: awsCredentialsProvider({
      roleArn,
      clientConfig: { region },
    }),
  })

  const token = await signer.getAuthToken()
  console.info("[Prisma] Using AWS IAM authentication via Vercel OIDC")
  return buildPostgresUrl({
    user,
    password: token,
    host,
    port,
    database,
    sslMode,
  })
}

/**
 * Resolve the database URL based on the environment:
 *
 * Priority for Vercel (production, preview, development):
 *   1. AWS IAM authentication (if credentials available)
 *   2. Explicit DATABASE_URL (fallback)
 *   3. Built from PG environment variables
 *
 * Priority for Local Development:
 *   1. Explicit DATABASE_URL
 *   2. Built from POSTGRES or PG environment variables
 */
const resolveDatabaseUrl = async () => {
  // On Vercel with IAM credentials, always use IAM auth
  // This ensures we use OIDC tokens instead of static passwords
  if (isVercel() && hasAwsIamCredentials()) {
    const iamUrl = await resolveAwsIamUrl()
    if (iamUrl) {
      return iamUrl
    }
    // If IAM auth fails, log warning but continue to fallbacks
    console.warn("[Prisma] AWS IAM auth failed, falling back to other methods")
  }

  // For local development or non-IAM environments, use DATABASE_URL first
  const explicit = trimValue(process.env.DATABASE_URL)
  if (explicit) {
    console.info("[Prisma] Using explicit DATABASE_URL")
    return explicit
  }

  // Try to build from environment parts (POSTGRES_*/PG* variables)
  const derived = buildFromEnvParts()
  if (derived) {
    console.info("[Prisma] Built DATABASE_URL from environment variables")
    return derived
  }

  throw new Error(
    "Prisma: Cannot resolve database connection. Set DATABASE_URL or POSTGRES_*/PG* variables."
  )
}

const resolvedDatabaseUrl = await resolveDatabaseUrl()
process.env.DATABASE_URL = resolvedDatabaseUrl

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
})

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
