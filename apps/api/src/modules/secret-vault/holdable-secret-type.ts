/**
 * Holdable customer secret types (V3-S03-a).
 * Typed catalog so later providers join this vault — not a second bounded context.
 * Schemas only. Not Binance, Telegram, SMTP, or OpenRouter products.
 */

export const HoldableSecretType = {
  Binance: 'binance',
  Bybit: 'bybit',
  Okx: 'okx',
  Telegram: 'telegram',
  Smtp: 'smtp',
  OpenRouter: 'openrouter',
} as const;

export type HoldableSecretType = (typeof HoldableSecretType)[keyof typeof HoldableSecretType];

const HOLDABLE = new Set<string>(Object.values(HoldableSecretType));

export function isHoldableSecretType(value: unknown): value is HoldableSecretType {
  return typeof value === 'string' && HOLDABLE.has(value);
}

export function listHoldableSecretTypes(): readonly HoldableSecretType[] {
  return Object.values(HoldableSecretType);
}
