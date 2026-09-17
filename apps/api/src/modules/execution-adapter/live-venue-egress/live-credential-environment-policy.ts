/**
 * V3-L02-S-ENV1 — Fail-closed credential environment ↔ venue ↔ EG1 endpoint binding (SB-06).
 *
 * Trusted inputs only: Vault purpose + workspace + vault type from server records.
 * Client-claimed environment cannot escalate TEST/DEMO → LIVE.
 * Does not retrieve secrets, contact venues, or implement adapters.
 */

import type { HoldableSecretType } from '../../secret-vault/holdable-secret-type';
import type { SecretPurpose } from '../../secret-vault/secret-purpose';
import { assertLiveVenueEgress, type LiveVenueEgressResult } from './live-venue-egress-policy';
import {
  isLiveVenueId,
  liveVenueOrigin,
  type LiveVenueExecutionMode,
  type LiveVenueId,
} from './live-venue-allowlist';
import {
  egressEnvironmentForCredential,
  isTradingCredentialEnvironment,
  okxDemoHeadersRequired,
  okxLiveMustNotSendDemoHeader,
  tradingEnvironmentFromPurpose,
  type TradingCredentialEnvironment,
} from './trading-credential-environment';

export type LiveCredentialEnvironmentDenyReason =
  | 'paper_mock_forbidden'
  | 'non_trading_purpose'
  | 'unknown_environment'
  | 'unknown_venue'
  | 'venue_mismatch'
  | 'workspace_mismatch'
  | 'environment_mismatch'
  | 'client_environment_escalation'
  | 'unsupported_venue_environment'
  | 'okx_demo_header_required'
  | 'okx_demo_header_forbidden_on_live'
  | 'egress_denied'
  | 'missing_configuration';

export type LiveCredentialEnvironmentBindingResult =
  | Readonly<{
      ok: true;
      workspaceId: string;
      venue: LiveVenueId;
      credentialEnvironment: TradingCredentialEnvironment;
      egressEnvironment: 'live' | 'testnet';
      origin: string;
      okxDemoHeaders: Readonly<Record<string, string>> | null;
    }>
  | Readonly<{ ok: false; reason: LiveCredentialEnvironmentDenyReason }>;

const EXCHANGE_VAULT_TYPES: Readonly<Record<LiveVenueId, HoldableSecretType>> = Object.freeze({
  BINANCE: 'binance',
  BYBIT: 'bybit',
  OKX: 'okx',
});

export type TrustedCredentialBindingInput = Readonly<{
  /** Server-side Connection / Vault workspace — never client-asserted alone. */
  workspaceId: string;
  vaultType: HoldableSecretType;
  purpose: SecretPurpose;
}>;

export type RequestedLiveCredentialUse = Readonly<{
  workspaceId: string;
  venue: string;
  /**
   * Endpoint class the caller intends to use (server-selected for ADP1).
   * Must match trusted credential environment.
   */
  endpointEnvironment: string;
  executionMode: LiveVenueExecutionMode;
  /**
   * Optional client-supplied environment claim. If present and differs from
   * trusted credential environment → deny (blocks TEST→LIVE escalation).
   */
  clientClaimedEnvironment?: string | null;
  /** Absolute URL to validate against EG1 for the mapped egress environment. */
  targetUrl?: string | null;
  /** Request headers (for OKX demo header checks). Never log these. */
  requestHeaders?: Readonly<Record<string, string>> | null;
}>;

/**
 * Authorize live credential use against trusted Vault metadata + EG1 destination class.
 * Does not return secret material.
 */
