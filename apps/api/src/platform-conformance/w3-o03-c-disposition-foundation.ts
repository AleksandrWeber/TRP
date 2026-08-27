/**
 * W3-O03-c — Product Owner Disposition Foundation (ADL-008).
 *
 * Establishes the canonical governance mechanism that allows ONLY the
 * Product Owner to record ADL-008 disposition (ACCEPTED or DEFERRED).
 *
 * This slice does NOT decide the disposition.
 * This slice does NOT declare ADL-008 ACCEPTED.
 * This slice does NOT declare Production Restart Safe.
 *
 * Internal governance only — no REST, no operator UI, no Administration page.
 */

import {
  W3_O03_B_EVIDENCE_REGISTRY,
  synchronizeEvidenceChain,
  type W3O03BSyncResult,
} from './w3-o03-b-evidence-chain-sync';

export const W3_O03_C_SLICE_ID = 'W3-O03-c' as const;

/** Exactly two dispositions — no third / hidden / implicit state. */
export const W3_O03_C_DISPOSITION_DECISIONS = Object.freeze(['ACCEPTED', 'DEFERRED'] as const);

export type W3O03CDispositionDecision = (typeof W3_O03_C_DISPOSITION_DECISIONS)[number];

/**
 * Governance authority for disposition recording.
 * Product Owner is package governance vocabulary — not a new identity Role
 * and not a new security owner. Reuses Authentication / Authorization /
 * Workspace Isolation / Security Audit conceptually for any future wire-up.
 */
export const W3_O03_C_ACTOR_AUTHORITIES = Object.freeze(['product-owner', 'engineering'] as const);

export type W3O03CActorAuthority = (typeof W3_O03_C_ACTOR_AUTHORITIES)[number];

export type W3O03CDispositionRecord = Readonly<{
  recordId: string;
  timestampIso: string;
  productOwnerIdentity: string;
  evidenceVersion: string;
  decision: W3O03CDispositionDecision;
  /** Mandatory non-empty when decision === DEFERRED; null when ACCEPTED. */
  writtenLimitation: string | null;
  evidenceReference: string;
  actorAuthority: 'product-owner';
  supersedesRecordId: string | null;
}>;

export type W3O03CDispositionRequest = Readonly<{
  actorAuthority: W3O03CActorAuthority;
  productOwnerIdentity: string;
  decision: W3O03CDispositionDecision;
  writtenLimitation?: string | null;
  timestampIso?: string;
}>;

export type W3O03CRecordFailureKind =
  | 'engineering-forbidden'
  | 'unknown-actor'
  | 'invalid-decision'
  | 'missing-product-owner-identity'
  | 'accepted-requires-synchronized-evidence'
  | 'deferred-requires-written-limitation'
  | 'accepted-forbids-written-limitation'
  | 'history-rewrite-forbidden';

export type W3O03CRecordResult =
  | Readonly<{ ok: true; record: W3O03CDispositionRecord }>
  | Readonly<{
      ok: false;
      failure: W3O03CRecordFailureKind;
      detail: string;
    }>;

export type W3O03CDispositionLedger = Readonly<{
  /** Append-only history — newest last. Never mutated in place. */
  history: readonly W3O03CDispositionRecord[];
}>;

/** Security Audit event type reused conceptually — no new audit owner. */
export const W3_O03_C_SECURITY_AUDIT_EVENT = 'adl008.product-owner.disposition.recorded' as const;

export const W3_O03_C_REUSED_SECURITY = Object.freeze([
  'Authentication',
  'Authorization',
  'Workspace Isolation',
  'Security Audit',
] as const);

export const W3_O03_C_BINDING_FINDINGS = Object.freeze({
  dispositionFoundationReady: true,
  dispositionRecordedByThisSlice: false,
  adl008Accepted: false,
  adl008DeferredWithLimitation: false,
  productionRestartSafeClaimed: false,
  engineeringMayCreateAccepted: false,
  productOwnerMayCreateAccepted: true,
  acceptedRequiresSynchronizedEvidence: true,
  deferredRequiresWrittenLimitation: true,
  governanceRecordImmutable: true,
  governanceHistoryRewriteForbidden: true,
  productOwnerDispositionStillRequired: true,
  customerVisibleFunctionality: false,
  businessContinuity: false,
  highAvailability: false,
  disasterRecovery: false,
  liveTrading: false,
  wave3Complete: false,
  w3O03Closed: false,
} as const);

export const W3_O03_C_EXPLICIT_OUT = Object.freeze([
  'adl-008-accepted-declaration',
  'production-restart-safe-pass',
  'w3-o03-closed',
  'wave-3-complete',
  'recovery-implementation',
  'us290-us294-redesign',
  'monitoring',
  'business-continuity',
  'high-availability',
  'disaster-recovery',
  'kill-switch',
  'live-trading',
  'operator-ui',
  'rest-endpoint',
  'administration-page',
  'new-persistence',
  'new-bounded-context',
  'new-owner',
  'second-source-of-truth',
  'security-redesign',
  'version-2-modification',
  'master-plan-modification',
  'w3-o03-d',
  'w3-o03-e',
] as const);

