/**
 * W5-N07-a — Notification Platform Dispatch Conformance Registry.
 *
 * Validates the canonical platform dispatch inventory and Honest Product baseline.
 * Discovery and evidence assembly only — no runtime behaviour changes.
 */

import {
  W5_N07_A_ARCHITECTURE_CLAIMS,
  W5_N07_A_BINDING_FINDINGS,
  W5_N07_A_HONEST_PRODUCT_BASELINE,
  W5_N07_A_SLICE_ID,
  W5_N07_A_SUBSTRATE_OWNERS,
  W5_N07_A_NOTIFICATION_PLATFORM_DISPATCH_INVENTORY,
  W5_N07_A_TECHNICAL_DEBT_DELTA,
  rowsByKind,
  rowsHonestyBoundaries,
} from './w5-n07-a-notification-platform-dispatch-inventory';

export const W5_N07_A_CONFORMANCE_SLICE_ID = W5_N07_A_SLICE_ID;

export const W5_N07_A_REQUIRED_REPORTS = Object.freeze([
  'w5-n07-a-notification-platform-dispatch-inventory.md',
  'w5-n07-a-implementation-report.md',
  'w5-n07-a-architecture-review.md',
  'w5-n07-a-security-review.md',
  'w5-n07-a-product-review.md',
  'w5-n07-a-validation-report.md',
] as const);

export function verifyInventoryCompleteness(): Readonly<{
  ok: boolean;
  rowCount: number;
  noRowAuthorizesPlatformDispatchFunctional: boolean;
  noRowAuthorizesW5N07Complete: boolean;
  requiredOwnershipRowsPresent: boolean;
}> {
  const ownershipIds = new Set(rowsByKind('ownership').map((row) => row.artifactId));
  const requiredOwnership = [
    'own-platform-dispatch-layer',
    'own-notification-delivery-domain',
    'own-pc06-routing-delivery',
    'own-w5-n06-delivery-foundation-consume',
    'own-secret-vault-consume',
    'own-connection-management-consume',
    'own-workspace-isolation-notifications',
    'own-notification-durable-queue',
    'own-per-channel-foundations-reference',
    'own-w5-n05-integration-foundation-consume',
    'own-honest-product-boundaries',
  ];
  const requiredOwnershipRowsPresent = requiredOwnership.every((id) => ownershipIds.has(id));
  const noRowAuthorizesPlatformDispatchFunctional =
    W5_N07_A_NOTIFICATION_PLATFORM_DISPATCH_INVENTORY.every(
      (row) => !row.authorizesPlatformDispatchFunctional,
    );
  const noRowAuthorizesW5N07Complete = W5_N07_A_NOTIFICATION_PLATFORM_DISPATCH_INVENTORY.every(
    (row) => !row.authorizesW5N07Complete,
  );
  return Object.freeze({
    ok:
      W5_N07_A_NOTIFICATION_PLATFORM_DISPATCH_INVENTORY.length >= 45 &&
      noRowAuthorizesPlatformDispatchFunctional &&
      noRowAuthorizesW5N07Complete &&
      requiredOwnershipRowsPresent,
    rowCount: W5_N07_A_NOTIFICATION_PLATFORM_DISPATCH_INVENTORY.length,
    noRowAuthorizesPlatformDispatchFunctional,
    noRowAuthorizesW5N07Complete,
    requiredOwnershipRowsPresent,
  });
}

