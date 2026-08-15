/**
 * PC-18: development identity is not a product path.
 * Engineer seed (`prisma db seed`) may still create an operator account.
 * Runtime modules must not auto-provision shared admin credentials.
 */
export const DEVELOPMENT_IDENTITY_EMAIL = 'admin@trp.local';
export const DEVELOPMENT_IDENTITY_DISPLAY_NAME = 'Admin';

/**
 * Always false. PC-18 removed automatic development identity bootstrap.
 */
export function shouldBootstrapDevelopmentIdentity(_env: NodeJS.ProcessEnv = process.env): boolean {
  return false;
}
