/**
 * W5-N03-a — Slack / Discord / Teams Notification Conformance Registry.
 *
 * Validates the canonical Slack / Discord / Teams notification inventory and Honest Product baseline.
 * Discovery and evidence assembly only — no runtime behaviour changes.
 */

import {
  W5_N03_A_ARCHITECTURE_CLAIMS,
  W5_N03_A_BINDING_FINDINGS,
  W5_N03_A_HONEST_PRODUCT_BASELINE,
  W5_N03_A_SLICE_ID,
  W5_N03_A_SUBSTRATE_OWNERS,
  W5_N03_A_SLACK_DISCORD_TEAMS_NOTIFICATION_INVENTORY,
  W5_N03_A_TECHNICAL_DEBT_DELTA,
  rowsByKind,
  rowsHonestyBoundaries,
} from './w5-n03-a-slack-discord-teams-notification-inventory';

export const W5_N03_A_CONFORMANCE_SLICE_ID = W5_N03_A_SLICE_ID;

export const W5_N03_A_REQUIRED_REPORTS = Object.freeze([
  'w5-n03-a-slack-discord-teams-notification-inventory.md',
  'w5-n03-a-implementation-report.md',
  'w5-n03-a-architecture-review.md',
  'w5-n03-a-security-review.md',
  'w5-n03-a-product-review.md',
  'w5-n03-a-validation-report.md',
] as const);

export function verifyInventoryCompleteness(): Readonly<{
  ok: boolean;
  rowCount: number;
  noRowAuthorizesWebhookRealDelivery: boolean;
  noRowAuthorizesW5N03Complete: boolean;
  requiredOwnershipRowsPresent: boolean;
}> {
  const ownershipIds = new Set(rowsByKind('ownership').map((row) => row.artifactId));
  const requiredOwnership = [
    'own-slack-discord-teams-webhook-transport',
    'own-notification-delivery-domain',
    'own-delivery-pipeline',
    'own-notification-persistence',
    'own-secret-vault-webhook',
    'own-connection-management-webhook',
    'own-workspace-isolation-notifications',
    'own-user-notification-preferences',
    'own-notification-durable-queue',
    'own-honest-product-boundaries',
  ];
  const requiredOwnershipRowsPresent = requiredOwnership.every((id) => ownershipIds.has(id));
  const noRowAuthorizesWebhookRealDelivery =
    W5_N03_A_SLACK_DISCORD_TEAMS_NOTIFICATION_INVENTORY.every(
      (row) => !row.authorizesWebhookRealDelivery,
    );
  const noRowAuthorizesW5N03Complete = W5_N03_A_SLACK_DISCORD_TEAMS_NOTIFICATION_INVENTORY.every(
    (row) => !row.authorizesW5N03Complete,
  );
  return Object.freeze({
    ok:
      W5_N03_A_SLACK_DISCORD_TEAMS_NOTIFICATION_INVENTORY.length >= 45 &&
      noRowAuthorizesWebhookRealDelivery &&
      noRowAuthorizesW5N03Complete &&
      requiredOwnershipRowsPresent,
    rowCount: W5_N03_A_SLACK_DISCORD_TEAMS_NOTIFICATION_INVENTORY.length,
    noRowAuthorizesWebhookRealDelivery,
    noRowAuthorizesW5N03Complete,
    requiredOwnershipRowsPresent,
  });
}

export function verifyHonestProductBaseline(): Readonly<{
  ok: boolean;
  noCustomerVisibleImplemented: boolean;
  infrastructureDocumented: boolean;
  plannedExplicit: boolean;
  notImplementedExplicit: boolean;
  webhookRealDeliveryNotAuthorized: boolean;
  teamChatDeliveryOnlyNotControlPlane: boolean;
}> {
  const implemented = W5_N03_A_HONEST_PRODUCT_BASELINE.implementedCapabilities;
  const noCustomerVisibleImplemented =
    implemented.length === 1 && implemented[0]?.includes('None') === true;
  const infrastructureDocumented =
    W5_N03_A_HONEST_PRODUCT_BASELINE.infrastructureCapabilities.length >= 8;
  const plannedExplicit = W5_N03_A_HONEST_PRODUCT_BASELINE.plannedCapabilities.length >= 1;
  const notImplementedExplicit =
    W5_N03_A_HONEST_PRODUCT_BASELINE.notYetImplementedCapabilities.length >= 5;
  const webhookRealDeliveryNotAuthorized = !W5_N03_A_BINDING_FINDINGS.webhookRealDeliveryAuthorized;
  const teamChatDeliveryOnlyNotControlPlane = !W5_N03_A_ARCHITECTURE_CLAIMS.webhookControlPlane;
  return Object.freeze({
    ok:
      noCustomerVisibleImplemented &&
      infrastructureDocumented &&
      plannedExplicit &&
      notImplementedExplicit &&
      webhookRealDeliveryNotAuthorized &&
      teamChatDeliveryOnlyNotControlPlane,
    noCustomerVisibleImplemented,
    infrastructureDocumented,
    plannedExplicit,
    notImplementedExplicit,
    webhookRealDeliveryNotAuthorized,
    teamChatDeliveryOnlyNotControlPlane,
  });
}

