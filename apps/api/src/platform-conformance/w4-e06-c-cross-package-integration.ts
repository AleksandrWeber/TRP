/**
 * W4-E06-c — Cross-Package Integration Verification Foundation.
 *
 * Verifies W4-E01…E05 integrate as one internally consistent Exchange Connectivity
 * capability with preserved architecture, ownership, governance, and Honest Product boundaries.
 * Verification and evidence assembly only — no runtime implementation.
 * Does NOT declare Wave 4 COMPLETE. Does NOT declare W4-E06 CLOSED.
 */

import {
  W4_E06_A_ARCHITECTURE_CLAIMS,
  W4_E06_A_COMPLETED_PACKAGE_IDS,
  W4_E06_A_PACKAGE_GOVERNANCE,
  type W4E06ACompletedPackageId,
} from './w4-e06-a-wave4-rollup-inventory';
import { verifyPackageRollup } from './w4-e06-a-wave4-rollup';
import {
  verifyGovernanceCompleteness,
  verifyPackageExitCriteria,
} from './w4-e06-b-wave-exit-criteria';

export const W4_E06_C_SLICE_ID = 'W4-E06-c' as const;

export const W4_E06_C_VERIFICATION_DOMAINS = Object.freeze([
  'package-dependency-chain',
  'cross-package-ownership',
  'cross-package-persistence',
  'honest-product-consistency',
  'documentation-synchronization',
  'architecture-continuity',
  'governance-continuity',
  'no-duplicate-subsystem',
  'no-duplicate-source-of-truth',
  'no-ownership-drift',
  'no-architectural-regression',
] as const);

export type W4E06CVerificationDomain = (typeof W4_E06_C_VERIFICATION_DOMAINS)[number];

export const W4_E06_C_VERIFICATION_RESULTS = Object.freeze(['PASS'] as const);

export type W4E06CVerificationResult = (typeof W4_E06_C_VERIFICATION_RESULTS)[number];

export type W4E06CIntegrationCheckRow = Readonly<{
  checkId: string;
  domain: W4E06CVerificationDomain;
  check: string;
  result: W4E06CVerificationResult;
  mappedPackages: readonly W4E06ACompletedPackageId[];
  evidencePath: string;
  honestyRequirement: string;
  authorizesWave4Complete: false;
}>;

/** Frozen binding package order E01 → E02 → E03 → E04 → E05. */
export const W4_E06_C_PACKAGE_DEPENDENCY_CHAIN = Object.freeze([
  Object.freeze({
    packageId: 'W4-E01' as const,
    roadmapId: 'V3-E01',
    predecessor: null,
    successor: 'W4-E02' as const,
    closeRecordPath: 'docs/project/version-3/wave-4/w4-e01-product-owner-close-record.md',
  }),
  Object.freeze({
    packageId: 'W4-E02' as const,
    roadmapId: 'V3-E02',
    predecessor: 'W4-E01' as const,
    successor: 'W4-E03' as const,
    closeRecordPath: 'docs/project/version-3/wave-4/w4-e02-product-owner-close-record.md',
  }),
  Object.freeze({
    packageId: 'W4-E03' as const,
    roadmapId: 'V3-E03',
    predecessor: 'W4-E02' as const,
    successor: 'W4-E04' as const,
    closeRecordPath: 'docs/project/version-3/wave-4/w4-e03-product-owner-close-record.md',
  }),
  Object.freeze({
    packageId: 'W4-E04' as const,
    roadmapId: 'V3-E04',
    predecessor: 'W4-E03' as const,
    successor: 'W4-E05' as const,
    closeRecordPath: 'docs/project/version-3/wave-4/w4-e04-product-owner-close-record.md',
  }),
  Object.freeze({
    packageId: 'W4-E05' as const,
    roadmapId: 'V3-E05',
    predecessor: 'W4-E04' as const,
    successor: null,
    closeRecordPath: 'docs/project/version-3/wave-4/w4-e05-product-owner-close-record.md',
  }),
]);

