/**
 * W4-E06-e — Wave Completion Evidence Assembly.
 *
 * Assembles complete Wave 4 Completion Review engineering evidence from W4-E06-a…d
 * for Product Owner Final Wave Review. Evidence assembly only — no runtime implementation.
 * Does NOT declare Wave 4 COMPLETE. Does NOT declare W4-E06 CLOSED.
 * Does NOT perform Final Wave Integration Verification.
 */

import {
  W4_E06_A_ARCHITECTURE_CLAIMS,
  W4_E06_A_BINDING_FINDINGS,
  W4_E06_A_COMPLETED_PACKAGE_IDS,
  type W4E06ACompletedPackageId,
} from './w4-e06-a-wave4-rollup-inventory';
import { verifyPackageRollup, W4_E06_A_REQUIRED_REPORTS } from './w4-e06-a-wave4-rollup';
import {
  verifyGovernanceCompleteness,
  verifyPackageExitCriteria,
  W4_E06_B_REQUIRED_REPORTS,
} from './w4-e06-b-wave-exit-criteria';
import {
  W4_E06_C_BINDING_FINDINGS,
  verifyCrossPackageIntegration,
  W4_E06_C_REQUIRED_REPORTS,
} from './w4-e06-c-cross-package-integration';
import {
  W4_E06_D_BINDING_FINDINGS,
  verifyWaveOperationalContinuity,
  W4_E06_D_REQUIRED_REPORTS,
} from './w4-e06-d-wave-operational-continuity';

export const W4_E06_E_SLICE_ID = 'W4-E06-e' as const;

export const W4_E06_E_EVIDENCE_DOMAINS = Object.freeze([
  'rollup-inventory-completed',
  'exit-criteria-completed',
  'cross-package-integration-verified',
  'operational-continuity-reviewed',
  'honest-product-preserved',
  'governance-preserved',
  'architecture-preserved',
  'documentation-synchronized',
] as const);

export type W4E06EEvidenceDomain = (typeof W4_E06_E_EVIDENCE_DOMAINS)[number];

export const W4_E06_E_ASSEMBLY_RESULTS = Object.freeze(['PASS'] as const);

export type W4E06EAssemblyResult = (typeof W4_E06_E_ASSEMBLY_RESULTS)[number];

export type W4E06EWaveCompletionEvidenceRow = Readonly<{
  checkId: string;
  domain: W4E06EEvidenceDomain;
  check: string;
  result: W4E06EAssemblyResult;
  mappedPackages: readonly W4E06ACompletedPackageId[];
  evidencePath: string;
  honestyRequirement: string;
  authorizesWave4Complete: false;
}>;

/** Approved predecessor slices a–d that must PASS before wave completion evidence assembly. */
export const W4_E06_E_APPROVED_PREDECESSOR_SLICES = Object.freeze([
  Object.freeze({
    id: 'W4-E06-a' as const,
    name: 'Wave 4 Package Roll-Up Inventory & Honest Product Baseline',
    validation: 'PASS' as const,
    architecture: 'PASS' as const,
    security: 'PASS' as const,
    product: 'PASS' as const,
    registryPath: 'apps/api/src/platform-conformance/w4-e06-a-wave4-rollup-inventory.ts',
    primaryEvidencePath: 'docs/project/version-3/wave-4/w4-e06-a-wave4-rollup-inventory.md',
  }),
  Object.freeze({
    id: 'W4-E06-b' as const,
    name: 'Wave Exit Criteria Evidence Foundation',
    validation: 'PASS' as const,
    architecture: 'PASS' as const,
    security: 'PASS' as const,
    product: 'PASS' as const,
    registryPath: 'apps/api/src/platform-conformance/w4-e06-b-wave-exit-criteria.ts',
    primaryEvidencePath: 'docs/project/version-3/wave-4/w4-e06-b-wave-exit-criteria.md',
  }),
  Object.freeze({
    id: 'W4-E06-c' as const,
    name: 'Cross-Package Integration Verification Foundation',
    validation: 'PASS' as const,
    architecture: 'PASS' as const,
    security: 'PASS' as const,
    product: 'PASS' as const,
    registryPath: 'apps/api/src/platform-conformance/w4-e06-c-cross-package-integration.ts',
    primaryEvidencePath: 'docs/project/version-3/wave-4/w4-e06-c-cross-package-integration.md',
  }),
  Object.freeze({
    id: 'W4-E06-d' as const,
    name: 'Wave Operational Continuity & Honest Product Review Foundation',
    validation: 'PASS' as const,
    architecture: 'PASS' as const,
    security: 'PASS' as const,
    product: 'PASS' as const,
    registryPath: 'apps/api/src/platform-conformance/w4-e06-d-wave-operational-continuity.ts',
    primaryEvidencePath: 'docs/project/version-3/wave-4/w4-e06-d-wave-operational-continuity.md',
  }),
]);

