/**
 * W5-N21-a — Notification Retry Backoff Conformance Registry.
 *
 * Validates the canonical platform retry backoff inventory and Honest Product baseline.
 * Discovery and evidence assembly only — no runtime behaviour changes.
 */

import {
  W5_N21_A_ARCHITECTURE_CLAIMS,
  W5_N21_A_BINDING_FINDINGS,
  W5_N21_A_HONEST_PRODUCT_BASELINE,
  W5_N21_A_SLICE_ID,
  W5_N21_A_SUBSTRATE_OWNERS,
  W5_N21_A_RETRY_BACKOFF_INVENTORY,
  W5_N21_A_TECHNICAL_DEBT_DELTA,
  rowsByKind,
  rowsHonestyBoundaries,
} from './w5-n21-a-retry-backoff-inventory';

export const W5_N21_A_CONFORMANCE_SLICE_ID = W5_N21_A_SLICE_ID;

export const W5_N21_A_REQUIRED_REPORTS = Object.freeze([
  'w5-n21-a-retry-backoff-inventory.md',
  'w5-n21-a-implementation-report.md',
  'w5-n21-a-architecture-review.md',
  'w5-n21-a-security-review.md',
  'w5-n21-a-product-review.md',
  'w5-n21-a-validation-report.md',
] as const);

export function verifyInventoryCompleteness(): Readonly<{
  ok: boolean;
  rowCount: number;
  noRowAuthorizesRetryBackoffFunctional: boolean;
  noRowAuthorizesW5N21Complete: boolean;
  requiredOwnershipRowsPresent: boolean;
}> {
  const ownershipIds = new Set(rowsByKind('ownership').map((row) => row.artifactId));
  const requiredOwnership = [
    'own-platform-retry-backoff-layer',
    'own-notification-delivery-domain',
    'own-pc06-routing-delivery',
    'own-w5-n17-delivery-reliability-consume',
    'own-w5-n18-retry-execution-consume',
    'own-w5-n19-retry-scheduling-consume',
    'own-w5-n20-retry-policy-consume',
    'own-secret-vault-consume',
    'own-connection-management-consume',
    'own-workspace-isolation-notifications',
    'own-notification-durable-queue',
    'own-honest-product-boundaries',
  ];
  const requiredOwnershipRowsPresent = requiredOwnership.every((id) => ownershipIds.has(id));
  const noRowAuthorizesRetryBackoffFunctional = W5_N21_A_RETRY_BACKOFF_INVENTORY.every(
    (row) => !row.authorizesRetryBackoffFunctional,
  );
  const noRowAuthorizesW5N21Complete = W5_N21_A_RETRY_BACKOFF_INVENTORY.every(
    (row) => !row.authorizesW5N21Complete,
  );
  return Object.freeze({
    ok:
      W5_N21_A_RETRY_BACKOFF_INVENTORY.length >= 50 &&
      noRowAuthorizesRetryBackoffFunctional &&
      noRowAuthorizesW5N21Complete &&
      requiredOwnershipRowsPresent,
    rowCount: W5_N21_A_RETRY_BACKOFF_INVENTORY.length,
    noRowAuthorizesRetryBackoffFunctional,
    noRowAuthorizesW5N21Complete,
    requiredOwnershipRowsPresent,
  });
}

export function verifyHonestProductBaseline(): Readonly<{
  ok: boolean;
  noCustomerVisibleImplemented: boolean;
  infrastructureDocumented: boolean;
  plannedExplicit: boolean;
  notImplementedExplicit: boolean;
  retryBackoffNotAuthorized: boolean;
  deliveryOnlyNotControlPlane: boolean;
}> {
  const implemented = W5_N21_A_HONEST_PRODUCT_BASELINE.implementedCapabilities;
  const noCustomerVisibleImplemented =
    implemented.length === 1 && implemented[0]?.includes('None') === true;
  const infrastructureDocumented =
    W5_N21_A_HONEST_PRODUCT_BASELINE.infrastructureCapabilities.length >= 8;
  const plannedExplicit = W5_N21_A_HONEST_PRODUCT_BASELINE.plannedCapabilities.length >= 1;
  const notImplementedExplicit =
    W5_N21_A_HONEST_PRODUCT_BASELINE.notYetImplementedCapabilities.length >= 5;
  const retryBackoffNotAuthorized = !W5_N21_A_BINDING_FINDINGS.retryBackoffFunctionalAuthorized;
  const deliveryOnlyNotControlPlane = !W5_N21_A_ARCHITECTURE_CLAIMS.notificationControlPlane;
  return Object.freeze({
    ok:
      noCustomerVisibleImplemented &&
      infrastructureDocumented &&
      plannedExplicit &&
      notImplementedExplicit &&
      retryBackoffNotAuthorized &&
      deliveryOnlyNotControlPlane,
    noCustomerVisibleImplemented,
    infrastructureDocumented,
    plannedExplicit,
    notImplementedExplicit,
    retryBackoffNotAuthorized,
    deliveryOnlyNotControlPlane,
  });
}

