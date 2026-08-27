/**
 * W3-O03-a — Recovery Residual Inventory & Claim-Language Baseline.
 *
 * Discovery and classification only.
 * Not recovery implementation. Not Business Continuity. Not High Availability.
 * Not Disaster Recovery. Not ADL-008 ACCEPTED.
 *
 * Residual vocabulary US295 / ADL-008 / TD-036 R6 / IN-02 is debt / capability
 * label only — not a new Source of Truth and not authorization to redesign
 * US290–US294 recovery behaviour.
 *
 * Classification (binding for this slice):
 * - RECOVERABLE: artifact may be cited / recovered into later US295 disposition
 *   evidence (W3-O03-b…d). Does NOT authorize production restart-safe PASS.
 * - NON_RECOVERABLE: artifact must never authorize production restart-safety
 *   claims and is explicitly out of the US295 disposition path.
 */

export const W3_O03_A_SLICE_ID = 'W3-O03-a' as const;

export const W3_O03_A_ALLOWED_OWNERS = Object.freeze([
  'architecture-decision-log',
  'trading-session',
  'runtime-recovery',
  'release-governance',
  'wave-3-documentation',
  'platform-readiness',
  'notification-delivery',
  'analytical-stores',
  'kill-switch-deferred',
  'monitoring-deferred',
  'live-trading-deferred',
  'continuity-products-deferred',
] as const);

export type W3O03AOwner = (typeof W3_O03_A_ALLOWED_OWNERS)[number];

/** Existing recovery / ADL owners for stance work — no new owner. */
export const W3_O03_A_STANCE_OWNERS = Object.freeze([
  'architecture-decision-log',
  'trading-session',
  'runtime-recovery',
  'release-governance',
] as const);

export const W3_O03_A_SURFACE_KINDS = Object.freeze([
  'adl-governance',
  'us295-residual',
  'substrate-evidence-input',
  'integration-validation-input',
  'claim-language-surface',
  'adjacent-durability-not-stance',
  'explicit-out',
] as const);

export type W3O03ASurfaceKind = (typeof W3_O03_A_SURFACE_KINDS)[number];

export const W3_O03_A_REQUIRED_SURFACE_KINDS = W3_O03_A_SURFACE_KINDS;

export const W3_O03_A_DOMAIN_CLASSES = Object.freeze([
  'us295-adl008-stance',
  'us290-us294-substrate',
  'w3-o01-analytical-durability',
  'w3-o02-notification-queue',
  'w3-o04-kill-switch',
  'w3-o05-monitoring',
  'live-trading',
  'business-continuity-ha-dr',
  'e19-operator-recovery-ux',
] as const);

export type W3O03ADomainClass = (typeof W3_O03_A_DOMAIN_CLASSES)[number];

/**
 * Recoverable = may feed later W3-O03 disposition evidence.
 * Non-recoverable = must never authorize production restart-safety claims.
 */
export const W3_O03_A_STANCE_CLASSES = Object.freeze(['RECOVERABLE', 'NON_RECOVERABLE'] as const);

export type W3O03AStanceClass = (typeof W3_O03_A_STANCE_CLASSES)[number];

export const W3_O03_A_ADL008_STATUSES = Object.freeze([
  'DEFERRED',
  'ACCEPTED',
  'EXPLICIT_LIMITATION',
] as const);

export type W3O03AAdl008Status = (typeof W3_O03_A_ADL008_STATUSES)[number];

export const W3_O03_A_FUTURE_RESPONSIBILITIES = Object.freeze([
  'W3-O03-b',
  'W3-O03-c',
  'W3-O03-d',
  'W3-O03-e',
  'honesty-baseline',
  'out-of-scope-w3-o01',
  'out-of-scope-w3-o02',
  'out-of-scope-w3-o04',
  'out-of-scope-w3-o05',
  'out-of-scope-live-trading',
  'out-of-scope-bc-ha-dr',
  'out-of-scope-e19',
] as const);

