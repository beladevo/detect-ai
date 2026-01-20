# Premium Features Setup Guide

This guide will help you set up and initialize the premium features system for the detect-ai application.

## Prerequisites

✅ All core files have been created:
- Database schema (Prisma)
- Authentication system (Supabase)
- Feature flags
- Premium Badge UI component
- Auth pages (login/register)
- Dashboard
- Middleware

## Step 1: Install Dependencies

The npm packages should already be installed. If not, run:

```bash
npm install
```

This will install:
- `prisma` & `@prisma/client` - Database ORM
- `@supabase/ssr` - Supabase authentication
- `stripe` & `@stripe/stripe-js` - Payment processing (for future use)

## Step 2: Initialize Prisma Database

### Generate Prisma Client

```bash
npx prisma generate
```

This creates the TypeScript types for your database models.

### Push Schema to Database

```bash
npx prisma db push
```

This creates the tables in your Supabase PostgreSQL database:
- `User` - User accounts with tier, Stripe data, API keys
- `Detection` - Detection history with full pipeline results
- `UsageLog` - API usage tracking for rate limiting
- `FeatureFlag` - Feature toggle configuration

### Verify Database (Optional)

Open Prisma Studio to view your database:

```bash
npx prisma studio
```

## Step 3: Seed Feature Flags (Optional)

Create initial feature flags in the database. You can do this via Prisma Studio or create a seed script:

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const features = [
    {
      key: 'multiple_models',
      enabled: true,
      description: 'Access to multiple AI model ensemble voting',
      premiumEnabled: true,
      enterpriseEnabled: true,
    },
    {
      key: 'api_access',
      enabled: true,
      description: 'REST API access with authentication',
      premiumEnabled: true,
      enterpriseEnabled: true,
    },
    {
      key: 'advanced_analytics',
      enabled: true,
      description: 'Detailed pipeline breakdowns and analytics',
      premiumEnabled: true,
      enterpriseEnabled: true,
    },
    {
      key: 'cloud_storage',
      enabled: true,
      description: 'Unlimited cloud history storage',
      premiumEnabled: true,
      enterpriseEnabled: true,
    },
    {
      key: 'priority_queue',
      enabled: true,
      description: 'Priority processing queue',
      enterpriseEnabled: true,
    },
  ]

  for (const feature of features) {
    await prisma.featureFlag.upsert({
      where: { key: feature.key },
      update: feature,
      create: feature,
    })
  }

  console.log('✅ Feature flags seeded')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Add to `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

Then run:

```bash
npm install -D ts-node
npx prisma db seed
```

## Step 4: Configure Supabase Authentication

### Enable Email Authentication

1. Go to your Supabase project: https://bwavartpkwqelzckpmdn.supabase.co
2. Navigate to **Authentication** → **Providers**
3. Enable **Email** provider
4. Configure email templates (optional)

### Update Site URL

1. Go to **Authentication** → **URL Configuration**
2. Add your site URL:
   - Development: `http://localhost:3000`
   - Production: `https://imagion.vercel.app`
3. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://imagion.vercel.app/auth/callback`

## Step 5: Test the System

### 1. Start Development Server

```bash
npm run dev
```

### 2. Test User Registration

1. Navigate to http://localhost:3000/register
2. Create a new account
3. Check Supabase Auth dashboard to see the user
4. Check Prisma Studio to see the User record created

### 3. Test Login

1. Navigate to http://localhost:3000/login
2. Sign in with your credentials
3. Should redirect to `/dashboard`

### 4. Test Dashboard

- View your account information
- See tier (should be FREE by default)
- Check detection counts

### 5. Test Premium Features

Since `NEXT_PUBLIC_PREMIUM_FEATURES_ENABLED=true`, all users have access to premium features:

1. Upload an image on the home page
2. Click "View Detailed Analysis"
3. You should see:
   - ✅ AI Model Predictions (MLModelsCard)
   - ✅ Score Calculation Breakdown (FusionBreakdown)
   - ✅ Forensic Module Details

