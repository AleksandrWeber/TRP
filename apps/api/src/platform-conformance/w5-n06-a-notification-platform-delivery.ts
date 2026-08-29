/**
 * W5-N06-a — Notification Platform Delivery Conformance Registry.
 *
 * Validates the canonical platform delivery inventory and Honest Product baseline.
 * Discovery and evidence assembly only — no runtime behaviour changes.
 */

import {
  W5_N06_A_ARCHITECTURE_CLAIMS,
  W5_N06_A_BINDING_FINDINGS,
  W5_N06_A_HONEST_PRODUCT_BASELINE,
  W5_N06_A_SLICE_ID,
  W5_N06_A_SUBSTRATE_OWNERS,
  W5_N06_A_NOTIFICATION_PLATFORM_DELIVERY_INVENTORY,
  W5_N06_A_TECHNICAL_DEBT_DELTA,
  rowsByKind,
  rowsHonestyBoundaries,
} from './w5-n06-a-notification-platform-delivery-inventory';

export const W5_N06_A_CONFORMANCE_SLICE_ID = W5_N06_A_SLICE_ID;

export const W5_N06_A_REQUIRED_REPORTS = Object.freeze([
  'w5-n06-a-notification-platform-delivery-inventory.md',
  'w5-n06-a-implementation-report.md',
  'w5-n06-a-architecture-review.md',
  'w5-n06-a-security-review.md',
  'w5-n06-a-product-review.md',
  'w5-n06-a-validation-report.md',
] as const);

export function verifyInventoryCompleteness(): Readonly<{
  ok: boolean;
  rowCount: number;
  noRowAuthorizesPlatformDeliveryFunctional: boolean;
  noRowAuthorizesW5N06Complete: boolean;
  requiredOwnershipRowsPresent: boolean;
}> {
  const ownershipIds = new Set(rowsByKind('ownership').map((row) => row.artifactId));
  const requiredOwnership = [
    'own-platform-delivery-layer',
    'own-notification-delivery-domain',
    'own-pc06-routing-delivery',
    'own-platform-delivery-persistence',
    'own-secret-vault-consume',
    'own-connection-management-consume',
    'own-workspace-isolation-notifications',
    'own-notification-durable-queue',
    'own-per-channel-foundations-reference',
    'own-w5-n05-integration-foundation-consume',
    'own-honest-product-boundaries',
  ];
  const requiredOwnershipRowsPresent = requiredOwnership.every((id) => ownershipIds.has(id));
  const noRowAuthorizesPlatformDeliveryFunctional =
    W5_N06_A_NOTIFICATION_PLATFORM_DELIVERY_INVENTORY.every(
      (row) => !row.authorizesPlatformDeliveryFunctional,
    );
  const noRowAuthorizesW5N06Complete = W5_N06_A_NOTIFICATION_PLATFORM_DELIVERY_INVENTORY.every(
    (row) => !row.authorizesW5N06Complete,
  );
  return Object.freeze({
    ok:
      W5_N06_A_NOTIFICATION_PLATFORM_DELIVERY_INVENTORY.length >= 45 &&
      noRowAuthorizesPlatformDeliveryFunctional &&
      noRowAuthorizesW5N06Complete &&
      requiredOwnershipRowsPresent,
    rowCount: W5_N06_A_NOTIFICATION_PLATFORM_DELIVERY_INVENTORY.length,
    noRowAuthorizesPlatformDeliveryFunctional,
    noRowAuthorizesW5N06Complete,
    requiredOwnershipRowsPresent,
  });
}