export type W3O03AFutureResponsibility = (typeof W3_O03_A_FUTURE_RESPONSIBILITIES)[number];

export type W3O03AInventoryRow = Readonly<{
  surfaceId: string;
  surface: string;
  kind: W3O03ASurfaceKind;
  owner: W3O03AOwner;
  domainClass: W3O03ADomainClass;
  stanceClass: W3O03AStanceClass;
  currentStatus: string;
  honestyRequirement: string;
  futureW3O03Responsibility: W3O03AFutureResponsibility;
  evidencePath: string;
  existsToday: boolean;
  authorizesProductionRestartSafe: boolean;
  isUs295Input: boolean;
}>;

/**
 * Frozen inventory of production restart-safety claim surfaces, ADL-008
 * status, US295 evidence inputs, and explicit non-authorizing OUT surfaces.
 */
export const W3_O03_A_RECOVERY_RESIDUAL_INVENTORY: readonly W3O03AInventoryRow[] = Object.freeze([
  // ── ADL-008 governance ─────────────────────────────────────────────────
  Object.freeze({
    surfaceId: 'adl-008-decision-log-entry',
    surface: 'ADL-008 Full ADR-014 recovery algorithm ownership (placeholder)',
    kind: 'adl-governance' as const,
    owner: 'architecture-decision-log' as const,
    domainClass: 'us295-adl008-stance' as const,
    stanceClass: 'RECOVERABLE' as const,
    currentStatus: 'DEFERRED',
    honestyRequirement:
      'DEFERRED must never be treated as production restart-safe PASS; only Product Owner may ACCEPTED or write explicit limitation',
    futureW3O03Responsibility: 'W3-O03-c' as const,
    evidencePath: 'docs/Architecture/ADR/ADL.md',
    existsToday: true,
    authorizesProductionRestartSafe: false,
    isUs295Input: true,
  }),

  // ── US295 residual ─────────────────────────────────────────────────────
  Object.freeze({
    surfaceId: 'us295-story-residual',
    surface: 'US295 ADL-008 Closure / Release Acceptance story',
    kind: 'us295-residual' as const,
    owner: 'release-governance' as const,
    domainClass: 'us295-adl008-stance' as const,
    stanceClass: 'RECOVERABLE' as const,
    currentStatus: 'OPEN — Spec drafted; disposition not recorded',
    honestyRequirement:
      'US295 is governance + claim stance only; does not redesign US290–US294 behaviour',
    futureW3O03Responsibility: 'W3-O03-c' as const,
    evidencePath: 'docs/project/stories/us295-adl008-release-acceptance.md',
    existsToday: true,
    authorizesProductionRestartSafe: false,
    isUs295Input: true,
  }),
  Object.freeze({
    surfaceId: 'td036-r6-residual-register',
    surface: 'TD-036 residual R6 — ADL-008 ACCEPTED or explicit deferral',
    kind: 'us295-residual' as const,
    owner: 'release-governance' as const,
    domainClass: 'us295-adl008-stance' as const,
    stanceClass: 'RECOVERABLE' as const,
    currentStatus: 'OPEN (US295)',
    honestyRequirement: 'R6 remains open until Product Owner disposition; silent PASS forbidden',
    futureW3O03Responsibility: 'W3-O03-c' as const,
    evidencePath: 'docs/project/rc-18-residual-register.md',
    existsToday: true,
    authorizesProductionRestartSafe: false,
    isUs295Input: true,
  }),
  Object.freeze({
    surfaceId: 'td036-technical-debt-row',
    surface: 'TD-036 Runtime Recovery residual ownership table (US295 open)',
    kind: 'us295-residual' as const,
    owner: 'release-governance' as const,
    domainClass: 'us295-adl008-stance' as const,
    stanceClass: 'RECOVERABLE' as const,
    currentStatus: 'Partial (RC-18) — US295 open',
    honestyRequirement: 'Debt vocabulary is not a new SoT; US290–US294 closed ≠ US295 closed',
    futureW3O03Responsibility: 'honesty-baseline' as const,
    evidencePath: 'docs/project/technical-debt.md',
    existsToday: true,
    authorizesProductionRestartSafe: false,
    isUs295Input: true,
  }),
  Object.freeze({
    surfaceId: 'in02-capability-inventory',
    surface: 'IN-02 Recovery residual US295 / ADL-008 capability',
    kind: 'us295-residual' as const,
    owner: 'wave-3-documentation' as const,
    domainClass: 'us295-adl008-stance' as const,
    stanceClass: 'RECOVERABLE' as const,
    currentStatus: 'Named in Master Plan / inventory — stance open',
    honestyRequirement: 'Blocks production restart-safety claims, not the paper loop',
    futureW3O03Responsibility: 'honesty-baseline' as const,
    evidencePath: 'docs/project/version-3/v3-capability-inventory.md',
    existsToday: true,
    authorizesProductionRestartSafe: false,
    isUs295Input: true,
  }),

  // ── US290–US294 substrate evidence inputs ──────────────────────────────
  Object.freeze({
    surfaceId: 'us290-force-confirm-recovering',
    surface: 'US290 Force/confirm Session RECOVERING on discovery',
    kind: 'substrate-evidence-input' as const,
    owner: 'trading-session' as const,
    domainClass: 'us290-us294-substrate' as const,
    stanceClass: 'RECOVERABLE' as const,
    currentStatus: 'CLOSED (Implemented)',
    honestyRequirement: 'Closed substrate input only; does not alone authorize restart-safe PASS',
    futureW3O03Responsibility: 'W3-O03-b' as const,
    evidencePath: 'docs/project/stories/us290-force-confirm-recovering-on-discovery.md',
    existsToday: true,
    authorizesProductionRestartSafe: false,
    isUs295Input: true,
  }),
  Object.freeze({
    surfaceId: 'us291-reconcile-port-adapters',
    surface: 'US291 Real RECOVERY_RECONCILIATION_PORTS adapters',
    kind: 'substrate-evidence-input' as const,
    owner: 'runtime-recovery' as const,
    domainClass: 'us290-us294-substrate' as const,
    stanceClass: 'RECOVERABLE' as const,
    currentStatus: 'CLOSED (Implemented)',
    honestyRequirement: 'Closed substrate input only; no stub false-green as stance Close',
    futureW3O03Responsibility: 'W3-O03-b' as const,
    evidencePath: 'docs/project/stories/us291-real-recovery-reconciliation-port-adapters.md',
    existsToday: true,
    authorizesProductionRestartSafe: false,
    isUs295Input: true,
  }),
  Object.freeze({
    surfaceId: 'us292-durable-recovery-state',
    surface: 'US292 Durable RecoveryState + phase machine',
    kind: 'substrate-evidence-input' as const,
    owner: 'trading-session' as const,
    domainClass: 'us290-us294-substrate' as const,
    stanceClass: 'RECOVERABLE' as const,
    currentStatus: 'CLOSED (Implemented)',
    honestyRequirement: 'RecoveryState durability ≠ ADL-008 ACCEPTED; substrate only',
    futureW3O03Responsibility: 'W3-O03-b' as const,
    evidencePath: 'docs/project/stories/us292-durable-recovery-state-phase-machine.md',
    existsToday: true,
    authorizesProductionRestartSafe: false,
    isUs295Input: true,
  }),
  Object.freeze({
    surfaceId: 'us293-durable-incident',
    surface: 'US293 Durable Incident on recovery ambiguity',
    kind: 'substrate-evidence-input' as const,
    owner: 'runtime-recovery' as const,
    domainClass: 'us290-us294-substrate' as const,
    stanceClass: 'RECOVERABLE' as const,
    currentStatus: 'CLOSED (Implemented)',
    honestyRequirement: 'Fail-closed Incident is substrate; E19 UX productization remains out',
    futureW3O03Responsibility: 'W3-O03-b' as const,
    evidencePath: 'docs/project/stories/us293-durable-incident-on-recovery-ambiguity.md',
    existsToday: true,
    authorizesProductionRestartSafe: false,
    isUs295Input: true,
  }),
  Object.freeze({
    surfaceId: 'us294-chaos-restart-evidence-package',
    surface: 'US294 Chaos/restart Evidence Package (M-01…M-12)',
    kind: 'substrate-evidence-input' as const,
    owner: 'runtime-recovery' as const,
    domainClass: 'us290-us294-substrate' as const,
    stanceClass: 'RECOVERABLE' as const,
    currentStatus: 'CLOSED — Evidence Package COMPLETE',
    honestyRequirement:
      'US294 alone must not claim ADL-008 ACCEPTED or production restart-safety PASS',
    futureW3O03Responsibility: 'W3-O03-b' as const,
    evidencePath: 'docs/project/rc-18-us294-chaos-restart-evidence.md',
    existsToday: true,
    authorizesProductionRestartSafe: false,
    isUs295Input: true,
  }),
  Object.freeze({
    surfaceId: 'us294-chaos-restart-evidence-suite',
    surface: 'US294 chaos/restart evidence vitest suite',
    kind: 'substrate-evidence-input' as const,
    owner: 'runtime-recovery' as const,
    domainClass: 'us290-us294-substrate' as const,
    stanceClass: 'RECOVERABLE' as const,
    currentStatus: 'CLOSED — suite exists',
    honestyRequirement: 'Chaos evidence is mandatory US295 input; not disposition itself',
    futureW3O03Responsibility: 'W3-O03-b' as const,
    evidencePath:
      'apps/api/src/modules/trading-session/recovery/us294-chaos-restart.evidence.spec.ts',
    existsToday: true,
    authorizesProductionRestartSafe: false,
    isUs295Input: true,
  }),

  // ── Integration validation inputs ──────────────────────────────────────
  Object.freeze({
    surfaceId: 'riv-001-recovery-integration',
    surface: 'RIV-001 Recovery Integration Validation',
    kind: 'integration-validation-input' as const,
    owner: 'release-governance' as const,
    domainClass: 'us290-us294-substrate' as const,
    stanceClass: 'RECOVERABLE' as const,
    currentStatus: 'COHERENT (predecessor input)',
    honestyRequirement:
      'Integration coherence is a substrate input only; does not alone close US295',
    futureW3O03Responsibility: 'W3-O03-b' as const,
    evidencePath: 'docs/project/rc-18-riv-001-recovery-integration-validation.md',
    existsToday: true,
    authorizesProductionRestartSafe: false,
    isUs295Input: true,
  }),
  Object.freeze({
    surfaceId: 'sig-001-safety-integration',
    surface: 'SIG-001 Safety Integration Validation',
    kind: 'integration-validation-input' as const,
    owner: 'release-governance' as const,
    domainClass: 'us290-us294-substrate' as const,
    stanceClass: 'RECOVERABLE' as const,
    currentStatus: 'PASS WITH RESIDUALS (predecessor input)',
    honestyRequirement:
      'PASS WITH RESIDUALS is substrate input only; does not alone close US295 / ADL-008',
    futureW3O03Responsibility: 'W3-O03-b' as const,
    evidencePath: 'docs/project/rc-18-sig-001-safety-integration-validation.md',
    existsToday: true,
    authorizesProductionRestartSafe: false,
    isUs295Input: true,
  }),

  // ── Claim-language surfaces ────────────────────────────────────────────
  Object.freeze({
    surfaceId: 'claim-recovery-residual-overview',
    surface: 'Recovery Residual operator overview (claim honesty product language)',
    kind: 'claim-language-surface' as const,
    owner: 'wave-3-documentation' as const,
    domainClass: 'us295-adl008-stance' as const,
    stanceClass: 'RECOVERABLE' as const,
    currentStatus: 'Planning + W3-O03-a inventory foundation',
    honestyRequirement:
      'Must show ACCEPTED or explicit limitation at package Close — never silent PASS from inventory alone',
    futureW3O03Responsibility: 'W3-O03-d' as const,
    evidencePath: 'docs/project/version-3/wave-3/recovery-residual-overview.md',
    existsToday: true,
    authorizesProductionRestartSafe: false,
    isUs295Input: false,
  }),
  Object.freeze({
    surfaceId: 'claim-durability-overview',
    surface: 'Wave 3 durability overview (must not imply O03 stance Closed)',
    kind: 'claim-language-surface' as const,
    owner: 'wave-3-documentation' as const,
    domainClass: 'us295-adl008-stance' as const,
    stanceClass: 'RECOVERABLE' as const,
    currentStatus: 'O03 planning complete; stance not Closed',
    honestyRequirement: 'O01/O02 durability ≠ production restart-safety Complete',
    futureW3O03Responsibility: 'honesty-baseline' as const,
    evidencePath: 'docs/project/version-3/wave-3/durability-overview.md',
    existsToday: true,
    authorizesProductionRestartSafe: false,
    isUs295Input: false,
  }),
  Object.freeze({
    surfaceId: 'claim-operational-state-matrix',
    surface: 'Operational State Matrix (continuity readiness — not ADL-008)',
    kind: 'claim-language-surface' as const,
    owner: 'platform-readiness' as const,
    domainClass: 'us295-adl008-stance' as const,
    stanceClass: 'RECOVERABLE' as const,
    currentStatus: 'O01-d / O02-d continuity foundation',
    honestyRequirement:
      'Owner readiness Ready must never be read as production restart-safe PASS / ADL-008 ACCEPTED',
    futureW3O03Responsibility: 'W3-O03-d' as const,
    evidencePath: 'docs/project/version-3/wave-3/operational-state-matrix.md',
    existsToday: true,
    authorizesProductionRestartSafe: false,
    isUs295Input: false,
  }),
  Object.freeze({
    surfaceId: 'claim-master-plan-disaster-recovery-rule',
    surface: 'Master Plan disaster-recovery claim rule (no silent PASS)',
    kind: 'claim-language-surface' as const,
    owner: 'release-governance' as const,
    domainClass: 'us295-adl008-stance' as const,
    stanceClass: 'RECOVERABLE' as const,
    currentStatus: 'FROZEN Master Plan rule — binding',
    honestyRequirement:
      'Production restart-safe claim requires ADL-008 ACCEPTED or explicit written limitation',
    futureW3O03Responsibility: 'honesty-baseline' as const,
    evidencePath: 'docs/project/version-3/version-3-master-plan.md',
    existsToday: true,
    authorizesProductionRestartSafe: false,
    isUs295Input: true,
  }),

  // ── Adjacent durability (not stance) ───────────────────────────────────
  Object.freeze({
    surfaceId: 'adjacent-w3-o01-analytical-stores',
    surface: 'W3-O01 Durable Analytical Stores (CLOSED)',
    kind: 'adjacent-durability-not-stance' as const,
    owner: 'analytical-stores' as const,
    domainClass: 'w3-o01-analytical-durability' as const,
    stanceClass: 'NON_RECOVERABLE' as const,
    currentStatus: 'CLOSED — analytical SURVIVE only',
    honestyRequirement:
      'Store survival alone must never authorize production restart-safety / ADL-008',
    futureW3O03Responsibility: 'out-of-scope-w3-o01' as const,
    evidencePath: 'docs/project/version-3/wave-3/w3-o01-package-summary.md',
    existsToday: true,
    authorizesProductionRestartSafe: false,
    isUs295Input: false,
  }),
  Object.freeze({
    surfaceId: 'adjacent-w3-o02-notification-queue',
    surface: 'W3-O02 Notification Durable Queue (CLOSED)',
    kind: 'adjacent-durability-not-stance' as const,
    owner: 'notification-delivery' as const,
    domainClass: 'w3-o02-notification-queue' as const,
    stanceClass: 'NON_RECOVERABLE' as const,
    currentStatus: 'CLOSED — queue durability only',
    honestyRequirement:
      'Queue durability alone must never authorize production restart-safety / ADL-008',
    futureW3O03Responsibility: 'out-of-scope-w3-o02' as const,
    evidencePath: 'docs/project/version-3/wave-3/w3-o02-package-summary.md',
    existsToday: true,
    authorizesProductionRestartSafe: false,
    isUs295Input: false,
  }),

  // ── Explicit OUT ───────────────────────────────────────────────────────
  Object.freeze({
    surfaceId: 'out-w3-o04-kill-switch',
    surface: 'W3-O04 Durable Kill Switch Product',
    kind: 'explicit-out' as const,
    owner: 'kill-switch-deferred' as const,
    domainClass: 'w3-o04-kill-switch' as const,
    stanceClass: 'NON_RECOVERABLE' as const,
    currentStatus: 'Not opened',
    honestyRequirement: 'Must not claim Kill Switch Complete from W3-O03',
    futureW3O03Responsibility: 'out-of-scope-w3-o04' as const,
    evidencePath: 'docs/project/version-3/wave-3/w3-o03-product-scope.md',
    existsToday: false,
    authorizesProductionRestartSafe: false,
    isUs295Input: false,
  }),
  Object.freeze({
    surfaceId: 'out-w3-o05-monitoring',
    surface: 'W3-O05 Monitoring & Security Health',
    kind: 'explicit-out' as const,
    owner: 'monitoring-deferred' as const,
    domainClass: 'w3-o05-monitoring' as const,
    stanceClass: 'NON_RECOVERABLE' as const,
    currentStatus: 'Not opened',
    honestyRequirement: 'Must not claim Monitoring Complete from W3-O03',
    futureW3O03Responsibility: 'out-of-scope-w3-o05' as const,
    evidencePath: 'docs/project/version-3/wave-3/w3-o03-product-scope.md',
    existsToday: false,
    authorizesProductionRestartSafe: false,
    isUs295Input: false,
  }),
  Object.freeze({
    surfaceId: 'out-live-trading',
    surface: 'Live Trading / Wave 6 live capital',
    kind: 'explicit-out' as const,
    owner: 'live-trading-deferred' as const,
    domainClass: 'live-trading' as const,
    stanceClass: 'NON_RECOVERABLE' as const,
    currentStatus: 'Out — Wave 6',
    honestyRequirement: 'Must not claim Live Trading from W3-O03',
    futureW3O03Responsibility: 'out-of-scope-live-trading' as const,
    evidencePath: 'docs/project/version-3/wave-3/w3-o03-product-scope.md',
    existsToday: false,
    authorizesProductionRestartSafe: false,
    isUs295Input: false,
  }),
  Object.freeze({
    surfaceId: 'out-business-continuity-ha-dr',
    surface: 'Business Continuity / High Availability / Disaster Recovery products',
    kind: 'explicit-out' as const,
    owner: 'continuity-products-deferred' as const,
    domainClass: 'business-continuity-ha-dr' as const,
    stanceClass: 'NON_RECOVERABLE' as const,
    currentStatus: 'Out — never silent from O03',
    honestyRequirement: 'Stance Close ≠ BC/HA/DR product; claim language must stay limited',
    futureW3O03Responsibility: 'out-of-scope-bc-ha-dr' as const,
    evidencePath: 'docs/project/version-3/wave-3/w3-o03-product-scope.md',
    existsToday: false,
    authorizesProductionRestartSafe: false,
    isUs295Input: false,
  }),
  Object.freeze({
    surfaceId: 'out-e19-operator-recovery-ux',
    surface: 'E19 operator recovery dashboard / resolve UX',
    kind: 'explicit-out' as const,
    owner: 'runtime-recovery' as const,
    domainClass: 'e19-operator-recovery-ux' as const,
    stanceClass: 'NON_RECOVERABLE' as const,
    currentStatus: 'Out of W3-O03',
    honestyRequirement: 'US293 substrate ≠ E19 productization; do not invent recovery UX here',
    futureW3O03Responsibility: 'out-of-scope-e19' as const,
    evidencePath: 'docs/project/version-3/wave-3/w3-o03-product-scope.md',
    existsToday: false,
    authorizesProductionRestartSafe: false,
    isUs295Input: false,
  }),
]);

