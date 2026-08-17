export const PLATFORM_ACCESS_DENIED_MESSAGE = 'Access denied';

const EXISTENCE_ORACLE_PATTERNS: readonly RegExp[] = [
  /\bnot found\b/i,
  /\bdoes not exist\b/i,
  /\bno such\b/i,
  /\bunknown user\b/i,
  /\bunknown account\b/i,
];

export type PlatformDenyShape = Readonly<{
  statusCode: number;
  message: string;
}>;

/**
 * Detect client-visible messages that reveal whether a protected resource exists.
 * Platform-owned surfaces use this at the HTTP edge; domain packages adopt incrementally.
 */
export function isExistenceOracleMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) {
    return false;
  }

  return EXISTENCE_ORACLE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * Normalize forbidden and missing resource responses to a single non-informative deny shape.
 * Returns null when the caller should preserve the original response.
 */
export function shapePlatformDeny(statusCode: number, message: string): PlatformDenyShape | null {
  if (statusCode !== 403 && statusCode !== 404) {
    return null;
  }

  if (!isExistenceOracleMessage(message)) {
    return null;
  }

  return {
    statusCode: 403,
    message: PLATFORM_ACCESS_DENIED_MESSAGE,
  };
}
