/**
 * Vault purpose (V3-S03-a).
 * One workspace holds at most one active secret per (type, purpose).
 * Public market data is not a purpose that stores a trading secret.
 */

export const SecretPurpose = {
  Trading: 'trading',
  Notification: 'notification',
  Ai: 'ai',
} as const;

export type SecretPurpose = (typeof SecretPurpose)[keyof typeof SecretPurpose];

const PURPOSES = new Set<string>(Object.values(SecretPurpose));

export function isSecretPurpose(value: unknown): value is SecretPurpose {
  return typeof value === 'string' && PURPOSES.has(value);
}

export function defaultPurposeForType(
  type: import('./holdable-secret-type').HoldableSecretType,
): SecretPurpose {
  switch (type) {
    case 'binance':
    case 'bybit':
    case 'okx':
      return SecretPurpose.Trading;
    case 'telegram':
    case 'smtp':
      return SecretPurpose.Notification;
    case 'openrouter':
      return SecretPurpose.Ai;
  }
}