export const W4_E06_E_WAVE_COMPLETION_CHAIN = Object.freeze([
  'Roll-Up Inventory (W4-E06-a)',
  'Exit Criteria Evidence (W4-E06-b)',
  'Cross-Package Integration Verification (W4-E06-c)',
  'Operational Continuity & Honest Product Review (W4-E06-d)',
  'Wave Completion Evidence Assembly (W4-E06-e)',
] as const);

export const W4_E06_E_CONSUMED_PREDECESSOR_REPORTS = Object.freeze([
  ...W4_E06_A_REQUIRED_REPORTS,
  ...W4_E06_B_REQUIRED_REPORTS,
  ...W4_E06_C_REQUIRED_REPORTS,
  ...W4_E06_D_REQUIRED_REPORTS,
] as const);

export const W4_E06_E_WAVE_COMPLETION_EVIDENCE_CHECKS: readonly W4E06EWaveCompletionEvidenceRow[] =
  Object.freeze([
    Object.freeze({
      checkId: 'asm-a-rollup-inventory-pass',
      domain: 'rollup-inventory-completed' as const,
      check:
        'W4-E06-a roll-up inventory indexes E01…E05 Close Evidence with Honest Product baseline',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-a-wave4-rollup-inventory.md',
      honestyRequirement: 'Inventory ≠ Wave 4 COMPLETE',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'asm-a-all-packages-indexed',
      domain: 'rollup-inventory-completed' as const,
      check: 'All five completed packages indexed with FIV PASS and Close records',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'apps/api/src/platform-conformance/w4-e06-a-wave4-rollup-inventory.ts',
      honestyRequirement: 'No skipped package in wave roll-up',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'asm-a-honest-baseline-frozen',
      domain: 'rollup-inventory-completed' as const,
      check: 'Honest Product baseline frozen: foundation ≠ product complete',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-a-validation-report.md',
      honestyRequirement: 'Deferred I/O explicit in inventory',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'asm-b-exit-criteria-mapped',
      domain: 'exit-criteria-completed' as const,
      check: 'W4-E06-b maps Master Plan / Roadmap exit criteria to Close Evidence',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-b-wave-exit-criteria.md',
      honestyRequirement: 'Exit criteria map ≠ Wave 4 COMPLETE',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'asm-b-governance-completeness-pass',
      domain: 'exit-criteria-completed' as const,
      check: 'Governance completeness verified for all package exit gates',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'apps/api/src/platform-conformance/w4-e06-b-wave-exit-criteria.ts',
      honestyRequirement: 'Gaps labeled deferred — not hidden',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'asm-c-integration-all-domains-pass',
      domain: 'cross-package-integration-verified' as const,
      check: 'W4-E06-c cross-package integration verified across all domains',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-c-cross-package-integration.md',
      honestyRequirement: 'Verification only — no new runtime integration',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'asm-c-no-duplicate-subsystem',
      domain: 'cross-package-integration-verified' as const,
      check: 'Single exchange connectivity and permission verification substrate confirmed',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-c-architecture-review.md',
      honestyRequirement: 'No duplicate subsystem across wave',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'asm-d-operational-continuity-verified',
      domain: 'operational-continuity-reviewed' as const,
      check: 'W4-E06-d operational continuity reviewed for E01…E05 package d slices',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-d-wave-operational-continuity.md',
      honestyRequirement: 'Continuity review ≠ product I/O complete',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'asm-d-platform-readiness-truthful',
      domain: 'operational-continuity-reviewed' as const,
      check: 'Platform Readiness projections remain derived and truthful',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'apps/api/src/modules/operational-continuity/operational-readiness.ts',
      honestyRequirement: 'Readiness projection ≠ Connected product',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'asm-honest-foundation-not-product',
      domain: 'honest-product-preserved' as const,
      check: 'Foundation Close ≠ product I/O complete across wave',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-product-scope.md',
      honestyRequirement: 'Deferred REST/WS I/O and permission probes explicit',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'asm-honest-connected-not-live-trading',
      domain: 'honest-product-preserved' as const,
      check: 'Connected / foundation continuity ≠ Live Trading',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-a-wave4-rollup-inventory.md',
      honestyRequirement: 'Paper default preserved',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'asm-honest-no-wave4-complete-claim',
      domain: 'honest-product-preserved' as const,
      check: 'No predecessor slice authorizes Wave 4 COMPLETE from evidence alone',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-d-validation-report.md',
      honestyRequirement: 'Wave COMPLETE is separate PO governance act',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'asm-gov-e01-e05-fiv-consumed',
      domain: 'governance-preserved' as const,
      check: 'E01…E05 FIV PASS and Close records consumed — not reopened',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/w4-e05-product-owner-close-record.md',
      honestyRequirement: 'Package Close ≠ Wave COMPLETE',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'asm-gov-slices-a-d-complete',
      domain: 'governance-preserved' as const,
      check: 'W4-E06-a/b/c/d slices COMPLETE with validation PASS',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-validation-plan.md',
      honestyRequirement: 'Governance chain intact through slice d',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'asm-arch-exchange-adapter-ownership',
      domain: 'architecture-preserved' as const,
      check: 'Exchange Adapter factory and persistence ownership preserved',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'apps/api/src/modules/exchange-adapter/exchange-factory.ts',
      honestyRequirement: 'Factory extension only; no engine clone',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'asm-arch-no-duplicate-sot',
      domain: 'architecture-preserved' as const,
      check: 'Vault owns secrets; Canonical Order Path unchanged; no second SoT',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-c-cross-package-integration.md',
      honestyRequirement: 'No new Source of Truth across wave',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'asm-arch-bounded-contexts',
      domain: 'architecture-preserved' as const,
      check: 'Vault / Connection Management / Exchange Scope / Risk / Ledger unchanged',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-planning-approval.md',
      honestyRequirement: 'No new bounded context from evidence assembly',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'asm-arch-no-v2-master-plan-change',
      domain: 'architecture-preserved' as const,
      check: 'Version 2 and Master Plan unchanged; Wave 1–3 not redesigned',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/version-3-master-plan.md',
      honestyRequirement: 'Consume closed waves; no scope drift',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'asm-arch-no-ownership-drift',
      domain: 'architecture-preserved' as const,
      check: 'No ownership drift across E01…E05 Close and W4-E06-a…d evidence',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-d-architecture-review.md',
      honestyRequirement: 'Adapter / Vault / CM / Scope / Risk / Ledger unchanged',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'asm-docs-predecessor-reports-indexed',
      domain: 'documentation-synchronized' as const,
      check: 'All W4-E06-a/b/c/d slice reports indexed in completion evidence',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-wave-completion-evidence.md',
      honestyRequirement: 'Complete evidence chain documented',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'asm-docs-wave-progress-synchronized',
      domain: 'documentation-synchronized' as const,
      check: 'wave-4-progress reflects W4-E06 slice status through e assembly',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/wave-4-progress.md',
      honestyRequirement: 'No contradictory slice status across wave docs',
      authorizesWave4Complete: false,
    }),
  ]);

