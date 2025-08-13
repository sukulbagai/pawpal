import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    tokens: number;
    lastRefill: number;
  };
}

interface RateLimitConfig {
  maxTokens: number;
  refillPeriodMs: number;
  tokensPerRefill: number;
}

// In-memory rate limit store
// In production, consider using Redis for distributed rate limiting
const rateLimitStore: RateLimitStore = {};

// Default rate limit configurations
const RATE_LIMIT_CONFIGS = {
  reports: {
    maxTokens: 10,
    refillPeriodMs: 10 * 60 * 1000, // 10 minutes
    tokensPerRefill: 10,
  },
  dogCreation: {
    maxTokens: 10,
    refillPeriodMs: 10 * 60 * 1000, // 10 minutes
    tokensPerRefill: 10,
  },
} as const;

/**
 * Token bucket rate limiter
 * Allows burst of requests up to maxTokens, then refills at steady rate
 */
function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const bucket = rateLimitStore[key] || {
    tokens: config.maxTokens,
    lastRefill: now,
  };

  // Calculate tokens to add based on time elapsed
  const timeSinceRefill = now - bucket.lastRefill;
  const refillsCount = Math.floor(timeSinceRefill / config.refillPeriodMs);
  
  if (refillsCount > 0) {
    bucket.tokens = Math.min(
      config.maxTokens,
      bucket.tokens + (refillsCount * config.tokensPerRefill)
    );
    bucket.lastRefill = now;
  }

  // Check if request is allowed
  if (bucket.tokens > 0) {
    bucket.tokens--;
    rateLimitStore[key] = bucket;
    return { allowed: true, remaining: bucket.tokens };
  }

  rateLimitStore[key] = bucket;
  return { allowed: false, remaining: 0 };
}

/**
 * Create rate limit middleware for specific endpoint
 */
export function createRateLimit(type: keyof typeof RATE_LIMIT_CONFIGS) {
  const config = RATE_LIMIT_CONFIGS[type];

  return (req: Request, res: Response, next: NextFunction): void => {
    // Use authenticated user ID if available, otherwise fall back to IP
    const identifier = req.authUserId || req.ip || 'anonymous';
    const key = `${type}:${identifier}`;

    const result = checkRateLimit(key, config);

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': config.maxTokens.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(
        Date.now() + config.refillPeriodMs
      ).toISOString(),
    });

    if (!result.allowed) {
      res.status(429).json({
        ok: false,
        error: {
          message: 'Rate limit exceeded. Please try again later.',
          type: 'RATE_LIMIT_EXCEEDED',
          retryAfter: config.refillPeriodMs / 1000, // seconds
        },
      });
      return;
    }

    next();
  };
}

/**
 * Predefined rate limiters for common endpoints
 */
export const rateLimiters = {
  reports: createRateLimit('reports'),
  dogCreation: createRateLimit('dogCreation'),
};

/**
 * Clean up old entries from rate limit store
 * Call this periodically to prevent memory leaks
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  const cleanupThreshold = 24 * 60 * 60 * 1000; // 24 hours

  for (const [key, bucket] of Object.entries(rateLimitStore)) {
    if (now - bucket.lastRefill > cleanupThreshold) {
      delete rateLimitStore[key];
    }
  }
}

// Clean up every hour
setInterval(cleanupRateLimitStore, 60 * 60 * 1000);