/** Binding finding frozen for honesty baseline. */
export const W3_O03_A_ADL008_CURRENT_STATUS: W3O03AAdl008Status = 'DEFERRED';

export const W3_O03_A_BINDING_FINDINGS = Object.freeze({
  adl008Status: W3_O03_A_ADL008_CURRENT_STATUS,
  us295Open: true,
  us290ToUs294Closed: true,
  us294AloneClosesAdl008: false,
  o01AloneClosesUs295: false,
  o02AloneClosesUs295: false,
  productionRestartSafeAuthorized: false,
  silentPassForbidden: true,
  engineeringMaySelfPromoteAdl008: false,
  customerVisibleStanceFeatureFromSliceA: false,
} as const);

export const W3_O03_A_EXPLICIT_OUT = Object.freeze([
  'recovery-redesign-us290-us294',
  'adl-008-accepted-self-promotion',
  'production-restart-safe-pass',
  'business-continuity',
  'high-availability',
  'disaster-recovery-product',
  'kill-switch-product',
  'monitoring-product',
  'live-trading',
  'second-recovery-domain',
  'second-lake',
  'second-outbox',
  'new-persistence-owner',
  'master-plan-revision',
  'version-2-redesign',
  'w3-o03-b',
] as const);

export const W3_O03_A_ARCHITECTURE_CLAIMS = Object.freeze({
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
} as const);

