import type { ConfigService } from '@nestjs/config';

export const DEV_JWT_FALLBACK_SECRET = 'dev-only-change-me';

/**
 * Resolve JWT signing secret with production hardening (US158 / TD-005).
 * Insecure fallback is allowed only outside production.
 */
export function resolveJwtSecret(
  config: Pick<ConfigService, 'get'>,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const secret = config.get<string>('JWT_SECRET')?.trim();
  const nodeEnv = (config.get<string>('NODE_ENV') ?? env.NODE_ENV ?? 'development').trim();
  const isProduction = nodeEnv === 'production';

  if (!secret || secret === DEV_JWT_FALLBACK_SECRET) {
    if (isProduction) {
      throw new Error('JWT_SECRET must be set to a non-default value when NODE_ENV=production');
    }
    return secret && secret.length > 0 ? secret : DEV_JWT_FALLBACK_SECRET;
  }

  if (secret.length < 16) {
    throw new Error('JWT_SECRET must be at least 16 characters');
  }

  return secret;
}
