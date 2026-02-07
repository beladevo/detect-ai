import { PrismaClient } from "@prisma/client"
import { Signer } from "@aws-sdk/rds-signer"
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider"

const trimValue = (value?: string) => value?.trim()

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

const shouldUseAwsIam = () => {
  if (process.env.NODE_ENV !== "production") {
    return false
  }
  return Boolean(
    trimValue(process.env.AWS_REGION) &&
      trimValue(process.env.AWS_ROLE_ARN) &&
      trimValue(process.env.PGHOST) &&
      trimValue(process.env.PGPORT) &&
      trimValue(process.env.PGUSER)
  )
}

const resolveAwsIamUrl = async () => {
  if (!shouldUseAwsIam()) {
    return undefined
  }

  const host =
    trimValue(process.env.PGHOST) ||
    trimValue(process.env.POSTGRES_HOST) ||
    trimValue(process.env.DATABASE_HOST)
  const port = trimValue(process.env.PGPORT) || "5432"
  const user = trimValue(process.env.PGUSER) || trimValue(process.env.POSTGRES_USER)
  const database =
    trimValue(process.env.PGDATABASE) ||
    trimValue(process.env.POSTGRES_DB) ||
    "postgres"
  const region = trimValue(process.env.AWS_REGION)
  const roleArn = trimValue(process.env.AWS_ROLE_ARN)
  const sslMode = trimValue(process.env.PGSSLMODE) || "require"

  if (!host || !user || !region || !roleArn) {
    return undefined
  }

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
  console.info("Prisma: resolved DATABASE_URL via AWS IAM credentials.")
  return buildPostgresUrl({
    user,
    password: token,
    host,
    port,
    database,
    sslMode,
  })
}

const resolveDatabaseUrl = async () => {
  const explicit = trimValue(process.env.DATABASE_URL)
  if (explicit) {
    return explicit
  }

  const iamUrl = await resolveAwsIamUrl()
  if (iamUrl) {
    return iamUrl
  }

  const derived = buildFromEnvParts()
  if (derived) {
    console.info("Prisma: resolved DATABASE_URL from POSTGRES_/PG* environment variables.")
    return derived
  }

  throw new Error(
    "Prisma requires a DATABASE_URL (or POSTGRES_/PG* variables) to connect to Postgres."
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