export function verifyHonestProductBaseline(): Readonly<{
  ok: boolean;
  noCustomerVisibleImplemented: boolean;
  infrastructureDocumented: boolean;
  plannedExplicit: boolean;
  notImplementedExplicit: boolean;
  platformDispatchNotAuthorized: boolean;
  dispatchOnlyNotControlPlane: boolean;
}> {
  const implemented = W5_N07_A_HONEST_PRODUCT_BASELINE.implementedCapabilities;
  const noCustomerVisibleImplemented =
    implemented.length === 1 && implemented[0]?.includes('None') === true;
  const infrastructureDocumented =
    W5_N07_A_HONEST_PRODUCT_BASELINE.infrastructureCapabilities.length >= 8;
  const plannedExplicit = W5_N07_A_HONEST_PRODUCT_BASELINE.plannedCapabilities.length >= 1;
  const notImplementedExplicit =
    W5_N07_A_HONEST_PRODUCT_BASELINE.notYetImplementedCapabilities.length >= 5;
  const platformDispatchNotAuthorized =
    !W5_N07_A_BINDING_FINDINGS.platformDispatchFunctionalAuthorized;
  const dispatchOnlyNotControlPlane = !W5_N07_A_ARCHITECTURE_CLAIMS.notificationControlPlane;
  return Object.freeze({
    ok:
      noCustomerVisibleImplemented &&
      infrastructureDocumented &&
      plannedExplicit &&
      notImplementedExplicit &&
      platformDispatchNotAuthorized &&
      dispatchOnlyNotControlPlane,
    noCustomerVisibleImplemented,
    infrastructureDocumented,
    plannedExplicit,
    notImplementedExplicit,
    platformDispatchNotAuthorized,
    dispatchOnlyNotControlPlane,
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
  const ownershipUnchanged = !W5_N07_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged;
  const noDuplicateSubsystem =
    !W5_N07_A_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem &&
    !W5_N07_A_ARCHITECTURE_CLAIMS.duplicateRoutingEngine;
  const noMasterPlanChange = !W5_N07_A_ARCHITECTURE_CLAIMS.masterPlanModified;
  const exchangeAdapterUntouched = W5_N07_A_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched;
  const notificationControlPlaneForbidden = !W5_N07_A_ARCHITECTURE_CLAIMS.notificationControlPlane;
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
    'own-platform-dispatch-layer',
    'own-notification-delivery-domain',
    'own-pc06-routing-delivery',
    'own-secret-vault-consume',
    'own-connection-management-consume',
    'own-notification-durable-queue',
    'own-per-channel-foundations-reference',
  ];
  const coreOwnership = ownershipRows.filter((row) => coreOwnershipIds.includes(row.artifactId));
  const substrateOwnersFrozen = coreOwnership.every((row) =>
    (W5_N07_A_SUBSTRATE_OWNERS as readonly string[]).includes(row.owner),
  );
  return Object.freeze({
    ok:
      W5_N07_A_BINDING_FINDINGS.ownershipBoundariesVerified &&
      !W5_N07_A_BINDING_FINDINGS.ownershipBoundariesChanged &&
      !W5_N07_A_ARCHITECTURE_CLAIMS.newPersistenceOwner &&
      substrateOwnersFrozen,
    substrateOwnersFrozen,
    ownershipVerified: W5_N07_A_BINDING_FINDINGS.ownershipBoundariesVerified,
    newPersistenceOwner: W5_N07_A_ARCHITECTURE_CLAIMS.newPersistenceOwner,
  });
}

export function verifyHonestyBoundaries(): Readonly<{
  ok: boolean;
  boundaryCount: number;
  dispatchFoundationNotLiveTrading: boolean;
  platformReadyRequiresEvidence: boolean;
  deliveryNotDispatchComplete: boolean;
}> {
  const boundaries = rowsHonestyBoundaries();
  const ids = new Set(boundaries.map((row) => row.artifactId));
  const dispatchFoundationNotLiveTrading = ids.has('honesty-platform-dispatch-not-live-trading');
  const platformReadyRequiresEvidence = ids.has(
    'honesty-platform-ready-requires-dispatch-evidence',
  );
  const deliveryNotDispatchComplete = ids.has('honesty-delivery-not-dispatch-complete');
  return Object.freeze({
    ok:
      boundaries.length >= 4 &&
      dispatchFoundationNotLiveTrading &&
      platformReadyRequiresEvidence &&
      deliveryNotDispatchComplete,
    boundaryCount: boundaries.length,
    dispatchFoundationNotLiveTrading,
    platformReadyRequiresEvidence,
    deliveryNotDispatchComplete,
  });
}

export function buildNotificationPlatformDispatchDiagnostics(): Readonly<{
  inventory: ReturnType<typeof verifyInventoryCompleteness>;
  honestProduct: ReturnType<typeof verifyHonestProductBaseline>;
  architecture: ReturnType<typeof verifyArchitectureIntegrity>;
  ownership: ReturnType<typeof verifyOwnershipBoundaries>;
  honesty: ReturnType<typeof verifyHonestyBoundaries>;
  technicalDebtDelta: typeof W5_N07_A_TECHNICAL_DEBT_DELTA;
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
    technicalDebtDelta: W5_N07_A_TECHNICAL_DEBT_DELTA,
    ok:
      inventory.ok &&
      honestProduct.ok &&
      architecture.ok &&
      ownership.ok &&
      honesty.ok &&
      !W5_N07_A_BINDING_FINDINGS.platformDispatchFunctionsAfterSliceA,
  });
}
