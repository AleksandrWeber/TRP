/**
 * W4-E06-a — Wave 4 Roll-Up Conformance Registry.
 *
 * Validates the canonical Wave 4 inventory and Honest Product baseline.
 * Governance and evidence assembly only — no runtime behaviour changes.
 */

import {
  W4_E06_A_ARCHITECTURE_CLAIMS,
  W4_E06_A_BINDING_FINDINGS,
  W4_E06_A_COMPLETED_PACKAGE_IDS,
  W4_E06_A_HONEST_PRODUCT_BASELINE,
  W4_E06_A_PACKAGE_GOVERNANCE,
  W4_E06_A_SLICE_ID,
  W4_E06_A_TECHNICAL_DEBT_DELTA,
  W4_E06_A_WAVE_CAPABILITY_INVENTORY,
  verifyAllPackagesGovernance,
} from './w4-e06-a-wave4-rollup-inventory';

export const W4_E06_A_ROLLUP_SLICE_ID = W4_E06_A_SLICE_ID;

export const W4_E06_A_REQUIRED_REPORTS = Object.freeze([
  'w4-e06-a-wave4-rollup-inventory.md',
  'w4-e06-a-implementation-report.md',
  'w4-e06-a-architecture-review.md',
  'w4-e06-a-security-review.md',
  'w4-e06-a-product-review.md',
  'w4-e06-a-validation-report.md',
] as const);

export const W4_E06_A_CONSUMED_CLOSE_RECORDS = Object.freeze(
  W4_E06_A_PACKAGE_GOVERNANCE.map((row) => row.closeRecordPath),
);

export const W4_E06_A_CONSUMED_FIV_REPORTS = Object.freeze(
  W4_E06_A_PACKAGE_GOVERNANCE.map((row) => row.fivPath),
);

export function verifyPackageRollup(): Readonly<{
  ok: boolean;
  allPackagesIndexed: boolean;
  governance: ReturnType<typeof verifyAllPackagesGovernance>;
}> {
  const governance = verifyAllPackagesGovernance();
  return Object.freeze({
    ok:
      governance.ok &&
      W4_E06_A_COMPLETED_PACKAGE_IDS.length === 5 &&
      W4_E06_A_PACKAGE_GOVERNANCE.length === 5,
    allPackagesIndexed: W4_E06_A_PACKAGE_GOVERNANCE.length === 5,
    governance,
  });
}

export function verifyHonestProductBaseline(): Readonly<{
  ok: boolean;
  noCustomerVisibleImplemented: boolean;
  infrastructureDocumented: boolean;
  deferredExplicit: boolean;
  wave4CompleteNotAuthorized: boolean;
}> {
  const implemented = W4_E06_A_HONEST_PRODUCT_BASELINE.implementedCapabilities;
  const noCustomerVisibleImplemented =
    implemented.length === 1 && implemented[0]?.includes('None') === true;
  const infrastructureDocumented =
    W4_E06_A_HONEST_PRODUCT_BASELINE.infrastructureCapabilities.length >= 5;
  const deferredExplicit =
    W4_E06_A_HONEST_PRODUCT_BASELINE.notYetImplementedCapabilities.length >= 5;
  const wave4CompleteNotAuthorized = !W4_E06_A_BINDING_FINDINGS.wave4CompleteAuthorized;
  return Object.freeze({
    ok:
      noCustomerVisibleImplemented &&
      infrastructureDocumented &&
      deferredExplicit &&
      wave4CompleteNotAuthorized &&
      W4_E06_A_BINDING_FINDINGS.honestProductBaselineAccurate,
    noCustomerVisibleImplemented,
    infrastructureDocumented,
    deferredExplicit,
    wave4CompleteNotAuthorized,
  });
}

export function verifyArchitectureIntegrity(): Readonly<{
  ok: boolean;
  ownershipUnchanged: boolean;
  noDuplicateSubsystem: boolean;
  noMasterPlanChange: boolean;
  noPackageReopen: boolean;
}> {
  const ownershipUnchanged = !W4_E06_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged;
  const noDuplicateSubsystem =
    !W4_E06_A_ARCHITECTURE_CLAIMS.duplicateExchangeSubsystem &&
    !W4_E06_A_ARCHITECTURE_CLAIMS.duplicatePermissionSubsystem &&
    !W4_E06_A_ARCHITECTURE_CLAIMS.engineClonePerVenue;
  const noMasterPlanChange = !W4_E06_A_ARCHITECTURE_CLAIMS.masterPlanModified;
  const noPackageReopen =
    !W4_E06_A_ARCHITECTURE_CLAIMS.w4E01Reopened &&
    !W4_E06_A_ARCHITECTURE_CLAIMS.w4E02Reopened &&
    !W4_E06_A_ARCHITECTURE_CLAIMS.w4E03Reopened &&
    !W4_E06_A_ARCHITECTURE_CLAIMS.w4E04Reopened &&
    !W4_E06_A_ARCHITECTURE_CLAIMS.w4E05Reopened;
  return Object.freeze({
    ok: ownershipUnchanged && noDuplicateSubsystem && noMasterPlanChange && noPackageReopen,
    ownershipUnchanged,
    noDuplicateSubsystem,
    noMasterPlanChange,
    noPackageReopen,
  });
}

export function verifyInventoryCompleteness(): Readonly<{
  ok: boolean;
  capabilityCount: number;
  noRowAuthorizesWave4Complete: boolean;
}> {
  const noRowAuthorizesWave4Complete = W4_E06_A_WAVE_CAPABILITY_INVENTORY.every(
    (row) => !row.authorizesWave4Complete,
  );
  return Object.freeze({
    ok: W4_E06_A_WAVE_CAPABILITY_INVENTORY.length > 0 && noRowAuthorizesWave4Complete,
    capabilityCount: W4_E06_A_WAVE_CAPABILITY_INVENTORY.length,
    noRowAuthorizesWave4Complete,
  });
}

export function buildRollupDiagnostics(): Readonly<{
  packageRollup: ReturnType<typeof verifyPackageRollup>;
  honestProduct: ReturnType<typeof verifyHonestProductBaseline>;
  architecture: ReturnType<typeof verifyArchitectureIntegrity>;
  inventory: ReturnType<typeof verifyInventoryCompleteness>;
  bindingFindings: typeof W4_E06_A_BINDING_FINDINGS;
  technicalDebtDelta: typeof W4_E06_A_TECHNICAL_DEBT_DELTA;
}> {
  return Object.freeze({
    packageRollup: verifyPackageRollup(),
    honestProduct: verifyHonestProductBaseline(),
    architecture: verifyArchitectureIntegrity(),
    inventory: verifyInventoryCompleteness(),
    bindingFindings: W4_E06_A_BINDING_FINDINGS,
    technicalDebtDelta: W4_E06_A_TECHNICAL_DEBT_DELTA,
  });
}

export {
  W4_E06_A_ARCHITECTURE_CLAIMS,
  W4_E06_A_BINDING_FINDINGS,
  W4_E06_A_HONEST_PRODUCT_BASELINE,
  W4_E06_A_TECHNICAL_DEBT_DELTA,
};
