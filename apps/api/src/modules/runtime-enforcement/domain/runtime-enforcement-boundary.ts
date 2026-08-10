/**
 * RC-23 — Runtime Enforcement boundary + ownership invariants.
 *
 * Runtime Enforcement is the sole validation Gate between Strategy Library
 * (SoT) and Trading Session / Strategy Deployment consumers
 * (Architecture Spec v2.0 §5.2, §5.6, §8).
 *
 * Authority class: Gate — PASS/FAIL over Library reads.
 * It is NOT certification SoT, NOT selection, NOT Orchestrator.
 *
 * Mantra: RC-23 validates. RC-23 does not decide.
 *
 * Epic 1: boundary + ownership invariants + inactive ports (no validation).
 * Epic 2: Library read consumption (Lookup / Eligibility).
 * Epic 3: Runtime Enforcement Gate (validateDeployment sequence).
 * Epic 4: Strategy Deployment bind enforcement.
 * Epic 5: Trading Session start refusal on FAIL.
 * Epic 6: Fail-closed coverage + RC-23 close readiness.
 */

/** Authority Matrix / Integration Diagram class for Runtime Enforcement. */
export const RUNTIME_ENFORCEMENT_AUTHORITY_CLASS = 'gate' as const;

/** Canonical module identity (code / docs). Product UI may say “Runtime Enforcement”. */
export const RUNTIME_ENFORCEMENT_MODULE_ID = 'runtime-enforcement' as const;

/**
 * Fact families Runtime Enforcement owns (declared in Epic 1;
 * gate behaviour activates in later Epics).
 */
export const RUNTIME_ENFORCEMENT_OWNED_CONCERNS = Object.freeze([
  'deployment-validation-boundary',
  'runtime-verification-contract',
  'enforcement-pass-fail',
  'rejection-reason-catalog',
] as const);

export type RuntimeEnforcementOwnedConcern = (typeof RUNTIME_ENFORCEMENT_OWNED_CONCERNS)[number];

/**
 * Modules / surfaces that own other SoT or projection facts.
 * Runtime Enforcement must not absorb these.
 */
export const RUNTIME_ENFORCEMENT_NON_OWNED = Object.freeze([
  'strategy-certification',
  'strategy-eligibility',
  'library-tactical-envelope',
  'strategy-library',
  'strategy-deployment',
  'trading-session',
  'execution-engine',
  'orders',
  'risk-engine',
  'ledger',
  'knowledge-lake',
  'trading-orchestrator',
  'market-state-engine',
  'strategy-selection',
  'paper-trading',
] as const);

export type RuntimeEnforcementNonOwned = (typeof RUNTIME_ENFORCEMENT_NON_OWNED)[number];

/**
 * Surfaces that remain distinct bounded contexts / aliases.
 * Do not rebrand these as Runtime Enforcement.
 */
export const RUNTIME_ENFORCEMENT_DISTINCT_FROM = Object.freeze([
  'strategy-library',
  'trading-session',
  'strategy-deployment',
  'strategy-runtime',
  'knowledge-lake',
  'bot-facade',
  'trading-orchestrator',
  'strategy-selection',
] as const);

/**
 * Forbidden Enforcement capabilities (Epic 1 declares; later Epics must not add these).
 */
export const RUNTIME_ENFORCEMENT_FORBIDDEN_CAPABILITIES = Object.freeze([
  'certify-strategy',
  'deprecate-certification',
  'archive-certification',
  'mutate-eligibility',
  'mutate-envelope',
  'select-strategy',
  'authorize-from-lake',
  'own-session-lifecycle',
  'own-deployment-binding',
  'implement-orchestrator',
  'implement-market-state',
  'approve-risk',
  'submit-execution',
  'mutate-orders',
  'soft-fail-warn-and-continue',
  'write-library-certification',
] as const);

export type RuntimeEnforcementForbiddenCapability =
  (typeof RUNTIME_ENFORCEMENT_FORBIDDEN_CAPABILITIES)[number];

/**
 * Immutable boundary descriptor for the Runtime Enforcement Gate.
 */
