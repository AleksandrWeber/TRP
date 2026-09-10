/**
 * W5-N19-a — Notification Retry Scheduling Conformance Registry.
 *
 * Validates the canonical platform retry scheduling inventory and Honest Product baseline.
 * Discovery and evidence assembly only — no runtime behaviour changes.
 */

import {
  W5_N19_A_ARCHITECTURE_CLAIMS,
  W5_N19_A_BINDING_FINDINGS,
  W5_N19_A_HONEST_PRODUCT_BASELINE,
  W5_N19_A_SLICE_ID,
  W5_N19_A_SUBSTRATE_OWNERS,
  W5_N19_A_RETRY_SCHEDULING_INVENTORY,
  W5_N19_A_TECHNICAL_DEBT_DELTA,
  rowsByKind,
  rowsHonestyBoundaries,
} from './w5-n19-a-retry-scheduling-inventory';

export const W5_N19_A_CONFORMANCE_SLICE_ID = W5_N19_A_SLICE_ID;

export const W5_N19_A_REQUIRED_REPORTS = Object.freeze([
  'w5-n19-a-retry-scheduling-inventory.md',
  'w5-n19-a-implementation-report.md',
  'w5-n19-a-architecture-review.md',
  'w5-n19-a-security-review.md',
  'w5-n19-a-product-review.md',
  'w5-n19-a-validation-report.md',
] as const);

export function verifyInventoryCompleteness(): Readonly<{
  ok: boolean;
  rowCount: number;
  noRowAuthorizesRetrySchedulingFunctional: boolean;
  noRowAuthorizesW5N19Complete: boolean;
  requiredOwnershipRowsPresent: boolean;
}> {
  const ownershipIds = new Set(rowsByKind('ownership').map((row) => row.artifactId));
  const requiredOwnership = [
    'own-platform-retry-scheduling-layer',
    'own-notification-delivery-domain',
    'own-pc06-routing-delivery',
    'own-w5-n18-retry-execution-consume',
    'own-w5-n12-scheduler-foundation-consume',
    'own-w5-n13-retry-foundation-consume',
    'own-w5-n17-delivery-reliability-consume',
    'own-secret-vault-consume',
    'own-connection-management-consume',
    'own-workspace-isolation-notifications',
    'own-notification-durable-queue',
    'own-honest-product-boundaries',
  ];
  const requiredOwnershipRowsPresent = requiredOwnership.every((id) => ownershipIds.has(id));
  const noRowAuthorizesRetrySchedulingFunctional = W5_N19_A_RETRY_SCHEDULING_INVENTORY.every(
    (row) => !row.authorizesRetrySchedulingFunctional,
  );
  const noRowAuthorizesW5N19Complete = W5_N19_A_RETRY_SCHEDULING_INVENTORY.every(
    (row) => !row.authorizesW5N19Complete,
  );
  return Object.freeze({
    ok:
      W5_N19_A_RETRY_SCHEDULING_INVENTORY.length >= 50 &&
      noRowAuthorizesRetrySchedulingFunctional &&
      noRowAuthorizesW5N19Complete &&
      requiredOwnershipRowsPresent,
    rowCount: W5_N19_A_RETRY_SCHEDULING_INVENTORY.length,
    noRowAuthorizesRetrySchedulingFunctional,
    noRowAuthorizesW5N19Complete,
    requiredOwnershipRowsPresent,
  });
}

export function verifyHonestProductBaseline(): Readonly<{
  ok: boolean;
  noCustomerVisibleImplemented: boolean;
  infrastructureDocumented: boolean;
  plannedExplicit: boolean;
  notImplementedExplicit: boolean;
  retrySchedulingNotAuthorized: boolean;
  deliveryOnlyNotControlPlane: boolean;
}> {
  const implemented = W5_N19_A_HONEST_PRODUCT_BASELINE.implementedCapabilities;
  const noCustomerVisibleImplemented =
    implemented.length === 1 && implemented[0]?.includes('None') === true;
  const infrastructureDocumented =
    W5_N19_A_HONEST_PRODUCT_BASELINE.infrastructureCapabilities.length >= 8;
  const plannedExplicit = W5_N19_A_HONEST_PRODUCT_BASELINE.plannedCapabilities.length >= 4;
  const notImplementedExplicit =
    W5_N19_A_HONEST_PRODUCT_BASELINE.notYetImplementedCapabilities.length >= 5;
  const retrySchedulingNotAuthorized =
    !W5_N19_A_BINDING_FINDINGS.retrySchedulingFunctionalAuthorized;
  const deliveryOnlyNotControlPlane = !W5_N19_A_ARCHITECTURE_CLAIMS.notificationControlPlane;
  return Object.freeze({
    ok:
      noCustomerVisibleImplemented &&
      infrastructureDocumented &&
      plannedExplicit &&
      notImplementedExplicit &&
      retrySchedulingNotAuthorized &&
      deliveryOnlyNotControlPlane,
    noCustomerVisibleImplemented,
    infrastructureDocumented,
    plannedExplicit,
    notImplementedExplicit,
    retrySchedulingNotAuthorized,
    deliveryOnlyNotControlPlane,
  });
}

