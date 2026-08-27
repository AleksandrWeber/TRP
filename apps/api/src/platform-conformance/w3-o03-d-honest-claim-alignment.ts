/**
 * W3-O03-d — Honest Claim Alignment for Production Restart Safety.
 *
 * Ensures every restart-safety claim is derived exclusively from the
 * canonical Product Owner disposition (W3-O03-c). No component may
 * independently claim Production Restart Safe.
 *
 * This slice does NOT declare ADL-008 ACCEPTED.
 * This slice does NOT declare Production Restart Safe by itself.
 *
 * Internal governance only — no REST, no operator UI, no Administration page.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { W3_O03_A_RECOVERY_RESIDUAL_INVENTORY } from './w3-o03-a-recovery-residual-inventory';
import {
  W3_O03_C_DISPOSITION_DECISIONS,
  createDispositionLedger,
  currentDisposition,
  type W3O03CDispositionDecision,
  type W3O03CDispositionLedger,
} from './w3-o03-c-disposition-foundation';

export const W3_O03_D_SLICE_ID = 'W3-O03-d' as const;

const REPO_ROOT = join(__dirname, '../../../..');

export const W3_O03_D_CLAIM_SURFACE_KINDS = Object.freeze([
  'documentation',
  'validation-report',
  'overview',
  'operational-report',
  'runtime',
] as const);

export type W3O03DClaimSurfaceKind = (typeof W3_O03_D_CLAIM_SURFACE_KINDS)[number];

export type W3O03DClaimSurface = Readonly<{
  surfaceId: string;
  kind: W3O03DClaimSurfaceKind;
  evidencePath: string;
  inventorySurfaceId: string | null;
}>;

/** Default limitation when no Product Owner disposition is recorded yet. */
export const W3_O03_D_DEFAULT_WRITTEN_LIMITATION = Object.freeze(
  'Production restart-safe PASS is not authorized until Product Owner records ADL-008 disposition (ACCEPTED or DEFERRED with explicit written live-claim limitation).',
);

export type W3O03DClaimPosture = Readonly<
  | {
      source: 'ACCEPTED';
      productionRestartSafeMayBePresented: true;
      writtenLimitation: null;
      dispositionRecordId: string;
    }
  | {
      source: 'DEFERRED';
      productionRestartSafeMayBePresented: false;
      writtenLimitation: string;
      dispositionRecordId: string;
    }
  | {
      source: 'NO_DISPOSITION';
      productionRestartSafeMayBePresented: false;
      writtenLimitation: string;
      dispositionRecordId: null;
    }
>;

export type W3O03DAlignedClaim = Readonly<{
  productionRestartSafeClaim: boolean;
  writtenLimitation: string | null;
  dispositionSource: W3O03DClaimPosture['source'];
  derivedFromProductOwnerDisposition: boolean;
}>;

export type W3O03DClaimFindingKind =
  | 'unauthorized-restart-safe-claim'
  | 'missing-written-limitation'
  | 'contradicts-disposition'
  | 'engineering-bypass'
  | 'optimistic-wording'
  | 'independent-claim-without-disposition'
  | 'surface-unreadable';

export type W3O03DClaimFinding = Readonly<{
  kind: W3O03DClaimFindingKind;
  surfaceId: string;
  detail: string;
}>;

export type W3O03DAlignmentResult = Readonly<{
  ok: boolean;
  posture: W3O03DClaimPosture;
  findings: readonly W3O03DClaimFinding[];
  surfacesChecked: number;
  aligned: boolean;
}>;

/**
 * Registered claim surfaces that must stay consistent with disposition.
 * Bound to W3-O03-a inventory rows assigned to W3-O03-d plus package reports.
 */