export function verifyArchitectureIntegrity(): Readonly<{
  ok: boolean;
  ownershipUnchanged: boolean;
  noDuplicateSubsystem: boolean;
  noBackoffEngine: boolean;
  noMasterPlanChange: boolean;
  exchangeAdapterUntouched: boolean;
  notificationControlPlaneForbidden: boolean;
}> {
  const ownershipUnchanged = !W5_N21_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged;
  const noDuplicateSubsystem =
    !W5_N21_A_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem &&
    !W5_N21_A_ARCHITECTURE_CLAIMS.duplicateBackoffSubsystem;
  const noBackoffEngine =
    !W5_N21_A_ARCHITECTURE_CLAIMS.backoffEngineIntroduced &&
    !W5_N21_A_ARCHITECTURE_CLAIMS.retryPlatformIntroduced &&
    !W5_N21_A_ARCHITECTURE_CLAIMS.workflowEngineIntroduced &&
    !W5_N21_A_ARCHITECTURE_CLAIMS.eventBusProductIntroduced &&
    !W5_N21_A_ARCHITECTURE_CLAIMS.orchestrationPlatformIntroduced;
  const noMasterPlanChange = !W5_N21_A_ARCHITECTURE_CLAIMS.masterPlanModified;
  const exchangeAdapterUntouched = W5_N21_A_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched;
  const notificationControlPlaneForbidden = !W5_N21_A_ARCHITECTURE_CLAIMS.notificationControlPlane;
  return Object.freeze({
    ok:
      ownershipUnchanged &&
      noDuplicateSubsystem &&
      noBackoffEngine &&
      noMasterPlanChange &&
      exchangeAdapterUntouched &&
      notificationControlPlaneForbidden,
    ownershipUnchanged,
    noDuplicateSubsystem,
    noBackoffEngine,
    noMasterPlanChange,
    exchangeAdapterUntouched,
    notificationControlPlaneForbidden,
  });
}

export function verifyOwnershipBoundaries(): Readonly<{
  ok: boolean;
  substrateOwnersFrozen: boolean;
  ownershipVerified: boolean;
  newPersistenceOwner: boolean;
}> {
  const ownershipRows = rowsByKind('ownership');
  const coreOwnershipIds = [
    'own-platform-retry-backoff-layer',
    'own-notification-delivery-domain',
    'own-pc06-routing-delivery',
    'own-secret-vault-consume',
    'own-connection-management-consume',
    'own-notification-durable-queue',
    'own-w5-n17-delivery-reliability-consume',
    'own-w5-n18-retry-execution-consume',
    'own-w5-n19-retry-scheduling-consume',
    'own-w5-n20-retry-policy-consume',
  ];
  const coreOwnership = ownershipRows.filter((row) => coreOwnershipIds.includes(row.artifactId));
  const substrateOwnersFrozen = coreOwnership.every((row) =>
    (W5_N21_A_SUBSTRATE_OWNERS as readonly string[]).includes(row.owner),
  );
  return Object.freeze({
    ok:
      W5_N21_A_BINDING_FINDINGS.ownershipBoundariesVerified &&
      !W5_N21_A_BINDING_FINDINGS.ownershipBoundariesChanged &&
      !W5_N21_A_ARCHITECTURE_CLAIMS.newPersistenceOwner &&
      substrateOwnersFrozen,
    substrateOwnersFrozen,
    ownershipVerified: W5_N21_A_BINDING_FINDINGS.ownershipBoundariesVerified,
    newPersistenceOwner: W5_N21_A_ARCHITECTURE_CLAIMS.newPersistenceOwner,
  });
}

export function verifyHonestyBoundaries(): Readonly<{
  ok: boolean;
  boundaryCount: number;
  retryBackoffNotCalculation: boolean;
  noBackoffEngine: boolean;
  retryPolicyNotRetryBackoff: boolean;
}> {
  const boundaries = rowsHonestyBoundaries();
  const ids = new Set(boundaries.map((row) => row.artifactId));
  const retryBackoffNotCalculation = ids.has('honesty-retry-backoff-not-calculation');
  const noBackoffEngine = ids.has('honesty-no-backoff-engine');
  const retryPolicyNotRetryBackoff = ids.has('honesty-retry-policy-not-retry-backoff');
  return Object.freeze({
    ok:
      boundaries.length >= 4 &&
      retryBackoffNotCalculation &&
      noBackoffEngine &&
      retryPolicyNotRetryBackoff,
    boundaryCount: boundaries.length,
    retryBackoffNotCalculation,
    noBackoffEngine,
    retryPolicyNotRetryBackoff,
  });
}

export function buildRetryBackoffDiagnostics(): Readonly<{
  inventory: ReturnType<typeof verifyInventoryCompleteness>;
  honestProduct: ReturnType<typeof verifyHonestProductBaseline>;
  architecture: ReturnType<typeof verifyArchitectureIntegrity>;
  ownership: ReturnType<typeof verifyOwnershipBoundaries>;
  honesty: ReturnType<typeof verifyHonestyBoundaries>;
  technicalDebtDelta: typeof W5_N21_A_TECHNICAL_DEBT_DELTA;
  ok: boolean;
}> {
  const inventory = verifyInventoryCompleteness();
  const honestProduct = verifyHonestProductBaseline();
  const architecture = verifyArchitectureIntegrity();
  const ownership = verifyOwnershipBoundaries();
  const honesty = verifyHonestyBoundaries();
  return Object.freeze({
    inventory,
    honestProduct,
    architecture,
    ownership,
    honesty,
    technicalDebtDelta: W5_N21_A_TECHNICAL_DEBT_DELTA,
    ok:
      inventory.ok &&
      honestProduct.ok &&
      architecture.ok &&
      ownership.ok &&
      honesty.ok &&
      !W5_N21_A_BINDING_FINDINGS.retryBackoffFunctionsAfterSliceA,
  });
}
