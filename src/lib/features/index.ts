import { prisma } from '@/src/lib/prisma'
import type { SessionUser } from '@/src/lib/auth'

export type FeatureKey =
  | 'multiple_models'
  | 'api_access'
  | 'advanced_analytics'
  | 'cloud_storage'
  | 'priority_queue'

const GLOBAL_PREMIUM_ENABLED = process.env.NEXT_PUBLIC_PREMIUM_FEATURES_ENABLED === 'true'

export async function hasFeature(user: SessionUser | null, feature: FeatureKey): Promise<boolean> {
  // If global premium is enabled, everyone gets all features
  if (GLOBAL_PREMIUM_ENABLED) {
    return true
  }

  // No user = no premium features (except global override)
  if (!user) {
    return false
  }

  // Check database feature flag
  try {
    const flag = await prisma.featureFlag.findUnique({
      where: { key: feature }
    })

    if (!flag?.enabled) {
      return false
    }

    // Check tier-specific access
    switch (user.tier) {
      case 'ENTERPRISE':
        return flag.enterpriseEnabled
      case 'PREMIUM':
        return flag.premiumEnabled
      case 'FREE':
        return flag.freeEnabled
      default:
        return false
    }
  } catch (error) {
    // If database is not set up yet, fall back to tier check
    console.warn('Feature flag database check failed:', error)
    return ['PREMIUM', 'ENTERPRISE'].includes(user.tier)
  }
}

export function hasFeatureSync(userTier: 'FREE' | 'PREMIUM' | 'ENTERPRISE' | null, feature: FeatureKey): boolean {
  if (GLOBAL_PREMIUM_ENABLED) {
    return true
  }

  if (!userTier) {
    return false
  }

  const premiumFeatures: FeatureKey[] = [
    'multiple_models',
    'api_access',
    'advanced_analytics',
    'cloud_storage',
    'priority_queue'
  ]

  return premiumFeatures.includes(feature)
    ? ['PREMIUM', 'ENTERPRISE'].includes(userTier)
    : true
}

// Rate limiting per tier
export function getRateLimits(tier: 'FREE' | 'PREMIUM' | 'ENTERPRISE') {
  if (GLOBAL_PREMIUM_ENABLED) {
    return { daily: Infinity, monthly: Infinity, concurrent: Infinity }
  }

  switch (tier) {
    case 'ENTERPRISE':
      return { daily: 10000, monthly: 300000, concurrent: 50 }
    case 'PREMIUM':
      return { daily: 1000, monthly: 30000, concurrent: 10 }
    case 'FREE':
    default:
      return { daily: 50, monthly: 1000, concurrent: 3 }
  }
}