export function verifyArchitectureIntegrity(): Readonly<{
  ok: boolean;
  ownershipUnchanged: boolean;
  noDuplicateSubsystem: boolean;
  noSchedulerPlatform: boolean;
  noMasterPlanChange: boolean;
  exchangeAdapterUntouched: boolean;
  notificationControlPlaneForbidden: boolean;
}> {
  const ownershipUnchanged = !W5_N19_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged;
  const noDuplicateSubsystem =
    !W5_N19_A_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem &&
    !W5_N19_A_ARCHITECTURE_CLAIMS.duplicateSchedulerSubsystem &&
    !W5_N19_A_ARCHITECTURE_CLAIMS.duplicateRoutingEngine;
  const noSchedulerPlatform =
    !W5_N19_A_ARCHITECTURE_CLAIMS.schedulerPlatformIntroduced &&
    !W5_N19_A_ARCHITECTURE_CLAIMS.workflowEngineIntroduced &&
    !W5_N19_A_ARCHITECTURE_CLAIMS.retryPlatformIntroduced &&
    !W5_N19_A_ARCHITECTURE_CLAIMS.eventBusProductIntroduced &&
    !W5_N19_A_ARCHITECTURE_CLAIMS.orchestrationPlatformIntroduced;
  const noMasterPlanChange = !W5_N19_A_ARCHITECTURE_CLAIMS.masterPlanModified;
  const exchangeAdapterUntouched = W5_N19_A_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched;
  const notificationControlPlaneForbidden = !W5_N19_A_ARCHITECTURE_CLAIMS.notificationControlPlane;
  return Object.freeze({
    ok:
      ownershipUnchanged &&
      noDuplicateSubsystem &&
      noSchedulerPlatform &&
      noMasterPlanChange &&
      exchangeAdapterUntouched &&
      notificationControlPlaneForbidden,
    ownershipUnchanged,
    noDuplicateSubsystem,
    noSchedulerPlatform,
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
    'own-platform-retry-scheduling-layer',
    'own-notification-delivery-domain',
    'own-pc06-routing-delivery',
    'own-secret-vault-consume',
    'own-connection-management-consume',
    'own-notification-durable-queue',
    'own-w5-n18-retry-execution-consume',
  ];
  const coreOwnership = ownershipRows.filter((row) => coreOwnershipIds.includes(row.artifactId));
  const substrateOwnersFrozen = coreOwnership.every((row) =>
    (W5_N19_A_SUBSTRATE_OWNERS as readonly string[]).includes(row.owner),
  );
  return Object.freeze({
    ok:
      W5_N19_A_BINDING_FINDINGS.ownershipBoundariesVerified &&
      !W5_N19_A_BINDING_FINDINGS.ownershipBoundariesChanged &&
      !W5_N19_A_ARCHITECTURE_CLAIMS.newPersistenceOwner &&
      substrateOwnersFrozen,
    substrateOwnersFrozen,
    ownershipVerified: W5_N19_A_BINDING_FINDINGS.ownershipBoundariesVerified,
    newPersistenceOwner: W5_N19_A_ARCHITECTURE_CLAIMS.newPersistenceOwner,
  });
}

export function verifyHonestyBoundaries(): Readonly<{
  ok: boolean;
  boundaryCount: number;
  retrySchedulingNotRuntime: boolean;
  retryExecutionNotRetryScheduling: boolean;
  schedulerFoundationNotPlatform: boolean;
}> {
  const boundaries = rowsHonestyBoundaries();
  const ids = new Set(boundaries.map((row) => row.artifactId));
  const retrySchedulingNotRuntime = ids.has('honesty-retry-scheduling-not-runtime');
  const retryExecutionNotRetryScheduling = ids.has('honesty-retry-execution-not-retry-scheduling');
  const schedulerFoundationNotPlatform = ids.has(
    'honesty-scheduler-foundation-not-scheduler-platform',
  );
  return Object.freeze({
    ok:
      boundaries.length >= 4 &&
      retrySchedulingNotRuntime &&
      retryExecutionNotRetryScheduling &&
      schedulerFoundationNotPlatform,
    boundaryCount: boundaries.length,
    retrySchedulingNotRuntime,
    retryExecutionNotRetryScheduling,
    schedulerFoundationNotPlatform,
  });
}

export function buildRetrySchedulingDiagnostics(): Readonly<{
  inventory: ReturnType<typeof verifyInventoryCompleteness>;
  honestProduct: ReturnType<typeof verifyHonestProductBaseline>;
  architecture: ReturnType<typeof verifyArchitectureIntegrity>;
  ownership: ReturnType<typeof verifyOwnershipBoundaries>;
  honesty: ReturnType<typeof verifyHonestyBoundaries>;
  technicalDebtDelta: typeof W5_N19_A_TECHNICAL_DEBT_DELTA;
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
    technicalDebtDelta: W5_N19_A_TECHNICAL_DEBT_DELTA,
    ok:
      inventory.ok &&
      honestProduct.ok &&
      architecture.ok &&
      ownership.ok &&
      honesty.ok &&
      !W5_N19_A_BINDING_FINDINGS.retrySchedulingFunctionsAfterSliceA,
  });
}
