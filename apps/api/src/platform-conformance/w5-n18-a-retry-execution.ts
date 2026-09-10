/**
 * W5-N18-a — Notification Platform Retry Execution Conformance Registry.
 *
 * Validates the canonical platform retry execution inventory and Honest Product baseline.
 * Discovery and evidence assembly only — no runtime behaviour changes.
 */

import {
  W5_N18_A_ARCHITECTURE_CLAIMS,
  W5_N18_A_BINDING_FINDINGS,
  W5_N18_A_HONEST_PRODUCT_BASELINE,
  W5_N18_A_SLICE_ID,
  W5_N18_A_SUBSTRATE_OWNERS,
  W5_N18_A_RETRY_EXECUTION_INVENTORY,
  W5_N18_A_TECHNICAL_DEBT_DELTA,
  rowsByKind,
  rowsHonestyBoundaries,
} from './w5-n18-a-retry-execution-inventory';

export const W5_N18_A_CONFORMANCE_SLICE_ID = W5_N18_A_SLICE_ID;

export const W5_N18_A_REQUIRED_REPORTS = Object.freeze([
  'w5-n18-a-retry-execution-inventory.md',
  'w5-n18-a-implementation-report.md',
  'w5-n18-a-architecture-review.md',
  'w5-n18-a-security-review.md',
  'w5-n18-a-product-review.md',
  'w5-n18-a-validation-report.md',
] as const);

export function verifyInventoryCompleteness(): Readonly<{
  ok: boolean;
  rowCount: number;
  noRowAuthorizesRetryExecutionFunctional: boolean;
  noRowAuthorizesW5N18Complete: boolean;
  requiredOwnershipRowsPresent: boolean;
}> {
  const ownershipIds = new Set(rowsByKind('ownership').map((row) => row.artifactId));
  const requiredOwnership = [
    'own-platform-retry-execution-layer',
    'own-notification-delivery-domain',
    'own-pc06-routing-delivery',
    'own-w5-n13-retry-foundation-consume',
    'own-w5-n17-delivery-reliability-consume',
    'own-w5-n06-delivery-foundation-consume',
    'own-w5-n08-queue-foundation-consume',
    'own-w5-n12-scheduler-foundation-consume',
    'own-secret-vault-consume',
    'own-connection-management-consume',
    'own-workspace-isolation-notifications',
    'own-notification-durable-queue',
    'own-per-channel-foundations-reference',
    'own-honest-product-boundaries',
  ];
  const requiredOwnershipRowsPresent = requiredOwnership.every((id) => ownershipIds.has(id));
  const noRowAuthorizesRetryExecutionFunctional = W5_N18_A_RETRY_EXECUTION_INVENTORY.every(
    (row) => !row.authorizesRetryExecutionFunctional,
  );
  const noRowAuthorizesW5N18Complete = W5_N18_A_RETRY_EXECUTION_INVENTORY.every(
    (row) => !row.authorizesW5N18Complete,
  );
  return Object.freeze({
    ok:
      W5_N18_A_RETRY_EXECUTION_INVENTORY.length >= 45 &&
      noRowAuthorizesRetryExecutionFunctional &&
      noRowAuthorizesW5N18Complete &&
      requiredOwnershipRowsPresent,
    rowCount: W5_N18_A_RETRY_EXECUTION_INVENTORY.length,
    noRowAuthorizesRetryExecutionFunctional,
    noRowAuthorizesW5N18Complete,
    requiredOwnershipRowsPresent,
  });
}

export function verifyHonestProductBaseline(): Readonly<{
  ok: boolean;
  noCustomerVisibleImplemented: boolean;
  infrastructureDocumented: boolean;
  plannedExplicit: boolean;
  notImplementedExplicit: boolean;
  retryExecutionNotAuthorized: boolean;
  deliveryOnlyNotControlPlane: boolean;
}> {
  const implemented = W5_N18_A_HONEST_PRODUCT_BASELINE.implementedCapabilities;
  const noCustomerVisibleImplemented =
    implemented.length === 1 && implemented[0]?.includes('None') === true;
  const infrastructureDocumented =
    W5_N18_A_HONEST_PRODUCT_BASELINE.infrastructureCapabilities.length >= 8;
  const plannedExplicit = W5_N18_A_HONEST_PRODUCT_BASELINE.plannedCapabilities.length >= 1;
  const notImplementedExplicit =
    W5_N18_A_HONEST_PRODUCT_BASELINE.notYetImplementedCapabilities.length >= 5;
  const retryExecutionNotAuthorized = !W5_N18_A_BINDING_FINDINGS.retryExecutionFunctionalAuthorized;
  const deliveryOnlyNotControlPlane = !W5_N18_A_ARCHITECTURE_CLAIMS.notificationControlPlane;
  return Object.freeze({
    ok:
      noCustomerVisibleImplemented &&
      infrastructureDocumented &&
      plannedExplicit &&
      notImplementedExplicit &&
      retryExecutionNotAuthorized &&
      deliveryOnlyNotControlPlane,
    noCustomerVisibleImplemented,
    infrastructureDocumented,
    plannedExplicit,
    notImplementedExplicit,
    retryExecutionNotAuthorized,
    deliveryOnlyNotControlPlane,
  });
}