export function surfaceIds(): readonly string[] {
  return W3_O03_A_RECOVERY_RESIDUAL_INVENTORY.map((row) => row.surfaceId);
}

export function rowsByKind(kind: W3O03ASurfaceKind): readonly W3O03AInventoryRow[] {
  return W3_O03_A_RECOVERY_RESIDUAL_INVENTORY.filter((row) => row.kind === kind);
}

export function rowsRecoverable(): readonly W3O03AInventoryRow[] {
  return W3_O03_A_RECOVERY_RESIDUAL_INVENTORY.filter((row) => row.stanceClass === 'RECOVERABLE');
}

export function rowsNonRecoverable(): readonly W3O03AInventoryRow[] {
  return W3_O03_A_RECOVERY_RESIDUAL_INVENTORY.filter(
    (row) => row.stanceClass === 'NON_RECOVERABLE',
  );
}

export function rowsUs295Inputs(): readonly W3O03AInventoryRow[] {
  return W3_O03_A_RECOVERY_RESIDUAL_INVENTORY.filter((row) => row.isUs295Input);
}

export function rowsStanceDomain(): readonly W3O03AInventoryRow[] {
  return W3_O03_A_RECOVERY_RESIDUAL_INVENTORY.filter(
    (row) => row.domainClass === 'us295-adl008-stance',
  );
}

export function rowsSubstrate(): readonly W3O03AInventoryRow[] {
  return W3_O03_A_RECOVERY_RESIDUAL_INVENTORY.filter(
    (row) => row.domainClass === 'us290-us294-substrate',
  );
}

export function rowsExplicitOut(): readonly W3O03AInventoryRow[] {
  return W3_O03_A_RECOVERY_RESIDUAL_INVENTORY.filter((row) => row.kind === 'explicit-out');
}
