import type { RateLimitConfig } from "@/src/lib/rateLimit";

export type UserTier = "FREE" | "PREMIUM" | "ENTERPRISE";

export type TierRateLimitConfig = {
  daily: number;
  monthly: number;
  perMinute: number;
  concurrent: number;
};

const buildRateLimit = (daily: number, monthly: number, perMinute: number, concurrent: number): TierRateLimitConfig => ({
  daily,
  monthly,
  perMinute,
  concurrent,
});

export const RATE_LIMIT_WINDOW_MS = 60 * 1000;

export const TIER_RATE_LIMITS: Record<UserTier, TierRateLimitConfig> = {
  FREE: buildRateLimit(50, 1000, 10, 3),
  PREMIUM: buildRateLimit(1000, 2500, 30, 10),
  ENTERPRISE: buildRateLimit(10000, 300000, 100, 50),
};

export const LOWERCASE_TIER_KEYS = ["free", "premium", "enterprise"] as const;
export type LowercaseUserTier = (typeof LOWERCASE_TIER_KEYS)[number];

export const LOWERCASE_TO_UPPERCASE_TIER: Record<LowercaseUserTier, UserTier> = {
  free: "FREE",
  premium: "PREMIUM",
  enterprise: "ENTERPRISE",
};

export type TierRateLimitView = Pick<TierRateLimitConfig, "daily" | "monthly" | "perMinute">;

const pickView = (value: TierRateLimitConfig): TierRateLimitView => ({
  daily: value.daily,
  monthly: value.monthly,
  perMinute: value.perMinute,
});

export const DEFAULT_RATE_LIMIT_VIEWS: Record<LowercaseUserTier, TierRateLimitView> = {
  free: pickView(TIER_RATE_LIMITS.FREE),
  premium: pickView(TIER_RATE_LIMITS.PREMIUM),
  enterprise: pickView(TIER_RATE_LIMITS.ENTERPRISE),
};

export function resolveUserTier(tier: string | undefined | null): UserTier {
  if (tier === "PREMIUM" || tier === "ENTERPRISE") {
    return tier;
  }
  return "FREE";
}

export function getBurstRateLimitConfig(tier: UserTier): RateLimitConfig {
  return {
    maxRequests: TIER_RATE_LIMITS[tier].perMinute,
    windowMs: RATE_LIMIT_WINDOW_MS,
  };
}

export function createRateLimitViewSnapshot(): Record<LowercaseUserTier, TierRateLimitView> {
  return {
    free: { ...DEFAULT_RATE_LIMIT_VIEWS.free },
    premium: { ...DEFAULT_RATE_LIMIT_VIEWS.premium },
    enterprise: { ...DEFAULT_RATE_LIMIT_VIEWS.enterprise },
  };
}