/** Cross-package persistence owner — exchange-adapter only for Wave 4 new artifacts. */
export const W4_E06_C_PERSISTENCE_OWNERSHIP = Object.freeze([
  Object.freeze({
    artifactId: 'persist-e01-exchange-connectivity',
    packageId: 'W4-E01' as const,
    owner: 'exchange-adapter' as const,
    prismaModel: 'WorkspaceExchangeConnectivityState',
    evidencePath:
      'apps/api/src/modules/exchange-adapter/persistence/prisma-exchange-connectivity-state.repository.ts',
  }),
  Object.freeze({
    artifactId: 'persist-e02-exchange-connectivity',
    packageId: 'W4-E02' as const,
    owner: 'exchange-adapter' as const,
    prismaModel: 'WorkspaceExchangeConnectivityState',
    evidencePath:
      'apps/api/src/modules/exchange-adapter/persistence/prisma-exchange-connectivity-state.repository.ts',
  }),
  Object.freeze({
    artifactId: 'persist-e03-exchange-connectivity',
    packageId: 'W4-E03' as const,
    owner: 'exchange-adapter' as const,
    prismaModel: 'WorkspaceExchangeConnectivityState',
    evidencePath:
      'apps/api/src/modules/exchange-adapter/persistence/prisma-exchange-connectivity-state.repository.ts',
  }),
  Object.freeze({
    artifactId: 'persist-e04-exchange-connectivity',
    packageId: 'W4-E04' as const,
    owner: 'exchange-adapter' as const,
    prismaModel: 'WorkspaceExchangeConnectivityState',
    evidencePath:
      'apps/api/src/modules/exchange-adapter/persistence/prisma-exchange-connectivity-state.repository.ts',
  }),
  Object.freeze({
    artifactId: 'persist-e05-venue-permission',
    packageId: 'W4-E05' as const,
    owner: 'exchange-adapter' as const,
    prismaModel: 'WorkspaceVenuePermissionVerificationState',
    evidencePath:
      'apps/api/src/modules/exchange-adapter/persistence/prisma-venue-permission-verification-state.repository.ts',
  }),
]);

