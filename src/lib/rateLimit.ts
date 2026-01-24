import { getRedisClient } from "@/src/lib/redisClient";

type RateLimitEntry = {
  count: number;
  resetTime: number;
};

const fallbackRateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes (only for the in-memory fallback)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of fallbackRateLimitStore.entries()) {
    if (entry.resetTime < now) {
      fallbackRateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export type RateLimitConfig = {
  maxRequests: number; // Maximum requests allowed
  windowMs: number; // Time window in milliseconds
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
};

function buildInMemoryRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = fallbackRateLimitStore.get(identifier);

  if (!entry || entry.resetTime < now) {
    const resetTime = now + config.windowMs;
    fallbackRateLimitStore.set(identifier, { count: 1, resetTime });
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime,
    };
  }

  entry.count += 1;
  const allowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);

  return {
    allowed,
    limit: config.maxRequests,
    remaining,
    resetTime: entry.resetTime,
  };
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const normalizedWindowSeconds = Math.max(1, Math.ceil(config.windowMs / 1000));
  const key = `rate-limit:${identifier}`;

  try {
    const redis = await getRedisClient();
    const currentCount = await redis.incr(key);
    let ttlSeconds = await redis.ttl(key);

    if (ttlSeconds < 0) {
      await redis.expire(key, normalizedWindowSeconds);
      ttlSeconds = normalizedWindowSeconds;
    }

    const remaining = Math.max(0, config.maxRequests - currentCount);
    const resetTime = Date.now() + ttlSeconds * 1000;

    return {
      allowed: currentCount <= config.maxRequests,
      limit: config.maxRequests,
      remaining,
      resetTime,
    };
  } catch (error) {
    console.error("Redis rate limiting failed, falling back to in-memory limiter:", error);
    return buildInMemoryRateLimit(identifier, config);
  }
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  return "unknown";
}
