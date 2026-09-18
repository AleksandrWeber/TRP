/**
 * FIV-CONN-04-A — Read-only LIVE backfill preflight classification.
 *
 * Pure deterministic classifier. Does not mutate Connections, Vault, or credentials.
 * Vault purpose remains runtime SoT; Connection.environment is constraint/audit context only.
 */

import {
  tradingEnvironmentFromPurpose,
  type TradingCredentialEnvironment,
} from '../execution-adapter/live-venue-egress/trading-credential-environment';
import { SecretPurpose, isSecretPurpose, type SecretPurpose as SecretPurposeType } from '../secret-vault/secret-purpose';
import { SecretState, type PersistedSecretState } from '../secret-vault/secret-state';

/** Machine-testable reason codes (FIV-CONN-04-A). */
export const FIV_CONN_04_A_REASON_CODES = Object.freeze([
  'ELIGIBLE_LIVE',
  'AMBIGUOUS',
  'MISSING_VAULT_BINDING',
  'DANGLING_VAULT_BINDING',
  'REVOKED_CREDENTIAL',
  'INVALID_CREDENTIAL',
  'WORKSPACE_MISMATCH',
  'PURPOSE_MISMATCH',
  'NON_LIVE_PURPOSE',
  'STRATEGY_B_COLLISION',
  'ALREADY_POPULATED',
  'NON_EXCHANGE_NULL',
  'ERROR',
] as const);

export type FivConn04AReasonCode = (typeof FIV_CONN_04_A_REASON_CODES)[number];

/** High-level disposition classes from the approved slice plan. */
export const FIV_CONN_04_A_CLASSES = Object.freeze([
  'ELIGIBLE_LIVE',
  'AMBIGUOUS',
  'DEFECTIVE_BINDING',
  'PURPOSE_MISMATCH',
  'COLLISION',
  'ALREADY_POPULATED',
  'NON_EXCHANGE_NULL',
  'ERROR',
] as const);

export type FivConn04AClassificationClass = (typeof FIV_CONN_04_A_CLASSES)[number];

export type FivConn04AVaultMetaInput = Readonly<{
  id: string;
  workspaceId: string;
  purpose: string;
  state: PersistedSecretState | string;
}>;

export type FivConn04AConnectionInput = Readonly<{
  id: string;
  workspaceId: string;
  provider: string;
  connectionType: string;
  environment: string | null;
  vaultSecretId: string | null;
  status: string;
}>;

export type FivConn04ARowResult = Readonly<{
  classification: FivConn04AClassificationClass;
  reasonCode: FivConn04AReasonCode;
  connectionId: string;
  workspaceId: string;
  provider: string;
  connectionType: string;
  currentEnvironment: string | null;
  vaultSecretId: string | null;
  /** Safe metadata only — never secret material. */
  vaultPurpose: string | null;
  vaultState: string | null;
  purposeEnvironmentClass: TradingCredentialEnvironment | null;
  strategyBCollision: boolean;
  collidingConnectionId: string | null;
}>;

export type FivConn04ACounters = Readonly<{
  totalScanned: number;
  exchangeCandidates: number;
  nonExchangeNull: number;
  alreadyPopulated: number;
  eligibleLive: number;
  ambiguous: number;
  defectiveBindings: number;
  purposeMismatch: number;
  nonLivePurpose: number;
  strategyBCollisions: number;
  residualExchangeNull: number;
  errors: number;
}>;

export type FivConn04APreflightReport = Readonly<{
  generatedAt: string;
  rows: readonly FivConn04ARowResult[];
  counters: FivConn04ACounters;
  /** Explicit safety markers for operators / tests. */
  safety: Readonly<{
    databaseWrites: 0;
    vaultMutations: 0;
    credentialMutations: 0;
    externalIo: 0;
    liveBackfillPerformed: false;
  }>;
}>;

const LIVE_PURPOSES: ReadonlySet<string> = new Set([
  SecretPurpose.Trading,
  SecretPurpose.TradingLive,
]);

function classForReason(reason: FivConn04AReasonCode): FivConn04AClassificationClass {
  switch (reason) {
    case 'ELIGIBLE_LIVE':
      return 'ELIGIBLE_LIVE';
    case 'AMBIGUOUS':
      return 'AMBIGUOUS';
    case 'MISSING_VAULT_BINDING':
    case 'DANGLING_VAULT_BINDING':
    case 'REVOKED_CREDENTIAL':
    case 'INVALID_CREDENTIAL':
    case 'WORKSPACE_MISMATCH':
      return 'DEFECTIVE_BINDING';
    case 'PURPOSE_MISMATCH':
    case 'NON_LIVE_PURPOSE':
      return 'PURPOSE_MISMATCH';
    case 'STRATEGY_B_COLLISION':
      return 'COLLISION';
    case 'ALREADY_POPULATED':
      return 'ALREADY_POPULATED';
    case 'NON_EXCHANGE_NULL':
      return 'NON_EXCHANGE_NULL';
    case 'ERROR':
    default:
      return 'ERROR';
  }
}