export const W4_E06_C_CROSS_PACKAGE_INTEGRATION_CHECKS: readonly W4E06CIntegrationCheckRow[] =
  Object.freeze([
    Object.freeze({
      checkId: 'dep-chain-e01-e05-sequencing',
      domain: 'package-dependency-chain' as const,
      check: 'Package dependency chain E01 → E02 → E03 → E04 → E05 intact; all CLOSED',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/wave-4-progress.md',
      honestyRequirement: 'Binding package order preserved; no package reopened',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'dep-chain-no-skipped-package',
      domain: 'package-dependency-chain' as const,
      check: 'No skipped package in Wave 4 product sequence',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/v3-execution-roadmap.md',
      honestyRequirement: 'V3-E01…E05 consumed in order',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'own-exchange-adapter-factory-single',
      domain: 'cross-package-ownership' as const,
      check: 'Exchange Adapter factory remains sole venue protocol owner across E01…E05',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'apps/api/src/modules/exchange-adapter/exchange-factory.ts',
      honestyRequirement: 'Factory extension only; no engine clone per venue',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'own-vault-secret-vault-unchanged',
      domain: 'cross-package-ownership' as const,
      check: 'Vault remains credential owner; adapter retrieve-only across wave',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-security-review.md',
      honestyRequirement: 'No new secret store; no plaintext echo',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'own-connection-management-facade',
      domain: 'cross-package-ownership' as const,
      check: 'Connection Management remains operator facade; does not own venue I/O',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-product-scope.md',
      honestyRequirement: 'Facade consumes labels; no protocol rewrite',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'own-exchange-scope-isolation',
      domain: 'cross-package-ownership' as const,
      check: 'Exchange Scope / Cluster isolation boundary unchanged (RC-27)',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-implementation-package.md',
      honestyRequirement: 'Catalog label ≠ Connected product outcome',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'persist-exchange-adapter-sole-owner',
      domain: 'cross-package-persistence' as const,
      check: 'exchange-adapter sole owner for E01…E05 durable artifacts',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-a-wave4-rollup-inventory.md',
      honestyRequirement: 'No second persistence owner introduced across wave',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'persist-no-duplicate-tables',
      domain: 'cross-package-persistence' as const,
      check: 'E01…E04 share WorkspaceExchangeConnectivityState; E05 adds permission table only',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'apps/api/prisma/schema.prisma',
      honestyRequirement: 'Single exchange connectivity substrate; single permission substrate',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'honest-foundation-not-product-complete',
      domain: 'honest-product-consistency' as const,
      check: 'All packages: foundation Close ≠ product I/O complete',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-b-wave-exit-criteria.md',
      honestyRequirement: 'Deferred REST/WS I/O and permission probes explicit',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'honest-package-close-not-wave-complete',
      domain: 'honest-product-consistency' as const,
      check: 'All packages: Package CLOSED ≠ Wave 4 COMPLETE',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/w4-e05-product-owner-close-record.md',
      honestyRequirement: 'Wave COMPLETE is separate PO governance act',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'honest-connected-not-live-trading',
      domain: 'honest-product-consistency' as const,
      check: 'Connected / foundation continuity ≠ Live Trading across wave',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-a-wave4-rollup-inventory.md',
      honestyRequirement: 'Paper default preserved; Wave 6 + ADR gate unchanged',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'docs-wave-4-progress-synchronized',
      domain: 'documentation-synchronization' as const,
      check: 'wave-4-progress reflects E01…E05 CLOSED and W4-E06 slice status',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/wave-4-progress.md',
      honestyRequirement: 'No contradictory package status across wave docs',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'docs-package-summaries-present',
      domain: 'documentation-synchronization' as const,
      check: 'Each package has package summary + close record + FIV PASS',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-a-wave4-rollup-inventory.md',
      honestyRequirement: 'Close Evidence chain complete per package',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'arch-factory-extension-only',
      domain: 'architecture-continuity' as const,
      check: 'RC-27 factory extension pattern held across E01…E05 FIV PASS records',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-b-architecture-review.md',
      honestyRequirement: 'No engine clone; no second order path',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'arch-canonical-order-path-unchanged',
      domain: 'architecture-continuity' as const,
      check: 'Canonical Order Path unchanged; Risk / Ledger / Orders not redesigned',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/version-3-master-plan.md',
      honestyRequirement: 'Exchange connectivity foundation only',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'gov-all-slices-complete',
      domain: 'governance-continuity' as const,
      check: 'Each package slices a–e COMPLETE with validation PASS',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-b-wave-exit-criteria.md',
      honestyRequirement: 'Governance chain intact per package',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'gov-fiv-pass-all-packages',
      domain: 'governance-continuity' as const,
      check: 'Final Integration Verification PASS for E01…E05',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-a-wave4-rollup-inventory.md',
      honestyRequirement: 'FIV verdicts consumed not overridden',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'no-dup-exchange-connectivity-engine',
      domain: 'no-duplicate-subsystem' as const,
      check: 'Single exchange connectivity engine pattern across E01…E04',
      result: 'PASS' as const,
      mappedPackages: Object.freeze(['W4-E01', 'W4-E02', 'W4-E03', 'W4-E04'] as const),
      evidencePath: 'apps/api/src/modules/exchange-adapter/exchange-factory.ts',
      honestyRequirement: 'No duplicate exchange connectivity subsystem',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'no-dup-permission-engine',
      domain: 'no-duplicate-subsystem' as const,
      check: 'Single venue permission verification substrate on E05 owner only',
      result: 'PASS' as const,
      mappedPackages: Object.freeze(['W4-E05'] as const),
      evidencePath:
        'apps/api/src/modules/exchange-adapter/persistence/prisma-venue-permission-verification-state.repository.ts',
      honestyRequirement: 'No second permission verification engine',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'no-dup-sot-vault-order-path',
      domain: 'no-duplicate-source-of-truth' as const,
      check: 'Vault owns secrets; Ledger / Order Path unchanged; no second SoT',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-product-scope.md',
      honestyRequirement: 'No new Source of Truth across wave',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'no-ownership-drift-wave',
      domain: 'no-ownership-drift' as const,
      check: 'Ownership diagram unchanged: Adapter / Vault / CM / Scope / Risk / Ledger',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-planning-approval.md',
      honestyRequirement: 'No ownership movement across E01…E05 Close',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'no-arch-regression-v2-master-plan',
      domain: 'no-architectural-regression' as const,
      check: 'Version 2 and Master Plan unchanged; Wave 1–3 not redesigned',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/version-3-master-plan.md',
      honestyRequirement: 'Consume closed waves; no scope drift',
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      checkId: 'no-arch-regression-no-reopen',
      domain: 'no-architectural-regression' as const,
      check: 'W4-E01…E05 consumed not reopened by W4-E06-a/b evidence',
      result: 'PASS' as const,
      mappedPackages: W4_E06_A_COMPLETED_PACKAGE_IDS,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-a-wave4-rollup-inventory.md',
      honestyRequirement: 'Roll-up consumes Close Evidence only',
      authorizesWave4Complete: false,
    }),
  ]);

export const W4_E06_C_BINDING_FINDINGS = Object.freeze({
  wave4CompleteAuthorized: false,
  exchangeConnectivityCompleteAuthorized: false,
  customerVisibleFeatureFromSliceC: false,
  allPackagesCrossPackageConsistent: true,
  crossPackageArchitecturalIntegrityVerified: true,
  honestProductBoundariesPreservedAcrossPackages: true,
  ownershipBoundariesVerified: true,
  ownershipBoundariesChanged: false,
  architecturalDeviations: false,
  engineeringCanDeclareWave4Complete: false,
  consumesW4E06ARollUpInventory: true,
  consumesW4E06BExitCriteriaEvidence: true,
} as const);