export function verifyHonestProductBaseline(): Readonly<{
  ok: boolean;
  noCustomerVisibleImplemented: boolean;
  infrastructureDocumented: boolean;
  plannedExplicit: boolean;
  notImplementedExplicit: boolean;
  platformDeliveryNotAuthorized: boolean;
  deliveryOnlyNotControlPlane: boolean;
}> {
  const implemented = W5_N06_A_HONEST_PRODUCT_BASELINE.implementedCapabilities;
  const noCustomerVisibleImplemented =
    implemented.length === 1 && implemented[0]?.includes('None') === true;
  const infrastructureDocumented =
    W5_N06_A_HONEST_PRODUCT_BASELINE.infrastructureCapabilities.length >= 8;
  const plannedExplicit = W5_N06_A_HONEST_PRODUCT_BASELINE.plannedCapabilities.length >= 1;
  const notImplementedExplicit =
    W5_N06_A_HONEST_PRODUCT_BASELINE.notYetImplementedCapabilities.length >= 5;
  const platformDeliveryNotAuthorized =
    !W5_N06_A_BINDING_FINDINGS.platformDeliveryFunctionalAuthorized;
  const deliveryOnlyNotControlPlane = !W5_N06_A_ARCHITECTURE_CLAIMS.notificationControlPlane;
  return Object.freeze({
    ok:
      noCustomerVisibleImplemented &&
      infrastructureDocumented &&
      plannedExplicit &&
      notImplementedExplicit &&
      platformDeliveryNotAuthorized &&
      deliveryOnlyNotControlPlane,
    noCustomerVisibleImplemented,
    infrastructureDocumented,
    plannedExplicit,
    notImplementedExplicit,
    platformDeliveryNotAuthorized,
    deliveryOnlyNotControlPlane,
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
  const ownershipUnchanged = !W5_N06_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged;
  const noDuplicateSubsystem =
    !W5_N06_A_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem &&
    !W5_N06_A_ARCHITECTURE_CLAIMS.duplicateRoutingEngine;
  const noMasterPlanChange = !W5_N06_A_ARCHITECTURE_CLAIMS.masterPlanModified;
  const exchangeAdapterUntouched = W5_N06_A_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched;
  const notificationControlPlaneForbidden = !W5_N06_A_ARCHITECTURE_CLAIMS.notificationControlPlane;
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
    'own-platform-delivery-layer',
    'own-notification-delivery-domain',
    'own-pc06-routing-delivery',
    'own-secret-vault-consume',
    'own-connection-management-consume',
    'own-notification-durable-queue',
    'own-per-channel-foundations-reference',
  ];
  const coreOwnership = ownershipRows.filter((row) => coreOwnershipIds.includes(row.artifactId));
  const substrateOwnersFrozen = coreOwnership.every((row) =>
    (W5_N06_A_SUBSTRATE_OWNERS as readonly string[]).includes(row.owner),
  );
  return Object.freeze({
    ok:
      W5_N06_A_BINDING_FINDINGS.ownershipBoundariesVerified &&
      !W5_N06_A_BINDING_FINDINGS.ownershipBoundariesChanged &&
      !W5_N06_A_ARCHITECTURE_CLAIMS.newPersistenceOwner &&
      substrateOwnersFrozen,
    substrateOwnersFrozen,
    ownershipVerified: W5_N06_A_BINDING_FINDINGS.ownershipBoundariesVerified,
    newPersistenceOwner: W5_N06_A_ARCHITECTURE_CLAIMS.newPersistenceOwner,
  });
}

export function verifyHonestyBoundaries(): Readonly<{
  ok: boolean;
  boundaryCount: number;
  deliveryFoundationNotLiveTrading: boolean;
  platformReadyRequiresEvidence: boolean;
  perChannelNotPlatformComplete: boolean;
}> {
  const boundaries = rowsHonestyBoundaries();
  const ids = new Set(boundaries.map((row) => row.artifactId));
  const deliveryFoundationNotLiveTrading = ids.has('honesty-platform-delivery-not-live-trading');
  const platformReadyRequiresEvidence = ids.has(
    'honesty-platform-ready-requires-delivery-evidence',
  );
  const perChannelNotPlatformComplete = ids.has('honesty-integration-not-delivery-complete');
  return Object.freeze({
    ok:
      boundaries.length >= 4 &&
      deliveryFoundationNotLiveTrading &&
      platformReadyRequiresEvidence &&
      perChannelNotPlatformComplete,
    boundaryCount: boundaries.length,
    deliveryFoundationNotLiveTrading,
    platformReadyRequiresEvidence,
    perChannelNotPlatformComplete,
  });
}

export function buildNotificationPlatformDeliveryDiagnostics(): Readonly<{
  inventory: ReturnType<typeof verifyInventoryCompleteness>;
  honestProduct: ReturnType<typeof verifyHonestProductBaseline>;
  architecture: ReturnType<typeof verifyArchitectureIntegrity>;
  ownership: ReturnType<typeof verifyOwnershipBoundaries>;
  honesty: ReturnType<typeof verifyHonestyBoundaries>;
  technicalDebtDelta: typeof W5_N06_A_TECHNICAL_DEBT_DELTA;
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
    technicalDebtDelta: W5_N06_A_TECHNICAL_DEBT_DELTA,
    ok:
      inventory.ok &&
      honestProduct.ok &&
      architecture.ok &&
      ownership.ok &&
      honesty.ok &&
      !W5_N06_A_BINDING_FINDINGS.platformDeliveryFunctionsAfterSliceA,
  });
}
