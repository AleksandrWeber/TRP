/**
 * W5-N01-a — Telegram Notification Conformance Registry.
 *
 * Validates the canonical Telegram notification inventory and Honest Product baseline.
 * Discovery and evidence assembly only — no runtime behaviour changes.
 */

import {
  W5_N01_A_ARCHITECTURE_CLAIMS,
  W5_N01_A_BINDING_FINDINGS,
  W5_N01_A_HONEST_PRODUCT_BASELINE,
  W5_N01_A_SLICE_ID,
  W5_N01_A_SUBSTRATE_OWNERS,
  W5_N01_A_TELEGRAM_NOTIFICATION_INVENTORY,
  W5_N01_A_TECHNICAL_DEBT_DELTA,
  rowsByKind,
  rowsHonestyBoundaries,
} from './w5-n01-a-telegram-notification-inventory';

export const W5_N01_A_CONFORMANCE_SLICE_ID = W5_N01_A_SLICE_ID;

export const W5_N01_A_REQUIRED_REPORTS = Object.freeze([
  'w5-n01-a-telegram-notification-inventory.md',
  'w5-n01-a-implementation-report.md',
  'w5-n01-a-architecture-review.md',
  'w5-n01-a-security-review.md',
  'w5-n01-a-product-review.md',
  'w5-n01-a-validation-report.md',
] as const);

export function verifyInventoryCompleteness(): Readonly<{
  ok: boolean;
  rowCount: number;
  noRowAuthorizesTelegramRealDelivery: boolean;
  noRowAuthorizesW5N01Complete: boolean;
  requiredOwnershipRowsPresent: boolean;
}> {
  const ownershipIds = new Set(rowsByKind('ownership').map((row) => row.artifactId));
  const requiredOwnership = [
    'own-telegram-bot-transport',
    'own-notification-delivery-domain',
    'own-delivery-pipeline',
    'own-notification-persistence',
    'own-secret-vault-telegram',
    'own-workspace-isolation-notifications',
    'own-user-notification-preferences',
    'own-message-template-catalog',
    'own-notification-durable-queue',
    'own-honest-product-boundaries',
  ];
  const requiredOwnershipRowsPresent = requiredOwnership.every((id) => ownershipIds.has(id));
  const noRowAuthorizesTelegramRealDelivery = W5_N01_A_TELEGRAM_NOTIFICATION_INVENTORY.every(
    (row) => !row.authorizesTelegramRealDelivery,
  );
  const noRowAuthorizesW5N01Complete = W5_N01_A_TELEGRAM_NOTIFICATION_INVENTORY.every(
    (row) => !row.authorizesW5N01Complete,
  );
  return Object.freeze({
    ok:
      W5_N01_A_TELEGRAM_NOTIFICATION_INVENTORY.length >= 40 &&
      noRowAuthorizesTelegramRealDelivery &&
      noRowAuthorizesW5N01Complete &&
      requiredOwnershipRowsPresent,
    rowCount: W5_N01_A_TELEGRAM_NOTIFICATION_INVENTORY.length,
    noRowAuthorizesTelegramRealDelivery,
    noRowAuthorizesW5N01Complete,
    requiredOwnershipRowsPresent,
  });
}

export function verifyHonestProductBaseline(): Readonly<{
  ok: boolean;
  noCustomerVisibleImplemented: boolean;
  infrastructureDocumented: boolean;
  plannedExplicit: boolean;
  notImplementedExplicit: boolean;
  telegramRealDeliveryNotAuthorized: boolean;
}> {
  const implemented = W5_N01_A_HONEST_PRODUCT_BASELINE.implementedCapabilities;
  const noCustomerVisibleImplemented =
    implemented.length === 1 && implemented[0]?.includes('None') === true;
  const infrastructureDocumented =
    W5_N01_A_HONEST_PRODUCT_BASELINE.infrastructureCapabilities.length >= 8;
  const plannedExplicit = W5_N01_A_HONEST_PRODUCT_BASELINE.plannedCapabilities.length >= 1;
  const notImplementedExplicit =
    W5_N01_A_HONEST_PRODUCT_BASELINE.notYetImplementedCapabilities.length >= 5;
  const telegramRealDeliveryNotAuthorized =
    !W5_N01_A_BINDING_FINDINGS.telegramRealDeliveryAuthorized;
  return Object.freeze({
    ok:
      noCustomerVisibleImplemented &&
      infrastructureDocumented &&
      plannedExplicit &&
      notImplementedExplicit &&
      telegramRealDeliveryNotAuthorized,
    noCustomerVisibleImplemented,
    infrastructureDocumented,
    plannedExplicit,
    notImplementedExplicit,
    telegramRealDeliveryNotAuthorized,
  });
}