export const W3_O03_D_CLAIM_SURFACES: readonly W3O03DClaimSurface[] = Object.freeze([
  ...W3_O03_A_RECOVERY_RESIDUAL_INVENTORY.filter(
    (row) => row.futureW3O03Responsibility === 'W3-O03-d',
  ).map((row) =>
    Object.freeze({
      surfaceId: row.surfaceId,
      kind: surfaceKindForInventoryRow(row.surfaceId),
      evidencePath: row.evidencePath,
      inventorySurfaceId: row.surfaceId,
    }),
  ),
  Object.freeze({
    surfaceId: 'doc-w3-o03-validation-plan',
    kind: 'documentation' as const,
    evidencePath: 'docs/project/version-3/wave-3/w3-o03-validation-plan.md',
    inventorySurfaceId: null,
  }),
  Object.freeze({
    surfaceId: 'validation-w3-o03-a',
    kind: 'validation-report' as const,
    evidencePath: 'docs/project/version-3/wave-3/w3-o03-a-validation-report.md',
    inventorySurfaceId: null,
  }),
  Object.freeze({
    surfaceId: 'validation-w3-o03-b',
    kind: 'validation-report' as const,
    evidencePath: 'docs/project/version-3/wave-3/w3-o03-b-validation-report.md',
    inventorySurfaceId: null,
  }),
  Object.freeze({
    surfaceId: 'validation-w3-o03-c',
    kind: 'validation-report' as const,
    evidencePath: 'docs/project/version-3/wave-3/w3-o03-c-validation-report.md',
    inventorySurfaceId: null,
  }),
  Object.freeze({
    surfaceId: 'operational-wave-3-progress',
    kind: 'operational-report' as const,
    evidencePath: 'docs/project/version-3/wave-3/wave-3-progress.md',
    inventorySurfaceId: null,
  }),
  Object.freeze({
    surfaceId: 'runtime-operational-readiness',
    kind: 'runtime' as const,
    evidencePath: 'apps/api/src/modules/operational-continuity/operational-readiness.ts',
    inventorySurfaceId: null,
  }),
  Object.freeze({
    surfaceId: 'runtime-operational-continuity-service',
    kind: 'runtime' as const,
    evidencePath: 'apps/api/src/modules/operational-continuity/operational-continuity.service.ts',
    inventorySurfaceId: null,
  }),
]);

export const W3_O03_D_BINDING_FINDINGS = Object.freeze({
  claimAlignmentReady: true,
  productionRestartSafeClaimedBySlice: false,
  adl008Accepted: false,
  claimsDerivedFromDispositionOnly: true,
  engineeringMayBypassDisposition: false,
  documentationMayContradictDisposition: false,
  runtimeMayContradictDisposition: false,
  validationMayContradictDisposition: false,
  customerVisibleFunctionality: false,
  businessContinuity: false,
  highAvailability: false,
  disasterRecovery: false,
  liveTrading: false,
  wave3Complete: false,
  w3O03Closed: false,
} as const);

export const W3_O03_D_EXPLICIT_OUT = Object.freeze([
  'adl-008-accepted-declaration',
  'production-restart-safe-pass-by-slice',
  'w3-o03-closed',
  'wave-3-complete',
  'recovery-implementation',
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
  'governance-decision',
  'w3-o03-e',
] as const);

export const W3_O03_D_ARCHITECTURE_CLAIMS = Object.freeze({
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
  honestClaimAlignmentIntroduced: true,
} as const);

export const W3_O03_D_REQUIRED_REPORTS = Object.freeze([
  'w3-o03-d-implementation-report.md',
  'w3-o03-d-architecture-review.md',
  'w3-o03-d-security-review.md',
  'w3-o03-d-product-review.md',
  'w3-o03-d-validation-report.md',
] as const);

const UNAUTHORIZED_POSITIVE_PATTERNS: readonly Readonly<{
  test: (line: string) => boolean;
}>[] = Object.freeze([
  Object.freeze({
    test: (line: string) =>
      /\bproduction restart[- ]safe\b/i.test(line) &&
      /\b(?:complete|authorized|pass|enabled)\b/i.test(line) &&
      !lineHasNegation(line) &&
      !/\bnot claimed\b/i.test(line),
  }),
  Object.freeze({
    test: (line: string) =>
      /\bdeclare(?:s|d)?\b[^.\n]{0,40}\bproduction restart[- ]safe\b/i.test(line) &&
      !lineHasNegation(line),
  }),
  Object.freeze({
    test: (line: string) =>
      /\bproduction restart[- ]safe\b[^.\n]{0,20}\bis authorized\b/i.test(line) &&
      !lineHasNegation(line),
  }),
  Object.freeze({
    test: (line: string) => /\brestart[- ]safe complete\b/i.test(line) && !lineHasNegation(line),
  }),
  Object.freeze({
    test: (line: string) => isUnauthorizedAdl008AcceptedClaim(line),
  }),
]);

