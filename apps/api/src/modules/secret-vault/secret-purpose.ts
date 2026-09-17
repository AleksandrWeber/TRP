/**
 * Vault purpose (V3-S03-a / V3-L02-S-ENV1).
 * One workspace holds at most one active secret per (type, purpose).
 * Public market data is not a purpose that stores a trading secret.
 *
 * Trading environment slots (ENV1 / SB-06):
 * - `trading` — legacy default; treated as LIVE for exchange types
 * - `trading_live` — explicit LIVE
 * - `trading_testnet` — TESTNET / sandbox hosts
 * - `trading_demo` — OKX demo/simulated trading (same host + trusted demo header)
 */

export const SecretPurpose = {
  Trading: 'trading',
  TradingLive: 'trading_live',
  TradingTestnet: 'trading_testnet',
  TradingDemo: 'trading_demo',
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
      // Legacy default remains LIVE-class (ENV1 maps `trading` → live).
      return SecretPurpose.Trading;
    case 'telegram':
    case 'smtp':
    case 'slack-webhook':
    case 'discord-webhook':
    case 'teams-webhook':
    case 'web-push-vapid':
      return SecretPurpose.Notification;
    case 'openrouter':
      return SecretPurpose.Ai;
  }
}

/** True when purpose may hold exchange trading credentials. */
export function isTradingSecretPurpose(purpose: SecretPurpose): boolean {
  return (
    purpose === SecretPurpose.Trading ||
    purpose === SecretPurpose.TradingLive ||
    purpose === SecretPurpose.TradingTestnet ||
    purpose === SecretPurpose.TradingDemo
  );
}
