import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Stub for local dev when Upstash is not configured
const isUpstashConfigured =
  process.env.UPSTASH_REDIS_REST_URL?.startsWith('https://') &&
  process.env.UPSTASH_REDIS_REST_TOKEN !== 'local-dev-token';

export const redis = isUpstashConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Pass-through limiter for local dev (always allows)
const allowAll = {
  limit: async () => ({ success: true, remaining: 999, reset: 0, limit: 999 }),
};

function makeRateLimit(
  prefix: string,
  requests: number,
  window: Parameters<typeof Ratelimit.slidingWindow>[1]
) {
  if (!redis) return allowAll;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
    prefix: `qrsos:${prefix}`,
  });
}

export const authRateLimit = makeRateLimit('auth', 10, '15 m');
export const scanRateLimit = makeRateLimit('scan', 30, '1 m');
export const apiRateLimit  = makeRateLimit('api', 100, '1 m');
