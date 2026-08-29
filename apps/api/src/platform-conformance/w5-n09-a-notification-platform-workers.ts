/**
 * W5-N09-a — Notification Platform Workers Conformance Registry.
 *
 * Validates the canonical platform workers inventory and Honest Product baseline.
 * Discovery and evidence assembly only — no runtime behaviour changes.
 */

import {
  W5_N09_A_ARCHITECTURE_CLAIMS,
  W5_N09_A_BINDING_FINDINGS,
  W5_N09_A_HONEST_PRODUCT_BASELINE,
  W5_N09_A_SLICE_ID,
  W5_N09_A_SUBSTRATE_OWNERS,
  W5_N09_A_NOTIFICATION_PLATFORM_WORKERS_INVENTORY,
  W5_N09_A_TECHNICAL_DEBT_DELTA,
  rowsByKind,
  rowsHonestyBoundaries,
} from './w5-n09-a-notification-platform-workers-inventory';

export const W5_N09_A_CONFORMANCE_SLICE_ID = W5_N09_A_SLICE_ID;

export const W5_N09_A_REQUIRED_REPORTS = Object.freeze([
  'w5-n09-a-notification-platform-workers-inventory.md',
  'w5-n09-a-implementation-report.md',
  'w5-n09-a-architecture-review.md',
  'w5-n09-a-security-review.md',
  'w5-n09-a-product-review.md',
  'w5-n09-a-validation-report.md',
] as const);

export function verifyInventoryCompleteness(): Readonly<{
  ok: boolean;
  rowCount: number;
  noRowAuthorizesPlatformQueueFunctional: boolean;
  noRowAuthorizesW5N09Complete: boolean;
  requiredOwnershipRowsPresent: boolean;
}> {
  const ownershipIds = new Set(rowsByKind('ownership').map((row) => row.artifactId));
  const requiredOwnership = [
    'own-platform-workers-layer',
    'own-notification-delivery-domain',
    'own-pc06-routing-delivery',
    'own-w5-n06-delivery-foundation-consume',
    'own-w5-n07-dispatch-foundation-consume',
    'own-w5-n08-queue-foundation-consume',
    'own-secret-vault-consume',
    'own-connection-management-consume',
    'own-workspace-isolation-notifications',
    'own-notification-durable-queue',
    'own-per-channel-foundations-reference',
    'own-w5-n05-integration-foundation-consume',
    'own-honest-product-boundaries',
  ];
  const requiredOwnershipRowsPresent = requiredOwnership.every((id) => ownershipIds.has(id));
  const noRowAuthorizesPlatformQueueFunctional =
    W5_N09_A_NOTIFICATION_PLATFORM_WORKERS_INVENTORY.every(
      (row) => !row.authorizesPlatformWorkersFunctional,
    );
  const noRowAuthorizesW5N09Complete = W5_N09_A_NOTIFICATION_PLATFORM_WORKERS_INVENTORY.every(
    (row) => !row.authorizesW5N09Complete,
  );
  return Object.freeze({
    ok:
      W5_N09_A_NOTIFICATION_PLATFORM_WORKERS_INVENTORY.length >= 45 &&
      noRowAuthorizesPlatformQueueFunctional &&
      noRowAuthorizesW5N09Complete &&
      requiredOwnershipRowsPresent,
    rowCount: W5_N09_A_NOTIFICATION_PLATFORM_WORKERS_INVENTORY.length,
    noRowAuthorizesPlatformQueueFunctional,
    noRowAuthorizesW5N09Complete,
    requiredOwnershipRowsPresent,
  });
}

