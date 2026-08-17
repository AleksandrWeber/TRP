export type AbuseQuota = Readonly<{
  limit: number;
  windowMs: number;
}>;

export type PlatformAbusePolicy = Readonly<{
  general: AbuseQuota;
  sensitive: AbuseQuota;
}>;

export type AbuseThrottleDecision =
  Readonly<{ allowed: true }> | Readonly<{ allowed: false; retryAfterSeconds: number }>;

type AbuseBucket = {
  count: number;
  expiresAt: number;
};

export const ABUSE_LIMIT_MESSAGE = 'Too many requests. Please try again later.';

const SENSITIVE_AUTH_PATHS = new Set([
  '/v1/auth/login',
  '/v1/auth/register',
  '/v1/auth/forgot-password',
  '/v1/auth/reset-password',
  '/v1/auth/refresh',
]);

export function isSensitiveAbusePath(url: string): boolean {
  const pathname = url.split('?', 1)[0] ?? url;
  return SENSITIVE_AUTH_PATHS.has(pathname);
}

/**
 * Process-local platform abuse guard. Authentication remains responsible for
 * account lockout; this protects the shared HTTP edge from a single caller.
 */
export class PlatformAbuseProtector {
  private readonly buckets = new Map<string, AbuseBucket>();

  constructor(
    private readonly policy: PlatformAbusePolicy,
    private readonly now: () => number = () => Date.now(),
  ) {}

  check(ip: string, url: string): AbuseThrottleDecision {
    const scope = isSensitiveAbusePath(url) ? 'sensitive' : 'general';
    const quota = this.policy[scope];
    const key = `${scope}:${ip}`;
    const now = this.now();
    const existing = this.buckets.get(key);

    if (!existing || existing.expiresAt <= now) {
      this.buckets.set(key, { count: 1, expiresAt: now + quota.windowMs });
      return { allowed: true };
    }

    if (existing.count >= quota.limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((existing.expiresAt - now) / 1000)),
      };
    }

    existing.count += 1;
    return { allowed: true };
  }
}
