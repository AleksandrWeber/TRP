/**
 * FIV-CONN-03 — Governed EXCHANGE Connection credential resolution (Model C).
 *
 * Shared by handshake and capability. Does not redesign Vault / SecretPurpose / ENV1.
 * Runtime credential selector remains Connection.vaultSecretId (exact-id binding).
 * LIVE dual-purpose {Trading, TradingLive} are acceptance classes only — not search order.
 */

import type { Role } from '../identity/role';
import {
  SecretPurpose,
  isSecretPurpose,
  type SecretPurpose as SecretPurposeType,
} from '../secret-vault/secret-purpose';
import type { SecretFieldMap } from '../secret-vault/secret-material';
import type { SecretVaultMetadata } from '../secret-vault/secret-record';
import type { SecretVaultService } from '../secret-vault/secret-vault.service';
import {
  isConnectionTradingEnvironment,
  tradingEnvironmentFromPurpose,
  type ConnectionTradingEnvironment,
} from '../execution-adapter/live-venue-egress/trading-credential-environment';
import { vaultSecretTypeForExchangeProvider } from './exchange-handshake.vault';

export type ExchangeCredentialUseDenyReason =
  | 'environment_required'
  | 'missing_vault_secret_id'
  | 'unsupported_provider'
  | 'secret_not_found'
  | 'vault_secret_id_mismatch'
  | 'purpose_mismatch'
  | 'provider_mismatch'
  | 'vault_unavailable';

export type GovernedExchangeCredentialRequest = Readonly<{
  workspaceId: string;
  actorUserId: string;
  actorRole: Role;
  provider: string;
  /** Trusted Connection.environment — never client-asserted purpose. */
  environment: string | null;
  /** Exact credential binding from Connection.vaultSecretId. */
  vaultSecretId: string;
  /**
   * Optional client-supplied purpose. MUST NEVER become authoritative.
   * Present only so callers can prove it is ignored (SC-07 / Case 13).
   */
  clientPurpose?: string | null;
}>;

export type GovernedExchangeCredentialSuccess = Readonly<{
  ok: true;
  credentials: SecretFieldMap;
  purpose: SecretPurposeType;
  metadata: SecretVaultMetadata;
  environment: ConnectionTradingEnvironment;
}>;

export type GovernedExchangeCredentialFailure = Readonly<{
  ok: false;
  reason: ExchangeCredentialUseDenyReason;
  /** Vault get/retrieve invocations performed before deny (for Case 07 assertions). */
  vaultGetCalls: number;
  vaultRetrieveCalls: number;
}>;

export type GovernedExchangeCredentialResult =
  GovernedExchangeCredentialSuccess | GovernedExchangeCredentialFailure;

type VaultPort = Pick<SecretVaultService, 'get' | 'retrieve'>;

/**
 * Acceptance-class purposes for a Connection environment (D-CONN-03-02).
 * Not a credential search order — used only to locate the exact vaultSecretId
 * under the slot-based Vault API (C-01 / C-07).
 */
export function acceptancePurposesForConnectionEnvironment(
  environment: ConnectionTradingEnvironment,
): readonly SecretPurposeType[] {
  if (environment === 'live') {
    return Object.freeze([SecretPurpose.TradingLive, SecretPurpose.Trading]);
  }
  return Object.freeze([SecretPurpose.TradingTestnet]);
}

/** Model C: Connection.environment ↔ actual Vault SecretPurpose agreement. */
export function assertConnectionPurposeModelC(
  environment: ConnectionTradingEnvironment,
  actualPurpose: SecretPurposeType,
): boolean {
  return tradingEnvironmentFromPurpose(actualPurpose) === environment;
}

/**
 * Resolve EXCHANGE credentials for handshake/capability under FIV-CONN-03.
 *
 * Flow:
 * environment NULL → FAIL CLOSED (no Vault I/O)
 * → acceptance purposes from environment
 * → locate exact vaultSecretId within those purposes only
 * → Model C on actual metadata.purpose
 * → retrieve with that exact purpose
 *
 * Client purpose, if present, is ignored.
 */
export async function resolveGovernedExchangeCredentials(
  vault: VaultPort,
  input: GovernedExchangeCredentialRequest,
): Promise<GovernedExchangeCredentialResult> {
  // SC-07: client purpose is never authoritative — intentionally unused.
  void input.clientPurpose;

  let vaultGetCalls = 0;
  let vaultRetrieveCalls = 0;

  if (!isConnectionTradingEnvironment(input.environment)) {
    return Object.freeze({
      ok: false,
      reason: 'environment_required',
      vaultGetCalls: 0,
      vaultRetrieveCalls: 0,
    });
  }
  const environment = input.environment;

  if (typeof input.vaultSecretId !== 'string' || input.vaultSecretId.trim() === '') {
    return Object.freeze({
      ok: false,
      reason: 'missing_vault_secret_id',
      vaultGetCalls: 0,
      vaultRetrieveCalls: 0,
    });
  }

  const type = vaultSecretTypeForExchangeProvider(input.provider);
  if (type === null) {
    return Object.freeze({
      ok: false,
      reason: 'unsupported_provider',
      vaultGetCalls: 0,
      vaultRetrieveCalls: 0,
    });
  }

  const candidates = acceptancePurposesForConnectionEnvironment(environment);
  let matched: SecretVaultMetadata | null = null;
  let matchedPurpose: SecretPurposeType | null = null;

  for (const purpose of candidates) {
    vaultGetCalls += 1;
    const metadata = await vault.get({
      actorWorkspaceId: input.actorUserId,
      actorRole: input.actorRole,
      workspaceId: input.workspaceId,
      type,
      purpose,
    });
    if (metadata === null) {
      continue;
    }
    if (metadata.id !== input.vaultSecretId) {
      // Occupied sibling slot for this purpose — never substitute.
      continue;
    }
    matched = metadata;
    matchedPurpose = purpose;
    break;
  }

  if (matched === null || matchedPurpose === null) {
    return Object.freeze({
      ok: false,
      reason: 'vault_secret_id_mismatch',
      vaultGetCalls,
      vaultRetrieveCalls,
    });
  }

  if (!isSecretPurpose(matched.purpose)) {
    return Object.freeze({
      ok: false,
      reason: 'purpose_mismatch',
      vaultGetCalls,
      vaultRetrieveCalls,
    });
  }

  if (matched.type !== type) {
    return Object.freeze({
      ok: false,
      reason: 'provider_mismatch',
      vaultGetCalls,
      vaultRetrieveCalls,
    });
  }

  if (!assertConnectionPurposeModelC(environment, matched.purpose)) {
    return Object.freeze({
      ok: false,
      reason: 'purpose_mismatch',
      vaultGetCalls,
      vaultRetrieveCalls,
    });
  }

  try {
    vaultRetrieveCalls += 1;
    const credentials = await vault.retrieve({
      actorWorkspaceId: input.actorUserId,
      actorRole: input.actorRole,
      workspaceId: input.workspaceId,
      type,
      purpose: matchedPurpose,
    });
    return Object.freeze({
      ok: true,
      credentials,
      purpose: matched.purpose,
      metadata: matched,
      environment,
    });
  } catch {
    return Object.freeze({
      ok: false,
      reason: 'vault_unavailable',
      vaultGetCalls,
      vaultRetrieveCalls,
    });
  }
}
