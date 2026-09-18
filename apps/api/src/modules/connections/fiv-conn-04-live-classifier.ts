/**
 * FIV-CONN-04-C — Vault-proven LIVE classifier (thin facade over A).
 *
 * Pure / read-only. Metadata-only Vault inputs. No DB/Vault I/O. No mutation.
 * Evidence SoT remains classifyFivConn04AConnection (A). This module maps to
 * Slice §9 dispositions and enforces IMPL-REV-C-01 occupancy input semantics.
 *
 * Does NOT authorize D writes, FIV, C7, live capital, or venue I/O.
 */

import { SecretState } from '../secret-vault/secret-state';
import {
  classifyFivConn04AConnection,
  type FivConn04AClassificationClass,
  type FivConn04AConnectionInput,
  type FivConn04AReasonCode,
  type FivConn04ARowResult,
  type FivConn04AVaultMetaInput,
} from './fiv-conn-04-a-classification';

export type FivConn04LiveConnectionInput = FivConn04AConnectionInput;
export type FivConn04LiveVaultMetaInput = FivConn04AVaultMetaInput;

/**
 * IMPL-REV-C-01 — Strategy-B live-slot occupancy at the C input boundary.
 *
 * - verified_vacant: occupancy was successfully evaluated; slot is confirmed vacant.
 * - occupied: another connection occupies the projected live slot.
 * - unavailable: occupancy could not be read/verified — MUST FAIL CLOSED
 *   (MUST NOT be converted to verified_vacant / A null).
 */
export type FivConn04LiveSlotOccupancy =
  | Readonly<{ status: 'verified_vacant' }>
  | Readonly<{ status: 'occupied'; occupantId: string }>
  | Readonly<{ status: 'unavailable' }>;

/** Slice §9 dispositions (+ IMPL-REV-C-01 occupancy fail-closed). */
export const FIV_CONN_04_LIVE_DISPOSITIONS = Object.freeze([
  'ELIGIBLE_LIVE',
  'OUT_OF_SCOPE_NON_EXCHANGE',
  'SKIP_ALREADY_LIVE',
  'SKIP_ALREADY_TESTNET',
  'SKIP_ALREADY_POPULATED',
  'BLOCKED_MISSING_CREDENTIAL',
  'BLOCKED_DANGLING_CREDENTIAL',
  'BLOCKED_WORKSPACE_MISMATCH',
  'BLOCKED_REVOKED_OR_INVALID',
  'BLOCKED_INVALID_PURPOSE',
  'BLOCKED_DEMO_DEFERRED',
  'BLOCKED_PURPOSE_ENV_MISMATCH_FOR_LIVE',
  'BLOCKED_STRATEGY_B_COLLISION',
  /** C input-boundary fail-closed when occupancy cannot be verified (IMPL-REV-C-01). */
  'BLOCKED_OCCUPANCY_UNAVAILABLE',
  'ERROR',
] as const);

export type FivConn04LiveDisposition = (typeof FIV_CONN_04_LIVE_DISPOSITIONS)[number];

export type FivConn04LiveClassificationResult = Readonly<{
  disposition: FivConn04LiveDisposition;
  /** True only when disposition === ELIGIBLE_LIVE. Never implies write/trade authorization. */
  eligibleLive: boolean;
  reasonCodeA: FivConn04AReasonCode | null;
  classificationA: FivConn04AClassificationClass | null;
  connectionId: string;
  workspaceId: string;
  provider: string;
  connectionType: string;
  currentEnvironment: string | null;
  vaultSecretId: string | null;
  /** Safe metadata only — never secret material. */
  vaultPurpose: string | null;
  vaultState: string | null;
  purposeEnvironmentClass: FivConn04ARowResult['purposeEnvironmentClass'];
  strategyBCollision: boolean;
  collidingConnectionId: string | null;
  occupancyStatus: FivConn04LiveSlotOccupancy['status'];
}>;

/**
 * Map A reason → Slice §9 disposition. Only A ELIGIBLE_LIVE may become C ELIGIBLE_LIVE.
 * Skip / DEMO refinements use fields already present on the A result (no new evidence bar).
 */