function isUnauthorizedAdl008AcceptedClaim(line: string): boolean {
  if (!/\badl-008\b/i.test(line) || !/\baccepted\b/i.test(line)) {
    return false;
  }
  if (lineHasNegation(line)) {
    return false;
  }
  const lower = line.toLowerCase();
  if (/accepted or explicit/.test(lower)) {
    return false;
  }
  if (/or accepted/.test(lower) && /deferred/.test(lower)) {
    return false;
  }
  if (/disposition foundation/.test(lower)) {
    return false;
  }
  if (/mechanism only/.test(lower)) {
    return false;
  }
  if (/cannot accept/.test(lower)) {
    return false;
  }
  if (/may create accepted/.test(lower)) {
    return false;
  }
  if (/product owner/.test(lower) && /can/.test(lower)) {
    return false;
  }
  if (/engineering/.test(lower) && /cannot/.test(lower)) {
    return false;
  }
  if (/\*\*complete\*\*/.test(lower) && /disposition/.test(lower)) {
    return false;
  }
  if (/remains \*\*deferred\*\*/.test(lower)) {
    return false;
  }
  if (/not accepted/.test(lower)) {
    return false;
  }
  return /\badl-008\b[^.\n]{0,30}\b(?:is|remains|declared|recorded as)\s+\*?\*?accepted\b/i.test(
    line,
  );
}

const NEGATION_MARKERS = Object.freeze([
  'not ',
  'must not',
  'does not',
  'do not',
  'never',
  'forbidden',
  'not claimed',
  'cannot',
  "can't",
  '≠',
  'without',
  'until',
  'no ',
  'none.',
  'none ',
]);

function surfaceKindForInventoryRow(surfaceId: string): W3O03DClaimSurfaceKind {
  if (surfaceId.includes('overview')) {
    return 'overview';
  }
  if (surfaceId.includes('matrix')) {
    return 'operational-report';
  }
  return 'documentation';
}

function lineHasNegation(line: string): boolean {
  const lower = line.toLowerCase();
  if (NEGATION_MARKERS.some((marker) => lower.includes(marker))) {
    return true;
  }
  if (/\*\*not\*\*/.test(lower) || /\bnot claim\b/.test(lower)) {
    return true;
  }
  if (/customer never sees/i.test(lower)) {
    return true;
  }
  if (/^-\s*silent/i.test(line.trim())) {
    return true;
  }
  if (/while adl-008 was deferred/i.test(lower)) {
    return true;
  }
  return false;
}

/**
 * Derive allowed claim posture exclusively from canonical Product Owner disposition.
 */
export function deriveClaimPosture(
  ledger: W3O03CDispositionLedger = createDispositionLedger(),
): W3O03DClaimPosture {
  const disposition = currentDisposition(ledger);
  if (!disposition) {
    return Object.freeze({
      source: 'NO_DISPOSITION',
      productionRestartSafeMayBePresented: false,
      writtenLimitation: W3_O03_D_DEFAULT_WRITTEN_LIMITATION,
      dispositionRecordId: null,
    });
  }
  if (disposition.decision === 'ACCEPTED') {
    return Object.freeze({
      source: 'ACCEPTED',
      productionRestartSafeMayBePresented: true,
      writtenLimitation: null,
      dispositionRecordId: disposition.recordId,
    });
  }
  return Object.freeze({
    source: 'DEFERRED',
    productionRestartSafeMayBePresented: false,
    writtenLimitation: disposition.writtenLimitation ?? W3_O03_D_DEFAULT_WRITTEN_LIMITATION,
    dispositionRecordId: disposition.recordId,
  });
}

/**
 * Single derivation path for restart-safety presentation — no independent claims.
 */
export function deriveAlignedRestartSafetyClaim(
  ledger: W3O03CDispositionLedger = createDispositionLedger(),
): W3O03DAlignedClaim {
  const posture = deriveClaimPosture(ledger);
  if (posture.source === 'ACCEPTED') {
    return Object.freeze({
      productionRestartSafeClaim: true,
      writtenLimitation: null,
      dispositionSource: 'ACCEPTED',
      derivedFromProductOwnerDisposition: true,
    });
  }
  return Object.freeze({
    productionRestartSafeClaim: false,
    writtenLimitation: posture.writtenLimitation,
    dispositionSource: posture.source,
    derivedFromProductOwnerDisposition: true,
  });
}

export function productionRestartSafeMayBeClaimedWithoutDisposition(): false {
  return false;
}

/**
 * Engineering must never bypass Product Owner disposition to present claims.
 */
