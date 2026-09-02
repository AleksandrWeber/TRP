/**
 * W5-N11-a — Notification Platform Worker Execution Conformance Registry.
 *
 * Validates the canonical platform worker runtime inventory and Honest Product baseline.
 * Discovery and evidence assembly only — no runtime behaviour changes.
 */

import {
  W5_N11_A_ARCHITECTURE_CLAIMS,
  W5_N11_A_BINDING_FINDINGS,
  W5_N11_A_HONEST_PRODUCT_BASELINE,
  W5_N11_A_SLICE_ID,
  W5_N11_A_SUBSTRATE_OWNERS,
  W5_N11_A_NOTIFICATION_PLATFORM_WORKER_RUNTIME_INVENTORY,
  W5_N11_A_TECHNICAL_DEBT_DELTA,
  rowsByKind,
  rowsHonestyBoundaries,
} from './w5-n11-a-notification-platform-worker-runtime-inventory';

export const W5_N11_A_CONFORMANCE_SLICE_ID = W5_N11_A_SLICE_ID;

export const W5_N11_A_REQUIRED_REPORTS = Object.freeze([
  'w5-n11-a-notification-platform-worker-runtime-inventory.md',
  'w5-n11-a-implementation-report.md',
  'w5-n11-a-architecture-review.md',
  'w5-n11-a-security-review.md',
  'w5-n11-a-product-review.md',
  'w5-n11-a-validation-report.md',
] as const);

export function verifyInventoryCompleteness(): Readonly<{
  ok: boolean;
  rowCount: number;
  noRowAuthorizesPlatformWorkerExecutionFunctional: boolean;
  noRowAuthorizesW5N10Complete: boolean;
  requiredOwnershipRowsPresent: boolean;
}> {
  const ownershipIds = new Set(rowsByKind('ownership').map((row) => row.artifactId));
  const requiredOwnership = [
    'own-platform-worker-runtime-layer',
    'own-notification-delivery-domain',
    'own-pc06-routing-delivery',
    'own-w5-n06-delivery-foundation-consume',
    'own-w5-n07-dispatch-foundation-consume',
    'own-w5-n08-queue-foundation-consume',
    'own-w5-n09-workers-foundation-consume',
    'own-secret-vault-consume',
    'own-connection-management-consume',
    'own-workspace-isolation-notifications',
    'own-notification-durable-queue',
    'own-per-channel-foundations-reference',
    'own-w5-n05-integration-foundation-consume',
    'own-w5-n10-worker-execution-foundation-consume',
    'own-honest-product-boundaries',
  ];
  const requiredOwnershipRowsPresent = requiredOwnership.every((id) => ownershipIds.has(id));
  const noRowAuthorizesPlatformWorkerExecutionFunctional =
    W5_N11_A_NOTIFICATION_PLATFORM_WORKER_RUNTIME_INVENTORY.every(
      (row) => !row.authorizesPlatformWorkerRuntimeFunctional,
    );
  const noRowAuthorizesW5N10Complete =
    W5_N11_A_NOTIFICATION_PLATFORM_WORKER_RUNTIME_INVENTORY.every(
      (row) => !row.authorizesW5N11Complete,
    );
  return Object.freeze({
    ok:
      W5_N11_A_NOTIFICATION_PLATFORM_WORKER_RUNTIME_INVENTORY.length >= 45 &&
      noRowAuthorizesPlatformWorkerExecutionFunctional &&
      noRowAuthorizesW5N10Complete &&
      requiredOwnershipRowsPresent,
    rowCount: W5_N11_A_NOTIFICATION_PLATFORM_WORKER_RUNTIME_INVENTORY.length,
    noRowAuthorizesPlatformWorkerExecutionFunctional,
    noRowAuthorizesW5N10Complete,
    requiredOwnershipRowsPresent,
  });
}

export function verifyHonestProductBaseline(): Readonly<{
  ok: boolean;
  noCustomerVisibleImplemented: boolean;
  infrastructureDocumented: boolean;
  plannedExplicit: boolean;
  notImplementedExplicit: boolean;
  platformWorkerExecutionNotAuthorized: boolean;
  workerExecutionOnlyNotControlPlane: boolean;
}> {
  const implemented = W5_N11_A_HONEST_PRODUCT_BASELINE.implementedCapabilities;
  const noCustomerVisibleImplemented =
    implemented.length === 1 && implemented[0]?.includes('None') === true;
  const infrastructureDocumented =
    W5_N11_A_HONEST_PRODUCT_BASELINE.infrastructureCapabilities.length >= 8;
  const plannedExplicit = W5_N11_A_HONEST_PRODUCT_BASELINE.plannedCapabilities.length >= 1;
  const notImplementedExplicit =
    W5_N11_A_HONEST_PRODUCT_BASELINE.notYetImplementedCapabilities.length >= 5;
  const platformWorkerExecutionNotAuthorized =
    !W5_N11_A_BINDING_FINDINGS.platformWorkerRuntimeFunctionalAuthorized;
  const workerExecutionOnlyNotControlPlane = !W5_N11_A_ARCHITECTURE_CLAIMS.notificationControlPlane;
  return Object.freeze({
    ok:
      noCustomerVisibleImplemented &&
      infrastructureDocumented &&
      plannedExplicit &&
      notImplementedExplicit &&
      platformWorkerExecutionNotAuthorized &&
      workerExecutionOnlyNotControlPlane,
    noCustomerVisibleImplemented,
    infrastructureDocumented,
    plannedExplicit,
    notImplementedExplicit,
    platformWorkerExecutionNotAuthorized,
    workerExecutionOnlyNotControlPlane,
  });
}