export const W3_O03_C_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  newEventStore: false,
  newKnowledgeLake: false,
  newProjectionStore: false,
  newLedger: false,
  newOutbox: false,
  newInbox: false,
  newRecoveryDomain: false,
  ownershipBoundariesChanged: false,
  masterPlanModified: false,
  version2Redesigned: false,
  wave1Modified: false,
  wave2Modified: false,
  w3O01Redesigned: false,
  w3O02Redesigned: false,
  us290ToUs294Redesigned: false,
  adl008Accepted: false,
  productionRestartSafeClaimed: false,
  customerVisibleStanceFeature: false,
  businessContinuityClaimed: false,
  highAvailabilityClaimed: false,
  disasterRecoveryClaimed: false,
  killSwitchCompleteClaimed: false,
  monitoringCompleteClaimed: false,
  liveTradingClaimed: false,
  wave3CompleteClaimed: false,
  restEndpointIntroduced: false,
  operatorUiIntroduced: false,
  dispositionFoundationIntroduced: true,
  dispositionDecidedByThisSlice: false,
} as const);

export const W3_O03_C_REQUIRED_REPORTS = Object.freeze([
  'w3-o03-c-implementation-report.md',
  'w3-o03-c-architecture-review.md',
  'w3-o03-c-security-review.md',
  'w3-o03-c-product-review.md',
  'w3-o03-c-validation-report.md',
] as const);

/**
 * Deterministic evidence version for disposition binding.
 * Derived from the synchronized W3-O03-b evidence registry ids + paths.
 */
export function computeEvidenceVersion(
  sync: W3O03BSyncResult = synchronizeEvidenceChain(),
): string {
  const fingerprint = W3_O03_B_EVIDENCE_REGISTRY.map((row) => `${row.id}@${row.evidencePath}`).join(
    '|',
  );
  const syncTag = sync.synchronized ? 'SYNCED' : 'UNSYNCED';
  return `w3-o03-b:${syncTag}:${W3_O03_B_EVIDENCE_REGISTRY.length}:${hashString(fingerprint)}`;
}