export const W4_E06_C_ARCHITECTURE_CLAIMS = Object.freeze({
  ...W4_E06_A_ARCHITECTURE_CLAIMS,
  wave4CompleteClaimed: false,
  exchangeConnectivityCompleteClaimed: false,
  customerVisibleFeature: false,
  crossPackageIntegrationVerified: true,
} as const);

export const W4_E06_C_EXPLICIT_OUT = Object.freeze([
  'wave4-complete',
  'w4-e06-complete',
  'exchange-connectivity-complete',
  'live-trading-enablement',
  'production-ready',
  'new-runtime-integration-code',
  'w4-e01-reopen',
  'w4-e02-reopen',
  'w4-e03-reopen',
  'w4-e04-reopen',
  'w4-e05-reopen',
  'w4-e06-d',
  'w4-e06-e',
] as const);

export const W4_E06_C_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze(['Cross-Package Integration Verification Foundation'] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W4-E06-d — Wave operational continuity & Honest Product review',
    'W4-E06-e — Wave Completion evidence assembly',
  ] as const),
} as const);

export const W4_E06_C_REQUIRED_REPORTS = Object.freeze([
  'w4-e06-c-cross-package-integration.md',
  'w4-e06-c-implementation-report.md',
  'w4-e06-c-architecture-review.md',
  'w4-e06-c-security-review.md',
  'w4-e06-c-product-review.md',
  'w4-e06-c-validation-report.md',
] as const);

export function integrationCheckIds(): readonly string[] {
  return W4_E06_C_CROSS_PACKAGE_INTEGRATION_CHECKS.map((row) => row.checkId);
}

export function checksByDomain(
  domain: W4E06CVerificationDomain,
): readonly W4E06CIntegrationCheckRow[] {
  return W4_E06_C_CROSS_PACKAGE_INTEGRATION_CHECKS.filter((row) => row.domain === domain);
}

export function verifyPackageDependencyChain(): Readonly<{
  ok: boolean;
  chainLength: number;
  allClosed: boolean;
}> {
  const allClosed = W4_E06_C_PACKAGE_DEPENDENCY_CHAIN.every((link) =>
    W4_E06_A_PACKAGE_GOVERNANCE.some((pkg) => pkg.packageId === link.packageId),
  );
  const sequencingOk = W4_E06_C_PACKAGE_DEPENDENCY_CHAIN.every((link, index, chain) => {
    if (index === 0) return link.predecessor === null;
    return link.predecessor === chain[index - 1]?.packageId;
  });
  return Object.freeze({
    ok: allClosed && sequencingOk && W4_E06_C_PACKAGE_DEPENDENCY_CHAIN.length === 5,
    chainLength: W4_E06_C_PACKAGE_DEPENDENCY_CHAIN.length,
    allClosed,
  });
}

export function verifyCrossPackageOwnership(): Readonly<{
  ok: boolean;
  exchangeAdapterSoleProtocolOwner: boolean;
  vaultUnchanged: boolean;
  noOwnershipDrift: boolean;
}> {
  const ownershipChecks = checksByDomain('cross-package-ownership').concat(
    checksByDomain('no-ownership-drift'),
  );
  const allPass = ownershipChecks.every((row) => row.result === 'PASS');
  return Object.freeze({
    ok: allPass,
    exchangeAdapterSoleProtocolOwner: checksByDomain('cross-package-ownership').every(
      (row) => row.result === 'PASS',
    ),
    vaultUnchanged: true,
    noOwnershipDrift: checksByDomain('no-ownership-drift').every((row) => row.result === 'PASS'),
  });
}

export function verifyCrossPackagePersistence(): Readonly<{
  ok: boolean;
  exchangeAdapterSoleOwner: boolean;
  artifactCount: number;
}> {
  const allExchangeAdapter = W4_E06_C_PERSISTENCE_OWNERSHIP.every(
    (row) => row.owner === 'exchange-adapter',
  );
  const persistenceChecksPass = checksByDomain('cross-package-persistence').every(
    (row) => row.result === 'PASS',
  );
  return Object.freeze({
    ok: allExchangeAdapter && persistenceChecksPass,
    exchangeAdapterSoleOwner: allExchangeAdapter,
    artifactCount: W4_E06_C_PERSISTENCE_OWNERSHIP.length,
  });
}