## Step 6: Premium Feature Gating (Future)

When ready to restrict features to premium users:

### 1. Update Environment Variable

Change in `.env.local`:

```env
NEXT_PUBLIC_PREMIUM_FEATURES_ENABLED=false
```

### 2. Test Feature Gates

- Free users: Should NOT see detailed ML model breakdowns
- Premium users: Should see all features
- Premium badges should appear on gated features

### 3. Upgrade User to Premium (Manual)

Using Prisma Studio:
1. Open http://localhost:5555
2. Find the User table
3. Edit a user
4. Change `tier` from `FREE` to `PREMIUM`
5. Save

### 4. Test Premium Access

- Login as premium user
- Upload image
- Verify premium features are accessible
- Check no premium badges show for premium user

## Step 7: Rate Limiting

Rate limits are configured in `src/lib/features/index.ts`:

- **FREE**: 50 daily, 1,000 monthly
- **PREMIUM**: 1,000 daily, 30,000 monthly
- **ENTERPRISE**: 10,000 daily, 300,000 monthly

When `NEXT_PUBLIC_PREMIUM_FEATURES_ENABLED=true`, rate limits are **disabled** (Infinity).

## Step 8: API Access (Future)

### Generate API Key for User

Using Prisma Studio or a custom API endpoint:

```typescript
import { randomBytes } from 'crypto'

const apiKey = `sk_${randomBytes(32).toString('hex')}`

await prisma.user.update({
  where: { id: userId },
  data: {
    apiKey,
    apiKeyEnabled: true,
  }
})
```

### Test API Access

```bash
curl -X POST http://localhost:3000/api/premium/detect \
  -H "x-api-key: sk_..." \
  -F "file=@path/to/image.jpg"
```

## Step 9: Stripe Integration (Future)

When ready to add payments:

1. Create Stripe account
2. Create products and prices
3. Add Stripe keys to `.env.local`
4. Implement checkout flow
5. Set up webhook endpoint
6. Test subscription flow

See `PREMIUM_FEATURES_PLAN.md` for detailed Stripe integration guide.

## Troubleshooting

### Database Connection Issues

If you get database errors:

```bash
# Check connection
npx prisma db pull

# Reset database (WARNING: deletes all data)
npx prisma db push --force-reset
```

### Authentication Issues

If login/register doesn't work:

1. Check Supabase console for errors
2. Verify environment variables
3. Check browser console for errors
4. Verify Supabase project is active

### TypeScript Errors

If you see type errors:

```bash
# Regenerate Prisma types
npx prisma generate

# Restart TypeScript server in VS Code
Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

## Architecture Overview

### Authentication Flow

1. User signs up/logs in via Supabase Auth
2. Supabase session stored in cookies
3. Middleware checks auth on protected routes
4. `AuthContext` provides user state to React components
5. API routes authenticate via session or API key

### Feature Flag System

1. Environment variable `NEXT_PUBLIC_PREMIUM_FEATURES_ENABLED` acts as master switch
2. When `true`: All users get all features (no database check)
3. When `false`: Check user tier + database feature flags
4. `hasFeature()` - Async database check (server-side)
5. `hasFeatureSync()` - Synchronous tier check (client-side)

### Database Models

- **User**: Account data, tier, Stripe info, API keys
- **Detection**: Detection history with full pipeline JSON
- **UsageLog**: API calls for rate limiting and billing
- **FeatureFlag**: Toggle features per tier

## Next Steps

1. ✅ Complete Phase 1-4 (Done - Auth, DB, Feature Flags, UI)
2. 🔄 Integrate premium badges into existing components
3. 🔄 Create premium API endpoints
4. 🔄 Add Stripe integration
5. 🔄 Build admin dashboard
6. 🔄 Add email notifications
7. 🔄 Deploy to production

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Stripe Documentation](https://stripe.com/docs)
- Full implementation plan: `PREMIUM_FEATURES_PLAN.md`
