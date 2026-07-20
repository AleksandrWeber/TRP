export type ConfigurationValidityResult = Readonly<{
  valid: boolean;
  issues: readonly string[];
  detail: string;
}>;

const DEV_JWT_FALLBACK_SECRET = 'dev-only-change-me';

/**
 * Lightweight configuration validity checks for startup verification.
 * Does not modify config — only reports issues.
 */
export function verifyConfigurationValidity(
  env: NodeJS.ProcessEnv = process.env,
): ConfigurationValidityResult {
  const issues: string[] = [];
  const nodeEnv = (env.NODE_ENV ?? 'development').trim().toLowerCase();
  const isProduction = nodeEnv === 'production';

  const databaseUrl = env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    issues.push('DATABASE_URL is not set');
  }

  const jwtSecret = env.JWT_SECRET?.trim();
  if (isProduction) {
    if (!jwtSecret || jwtSecret === DEV_JWT_FALLBACK_SECRET) {
      issues.push('JWT_SECRET must be set to a non-default value in production');
    } else if (jwtSecret.length < 16) {
      issues.push('JWT_SECRET must be at least 16 characters');
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    detail:
      issues.length === 0 ? 'Configuration is valid' : `Configuration issues: ${issues.join('; ')}`,
  };
}