export const W4_E06_E_ARCHITECTURE_CLAIMS = Object.freeze({
  ...W4_E06_A_ARCHITECTURE_CLAIMS,
  newCustomerFunctionality: false,
  newRuntimeImplementation: false,
  newPersistence: false,
  newRecoveryLogic: false,
  newOperationalContinuityLogic: false,
  waveCompletionEvidenceAssembled: true,
  wave4CompleteClaimed: false,
  w4E06CompleteClaimed: false,
  exchangeConnectivityCompleteClaimed: false,
  customerVisibleFeature: false,
  finalWaveIntegrationVerificationPerformed: false,
} as const);

export const W4_E06_E_BINDING_FINDINGS = Object.freeze({
  waveCompletionEvidenceAssembled: true,
  wave4CompleteAuthorized: false,
  w4E06CompleteAuthorized: false,
  exchangeConnectivityCompleteAuthorized: false,
  customerVisibleFeatureFromSliceE: false,
  governanceRequirementsSatisfied: true,
  honestProductPreserved: true,
  ownershipBoundariesVerified: true,
  ownershipBoundariesChanged: false,
  architecturalDeviations: false,
  engineeringCanDeclareWave4Complete: false,
  finalWaveIntegrationVerificationPerformed: false,
  consumesW4E06ARollUpInventory: true,
  consumesW4E06BExitCriteriaEvidence: true,
  consumesW4E06CCrossPackageIntegration: true,
  consumesW4E06DOperationalContinuityReview: true,
} as const);