export function attemptEngineeringClaimPresentation(
  actorAuthority: 'engineering' | 'product-owner',
  claim: W3O03DAlignedClaim,
  ledger: W3O03CDispositionLedger = createDispositionLedger(),
): Readonly<{ ok: boolean; failure?: W3O03DClaimFindingKind; detail: string }> {
  if (actorAuthority === 'engineering' && claim.productionRestartSafeClaim) {
    return Object.freeze({
      ok: false,
      failure: 'engineering-bypass',
      detail:
        'Engineering must never bypass Product Owner disposition to present Production Restart Safe',
    });
  }
  const posture = deriveClaimPosture(ledger);
  if (claim.productionRestartSafeClaim && !posture.productionRestartSafeMayBePresented) {
    return Object.freeze({
      ok: false,
      failure: 'independent-claim-without-disposition',
      detail:
        'Production Restart Safe cannot be claimed without Product Owner ACCEPTED disposition',
    });
  }
  if (
    !claim.productionRestartSafeClaim &&
    posture.source !== 'ACCEPTED' &&
    (!claim.writtenLimitation || claim.writtenLimitation.trim().length === 0)
  ) {
    return Object.freeze({
      ok: false,
      failure: 'missing-written-limitation',
      detail: 'DEFERRED or undecided disposition requires explicit written live-claim limitation',
    });
  }
  return Object.freeze({ ok: true, detail: 'Claim presentation aligned' });
}

function detectUnauthorizedPositiveClaims(
  content: string,
  surfaceId: string,
): W3O03DClaimFinding[] {
  const findings: W3O03DClaimFinding[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
    if (lineHasNegation(line)) {
      continue;
    }
    for (const pattern of UNAUTHORIZED_POSITIVE_PATTERNS) {
      if (pattern.test(line)) {
        findings.push(
          Object.freeze({
            kind: 'unauthorized-restart-safe-claim',
            surfaceId,
            detail: `Unauthorized positive restart-safety claim: ${line.trim().slice(0, 120)}`,
          }),
        );
        break;
      }
    }
    if (
      /\boptimistic\b/i.test(line) &&
      /\brestart[- ]safe\b/i.test(line) &&
      !lineHasNegation(line)
    ) {
      findings.push(
        Object.freeze({
          kind: 'optimistic-wording',
          surfaceId,
          detail: `Optimistic restart-safety wording forbidden: ${line.trim().slice(0, 120)}`,
        }),
      );
    }
  }
  return findings;
}

/**
 * Validate a single claim surface file against canonical disposition posture.
 */
export function validateClaimSurfaceContent(
  surface: W3O03DClaimSurface,
  content: string,
  posture: W3O03DClaimPosture = deriveClaimPosture(),
): readonly W3O03DClaimFinding[] {
  const findings: W3O03DClaimFinding[] = [];

  if (!posture.productionRestartSafeMayBePresented) {
    findings.push(...detectUnauthorizedPositiveClaims(content, surface.surfaceId));

    if (
      (surface.kind === 'overview' || surface.kind === 'documentation') &&
      posture.writtenLimitation &&
      !contentIncludesLimitation(content, posture.writtenLimitation)
    ) {
      // Overview must acknowledge limitation posture — check for key honesty phrases
      const hasHonestyAnchor =
        /explicit written live-claim limitation|not authorized|not claimed|remains \*\*DEFERRED\*\*|no disposition recorded/i.test(
          content,
        );
      if (!hasHonestyAnchor && surface.kind === 'overview') {
        findings.push(
          Object.freeze({
            kind: 'missing-written-limitation',
            surfaceId: surface.surfaceId,
            detail:
              'Overview must present explicit limitation or honesty anchor when disposition is not ACCEPTED',
          }),
        );
      }
    }
  } else if (posture.source === 'ACCEPTED') {
    // When ACCEPTED, surfaces must not contradict ACCEPTED with "not authorized" as current state
    if (
      /\badl-008 remains \*\*DEFERRED\*\*/i.test(content) &&
      surface.surfaceId === 'claim-recovery-residual-overview'
    ) {
      findings.push(
        Object.freeze({
          kind: 'contradicts-disposition',
          surfaceId: surface.surfaceId,
          detail: 'Overview contradicts Product Owner ACCEPTED disposition (still states DEFERRED)',
        }),
      );
    }
  }

  return Object.freeze(findings);
}

function contentIncludesLimitation(content: string, limitation: string): boolean {
  if (content.includes(limitation)) {
    return true;
  }
  const keywords = limitation
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 5)
    .slice(0, 6);
  const lower = content.toLowerCase();
  return keywords.filter((w) => lower.includes(w)).length >= 3;
}

/**
 * Align and validate every registered claim surface against disposition.
 */