export function verifyHonestProductBaseline(): Readonly<{
  ok: boolean;
  noCustomerVisibleImplemented: boolean;
  infrastructureDocumented: boolean;
  plannedExplicit: boolean;
  notImplementedExplicit: boolean;
  platformQueueNotAuthorized: boolean;
  queueOnlyNotControlPlane: boolean;
}> {
  const implemented = W5_N09_A_HONEST_PRODUCT_BASELINE.implementedCapabilities;
  const noCustomerVisibleImplemented =
    implemented.length === 1 && implemented[0]?.includes('None') === true;
  const infrastructureDocumented =
    W5_N09_A_HONEST_PRODUCT_BASELINE.infrastructureCapabilities.length >= 8;
  const plannedExplicit = W5_N09_A_HONEST_PRODUCT_BASELINE.plannedCapabilities.length >= 1;
  const notImplementedExplicit =
    W5_N09_A_HONEST_PRODUCT_BASELINE.notYetImplementedCapabilities.length >= 5;
  const platformQueueNotAuthorized = !W5_N09_A_BINDING_FINDINGS.platformWorkersFunctionalAuthorized;
  const queueOnlyNotControlPlane = !W5_N09_A_ARCHITECTURE_CLAIMS.notificationControlPlane;
  return Object.freeze({
    ok:
      noCustomerVisibleImplemented &&
      infrastructureDocumented &&
      plannedExplicit &&
      notImplementedExplicit &&
      platformQueueNotAuthorized &&
      queueOnlyNotControlPlane,
    noCustomerVisibleImplemented,
    infrastructureDocumented,
    plannedExplicit,
    notImplementedExplicit,
    platformQueueNotAuthorized,
    queueOnlyNotControlPlane,
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
  const ownershipUnchanged = !W5_N09_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged;
  const noDuplicateSubsystem =
    !W5_N09_A_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem &&
    !W5_N09_A_ARCHITECTURE_CLAIMS.duplicateRoutingEngine;
  const noMasterPlanChange = !W5_N09_A_ARCHITECTURE_CLAIMS.masterPlanModified;
  const exchangeAdapterUntouched = W5_N09_A_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched;
  const notificationControlPlaneForbidden = !W5_N09_A_ARCHITECTURE_CLAIMS.notificationControlPlane;
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
    'own-platform-workers-layer',
    'own-notification-delivery-domain',
    'own-pc06-routing-delivery',
    'own-secret-vault-consume',
    'own-connection-management-consume',
    'own-notification-durable-queue',
    'own-per-channel-foundations-reference',
  ];
  const coreOwnership = ownershipRows.filter((row) => coreOwnershipIds.includes(row.artifactId));
  const substrateOwnersFrozen = coreOwnership.every((row) =>
    (W5_N09_A_SUBSTRATE_OWNERS as readonly string[]).includes(row.owner),
  );
  return Object.freeze({
    ok:
      W5_N09_A_BINDING_FINDINGS.ownershipBoundariesVerified &&
      !W5_N09_A_BINDING_FINDINGS.ownershipBoundariesChanged &&
      !W5_N09_A_ARCHITECTURE_CLAIMS.newPersistenceOwner &&
      substrateOwnersFrozen,
    substrateOwnersFrozen,
    ownershipVerified: W5_N09_A_BINDING_FINDINGS.ownershipBoundariesVerified,
    newPersistenceOwner: W5_N09_A_ARCHITECTURE_CLAIMS.newPersistenceOwner,
  });
}

export function verifyHonestyBoundaries(): Readonly<{
  ok: boolean;
  boundaryCount: number;
  workersFoundationNotLiveTrading: boolean;
  platformReadyRequiresEvidence: boolean;
  queueNotWorkersComplete: boolean;
}> {
  const boundaries = rowsHonestyBoundaries();
  const ids = new Set(boundaries.map((row) => row.artifactId));
  const workersFoundationNotLiveTrading = ids.has('honesty-platform-workers-not-live-trading');
  const platformReadyRequiresEvidence = ids.has('honesty-platform-ready-requires-workers-evidence');
  const queueNotWorkersComplete = ids.has('honesty-queue-not-workers-complete');
  return Object.freeze({
    ok:
      boundaries.length >= 4 &&
      workersFoundationNotLiveTrading &&
      platformReadyRequiresEvidence &&
      queueNotWorkersComplete,
    boundaryCount: boundaries.length,
    workersFoundationNotLiveTrading,
    platformReadyRequiresEvidence,
    queueNotWorkersComplete,
  });
}

export function buildNotificationPlatformWorkersDiagnostics(): Readonly<{
  inventory: ReturnType<typeof verifyInventoryCompleteness>;
  honestProduct: ReturnType<typeof verifyHonestProductBaseline>;
  architecture: ReturnType<typeof verifyArchitectureIntegrity>;
  ownership: ReturnType<typeof verifyOwnershipBoundaries>;
  honesty: ReturnType<typeof verifyHonestyBoundaries>;
  technicalDebtDelta: typeof W5_N09_A_TECHNICAL_DEBT_DELTA;
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
    technicalDebtDelta: W5_N09_A_TECHNICAL_DEBT_DELTA,
    ok:
      inventory.ok &&
      honestProduct.ok &&
      architecture.ok &&
      ownership.ok &&
      honesty.ok &&
      !W5_N09_A_BINDING_FINDINGS.platformWorkersFunctionsAfterSliceA,
  });
}