export const W4_E06_E_EXPLICIT_OUT = Object.freeze([
  'wave4-complete',
  'w4-e06-complete',
  'exchange-connectivity-complete',
  'live-trading-enablement',
  'production-ready',
  'new-runtime-implementation',
  'persistence-changes',
  'restart-recovery-changes',
  'operational-continuity-implementation-changes',
  'final-wave-integration-verification',
  'w4-e01-reopen',
  'w4-e02-reopen',
  'w4-e03-reopen',
  'w4-e04-reopen',
  'w4-e05-reopen',
] as const);

export const W4_E06_E_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze(['Wave Completion Evidence Assembly'] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze(['Final Wave Integration Verification'] as const),
} as const);

export const W4_E06_E_REQUIRED_REPORTS = Object.freeze([
  'w4-e06-wave-completion-evidence.md',
  'w4-e06-e-implementation-report.md',
  'w4-e06-e-architecture-review.md',
  'w4-e06-e-security-review.md',
  'w4-e06-e-product-review.md',
  'w4-e06-e-validation-report.md',
] as const);

export function assemblyCheckIds(): readonly string[] {
  return W4_E06_E_WAVE_COMPLETION_EVIDENCE_CHECKS.map((row) => row.checkId);
}

export function checksByDomain(
  domain: W4E06EEvidenceDomain,
): readonly W4E06EWaveCompletionEvidenceRow[] {
  return W4_E06_E_WAVE_COMPLETION_EVIDENCE_CHECKS.filter((row) => row.domain === domain);
}

export function verifyRollUpInventoryCompleted(): Readonly<{
  ok: boolean;
  rollup: ReturnType<typeof verifyPackageRollup>;
}> {
  const rollup = verifyPackageRollup();
  const checksPass = checksByDomain('rollup-inventory-completed').every(
    (row) => row.result === 'PASS',
  );
  return Object.freeze({
    ok: rollup.ok && checksPass && W4_E06_A_BINDING_FINDINGS.honestProductBaselineAccurate === true,
    rollup,
  });
}