export function mapFivConn04AReasonToLiveDisposition(
  a: FivConn04ARowResult,
): FivConn04LiveDisposition {
  switch (a.reasonCode) {
    case 'ELIGIBLE_LIVE':
      return 'ELIGIBLE_LIVE';
    case 'AMBIGUOUS':
    case 'MISSING_VAULT_BINDING':
      return 'BLOCKED_MISSING_CREDENTIAL';
    case 'DANGLING_VAULT_BINDING':
      return 'BLOCKED_DANGLING_CREDENTIAL';
    case 'WORKSPACE_MISMATCH':
      return 'BLOCKED_WORKSPACE_MISMATCH';
    case 'REVOKED_CREDENTIAL':
    case 'INVALID_CREDENTIAL':
      return 'BLOCKED_REVOKED_OR_INVALID';
    case 'PURPOSE_MISMATCH':
      return 'BLOCKED_PURPOSE_ENV_MISMATCH_FOR_LIVE';
    case 'NON_LIVE_PURPOSE':
      return a.purposeEnvironmentClass === 'demo'
        ? 'BLOCKED_DEMO_DEFERRED'
        : 'BLOCKED_PURPOSE_ENV_MISMATCH_FOR_LIVE';
    case 'STRATEGY_B_COLLISION':
      return 'BLOCKED_STRATEGY_B_COLLISION';
    case 'ALREADY_POPULATED':
      if (a.currentEnvironment === 'live') return 'SKIP_ALREADY_LIVE';
      if (a.currentEnvironment === 'testnet') return 'SKIP_ALREADY_TESTNET';
      return 'SKIP_ALREADY_POPULATED';
    case 'NON_EXCHANGE_NULL':
      return 'OUT_OF_SCOPE_NON_EXCHANGE';
    case 'ERROR':
    default:
      return 'ERROR';
  }
}

function occupancyUnavailableResult(
  connection: FivConn04LiveConnectionInput,
  vaultMeta: FivConn04LiveVaultMetaInput | null,
): FivConn04LiveClassificationResult {
  return Object.freeze({
    disposition: 'BLOCKED_OCCUPANCY_UNAVAILABLE',
    eligibleLive: false,
    reasonCodeA: null,
    classificationA: null,
    connectionId: connection.id,
    workspaceId: connection.workspaceId,
    provider: connection.provider,
    connectionType: connection.connectionType,
    currentEnvironment: connection.environment,
    vaultSecretId: connection.vaultSecretId,
    vaultPurpose: vaultMeta?.purpose ?? null,
    vaultState: vaultMeta?.state ?? null,
    purposeEnvironmentClass: null,
    strategyBCollision: false,
    collidingConnectionId: null,
    occupancyStatus: 'unavailable',
  });
}

function fromAResult(
  a: FivConn04ARowResult,
  occupancyStatus: 'verified_vacant' | 'occupied',
): FivConn04LiveClassificationResult {
  const disposition = mapFivConn04AReasonToLiveDisposition(a);
  return Object.freeze({
    disposition,
    eligibleLive: disposition === 'ELIGIBLE_LIVE',
    reasonCodeA: a.reasonCode,
    classificationA: a.classification,
    connectionId: a.connectionId,
    workspaceId: a.workspaceId,
    provider: a.provider,
    connectionType: a.connectionType,
    currentEnvironment: a.currentEnvironment,
    vaultSecretId: a.vaultSecretId,
    vaultPurpose: a.vaultPurpose,
    vaultState: a.vaultState,
    purposeEnvironmentClass: a.purposeEnvironmentClass,
    strategyBCollision: a.strategyBCollision,
    collidingConnectionId: a.collidingConnectionId,
    occupancyStatus,
  });
}

/**
 * Classify one Connection for FIV-CONN-04-C.
 *
 * @param occupancy IMPL-REV-C-01 typed occupancy. `verified_vacant` maps to A `null`.
 *   `unavailable` fails closed without treating the slot as vacant.
 */
export function classifyFivConn04LiveConnection(
  connection: FivConn04LiveConnectionInput,
  vaultMeta: FivConn04LiveVaultMetaInput | null,
  occupancy: FivConn04LiveSlotOccupancy,
): FivConn04LiveClassificationResult {
  if (occupancy.status === 'unavailable') {
    return occupancyUnavailableResult(connection, vaultMeta);
  }

  const liveSlotOccupantId =
    occupancy.status === 'verified_vacant' ? null : occupancy.occupantId;

  const a = classifyFivConn04AConnection(connection, vaultMeta, liveSlotOccupantId);
  return fromAResult(a, occupancy.status);
}

export function isFivConn04EligibleLive(
  result: FivConn04LiveClassificationResult,
): boolean {
  return result.eligibleLive === true && result.disposition === 'ELIGIBLE_LIVE';
}

/** IPR-C-01 helper — Connected is the only Vault state that may participate in LIVE. */
export function isFivConn04LiveVaultStateConnected(state: string): boolean {
  return state === SecretState.Connected;
}