export function alignHonestClaims(
  ledger: W3O03CDispositionLedger = createDispositionLedger(),
  options: Readonly<{ repoRoot?: string; surfaces?: readonly W3O03DClaimSurface[] }> = {},
): W3O03DAlignmentResult {
  const repoRoot = options.repoRoot ?? REPO_ROOT;
  const surfaces = options.surfaces ?? W3_O03_D_CLAIM_SURFACES;
  const posture = deriveClaimPosture(ledger);
  const findings: W3O03DClaimFinding[] = [];

  for (const surface of surfaces) {
    const path = join(repoRoot, surface.evidencePath);
    let content: string;
    try {
      content = readFileSync(path, 'utf8');
    } catch {
      findings.push(
        Object.freeze({
          kind: 'surface-unreadable',
          surfaceId: surface.surfaceId,
          detail: `Cannot read claim surface: ${surface.evidencePath}`,
        }),
      );
      continue;
    }
    findings.push(...validateClaimSurfaceContent(surface, content, posture));
  }

  const aligned = findings.length === 0;
  return Object.freeze({
    ok: aligned,
    posture,
    findings: Object.freeze(findings),
    surfacesChecked: surfaces.length,
    aligned,
  });
}

/**
 * Validate an explicit restart-safety claim attempt against disposition.
 */
export function validateRestartSafetyClaimAttempt(
  claim: Readonly<{
    productionRestartSafeClaim: boolean;
    writtenLimitation?: string | null;
    actorAuthority: 'engineering' | 'product-owner';
  }>,
  ledger: W3O03CDispositionLedger = createDispositionLedger(),
): Readonly<{ ok: boolean; findings: readonly W3O03DClaimFinding[] }> {
  const aligned = deriveAlignedRestartSafetyClaim(ledger);
  const findings: W3O03DClaimFinding[] = [];

  if (claim.productionRestartSafeClaim && !aligned.productionRestartSafeClaim) {
    findings.push(
      Object.freeze({
        kind: 'independent-claim-without-disposition',
        surfaceId: 'claim-attempt',
        detail:
          'Production Restart Safe cannot be claimed without Product Owner ACCEPTED disposition',
      }),
    );
  }

  if (claim.actorAuthority === 'engineering' && claim.productionRestartSafeClaim) {
    findings.push(
      Object.freeze({
        kind: 'engineering-bypass',
        surfaceId: 'claim-attempt',
        detail: 'Engineering cannot present Production Restart Safe claim',
      }),
    );
  }

  if (
    !claim.productionRestartSafeClaim &&
    deriveClaimPosture(ledger).source !== 'ACCEPTED' &&
    (!claim.writtenLimitation || claim.writtenLimitation.trim().length === 0)
  ) {
    findings.push(
      Object.freeze({
        kind: 'missing-written-limitation',
        surfaceId: 'claim-attempt',
        detail:
          'Explicit written limitation is mandatory when disposition is DEFERRED or not recorded',
      }),
    );
  }

  return Object.freeze({ ok: findings.length === 0, findings: Object.freeze(findings) });
}

/**
 * Internal diagnostics only — no REST / UI surface.
 */
export function buildHonestClaimAlignmentDiagnostics(
  ledger: W3O03CDispositionLedger = createDispositionLedger(),
  alignment: W3O03DAlignmentResult = alignHonestClaims(ledger),
): Readonly<{
  sliceId: typeof W3_O03_D_SLICE_ID;
  posture: W3O03DClaimPosture;
  alignedClaim: W3O03DAlignedClaim;
  alignmentOk: boolean;
  surfacesChecked: number;
  findingCount: number;
  productionRestartSafeClaimedBySlice: false;
  engineeringMayBypassDisposition: false;
  allowedDecisions: typeof W3_O03_C_DISPOSITION_DECISIONS;
  architectureClaims: typeof W3_O03_D_ARCHITECTURE_CLAIMS;
}> {
  return Object.freeze({
    sliceId: W3_O03_D_SLICE_ID,
    posture: alignment.posture,
    alignedClaim: deriveAlignedRestartSafetyClaim(ledger),
    alignmentOk: alignment.ok,
    surfacesChecked: alignment.surfacesChecked,
    findingCount: alignment.findings.length,
    productionRestartSafeClaimedBySlice: false,
    engineeringMayBypassDisposition: false,
    allowedDecisions: W3_O03_C_DISPOSITION_DECISIONS,
    architectureClaims: W3_O03_D_ARCHITECTURE_CLAIMS,
  });
}

export function claimSurfaceIds(): readonly string[] {
  return W3_O03_D_CLAIM_SURFACES.map((s) => s.surfaceId);
}

export type W3O03CDispositionDecisionExport = W3O03CDispositionDecision;