export function verifyArchitectureIntegrity(): Readonly<{
  ok: boolean;
  ownershipUnchanged: boolean;
  noDuplicateSubsystem: boolean;
  noMasterPlanChange: boolean;
  exchangeAdapterUntouched: boolean;
  notificationControlPlaneForbidden: boolean;
}> {
  const ownershipUnchanged = !W5_N11_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged;
  const noDuplicateSubsystem =
    !W5_N11_A_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem &&
    !W5_N11_A_ARCHITECTURE_CLAIMS.duplicateRoutingEngine;
  const noMasterPlanChange = !W5_N11_A_ARCHITECTURE_CLAIMS.masterPlanModified;
  const exchangeAdapterUntouched = W5_N11_A_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched;
  const notificationControlPlaneForbidden = !W5_N11_A_ARCHITECTURE_CLAIMS.notificationControlPlane;
  return Object.freeze({
    ok:
      ownershipUnchanged &&
      noDuplicateSubsystem &&
      noMasterPlanChange &&
      exchangeAdapterUntouched &&
      notificationControlPlaneForbidden,
    ownershipUnchanged,
    noDuplicateSubsystem,
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
    'own-platform-worker-runtime-layer',
    'own-notification-delivery-domain',
    'own-pc06-routing-delivery',
    'own-secret-vault-consume',
    'own-connection-management-consume',
    'own-notification-durable-queue',
    'own-per-channel-foundations-reference',
  ];
  const coreOwnership = ownershipRows.filter((row) => coreOwnershipIds.includes(row.artifactId));
  const substrateOwnersFrozen = coreOwnership.every((row) =>
    (W5_N11_A_SUBSTRATE_OWNERS as readonly string[]).includes(row.owner),
  );
  return Object.freeze({
    ok:
      W5_N11_A_BINDING_FINDINGS.ownershipBoundariesVerified &&
      !W5_N11_A_BINDING_FINDINGS.ownershipBoundariesChanged &&
      !W5_N11_A_ARCHITECTURE_CLAIMS.newPersistenceOwner &&
      substrateOwnersFrozen,
    substrateOwnersFrozen,
    ownershipVerified: W5_N11_A_BINDING_FINDINGS.ownershipBoundariesVerified,
    newPersistenceOwner: W5_N11_A_ARCHITECTURE_CLAIMS.newPersistenceOwner,
  });
}

export function verifyHonestyBoundaries(): Readonly<{
  ok: boolean;
  boundaryCount: number;
  workerExecutionFoundationNotLiveTrading: boolean;
  platformReadyRequiresEvidence: boolean;
  workersNotWorkerExecutionComplete: boolean;
}> {
  const boundaries = rowsHonestyBoundaries();
  const ids = new Set(boundaries.map((row) => row.artifactId));
  const workerExecutionFoundationNotLiveTrading = ids.has(
    'honesty-platform-workers-not-live-trading',
  );
  const platformReadyRequiresEvidence = ids.has('honesty-platform-ready-requires-workers-evidence');
  const workersNotWorkerExecutionComplete = ids.has('honesty-queue-not-workers-complete');
  return Object.freeze({
    ok:
      boundaries.length >= 4 &&
      workerExecutionFoundationNotLiveTrading &&
      platformReadyRequiresEvidence &&
      workersNotWorkerExecutionComplete,
    boundaryCount: boundaries.length,
    workerExecutionFoundationNotLiveTrading,
    platformReadyRequiresEvidence,
    workersNotWorkerExecutionComplete,
  });
}

export function buildNotificationPlatformWorkerRuntimeDiagnostics(): Readonly<{
  inventory: ReturnType<typeof verifyInventoryCompleteness>;
  honestProduct: ReturnType<typeof verifyHonestProductBaseline>;
  architecture: ReturnType<typeof verifyArchitectureIntegrity>;
  ownership: ReturnType<typeof verifyOwnershipBoundaries>;
  honesty: ReturnType<typeof verifyHonestyBoundaries>;
  technicalDebtDelta: typeof W5_N11_A_TECHNICAL_DEBT_DELTA;
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
    technicalDebtDelta: W5_N11_A_TECHNICAL_DEBT_DELTA,
    ok:
      inventory.ok &&
      honestProduct.ok &&
      architecture.ok &&
      ownership.ok &&
      honesty.ok &&
      !W5_N11_A_BINDING_FINDINGS.platformWorkerRuntimeFunctionsAfterSliceA,
  });
}