function rowResult(
  connection: FivConn04AConnectionInput,
  reasonCode: FivConn04AReasonCode,
  extras: {
    vaultPurpose?: string | null;
    vaultState?: string | null;
    purposeEnvironmentClass?: TradingCredentialEnvironment | null;
    strategyBCollision?: boolean;
    collidingConnectionId?: string | null;
  } = {},
): FivConn04ARowResult {
  return Object.freeze({
    classification: classForReason(reasonCode),
    reasonCode,
    connectionId: connection.id,
    workspaceId: connection.workspaceId,
    provider: connection.provider,
    connectionType: connection.connectionType,
    currentEnvironment: connection.environment,
    vaultSecretId: connection.vaultSecretId,
    vaultPurpose: extras.vaultPurpose ?? null,
    vaultState: extras.vaultState ?? null,
    purposeEnvironmentClass: extras.purposeEnvironmentClass ?? null,
    strategyBCollision: extras.strategyBCollision ?? false,
    collidingConnectionId: extras.collidingConnectionId ?? null,
  });
}

/**
 * Classify one Connection for FIV-CONN-04-A.
 *
 * @param vaultMeta Exact Vault metadata for `connection.vaultSecretId` in the
 *   same workspace, or null when missing/dangling. Must not be a sibling lookup.
 * @param liveSlotOccupantId When projecting `environment = live`, id of another
 *   credentialed non-revoked EXCHANGE already occupying Strategy B live slot,
 *   or null when free.
 */
export function classifyFivConn04AConnection(
  connection: FivConn04AConnectionInput,
  vaultMeta: FivConn04AVaultMetaInput | null,
  liveSlotOccupantId: string | null,
): FivConn04ARowResult {
  if (connection.connectionType !== 'EXCHANGE') {
    if (connection.environment === null) {
      return rowResult(connection, 'NON_EXCHANGE_NULL');
    }
    return rowResult(connection, 'ALREADY_POPULATED');
  }

  if (connection.environment !== null) {
    return rowResult(connection, 'ALREADY_POPULATED');
  }

  // EXCHANGE + environment IS NULL from here — backfill candidate population.

  if (connection.status === 'REVOKED') {
    return rowResult(connection, 'REVOKED_CREDENTIAL', {
      vaultPurpose: vaultMeta?.purpose ?? null,
      vaultState: vaultMeta?.state ?? null,
    });
  }

  const vaultSecretId = connection.vaultSecretId?.trim() ?? '';
  if (vaultSecretId.length === 0) {
    // Metadata-only EXCHANGE — insufficient Vault proof (D-CONN-04-01 = A).
    return rowResult(connection, 'AMBIGUOUS');
  }

  if (vaultMeta === null) {
    return rowResult(connection, 'DANGLING_VAULT_BINDING');
  }

  // Exact-id binding: caller must supply meta for this vaultSecretId only.
  if (vaultMeta.id !== vaultSecretId) {
    return rowResult(connection, 'DANGLING_VAULT_BINDING', {
      vaultPurpose: vaultMeta.purpose,
      vaultState: vaultMeta.state,
    });
  }

  if (vaultMeta.workspaceId !== connection.workspaceId) {
    return rowResult(connection, 'WORKSPACE_MISMATCH', {
      vaultPurpose: vaultMeta.purpose,
      vaultState: vaultMeta.state,
    });
  }

  if (vaultMeta.state === SecretState.Revoked) {
    return rowResult(connection, 'REVOKED_CREDENTIAL', {
      vaultPurpose: vaultMeta.purpose,
      vaultState: vaultMeta.state,
    });
  }

  if (vaultMeta.state !== SecretState.Connected) {
    return rowResult(connection, 'INVALID_CREDENTIAL', {
      vaultPurpose: vaultMeta.purpose,
      vaultState: vaultMeta.state,
    });
  }

  if (!isSecretPurpose(vaultMeta.purpose)) {
    return rowResult(connection, 'INVALID_CREDENTIAL', {
      vaultPurpose: vaultMeta.purpose,
      vaultState: vaultMeta.state,
    });
  }

  const purpose = vaultMeta.purpose as SecretPurposeType;
  const envFromPurpose = tradingEnvironmentFromPurpose(purpose);

  if (envFromPurpose === null) {
    return rowResult(connection, 'INVALID_CREDENTIAL', {
      vaultPurpose: purpose,
      vaultState: vaultMeta.state,
      purposeEnvironmentClass: null,
    });
  }

  if (envFromPurpose === 'demo') {
    return rowResult(connection, 'NON_LIVE_PURPOSE', {
      vaultPurpose: purpose,
      vaultState: vaultMeta.state,
      purposeEnvironmentClass: envFromPurpose,
    });
  }

  if (envFromPurpose === 'testnet') {
    return rowResult(connection, 'NON_LIVE_PURPOSE', {
      vaultPurpose: purpose,
      vaultState: vaultMeta.state,
      purposeEnvironmentClass: envFromPurpose,
    });
  }

  if (envFromPurpose !== 'live' || !LIVE_PURPOSES.has(purpose)) {
    return rowResult(connection, 'PURPOSE_MISMATCH', {
      vaultPurpose: purpose,
      vaultState: vaultMeta.state,
      purposeEnvironmentClass: envFromPurpose,
    });
  }

  // LIVE-class purpose only (Trading / TradingLive).
  if (liveSlotOccupantId !== null && liveSlotOccupantId !== connection.id) {
    return rowResult(connection, 'STRATEGY_B_COLLISION', {
      vaultPurpose: purpose,
      vaultState: vaultMeta.state,
      purposeEnvironmentClass: 'live',
      strategyBCollision: true,
      collidingConnectionId: liveSlotOccupantId,
    });
  }

  return rowResult(connection, 'ELIGIBLE_LIVE', {
    vaultPurpose: purpose,
    vaultState: vaultMeta.state,
    purposeEnvironmentClass: 'live',
    strategyBCollision: false,
  });
}