function hashString(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function createDispositionLedger(
  history: readonly W3O03CDispositionRecord[] = [],
): W3O03CDispositionLedger {
  return Object.freeze({
    history: Object.freeze([...history]),
  });
}

export function currentDisposition(
  ledger: W3O03CDispositionLedger,
): W3O03CDispositionRecord | null {
  if (ledger.history.length === 0) {
    return null;
  }
  return ledger.history[ledger.history.length - 1] ?? null;
}

function isNonEmptyLimitation(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Record a Product Owner disposition.
 * Engineering cannot create ACCEPTED (or any disposition).
 * ACCEPTED requires synchronized evidence.
 * DEFERRED requires an explicit non-empty written live-claim limitation.
 * Records are immutable; a change appends a NEW record and preserves history.
 */
export function recordProductOwnerDisposition(
  ledger: W3O03CDispositionLedger,
  request: W3O03CDispositionRequest,
  options: Readonly<{
    sync?: W3O03BSyncResult;
    nowIso?: string;
  }> = {},
): Readonly<{
  result: W3O03CRecordResult;
  ledger: W3O03CDispositionLedger;
}> {
  if (!(W3_O03_C_ACTOR_AUTHORITIES as readonly string[]).includes(request.actorAuthority)) {
    return {
      result: Object.freeze({
        ok: false,
        failure: 'unknown-actor',
        detail: `Unknown actor authority: ${String(request.actorAuthority)}`,
      }),
      ledger,
    };
  }

  if (request.actorAuthority === 'engineering') {
    return {
      result: Object.freeze({
        ok: false,
        failure: 'engineering-forbidden',
        detail:
          'Engineering must never create ACCEPTED, change disposition, fabricate Product Owner decisions, or fabricate written limitations',
      }),
      ledger,
    };
  }

  if (!(W3_O03_C_DISPOSITION_DECISIONS as readonly string[]).includes(request.decision)) {
    return {
      result: Object.freeze({
        ok: false,
        failure: 'invalid-decision',
        detail: `Decision must be ACCEPTED or DEFERRED — no third/hidden/implicit state (got ${String(request.decision)})`,
      }),
      ledger,
    };
  }

  if (
    typeof request.productOwnerIdentity !== 'string' ||
    request.productOwnerIdentity.trim().length === 0
  ) {
    return {
      result: Object.freeze({
        ok: false,
        failure: 'missing-product-owner-identity',
        detail: 'Product Owner identity is required on every disposition record',
      }),
      ledger,
    };
  }

  const sync = options.sync ?? synchronizeEvidenceChain();
  const evidenceVersion = computeEvidenceVersion(sync);
  const evidenceReference = 'apps/api/src/platform-conformance/w3-o03-b-evidence-chain-sync.ts';

  if (request.decision === 'ACCEPTED') {
    if (!sync.synchronized || sync.missingEvidenceDetected || !sync.ok) {
      return {
        result: Object.freeze({
          ok: false,
          failure: 'accepted-requires-synchronized-evidence',
          detail:
            'ACCEPTED is allowed only when required evidence exists and the evidence chain is synchronized',
        }),
        ledger,
      };
    }
    if (isNonEmptyLimitation(request.writtenLimitation ?? null)) {
      return {
        result: Object.freeze({
          ok: false,
          failure: 'accepted-forbids-written-limitation',
          detail:
            'ACCEPTED must not carry a live-claim limitation; use DEFERRED when limiting claims',
        }),
        ledger,
      };
    }
  }

  if (request.decision === 'DEFERRED') {
    if (!isNonEmptyLimitation(request.writtenLimitation)) {
      return {
        result: Object.freeze({
          ok: false,
          failure: 'deferred-requires-written-limitation',
          detail:
            'DEFERRED requires an explicit non-empty written live-claim limitation; empty limitation is forbidden',
        }),
        ledger,
      };
    }
  }

  const previous = currentDisposition(ledger);
  const timestampIso = request.timestampIso ?? options.nowIso ?? new Date().toISOString();
  const recordId = `adl008-disposition-${ledger.history.length + 1}-${hashString(
    `${timestampIso}|${request.productOwnerIdentity}|${request.decision}|${evidenceVersion}`,
  )}`;

  const record: W3O03CDispositionRecord = Object.freeze({
    recordId,
    timestampIso,
    productOwnerIdentity: request.productOwnerIdentity.trim(),
    evidenceVersion,
    decision: request.decision,
    writtenLimitation:
      request.decision === 'DEFERRED' ? (request.writtenLimitation as string).trim() : null,
    evidenceReference,
    actorAuthority: 'product-owner',
    supersedesRecordId: previous?.recordId ?? null,
  });

  const nextLedger = createDispositionLedger([...ledger.history, record]);
  return {
    result: Object.freeze({ ok: true, record }),
    ledger: nextLedger,
  };
}

/**
 * Attempt to mutate / rewrite an existing record — always forbidden.
 * Changing disposition must create a NEW record via recordProductOwnerDisposition.
 */
export function attemptRewriteDispositionHistory(
  _ledger: W3O03CDispositionLedger,
  _recordId: string,
  _patch: Partial<W3O03CDispositionRecord>,
): W3O03CRecordResult {
  return Object.freeze({
    ok: false,
    failure: 'history-rewrite-forbidden',
    detail:
      'Disposition records are immutable; changing disposition creates a NEW record and previous records remain preserved',
  });
}

export function engineeringMayCreateAccepted(): false {
  return false;
}

export function productOwnerMayCreateAccepted(): true {
  return true;
}

/**
 * Internal diagnostics only — no REST / UI surface.
 */
export function buildDispositionFoundationDiagnostics(
  ledger: W3O03CDispositionLedger = createDispositionLedger(),
  sync: W3O03BSyncResult = synchronizeEvidenceChain(),
): Readonly<{
  sliceId: typeof W3_O03_C_SLICE_ID;
  foundationReady: true;
  dispositionRecorded: boolean;
  currentDecision: W3O03CDispositionDecision | null;
  historyLength: number;
  evidenceVersion: string;
  evidenceSynchronized: boolean;
  engineeringMayCreateAccepted: false;
  productOwnerMayCreateAccepted: true;
  adl008AcceptedByPackage: false;
  securityAuditEvent: typeof W3_O03_C_SECURITY_AUDIT_EVENT;
  reusedSecurity: typeof W3_O03_C_REUSED_SECURITY;
  architectureClaims: typeof W3_O03_C_ARCHITECTURE_CLAIMS;
}> {
  const current = currentDisposition(ledger);
  return Object.freeze({
    sliceId: W3_O03_C_SLICE_ID,
    foundationReady: true,
    dispositionRecorded: current !== null,
    currentDecision: current?.decision ?? null,
    historyLength: ledger.history.length,
    evidenceVersion: computeEvidenceVersion(sync),
    evidenceSynchronized: sync.synchronized,
    engineeringMayCreateAccepted: false,
    productOwnerMayCreateAccepted: true,
    adl008AcceptedByPackage: false,
    securityAuditEvent: W3_O03_C_SECURITY_AUDIT_EVENT,
    reusedSecurity: W3_O03_C_REUSED_SECURITY,
    architectureClaims: W3_O03_C_ARCHITECTURE_CLAIMS,
  });
}