export function verifyArchitectureIntegrity(): Readonly<{
  ok: boolean;
  ownershipUnchanged: boolean;
  noDuplicateSubsystem: boolean;
  noRetryPlatform: boolean;
  noMasterPlanChange: boolean;
  exchangeAdapterUntouched: boolean;
  notificationControlPlaneForbidden: boolean;
}> {
  const ownershipUnchanged = !W5_N18_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged;
  const noDuplicateSubsystem =
    !W5_N18_A_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem &&
    !W5_N18_A_ARCHITECTURE_CLAIMS.duplicateRetrySubsystem &&
    !W5_N18_A_ARCHITECTURE_CLAIMS.duplicateRoutingEngine;
  const noRetryPlatform =
    !W5_N18_A_ARCHITECTURE_CLAIMS.retryPlatformIntroduced &&
    !W5_N18_A_ARCHITECTURE_CLAIMS.workflowEngineIntroduced &&
    !W5_N18_A_ARCHITECTURE_CLAIMS.schedulerProductIntroduced &&
    !W5_N18_A_ARCHITECTURE_CLAIMS.eventBusProductIntroduced &&
    !W5_N18_A_ARCHITECTURE_CLAIMS.orchestrationPlatformIntroduced;
  const noMasterPlanChange = !W5_N18_A_ARCHITECTURE_CLAIMS.masterPlanModified;
  const exchangeAdapterUntouched = W5_N18_A_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched;
  const notificationControlPlaneForbidden = !W5_N18_A_ARCHITECTURE_CLAIMS.notificationControlPlane;
  return Object.freeze({
    ok:
      ownershipUnchanged &&
      noDuplicateSubsystem &&
      noRetryPlatform &&
      noMasterPlanChange &&
      exchangeAdapterUntouched &&
      notificationControlPlaneForbidden,
    ownershipUnchanged,
    noDuplicateSubsystem,
    noRetryPlatform,
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
    'own-platform-retry-execution-layer',
    'own-notification-delivery-domain',
    'own-pc06-routing-delivery',
    'own-secret-vault-consume',
    'own-connection-management-consume',
    'own-notification-durable-queue',
    'own-per-channel-foundations-reference',
  ];
  const coreOwnership = ownershipRows.filter((row) => coreOwnershipIds.includes(row.artifactId));
  const substrateOwnersFrozen = coreOwnership.every((row) =>
    (W5_N18_A_SUBSTRATE_OWNERS as readonly string[]).includes(row.owner),
  );
  return Object.freeze({
    ok:
      W5_N18_A_BINDING_FINDINGS.ownershipBoundariesVerified &&
      !W5_N18_A_BINDING_FINDINGS.ownershipBoundariesChanged &&
      !W5_N18_A_ARCHITECTURE_CLAIMS.newPersistenceOwner &&
      substrateOwnersFrozen,
    substrateOwnersFrozen,
    ownershipVerified: W5_N18_A_BINDING_FINDINGS.ownershipBoundariesVerified,
    newPersistenceOwner: W5_N18_A_ARCHITECTURE_CLAIMS.newPersistenceOwner,
  });
}

export function verifyHonestyBoundaries(): Readonly<{
  ok: boolean;
  boundaryCount: number;
  retryExecutionNotSuccessfulDelivery: boolean;
  retryFoundationNotRetryExecution: boolean;
  deliveryReliabilityNotRetryExecution: boolean;
}> {
  const boundaries = rowsHonestyBoundaries();
  const ids = new Set(boundaries.map((row) => row.artifactId));
  const retryExecutionNotSuccessfulDelivery = ids.has(
    'honesty-retry-execution-not-successful-delivery',
  );
  const retryFoundationNotRetryExecution = ids.has('honesty-retry-foundation-not-retry-execution');
  const deliveryReliabilityNotRetryExecution = ids.has(
    'honesty-delivery-reliability-not-retry-execution',
  );
  return Object.freeze({
    ok:
      boundaries.length >= 4 &&
      retryExecutionNotSuccessfulDelivery &&
      retryFoundationNotRetryExecution &&
      deliveryReliabilityNotRetryExecution,
    boundaryCount: boundaries.length,
    retryExecutionNotSuccessfulDelivery,
    retryFoundationNotRetryExecution,
    deliveryReliabilityNotRetryExecution,
  });
}

export function buildRetryExecutionDiagnostics(): Readonly<{
  inventory: ReturnType<typeof verifyInventoryCompleteness>;
  honestProduct: ReturnType<typeof verifyHonestProductBaseline>;
  architecture: ReturnType<typeof verifyArchitectureIntegrity>;
  ownership: ReturnType<typeof verifyOwnershipBoundaries>;
  honesty: ReturnType<typeof verifyHonestyBoundaries>;
  technicalDebtDelta: typeof W5_N18_A_TECHNICAL_DEBT_DELTA;
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
    technicalDebtDelta: W5_N18_A_TECHNICAL_DEBT_DELTA,
    ok:
      inventory.ok &&
      honestProduct.ok &&
      architecture.ok &&
      ownership.ok &&
      honesty.ok &&
      !W5_N18_A_BINDING_FINDINGS.retryExecutionFunctionsAfterSliceA,
  });
}
