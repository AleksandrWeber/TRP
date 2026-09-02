/**
 * W5-N17-a — Notification Platform Delivery Reliability Conformance Registry.
 *
 * Validates the canonical platform delivery reliability inventory and Honest Product baseline.
 * Discovery and evidence assembly only — no runtime behaviour changes.
 */

import {
  W5_N17_A_ARCHITECTURE_CLAIMS,
  W5_N17_A_BINDING_FINDINGS,
  W5_N17_A_HONEST_PRODUCT_BASELINE,
  W5_N17_A_SLICE_ID,
  W5_N17_A_SUBSTRATE_OWNERS,
  W5_N17_A_DELIVERY_RELIABILITY_INVENTORY,
  W5_N17_A_TECHNICAL_DEBT_DELTA,
  rowsByKind,
  rowsHonestyBoundaries,
} from './w5-n17-a-delivery-reliability-inventory';

export const W5_N17_A_CONFORMANCE_SLICE_ID = W5_N17_A_SLICE_ID;

export const W5_N17_A_REQUIRED_REPORTS = Object.freeze([
  'w5-n17-a-delivery-reliability-inventory.md',
  'w5-n17-a-implementation-report.md',
  'w5-n17-a-architecture-review.md',
  'w5-n17-a-security-review.md',
  'w5-n17-a-product-review.md',
  'w5-n17-a-validation-report.md',
] as const);

export function verifyInventoryCompleteness(): Readonly<{
  ok: boolean;
  rowCount: number;
  noRowAuthorizesDeliveryReliabilityFunctional: boolean;
  noRowAuthorizesW5N17Complete: boolean;
  requiredOwnershipRowsPresent: boolean;
}> {
  const ownershipIds = new Set(rowsByKind('ownership').map((row) => row.artifactId));
  const requiredOwnership = [
    'own-platform-reliability-layer',
    'own-notification-delivery-domain',
    'own-pc06-routing-delivery',
    'own-w5-n06-delivery-foundation-consume',
    'own-w5-n07-dispatch-foundation-consume',
    'own-w5-n08-queue-foundation-consume',
    'own-w5-n09-workers-foundation-consume',
    'own-w5-n12-scheduler-foundation-consume',
    'own-w5-n13-retry-foundation-consume',
    'own-secret-vault-consume',
    'own-connection-management-consume',
    'own-workspace-isolation-notifications',
    'own-notification-durable-queue',
    'own-per-channel-foundations-reference',
    'own-w5-n05-integration-foundation-consume',
    'own-w5-n11-worker-runtime-foundation-consume',
    'own-honest-product-boundaries',
  ];
  const requiredOwnershipRowsPresent = requiredOwnership.every((id) => ownershipIds.has(id));
  const noRowAuthorizesDeliveryReliabilityFunctional =
    W5_N17_A_DELIVERY_RELIABILITY_INVENTORY.every(
      (row) => !row.authorizesDeliveryReliabilityFunctional,
    );
  const noRowAuthorizesW5N17Complete = W5_N17_A_DELIVERY_RELIABILITY_INVENTORY.every(
    (row) => !row.authorizesW5N17Complete,
  );
  return Object.freeze({
    ok:
      W5_N17_A_DELIVERY_RELIABILITY_INVENTORY.length >= 45 &&
      noRowAuthorizesDeliveryReliabilityFunctional &&
      noRowAuthorizesW5N17Complete &&
      requiredOwnershipRowsPresent,
    rowCount: W5_N17_A_DELIVERY_RELIABILITY_INVENTORY.length,
    noRowAuthorizesDeliveryReliabilityFunctional,
    noRowAuthorizesW5N17Complete,
    requiredOwnershipRowsPresent,
  });
}