export function verifyArchitectureIntegrity(): Readonly<{
  ok: boolean;
  ownershipUnchanged: boolean;
  noDuplicateSubsystem: boolean;
  noMasterPlanChange: boolean;
  exchangeAdapterUntouched: boolean;
  teamChatControlPlaneForbidden: boolean;
}> {
  const ownershipUnchanged = !W5_N03_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged;
  const noDuplicateSubsystem =
    !W5_N03_A_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem &&
    !W5_N03_A_ARCHITECTURE_CLAIMS.duplicateRoutingEngine;
  const noMasterPlanChange = !W5_N03_A_ARCHITECTURE_CLAIMS.masterPlanModified;
  const exchangeAdapterUntouched = W5_N03_A_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched;
  const teamChatControlPlaneForbidden = !W5_N03_A_ARCHITECTURE_CLAIMS.webhookControlPlane;
  return Object.freeze({
    ok:
      ownershipUnchanged &&
      noDuplicateSubsystem &&
      noMasterPlanChange &&
      exchangeAdapterUntouched &&
      teamChatControlPlaneForbidden,
    ownershipUnchanged,
    noDuplicateSubsystem,
    noMasterPlanChange,
    exchangeAdapterUntouched,
    teamChatControlPlaneForbidden,
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
    'own-slack-discord-teams-webhook-transport',
    'own-notification-delivery-domain',
    'own-delivery-pipeline',
    'own-notification-persistence',
    'own-secret-vault-webhook',
    'own-connection-management-webhook',
    'own-user-notification-preferences',
    'own-notification-durable-queue',
  ];
  const coreOwnership = ownershipRows.filter((row) => coreOwnershipIds.includes(row.artifactId));
  const substrateOwnersFrozen = coreOwnership.every((row) =>
    (W5_N03_A_SUBSTRATE_OWNERS as readonly string[]).includes(row.owner),
  );
  return Object.freeze({
    ok:
      W5_N03_A_BINDING_FINDINGS.ownershipBoundariesVerified &&
      !W5_N03_A_BINDING_FINDINGS.ownershipBoundariesChanged &&
      !W5_N03_A_ARCHITECTURE_CLAIMS.newPersistenceOwner &&
      substrateOwnersFrozen,
    substrateOwnersFrozen,
    ownershipVerified: W5_N03_A_BINDING_FINDINGS.ownershipBoundariesVerified,
    newPersistenceOwner: W5_N03_A_ARCHITECTURE_CLAIMS.newPersistenceOwner,
  });
}

export function verifyHonestyBoundaries(): Readonly<{
  ok: boolean;
  boundaryCount: number;
  realDeliveryNotLiveTrading: boolean;
  reservedInactiveNotConnected: boolean;
  webhookConnectedRequiresRoundTrip: boolean;
}> {
  const boundaries = rowsHonestyBoundaries();
  const ids = new Set(boundaries.map((row) => row.artifactId));
  const realDeliveryNotLiveTrading = ids.has('honesty-real-delivery-not-live-trading');
  const reservedInactiveNotConnected = ids.has('honesty-reserved-inactive-not-production-webhook');
  const webhookConnectedRequiresRoundTrip = ids.has(
    'honesty-connected-requires-webhook-round-trip',
  );
  return Object.freeze({
    ok:
      boundaries.length >= 4 &&
      realDeliveryNotLiveTrading &&
      reservedInactiveNotConnected &&
      webhookConnectedRequiresRoundTrip,
    boundaryCount: boundaries.length,
    realDeliveryNotLiveTrading,
    reservedInactiveNotConnected,
    webhookConnectedRequiresRoundTrip,
  });
}

export function buildSlackDiscordTeamsNotificationDiagnostics(): Readonly<{
  inventory: ReturnType<typeof verifyInventoryCompleteness>;
  honestProduct: ReturnType<typeof verifyHonestProductBaseline>;
  architecture: ReturnType<typeof verifyArchitectureIntegrity>;
  ownership: ReturnType<typeof verifyOwnershipBoundaries>;
  honesty: ReturnType<typeof verifyHonestyBoundaries>;
  technicalDebtDelta: typeof W5_N03_A_TECHNICAL_DEBT_DELTA;
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
    technicalDebtDelta: W5_N03_A_TECHNICAL_DEBT_DELTA,
    ok:
      inventory.ok &&
      honestProduct.ok &&
      architecture.ok &&
      ownership.ok &&
      honesty.ok &&
      !W5_N03_A_BINDING_FINDINGS.slackDiscordTeamsNotificationsFunctionAfterSliceA,
  });
}