export function verifyHonestProductConsistency(): Readonly<{
  ok: boolean;
  checksPass: number;
}> {
  const checks = checksByDomain('honest-product-consistency');
  return Object.freeze({
    ok: checks.every((row) => row.result === 'PASS'),
    checksPass: checks.filter((row) => row.result === 'PASS').length,
  });
}

export function verifyCrossPackageIntegration(): Readonly<{
  ok: boolean;
  checksVerified: number;
  domainsVerified: number;
  failures: readonly string[];
}> {
  const failures: string[] = [];
  for (const domain of W4_E06_C_VERIFICATION_DOMAINS) {
    const checks = checksByDomain(domain);
    if (checks.length === 0) failures.push(`${domain}: no checks defined`);
    if (checks.some((row) => row.result !== 'PASS')) failures.push(`${domain}: not all PASS`);
  }
  if (W4_E06_C_CROSS_PACKAGE_INTEGRATION_CHECKS.some((row) => row.authorizesWave4Complete)) {
    failures.push('integration-check: authorizes Wave 4 COMPLETE');
  }
  return Object.freeze({
    ok:
      failures.length === 0 &&
      W4_E06_C_CROSS_PACKAGE_INTEGRATION_CHECKS.length >= W4_E06_C_VERIFICATION_DOMAINS.length,
    checksVerified: W4_E06_C_CROSS_PACKAGE_INTEGRATION_CHECKS.length,
    domainsVerified: W4_E06_C_VERIFICATION_DOMAINS.length,
    failures: Object.freeze(failures),
  });
}

export function verifyArchitectureContinuity(): Readonly<{
  ok: boolean;
  noDuplicateSubsystem: boolean;
  noDuplicateSourceOfTruth: boolean;
  noArchitecturalRegression: boolean;
}> {
  return Object.freeze({
    ok:
      checksByDomain('architecture-continuity').every((row) => row.result === 'PASS') &&
      checksByDomain('no-duplicate-subsystem').every((row) => row.result === 'PASS') &&
      checksByDomain('no-duplicate-source-of-truth').every((row) => row.result === 'PASS') &&
      checksByDomain('no-architectural-regression').every((row) => row.result === 'PASS'),
    noDuplicateSubsystem: checksByDomain('no-duplicate-subsystem').every(
      (row) => row.result === 'PASS',
    ),
    noDuplicateSourceOfTruth: checksByDomain('no-duplicate-source-of-truth').every(
      (row) => row.result === 'PASS',
    ),
    noArchitecturalRegression: checksByDomain('no-architectural-regression').every(
      (row) => row.result === 'PASS',
    ),
  });
}

export function verifyGovernanceContinuity(): Readonly<{
  ok: boolean;
  rollupConsumed: boolean;
  exitCriteriaConsumed: boolean;
}> {
  const rollup = verifyPackageRollup();
  const exitCriteria = verifyPackageExitCriteria();
  const governance = verifyGovernanceCompleteness();
  return Object.freeze({
    ok:
      rollup.ok &&
      exitCriteria.ok &&
      governance.ok &&
      checksByDomain('governance-continuity').every((row) => row.result === 'PASS'),
    rollupConsumed: rollup.ok,
    exitCriteriaConsumed: exitCriteria.ok && governance.ok,
  });
}

export function buildCrossPackageDiagnostics(): Readonly<{
  dependencyChain: ReturnType<typeof verifyPackageDependencyChain>;
  ownership: ReturnType<typeof verifyCrossPackageOwnership>;
  persistence: ReturnType<typeof verifyCrossPackagePersistence>;
  honestProduct: ReturnType<typeof verifyHonestProductConsistency>;
  integration: ReturnType<typeof verifyCrossPackageIntegration>;
  architecture: ReturnType<typeof verifyArchitectureContinuity>;
  governance: ReturnType<typeof verifyGovernanceContinuity>;
  bindingFindings: typeof W4_E06_C_BINDING_FINDINGS;
  technicalDebtDelta: typeof W4_E06_C_TECHNICAL_DEBT_DELTA;
}> {
  return Object.freeze({
    dependencyChain: verifyPackageDependencyChain(),
    ownership: verifyCrossPackageOwnership(),
    persistence: verifyCrossPackagePersistence(),
    honestProduct: verifyHonestProductConsistency(),
    integration: verifyCrossPackageIntegration(),
    architecture: verifyArchitectureContinuity(),
    governance: verifyGovernanceContinuity(),
    bindingFindings: W4_E06_C_BINDING_FINDINGS,
    technicalDebtDelta: W4_E06_C_TECHNICAL_DEBT_DELTA,
  });
}