export function aggregateFivConn04ACounters(
  rows: readonly FivConn04ARowResult[],
): FivConn04ACounters {
  let exchangeCandidates = 0;
  let nonExchangeNull = 0;
  let alreadyPopulated = 0;
  let eligibleLive = 0;
  let ambiguous = 0;
  let defectiveBindings = 0;
  let purposeMismatch = 0;
  let nonLivePurpose = 0;
  let strategyBCollisions = 0;
  let residualExchangeNull = 0;
  let errors = 0;

  for (const row of rows) {
    const isExchangeNull =
      row.connectionType === 'EXCHANGE' && row.currentEnvironment === null;

    if (isExchangeNull) {
      exchangeCandidates += 1;
      if (row.reasonCode !== 'ELIGIBLE_LIVE') {
        residualExchangeNull += 1;
      }
    }

    switch (row.reasonCode) {
      case 'NON_EXCHANGE_NULL':
        nonExchangeNull += 1;
        break;
      case 'ALREADY_POPULATED':
        alreadyPopulated += 1;
        break;
      case 'ELIGIBLE_LIVE':
        eligibleLive += 1;
        break;
      case 'AMBIGUOUS':
        ambiguous += 1;
        break;
      case 'MISSING_VAULT_BINDING':
      case 'DANGLING_VAULT_BINDING':
      case 'REVOKED_CREDENTIAL':
      case 'INVALID_CREDENTIAL':
      case 'WORKSPACE_MISMATCH':
        defectiveBindings += 1;
        break;
      case 'PURPOSE_MISMATCH':
        purposeMismatch += 1;
        break;
      case 'NON_LIVE_PURPOSE':
        nonLivePurpose += 1;
        break;
      case 'STRATEGY_B_COLLISION':
        strategyBCollisions += 1;
        break;
      case 'ERROR':
        errors += 1;
        break;
      default:
        break;
    }
  }

  return Object.freeze({
    totalScanned: rows.length,
    exchangeCandidates,
    nonExchangeNull,
    alreadyPopulated,
    eligibleLive,
    ambiguous,
    defectiveBindings,
    purposeMismatch,
    nonLivePurpose,
    strategyBCollisions,
    residualExchangeNull,
    errors,
  });
}

export function buildFivConn04APreflightReport(
  rows: readonly FivConn04ARowResult[],
  generatedAt: string = new Date().toISOString(),
): FivConn04APreflightReport {
  const sorted = [...rows].sort((a, b) => {
    const ws = a.workspaceId.localeCompare(b.workspaceId);
    if (ws !== 0) return ws;
    const provider = a.provider.localeCompare(b.provider);
    if (provider !== 0) return provider;
    return a.connectionId.localeCompare(b.connectionId);
  });
  return Object.freeze({
    generatedAt,
    rows: Object.freeze(sorted),
    counters: aggregateFivConn04ACounters(sorted),
    safety: Object.freeze({
      databaseWrites: 0 as const,
      vaultMutations: 0 as const,
      credentialMutations: 0 as const,
      externalIo: 0 as const,
      liveBackfillPerformed: false as const,
    }),
  });
}

/** True when purpose is an allowed LIVE-class Vault purpose for CONN-04. */
export function isFivConn04ALivePurpose(purpose: string): boolean {
  return LIVE_PURPOSES.has(purpose);
}
