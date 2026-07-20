/**
 * Runtime environment classification for health and startup verification.
 */
export type RuntimeEnvironment = 'development' | 'test' | 'production' | 'unknown';

export function resolveRuntimeEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): RuntimeEnvironment {
  if (env.VITEST) return 'test';

  const nodeEnv = (env.NODE_ENV ?? 'development').trim().toLowerCase();
  if (nodeEnv === 'development') return 'development';
  if (nodeEnv === 'test') return 'test';
  if (nodeEnv === 'production') return 'production';
  return 'unknown';
}

/**
 * Production-like environments fail startup on verification errors.
 * Development and test may warn instead.
 */
export function shouldFailStartupOnVerificationError(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return resolveRuntimeEnvironment(env) === 'production';
}