export function verifyHonestProductBaseline(): Readonly<{
  ok: boolean;
  noCustomerVisibleImplemented: boolean;
  infrastructureDocumented: boolean;
  plannedExplicit: boolean;
  notImplementedExplicit: boolean;
  deliveryReliabilityNotAuthorized: boolean;
  deliveryOnlyNotControlPlane: boolean;
}> {
  const implemented = W5_N17_A_HONEST_PRODUCT_BASELINE.implementedCapabilities;
  const noCustomerVisibleImplemented =
    implemented.length === 1 && implemented[0]?.includes('None') === true;
  const infrastructureDocumented =
    W5_N17_A_HONEST_PRODUCT_BASELINE.infrastructureCapabilities.length >= 8;
  const plannedExplicit = W5_N17_A_HONEST_PRODUCT_BASELINE.plannedCapabilities.length >= 1;
  const notImplementedExplicit =
    W5_N17_A_HONEST_PRODUCT_BASELINE.notYetImplementedCapabilities.length >= 5;
  const deliveryReliabilityNotAuthorized =
    !W5_N17_A_BINDING_FINDINGS.deliveryReliabilityFunctionalAuthorized;
  const deliveryOnlyNotControlPlane = !W5_N17_A_ARCHITECTURE_CLAIMS.notificationControlPlane;
  return Object.freeze({
    ok:
      noCustomerVisibleImplemented &&
      infrastructureDocumented &&
      plannedExplicit &&
      notImplementedExplicit &&
      deliveryReliabilityNotAuthorized &&
      deliveryOnlyNotControlPlane,
    noCustomerVisibleImplemented,
    infrastructureDocumented,
    plannedExplicit,
    notImplementedExplicit,
    deliveryReliabilityNotAuthorized,
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
  const ownershipUnchanged = !W5_N17_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged;
  const noDuplicateSubsystem =
    !W5_N17_A_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem &&
    !W5_N17_A_ARCHITECTURE_CLAIMS.duplicateRoutingEngine;
  const noMasterPlanChange = !W5_N17_A_ARCHITECTURE_CLAIMS.masterPlanModified;
  const exchangeAdapterUntouched = W5_N17_A_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched;
  const notificationControlPlaneForbidden = !W5_N17_A_ARCHITECTURE_CLAIMS.notificationControlPlane;
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
    'own-platform-reliability-layer',
    'own-notification-delivery-domain',
    'own-pc06-routing-delivery',
    'own-secret-vault-consume',
    'own-connection-management-consume',
    'own-notification-durable-queue',
    'own-per-channel-foundations-reference',
  ];
  const coreOwnership = ownershipRows.filter((row) => coreOwnershipIds.includes(row.artifactId));
  const substrateOwnersFrozen = coreOwnership.every((row) =>
    (W5_N17_A_SUBSTRATE_OWNERS as readonly string[]).includes(row.owner),
  );
  return Object.freeze({
    ok:
      W5_N17_A_BINDING_FINDINGS.ownershipBoundariesVerified &&
      !W5_N17_A_BINDING_FINDINGS.ownershipBoundariesChanged &&
      !W5_N17_A_ARCHITECTURE_CLAIMS.newPersistenceOwner &&
      substrateOwnersFrozen,
    substrateOwnersFrozen,
    ownershipVerified: W5_N17_A_BINDING_FINDINGS.ownershipBoundariesVerified,
    newPersistenceOwner: W5_N17_A_ARCHITECTURE_CLAIMS.newPersistenceOwner,
  });
}

export function verifyHonestyBoundaries(): Readonly<{
  ok: boolean;
  boundaryCount: number;
  reliabilityFoundationNotLiveTrading: boolean;
  platformReadyRequiresReliabilityEvidence: boolean;
  metricsFoundationNotReliabilityComplete: boolean;
}> {
  const boundaries = rowsHonestyBoundaries();
  const ids = new Set(boundaries.map((row) => row.artifactId));
  const reliabilityFoundationNotLiveTrading = ids.has(
    'honesty-platform-reliability-not-live-trading',
  );
  const platformReadyRequiresReliabilityEvidence = ids.has(
    'honesty-platform-ready-requires-reliability-evidence',
  );
  const metricsFoundationNotReliabilityComplete = ids.has(
    'honesty-metrics-foundation-not-reliability-complete',
  );
  return Object.freeze({
    ok:
      boundaries.length >= 4 &&
      reliabilityFoundationNotLiveTrading &&
      platformReadyRequiresReliabilityEvidence &&
      metricsFoundationNotReliabilityComplete,
    boundaryCount: boundaries.length,
    reliabilityFoundationNotLiveTrading,
    platformReadyRequiresReliabilityEvidence,
    metricsFoundationNotReliabilityComplete,
  });
}

export function buildDeliveryReliabilityDiagnostics(): Readonly<{
  inventory: ReturnType<typeof verifyInventoryCompleteness>;
  honestProduct: ReturnType<typeof verifyHonestProductBaseline>;
  architecture: ReturnType<typeof verifyArchitectureIntegrity>;
  ownership: ReturnType<typeof verifyOwnershipBoundaries>;
  honesty: ReturnType<typeof verifyHonestyBoundaries>;
  technicalDebtDelta: typeof W5_N17_A_TECHNICAL_DEBT_DELTA;
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
    technicalDebtDelta: W5_N17_A_TECHNICAL_DEBT_DELTA,
    ok:
      inventory.ok &&
      honestProduct.ok &&
      architecture.ok &&
      ownership.ok &&
      honesty.ok &&
      !W5_N17_A_BINDING_FINDINGS.deliveryReliabilityFunctionsAfterSliceA,
  });
}