export function verifyArchitectureIntegrity(): Readonly<{
  ok: boolean;
  ownershipUnchanged: boolean;
  noDuplicateSubsystem: boolean;
  noMasterPlanChange: boolean;
  exchangeAdapterUntouched: boolean;
}> {
  const ownershipUnchanged = !W5_N01_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged;
  const noDuplicateSubsystem =
    !W5_N01_A_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem &&
    !W5_N01_A_ARCHITECTURE_CLAIMS.duplicateRoutingEngine &&
    !W5_N01_A_ARCHITECTURE_CLAIMS.telegramControlPlane;
  const noMasterPlanChange = !W5_N01_A_ARCHITECTURE_CLAIMS.masterPlanModified;
  const exchangeAdapterUntouched = W5_N01_A_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched;
  return Object.freeze({
    ok:
      ownershipUnchanged && noDuplicateSubsystem && noMasterPlanChange && exchangeAdapterUntouched,
    ownershipUnchanged,
    noDuplicateSubsystem,
    noMasterPlanChange,
    exchangeAdapterUntouched,
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
    'own-telegram-bot-transport',
    'own-notification-delivery-domain',
    'own-delivery-pipeline',
    'own-notification-persistence',
    'own-secret-vault-telegram',
    'own-user-notification-preferences',
    'own-message-template-catalog',
    'own-notification-durable-queue',
  ];
  const coreOwnership = ownershipRows.filter((row) => coreOwnershipIds.includes(row.artifactId));
  const substrateOwnersFrozen = coreOwnership.every((row) =>
    (W5_N01_A_SUBSTRATE_OWNERS as readonly string[]).includes(row.owner),
  );
  return Object.freeze({
    ok:
      W5_N01_A_BINDING_FINDINGS.ownershipBoundariesVerified &&
      !W5_N01_A_BINDING_FINDINGS.ownershipBoundariesChanged &&
      !W5_N01_A_ARCHITECTURE_CLAIMS.newPersistenceOwner &&
      substrateOwnersFrozen,
    substrateOwnersFrozen,
    ownershipVerified: W5_N01_A_BINDING_FINDINGS.ownershipBoundariesVerified,
    newPersistenceOwner: W5_N01_A_ARCHITECTURE_CLAIMS.newPersistenceOwner,
  });
}

export function verifyHonestyBoundaries(): Readonly<{
  ok: boolean;
  boundaryCount: number;
  realDeliveryNotLiveTrading: boolean;
  deliveryOnlyNotControlPlane: boolean;
  inMemoryNotProductionBotApi: boolean;
}> {
  const boundaries = rowsHonestyBoundaries();
  const ids = new Set(boundaries.map((row) => row.artifactId));
  const realDeliveryNotLiveTrading = ids.has('honesty-real-delivery-not-live-trading');
  const deliveryOnlyNotControlPlane = ids.has('honesty-telegram-delivery-only-not-control-plane');
  const inMemoryNotProductionBotApi = ids.has('honesty-in-memory-not-production-bot-api');
  return Object.freeze({
    ok:
      boundaries.length >= 4 &&
      realDeliveryNotLiveTrading &&
      deliveryOnlyNotControlPlane &&
      inMemoryNotProductionBotApi,
    boundaryCount: boundaries.length,
    realDeliveryNotLiveTrading,
    deliveryOnlyNotControlPlane,
    inMemoryNotProductionBotApi,
  });
}

export function buildTelegramNotificationDiagnostics(): Readonly<{
  inventory: ReturnType<typeof verifyInventoryCompleteness>;
  honestProduct: ReturnType<typeof verifyHonestProductBaseline>;
  architecture: ReturnType<typeof verifyArchitectureIntegrity>;
  ownership: ReturnType<typeof verifyOwnershipBoundaries>;
  honesty: ReturnType<typeof verifyHonestyBoundaries>;
  technicalDebtDelta: typeof W5_N01_A_TECHNICAL_DEBT_DELTA;
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
    technicalDebtDelta: W5_N01_A_TECHNICAL_DEBT_DELTA,
    ok:
      inventory.ok &&
      honestProduct.ok &&
      architecture.ok &&
      ownership.ok &&
      honesty.ok &&
      !W5_N01_A_BINDING_FINDINGS.telegramNotificationsFunctionAfterSliceA,
  });
}