export function assertLiveCredentialEnvironmentBinding(
  trusted: TrustedCredentialBindingInput,
  requested: RequestedLiveCredentialUse,
): LiveCredentialEnvironmentBindingResult {
  if (requested.executionMode === 'paper' || requested.executionMode === 'mock') {
    return Object.freeze({ ok: false, reason: 'paper_mock_forbidden' });
  }
  if (requested.executionMode !== 'live') {
    return Object.freeze({ ok: false, reason: 'missing_configuration' });
  }

  if (trusted.workspaceId.trim() !== requested.workspaceId.trim()) {
    return Object.freeze({ ok: false, reason: 'workspace_mismatch' });
  }

  const credentialEnvironment = tradingEnvironmentFromPurpose(trusted.purpose);
  if (credentialEnvironment === null) {
    return Object.freeze({ ok: false, reason: 'non_trading_purpose' });
  }

  if (!isLiveVenueId(requested.venue)) {
    return Object.freeze({ ok: false, reason: 'unknown_venue' });
  }
  const venue = requested.venue;

  const expectedType = EXCHANGE_VAULT_TYPES[venue];
  if (trusted.vaultType !== expectedType) {
    return Object.freeze({ ok: false, reason: 'venue_mismatch' });
  }

  if (!isTradingCredentialEnvironment(requested.endpointEnvironment)) {
    return Object.freeze({ ok: false, reason: 'unknown_environment' });
  }
  const endpointEnvironment = requested.endpointEnvironment;

  if (
    requested.clientClaimedEnvironment !== undefined &&
    requested.clientClaimedEnvironment !== null &&
    requested.clientClaimedEnvironment.trim() !== ''
  ) {
    const claimed = requested.clientClaimedEnvironment.trim().toLowerCase();
    if (claimed !== credentialEnvironment) {
      return Object.freeze({ ok: false, reason: 'client_environment_escalation' });
    }
  }

  if (endpointEnvironment !== credentialEnvironment) {
    return Object.freeze({ ok: false, reason: 'environment_mismatch' });
  }

  // Binance/Bybit do not support demo credentials.
  if (credentialEnvironment === 'demo' && venue !== 'OKX') {
    return Object.freeze({ ok: false, reason: 'unsupported_venue_environment' });
  }

  const egressEnvironment = egressEnvironmentForCredential(credentialEnvironment);
  const origin = liveVenueOrigin(venue, egressEnvironment);

  const demoHeaders = okxDemoHeadersRequired(venue, credentialEnvironment);
  if (demoHeaders) {
    const headers = requested.requestHeaders ?? {};
    const present =
      headers['x-simulated-trading'] === '1' || headers['X-Simulated-Trading'] === '1';
    if (!present) {
      // Binding may succeed for policy matrix without headers; callers that send
      // requests must include headers. We expose required headers on success —
      // deny only when headers were provided but wrong.
      if (requested.requestHeaders) {
        return Object.freeze({ ok: false, reason: 'okx_demo_header_required' });
      }
    }
  }

  if (!okxLiveMustNotSendDemoHeader(venue, credentialEnvironment, requested.requestHeaders)) {
    return Object.freeze({ ok: false, reason: 'okx_demo_header_forbidden_on_live' });
  }

  if (requested.targetUrl !== undefined && requested.targetUrl !== null) {
    const egress: LiveVenueEgressResult = assertLiveVenueEgress({
      targetUrl: requested.targetUrl,
      venue,
      environment: egressEnvironment,
      executionMode: 'live',
    });
    if (!egress.ok) {
      return Object.freeze({ ok: false, reason: 'egress_denied' });
    }
  }

  return Object.freeze({
    ok: true,
    workspaceId: trusted.workspaceId,
    venue,
    credentialEnvironment,
    egressEnvironment,
    origin,
    okxDemoHeaders: demoHeaders,
  });
}

/**
 * Paper/Mock must not retrieve LIVE-class trading secrets.
 * Testnet/demo retrieval under paper/mock is also forbidden (no live I/O path).
 */
export function assertMayRetrieveTradingCredential(input: {
  executionMode: LiveVenueExecutionMode;
  purpose: SecretPurpose;
}): LiveCredentialEnvironmentBindingResult | Readonly<{ ok: true }> {
  if (input.executionMode === 'paper' || input.executionMode === 'mock') {
    const env = tradingEnvironmentFromPurpose(input.purpose);
    if (env !== null) {
      return Object.freeze({ ok: false, reason: 'paper_mock_forbidden' });
    }
  }
  return Object.freeze({ ok: true as const });
}

const SECRET_KV =
  /\b(api[_-]?key|api[_-]?secret|passphrase|secret|token|password|authorization)\b\s*[:=]\s*['"]?[^'"\s,}]+/gi;
const BEARER_TOKEN = /\b(authorization)\b\s*:\s*bearer\s+\S+/gi;

/**
 * Strip secret-like key/value pairs from error/log text. Never log raw Vault material.
 */
export function redactCredentialMaterial(text: string): string {
  return text.replace(BEARER_TOKEN, '$1: Bearer [REDACTED]').replace(SECRET_KV, '$1=[REDACTED]');
}

export function liveCredentialBindingErrorMessage(
  reason: LiveCredentialEnvironmentDenyReason,
): string {
  // Fixed codes only — no secret echo.
  return `live_credential_environment_denied:${reason}`;
}