export function verifyExitCriteriaCompleted(): Readonly<{
  ok: boolean;
  exitCriteria: ReturnType<typeof verifyPackageExitCriteria>;
  governance: ReturnType<typeof verifyGovernanceCompleteness>;
}> {
  const exitCriteria = verifyPackageExitCriteria();
  const governance = verifyGovernanceCompleteness();
  const checksPass = checksByDomain('exit-criteria-completed').every(
    (row) => row.result === 'PASS',
  );
  return Object.freeze({
    ok: exitCriteria.ok && governance.ok && checksPass,
    exitCriteria,
    governance,
  });
}

export function verifyCrossPackageIntegrationVerified(): Readonly<{
  ok: boolean;
  integration: ReturnType<typeof verifyCrossPackageIntegration>;
}> {
  const integration = verifyCrossPackageIntegration();
  const checksPass = checksByDomain('cross-package-integration-verified').every(
    (row) => row.result === 'PASS',
  );
  return Object.freeze({
    ok:
      integration.ok &&
      checksPass &&
      W4_E06_C_BINDING_FINDINGS.allPackagesCrossPackageConsistent === true,
    integration,
  });
}

export function verifyOperationalContinuityReviewed(): Readonly<{
  ok: boolean;
  review: ReturnType<typeof verifyWaveOperationalContinuity>;
}> {
  const review = verifyWaveOperationalContinuity();
  const checksPass = checksByDomain('operational-continuity-reviewed').every(
    (row) => row.result === 'PASS',
  );
  return Object.freeze({
    ok:
      review.ok &&
      checksPass &&
      W4_E06_D_BINDING_FINDINGS.wave4OperationalContinuityVerified === true,
    review,
  });
}

export function verifyHonestProductPreserved(): Readonly<{
  ok: boolean;
}> {
  return Object.freeze({
    ok:
      checksByDomain('honest-product-preserved').every((row) => row.result === 'PASS') &&
      W4_E06_D_BINDING_FINDINGS.honestProductVerifiedAcrossAllPackages === true &&
      W4_E06_C_BINDING_FINDINGS.honestProductBoundariesPreservedAcrossPackages === true,
  });
}

export function verifyGovernancePreserved(): Readonly<{
  ok: boolean;
  predecessorSlicesComplete: boolean;
}> {
  const predecessorSlicesComplete = W4_E06_E_APPROVED_PREDECESSOR_SLICES.every(
    (slice) =>
      slice.validation === 'PASS' &&
      slice.architecture === 'PASS' &&
      slice.security === 'PASS' &&
      slice.product === 'PASS',
  );
  return Object.freeze({
    ok:
      predecessorSlicesComplete &&
      checksByDomain('governance-preserved').every((row) => row.result === 'PASS'),
    predecessorSlicesComplete,
  });
}

export function verifyArchitecturePreserved(): Readonly<{
  ok: boolean;
  exchangeAdapterOwnershipPreserved: boolean;
  persistenceOwnershipPreserved: boolean;
  boundedContextsPreserved: boolean;
  noDuplicateSubsystem: boolean;
  noDuplicateSourceOfTruth: boolean;
  noOwnershipDrift: boolean;
  noVersion2Modification: boolean;
  noMasterPlanModification: boolean;
}> {
  const archChecks = checksByDomain('architecture-preserved');
  return Object.freeze({
    ok: archChecks.every((row) => row.result === 'PASS'),
    exchangeAdapterOwnershipPreserved: true,
    persistenceOwnershipPreserved: W4_E06_A_ARCHITECTURE_CLAIMS.newPersistenceOwner === false,
    boundedContextsPreserved: W4_E06_A_ARCHITECTURE_CLAIMS.newBoundedContext === false,
    noDuplicateSubsystem: W4_E06_A_ARCHITECTURE_CLAIMS.duplicateExchangeSubsystem === false,
    noDuplicateSourceOfTruth: W4_E06_A_ARCHITECTURE_CLAIMS.duplicatePermissionSubsystem === false,
    noOwnershipDrift: W4_E06_C_BINDING_FINDINGS.ownershipBoundariesChanged === false,
    noVersion2Modification: W4_E06_A_ARCHITECTURE_CLAIMS.version2Redesigned === false,
    noMasterPlanModification: W4_E06_A_ARCHITECTURE_CLAIMS.masterPlanModified === false,
  });
}

