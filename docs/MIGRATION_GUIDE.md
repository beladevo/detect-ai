# Migration Guide: Supabase to Self-Hosted PostgreSQL

This guide documents the complete migration from Supabase to a self-hosted PostgreSQL database with custom JWT authentication.

## Technology Stack

| Component | Technology | Justification |
|-----------|------------|---------------|
| **Database** | PostgreSQL 16 | Already used via Supabase, superior JSON support, zero schema migration |
| **ORM** | Prisma | Already integrated, type-safe, excellent migrations |
| **Auth** | JWT + bcrypt | Stateless, scalable, industry standard |
| **Session** | HTTP-only cookies | Secure, XSS-resistant, automatic browser handling |

## Quick Start

### 1. Start the Database

```bash
docker compose up -d
```

This starts PostgreSQL on port 5432 with:
- User: `imagion`
- Password: `imagion_dev_password`
- Database: `imagion`

### 2. Configure Environment

Copy `.env.example` to `.env.local` and update:

```bash
# Required
DATABASE_URL=postgresql://imagion:imagion_dev_password@localhost:5432/imagion
JWT_SECRET=your-secure-random-string-at-least-32-chars
```

Generate a secure JWT secret:
```bash
openssl rand -base64 32
```

### 3. Install Dependencies

```bash
npm install
```

New dependencies added:
- `bcrypt` - Password hashing
- `jose` - JWT signing/verification

### 4. Run Migrations

```bash
npm run db:migrate
```

This creates all tables including the new `Waitlist` and `RefreshToken` models.

### 5. Start Development

```bash
npm run dev
```

## Architecture Changes

### Authentication Flow

**Before (Supabase):**
```
User → Supabase Auth → Supabase Session Cookie → API
```

**After (Self-hosted):**
```
User → /api/auth/login → JWT + Refresh Token → HTTP-only Cookies → API
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create new account |
| `/api/auth/login` | POST | Authenticate user |
| `/api/auth/logout` | POST | Clear session |
| `/api/auth/session` | GET | Get current user |
| `/api/users/me` | GET | Get full user profile |

### Token Strategy

- **Access Token**: 15-minute expiry, stored in HTTP-only cookie
- **Refresh Token**: 7-day expiry, stored in HTTP-only cookie + database
- **Automatic Refresh**: Middleware handles token refresh transparently

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## File Structure

```
src/
├── lib/
│   ├── auth/
│   │   ├── index.ts      # Public exports
│   │   ├── password.ts   # bcrypt hashing
│   │   ├── jwt.ts        # JWT creation/verification
│   │   ├── session.ts    # Session management
│   │   └── api.ts        # Request authentication
│   └── prisma.ts         # Prisma client singleton
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   └── session/route.ts
│   │   ├── users/me/route.ts
│   │   └── waitlist/route.ts
│   ├── login/page.tsx
│   └── register/page.tsx
├── context/
│   └── AuthContext.tsx   # Simplified React context
└── middleware.ts         # Route protection
```

## Database Schema Changes

### New Tables

**RefreshToken**
```sql
CREATE TABLE "RefreshToken" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "token" TEXT UNIQUE NOT NULL,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT now()
);
```

**Waitlist**
```sql
CREATE TABLE "Waitlist" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT UNIQUE NOT NULL,
  "source" TEXT DEFAULT 'unknown',
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP DEFAULT now()
);
```

### Modified Tables

**User** - New fields:
- `passwordHash` (required)
- `emailVerified` (boolean)
- `emailVerifyToken` (optional)
- `passwordResetToken` (optional)
- `passwordResetExpires` (optional)

## Migration Steps from Supabase

### 1. Export Existing Data

```sql
-- Export users from Supabase
SELECT
  id,
  email,
  raw_user_meta_data->>'name' as name,
  created_at
FROM auth.users;

-- Export waitlist
SELECT * FROM waitlist;
```

### 2. Transform User Data

Users need password hashes. Options:
1. **Require password reset**: Set `passwordResetToken` for all migrated users
2. **Keep old passwords**: If you have access to Supabase password hashes (unlikely)
3. **Fresh start**: Email users to create new accounts

### 3. Import to New Database

```sql
-- Import users (example with password reset flow)
INSERT INTO "User" (id, email, name, "passwordHash", "emailVerified", "passwordResetToken", "createdAt")
SELECT
  id,
  email,
  name,
  '', -- Empty hash, user must reset
  true,
  encode(gen_random_bytes(32), 'hex'), -- Generate reset token
  created_at
FROM supabase_users_export;

-- Import waitlist
INSERT INTO "Waitlist" (email, source, "ipAddress", "userAgent", "createdAt")
SELECT email, 'supabase_migration', ip, user_agent, created_at
FROM supabase_waitlist_export;
```

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret for signing JWTs | 32+ character random string |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_USER` | Docker PostgreSQL user | `imagion` |
| `POSTGRES_PASSWORD` | Docker PostgreSQL password | `imagion_dev_password` |
| `POSTGRES_DB` | Docker PostgreSQL database | `imagion` |
| `POSTGRES_PORT` | Docker PostgreSQL port | `5432` |

## npm Scripts

| Script | Description |
|--------|-------------|
| `npm run db:migrate` | Run migrations in development |
| `npm run db:migrate:prod` | Deploy migrations in production |
| `npm run db:push` | Push schema changes (no migration files) |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run db:generate` | Generate Prisma client |

## Security Considerations

### Password Storage
- bcrypt with cost factor 12
- Salts automatically generated per password

### JWT Security
- Short-lived access tokens (15 min)
- Refresh tokens stored in database for revocation
- HTTP-only, Secure, SameSite=Lax cookies

### Session Management
- Refresh tokens can be revoked server-side
- `destroyAllUserSessions()` for password changes
- Automatic cleanup of expired tokens

## Production Deployment

### 1. Database

Use a managed PostgreSQL service:
- **Neon** (serverless, generous free tier)
- **Supabase PostgreSQL** (just the database, no auth)
- **Railway** (simple deployment)
- **AWS RDS** / **Google Cloud SQL** (enterprise)

### 2. Environment Variables

```bash
# Production .env
DATABASE_URL=postgresql://user:pass@production-host:5432/imagion?sslmode=require
JWT_SECRET=<generate-new-secret-for-production>
```

### 3. Migrations

```bash
npm run db:migrate:prod
```

### 4. Build

```bash
npm run build
```

## Troubleshooting

### "JWT_SECRET environment variable is not set"
Add `JWT_SECRET` to your `.env.local` file.

### Database connection refused
1. Check Docker is running: `docker compose ps`
2. Check connection string in `.env.local`
3. Ensure port 5432 is available

### "Invalid email or password" on login
1. Check user exists in database
2. Verify password meets requirements
3. Check bcrypt is installed correctly

### Cookies not being set
1. Check `NODE_ENV` - `Secure` flag only in production
2. Verify domain matches (no cross-origin issues)
3. Check browser dev tools → Application → Cookies

## Removed Files

The following Supabase-specific files were removed:
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`

## Removed Dependencies

- `@supabase/ssr`
- `@supabase/supabase-js`
