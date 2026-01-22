/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or a similar solution
 */

type RateLimitEntry = {
  count: number;
  resetTime: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
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

/**
 * Check if a request is within rate limit
 * @param identifier - Unique identifier for the requester (IP, user ID, etc.)
 * @param config - Rate limit configuration
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetTime < now) {
    // Create new entry
    const resetTime = now + config.windowMs;
    rateLimitStore.set(identifier, { count: 1, resetTime });
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime,
    };
  }

  // Update existing entry
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

/**
 * Get client IP from request
 */
export function getClientIP(request: Request): string {
  // Try various headers for IP (common in reverse proxy setups)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback to a default (not ideal for rate limiting)
  return "unknown";
}