export type RuntimeEnforcementBoundary = Readonly<{
  moduleId: typeof RUNTIME_ENFORCEMENT_MODULE_ID;
  authorityClass: typeof RUNTIME_ENFORCEMENT_AUTHORITY_CLASS;
  ownedConcerns: typeof RUNTIME_ENFORCEMENT_OWNED_CONCERNS;
  nonOwned: typeof RUNTIME_ENFORCEMENT_NON_OWNED;
  distinctFrom: typeof RUNTIME_ENFORCEMENT_DISTINCT_FROM;
  forbiddenCapabilities: typeof RUNTIME_ENFORCEMENT_FORBIDDEN_CAPABILITIES;
  /**
   * Port posture by Epic.
   * Epic 3: Library reads + validateDeployment Gate active.
   */
  activePorts: Readonly<{
    validateDeployment: true;
    libraryLookup: true;
    libraryEligibility: true;
    persistence: false;
    rest: false;
  }>;
  /** Strategy Library relationship: read-only consumer (activates Epic 2+). */
  strategyLibraryRole: 'read-only-consumer';
  /** Knowledge Lake must never authorize enforcement. */
  knowledgeLakeRole: 'never-authority';
}>;

/** Sole RC-23 Runtime Enforcement boundary constant. */
export const RUNTIME_ENFORCEMENT_BOUNDARY: RuntimeEnforcementBoundary = Object.freeze({
  moduleId: RUNTIME_ENFORCEMENT_MODULE_ID,
  authorityClass: RUNTIME_ENFORCEMENT_AUTHORITY_CLASS,
  ownedConcerns: RUNTIME_ENFORCEMENT_OWNED_CONCERNS,
  nonOwned: RUNTIME_ENFORCEMENT_NON_OWNED,
  distinctFrom: RUNTIME_ENFORCEMENT_DISTINCT_FROM,
  forbiddenCapabilities: RUNTIME_ENFORCEMENT_FORBIDDEN_CAPABILITIES,
  activePorts: Object.freeze({
    validateDeployment: true,
    libraryLookup: true,
    libraryEligibility: true,
    persistence: false,
    rest: false,
  }),
  strategyLibraryRole: 'read-only-consumer',
  knowledgeLakeRole: 'never-authority',
});

/** True when a capability is forbidden for Runtime Enforcement. */
export function isRuntimeEnforcementForbiddenCapability(
  value: string,
): value is RuntimeEnforcementForbiddenCapability {
  return (RUNTIME_ENFORCEMENT_FORBIDDEN_CAPABILITIES as readonly string[]).includes(value);
}

/** True when a concern is Enforcement-owned (declared). */
export function isRuntimeEnforcementOwnedConcern(
  value: string,
): value is RuntimeEnforcementOwnedConcern {
  return (RUNTIME_ENFORCEMENT_OWNED_CONCERNS as readonly string[]).includes(value);
}

/**
 * Runtime never owns certification (Enforcement Contract §2).
 */
export function runtimeOwnsCertification(): false {
  return false;
}

/**
 * Runtime never selects strategies (validates ≠ decides).
 */
export function runtimeSelectsStrategies(): false {
  return false;
}

/**
 * Mantra: validates ≠ decides.
 */
export function validatesDoesNotDecide(): true {
  return true;
}

/**
 * Knowledge Lake never authorizes enforcement outcomes.
 */
export function knowledgeLakeAuthorizesEnforcement(): false {
  return false;
}

/**
 * Runtime Enforcement owns PASS/FAIL gate outcomes only.
 */
export function runtimeEnforcementOwnsPassFail(): true {
  return true;
}

/**
 * Conflict rule: on membership / certification / eligibility / envelope disputes,
 * Strategy Library wins. Enforcement must FAIL closed if Library denies.
 */
export function resolveLibraryAuthorityConflict(
  concern:
    'certified-membership' | 'certification-status' | 'eligibility-status' | 'tactical-envelope',
): 'strategy-library' {
  void concern;
  return 'strategy-library';
}

/**
 * Conflict rule: on session lifecycle disputes, Trading Session wins.
 */
export function resolveSessionLifecycleConflict(): 'trading-session' {
  return 'trading-session';
}

/**
 * Conflict rule: on deployment binding disputes, Strategy Deployment wins.
 */
export function resolveDeploymentBindingConflict(): 'strategy-deployment' {
  return 'strategy-deployment';
}

/**
 * Conflict rule: PASS/FAIL gate outcome disputes resolve to Runtime Enforcement.
 */
export function resolveEnforcementOutcomeConflict(): 'runtime-enforcement' {
  return 'runtime-enforcement';
}

/**
 * Conflict rule: Lake analytical facts never authorize enforcement.
 */
export function resolveLakeAuthorityConflict(): 'never-authority' {
  return 'never-authority';
}