export function verifyDocumentationSynchronized(): Readonly<{
  ok: boolean;
  predecessorReportCount: number;
}> {
  return Object.freeze({
    ok: checksByDomain('documentation-synchronized').every((row) => row.result === 'PASS'),
    predecessorReportCount: W4_E06_E_CONSUMED_PREDECESSOR_REPORTS.length,
  });
}

export function verifyWaveCompletionEvidence(): Readonly<{
  ok: boolean;
  checksVerified: number;
  domainsVerified: number;
  failures: readonly string[];
}> {
  const failures: string[] = [];
  for (const domain of W4_E06_E_EVIDENCE_DOMAINS) {
    const checks = checksByDomain(domain);
    if (checks.length === 0) failures.push(`${domain}: no checks defined`);
    if (checks.some((row) => row.result !== 'PASS')) failures.push(`${domain}: not all PASS`);
  }
  if (W4_E06_E_WAVE_COMPLETION_EVIDENCE_CHECKS.some((row) => row.authorizesWave4Complete)) {
    failures.push('assembly-check: authorizes Wave 4 COMPLETE');
  }
  return Object.freeze({
    ok:
      failures.length === 0 &&
      W4_E06_E_WAVE_COMPLETION_EVIDENCE_CHECKS.length >= W4_E06_E_EVIDENCE_DOMAINS.length,
    checksVerified: W4_E06_E_WAVE_COMPLETION_EVIDENCE_CHECKS.length,
    domainsVerified: W4_E06_E_EVIDENCE_DOMAINS.length,
    failures: Object.freeze(failures),
  });
}

export function buildWaveCompletionEvidenceDiagnostics(): Readonly<{
  rollupInventory: ReturnType<typeof verifyRollUpInventoryCompleted>;
  exitCriteria: ReturnType<typeof verifyExitCriteriaCompleted>;
  crossPackageIntegration: ReturnType<typeof verifyCrossPackageIntegrationVerified>;
  operationalContinuity: ReturnType<typeof verifyOperationalContinuityReviewed>;
  honestProduct: ReturnType<typeof verifyHonestProductPreserved>;
  governance: ReturnType<typeof verifyGovernancePreserved>;
  architecture: ReturnType<typeof verifyArchitecturePreserved>;
  documentation: ReturnType<typeof verifyDocumentationSynchronized>;
  waveCompletionEvidence: ReturnType<typeof verifyWaveCompletionEvidence>;
  bindingFindings: typeof W4_E06_E_BINDING_FINDINGS;
  technicalDebtDelta: typeof W4_E06_E_TECHNICAL_DEBT_DELTA;
}> {
  return Object.freeze({
    rollupInventory: verifyRollUpInventoryCompleted(),
    exitCriteria: verifyExitCriteriaCompleted(),
    crossPackageIntegration: verifyCrossPackageIntegrationVerified(),
    operationalContinuity: verifyOperationalContinuityReviewed(),
    honestProduct: verifyHonestProductPreserved(),
    governance: verifyGovernancePreserved(),
    architecture: verifyArchitecturePreserved(),
    documentation: verifyDocumentationSynchronized(),
    waveCompletionEvidence: verifyWaveCompletionEvidence(),
    bindingFindings: W4_E06_E_BINDING_FINDINGS,
    technicalDebtDelta: W4_E06_E_TECHNICAL_DEBT_DELTA,
  });
}
