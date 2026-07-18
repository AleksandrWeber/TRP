/**
 * Canonical development identity (US002A).
 * Matches the browser login default — not a Prisma-backed user.
 */
export const DEVELOPMENT_IDENTITY_EMAIL = 'admin@trp.local';
export const DEVELOPMENT_IDENTITY_DISPLAY_NAME = 'Admin';

/**
 * Development-only gate for identity bootstrap.
 * Skips production, test, and Vitest runs.
 */
export function shouldBootstrapDevelopmentIdentity(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.VITEST) return false;
  const nodeEnv = (env.NODE_ENV ?? 'development').trim();
  return nodeEnv === 'development';
}
