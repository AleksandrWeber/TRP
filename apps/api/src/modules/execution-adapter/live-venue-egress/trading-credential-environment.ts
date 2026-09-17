/**
 * V3-L02-S-ENV1 — Trusted trading credential environment taxonomy (SB-06).
 *
 * Environment classification comes from Vault purpose (server-side), never from
 * a client request field. Maps onto EG1 LiveVenueEnvironment endpoint classes.
 */

import {
  SecretPurpose,
  isTradingSecretPurpose,
  type SecretPurpose as SecretPurposeType,
} from '../../secret-vault/secret-purpose';
import type { LiveVenueEnvironment, LiveVenueId } from './live-venue-allowlist';

export const TRADING_CREDENTIAL_ENVIRONMENTS = Object.freeze(['live', 'testnet', 'demo'] as const);
export type TradingCredentialEnvironment = (typeof TRADING_CREDENTIAL_ENVIRONMENTS)[number];

/**
 * Connection-persisted environments (FIV-CONN-01).
 * Subset of ENV1 `TradingCredentialEnvironment` — DEMO deferred for Connections.
 */
export const CONNECTION_TRADING_ENVIRONMENTS = Object.freeze(['live', 'testnet'] as const);
export type ConnectionTradingEnvironment = (typeof CONNECTION_TRADING_ENVIRONMENTS)[number];

export function isTradingCredentialEnvironment(
  value: string,
): value is TradingCredentialEnvironment {
  return (TRADING_CREDENTIAL_ENVIRONMENTS as readonly string[]).includes(value);
}

export function isConnectionTradingEnvironment(
  value: unknown,
): value is ConnectionTradingEnvironment {
  return value === 'live' || value === 'testnet';
}

/**
 * Resolve trusted trading environment from Vault purpose.
 * Returns null for non-trading purposes (notification/ai) or unknown values.
 */
export function tradingEnvironmentFromPurpose(
  purpose: SecretPurposeType,
): TradingCredentialEnvironment | null {
  if (!isTradingSecretPurpose(purpose)) {
    return null;
  }
  if (purpose === SecretPurpose.TradingTestnet) {
    return 'testnet';
  }
  if (purpose === SecretPurpose.TradingDemo) {
    return 'demo';
  }
  // `trading` (legacy) and `trading_live` → live
  return 'live';
}

export function purposeForTradingEnvironment(
  environment: TradingCredentialEnvironment,
): SecretPurposeType {
  if (environment === 'testnet') return SecretPurpose.TradingTestnet;
  if (environment === 'demo') return SecretPurpose.TradingDemo;
  return SecretPurpose.TradingLive;
}

/**
 * Map credential environment → EG1 host class.
 * OKX demo shares the testnet host class (www.okx.com) and requires a demo header.
 */
export function egressEnvironmentForCredential(
  credentialEnvironment: TradingCredentialEnvironment,
): LiveVenueEnvironment {
  if (credentialEnvironment === 'live') return 'live';
  // testnet + demo both use the EG1 `testnet` host slot for OKX; Binance/Bybit use distinct hosts.
  return 'testnet';
}

/** OKX simulated-trading header required for demo credentials (ADP1 must apply server-side only). */
export const OKX_DEMO_TRADING_HEADER_NAME = 'x-simulated-trading' as const;
export const OKX_DEMO_TRADING_HEADER_VALUE = '1' as const;

export function okxDemoHeadersRequired(
  venue: LiveVenueId,
  credentialEnvironment: TradingCredentialEnvironment,
): Readonly<Record<string, string>> | null {
  if (venue !== 'OKX' || credentialEnvironment !== 'demo') {
    return null;
  }
  return Object.freeze({
    [OKX_DEMO_TRADING_HEADER_NAME]: OKX_DEMO_TRADING_HEADER_VALUE,
  });
}

export function okxLiveMustNotSendDemoHeader(
  venue: LiveVenueId,
  credentialEnvironment: TradingCredentialEnvironment,
  headers: Readonly<Record<string, string>> | null | undefined,
): boolean {
  if (venue !== 'OKX' || credentialEnvironment !== 'live') {
    return true;
  }
  if (!headers) return true;
  const value = headers[OKX_DEMO_TRADING_HEADER_NAME] ?? headers['X-Simulated-Trading'];
  return value === undefined;
}
