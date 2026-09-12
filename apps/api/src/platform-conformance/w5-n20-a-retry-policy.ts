/**
 * W5-N20-a — Notification Retry Policy Conformance Registry.
 *
 * Validates the canonical platform retry policy inventory and Honest Product baseline.
 * Discovery and evidence assembly only — no runtime behaviour changes.
 */

import {
  W5_N20_A_ARCHITECTURE_CLAIMS,
  W5_N20_A_BINDING_FINDINGS,
  W5_N20_A_HONEST_PRODUCT_BASELINE,
  W5_N20_A_SLICE_ID,
  W5_N20_A_SUBSTRATE_OWNERS,
  W5_N20_A_RETRY_POLICY_INVENTORY,
  W5_N20_A_TECHNICAL_DEBT_DELTA,
  rowsByKind,
  rowsHonestyBoundaries,
} from './w5-n20-a-retry-policy-inventory';

export const W5_N20_A_CONFORMANCE_SLICE_ID = W5_N20_A_SLICE_ID;

export const W5_N20_A_REQUIRED_REPORTS = Object.freeze([
  'w5-n20-a-retry-policy-inventory.md',
  'w5-n20-a-implementation-report.md',
  'w5-n20-a-architecture-review.md',
  'w5-n20-a-security-review.md',
  'w5-n20-a-product-review.md',
  'w5-n20-a-validation-report.md',
] as const);

export function verifyInventoryCompleteness(): Readonly<{
  ok: boolean;
  rowCount: number;
  noRowAuthorizesRetryPolicyFunctional: boolean;
  noRowAuthorizesW5N20Complete: boolean;
  requiredOwnershipRowsPresent: boolean;
}> {
  const ownershipIds = new Set(rowsByKind('ownership').map((row) => row.artifactId));
  const requiredOwnership = [
    'own-platform-retry-policy-layer',
    'own-notification-delivery-domain',
    'own-pc06-routing-delivery',
    'own-w5-n18-retry-execution-consume',
    'own-w5-n19-retry-scheduling-consume',
    'own-secret-vault-consume',
    'own-connection-management-consume',
    'own-workspace-isolation-notifications',
    'own-notification-durable-queue',
    'own-honest-product-boundaries',
  ];
  const requiredOwnershipRowsPresent = requiredOwnership.every((id) => ownershipIds.has(id));
  const noRowAuthorizesRetryPolicyFunctional = W5_N20_A_RETRY_POLICY_INVENTORY.every(
    (row) => !row.authorizesRetryPolicyFunctional,
  );
  const noRowAuthorizesW5N20Complete = W5_N20_A_RETRY_POLICY_INVENTORY.every(
    (row) => !row.authorizesW5N20Complete,
  );
  return Object.freeze({
    ok:
      W5_N20_A_RETRY_POLICY_INVENTORY.length >= 50 &&
      noRowAuthorizesRetryPolicyFunctional &&
      noRowAuthorizesW5N20Complete &&
      requiredOwnershipRowsPresent,
    rowCount: W5_N20_A_RETRY_POLICY_INVENTORY.length,
    noRowAuthorizesRetryPolicyFunctional,
    noRowAuthorizesW5N20Complete,
    requiredOwnershipRowsPresent,
  });
}

export function verifyHonestProductBaseline(): Readonly<{
  ok: boolean;
  noCustomerVisibleImplemented: boolean;
  infrastructureDocumented: boolean;
  plannedExplicit: boolean;
  notImplementedExplicit: boolean;
  retryPolicyNotAuthorized: boolean;
  deliveryOnlyNotControlPlane: boolean;
}> {
  const implemented = W5_N20_A_HONEST_PRODUCT_BASELINE.implementedCapabilities;
  const noCustomerVisibleImplemented =
    implemented.length === 1 && implemented[0]?.includes('None') === true;
  const infrastructureDocumented =
    W5_N20_A_HONEST_PRODUCT_BASELINE.infrastructureCapabilities.length >= 8;
  const plannedExplicit = W5_N20_A_HONEST_PRODUCT_BASELINE.plannedCapabilities.length >= 1;
  const notImplementedExplicit =
    W5_N20_A_HONEST_PRODUCT_BASELINE.notYetImplementedCapabilities.length >= 5;
  const retryPolicyNotAuthorized = !W5_N20_A_BINDING_FINDINGS.retryPolicyFunctionalAuthorized;
  const deliveryOnlyNotControlPlane = !W5_N20_A_ARCHITECTURE_CLAIMS.notificationControlPlane;
  return Object.freeze({
    ok:
      noCustomerVisibleImplemented &&
      infrastructureDocumented &&
      plannedExplicit &&
      notImplementedExplicit &&
      retryPolicyNotAuthorized &&
      deliveryOnlyNotControlPlane,
    noCustomerVisibleImplemented,
    infrastructureDocumented,
    plannedExplicit,
    notImplementedExplicit,
    retryPolicyNotAuthorized,
    deliveryOnlyNotControlPlane,
  });
}

export function verifyArchitectureIntegrity(): Readonly<{
  ok: boolean;
  ownershipUnchanged: boolean;
  noDuplicateSubsystem: boolean;
  noPolicyEngine: boolean;
  noMasterPlanChange: boolean;
  exchangeAdapterUntouched: boolean;
  notificationControlPlaneForbidden: boolean;
}> {
  const ownershipUnchanged = !W5_N20_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged;
  const noDuplicateSubsystem =
    !W5_N20_A_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem &&
    !W5_N20_A_ARCHITECTURE_CLAIMS.duplicatePolicySubsystem;
  const noPolicyEngine =
    !W5_N20_A_ARCHITECTURE_CLAIMS.policyEngineIntroduced &&
    !W5_N20_A_ARCHITECTURE_CLAIMS.retryPlatformIntroduced &&
    !W5_N20_A_ARCHITECTURE_CLAIMS.workflowEngineIntroduced &&
    !W5_N20_A_ARCHITECTURE_CLAIMS.eventBusProductIntroduced &&
    !W5_N20_A_ARCHITECTURE_CLAIMS.orchestrationPlatformIntroduced;
  const noMasterPlanChange = !W5_N20_A_ARCHITECTURE_CLAIMS.masterPlanModified;
  const exchangeAdapterUntouched = W5_N20_A_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched;
  const notificationControlPlaneForbidden = !W5_N20_A_ARCHITECTURE_CLAIMS.notificationControlPlane;
  return Object.freeze({
    ok:
      ownershipUnchanged &&
      noDuplicateSubsystem &&
      noPolicyEngine &&
      noMasterPlanChange &&
      exchangeAdapterUntouched &&
      notificationControlPlaneForbidden,
    ownershipUnchanged,
    noDuplicateSubsystem,
    noPolicyEngine,
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
    'own-platform-retry-policy-layer',
    'own-notification-delivery-domain',
    'own-pc06-routing-delivery',
    'own-secret-vault-consume',
    'own-connection-management-consume',
    'own-notification-durable-queue',
    'own-w5-n18-retry-execution-consume',
    'own-w5-n19-retry-scheduling-consume',
  ];
  const coreOwnership = ownershipRows.filter((row) => coreOwnershipIds.includes(row.artifactId));
  const substrateOwnersFrozen = coreOwnership.every((row) =>
    (W5_N20_A_SUBSTRATE_OWNERS as readonly string[]).includes(row.owner),
  );
  return Object.freeze({
    ok:
      W5_N20_A_BINDING_FINDINGS.ownershipBoundariesVerified &&
      !W5_N20_A_BINDING_FINDINGS.ownershipBoundariesChanged &&
      !W5_N20_A_ARCHITECTURE_CLAIMS.newPersistenceOwner &&
      substrateOwnersFrozen,
    substrateOwnersFrozen,
    ownershipVerified: W5_N20_A_BINDING_FINDINGS.ownershipBoundariesVerified,
    newPersistenceOwner: W5_N20_A_ARCHITECTURE_CLAIMS.newPersistenceOwner,
  });
}

export function verifyHonestyBoundaries(): Readonly<{
  ok: boolean;
  boundaryCount: number;
  policyNotEvaluationRuntime: boolean;
  noPolicyEngine: boolean;
  schedulingNotRetryPolicy: boolean;
}> {
  const boundaries = rowsHonestyBoundaries();
  const ids = new Set(boundaries.map((row) => row.artifactId));
  const policyNotEvaluationRuntime = ids.has('honesty-retry-policy-not-evaluation-runtime');
  const noPolicyEngine = ids.has('honesty-no-policy-engine');
  const schedulingNotRetryPolicy = ids.has('honesty-retry-scheduling-not-retry-policy');
  return Object.freeze({
    ok:
      boundaries.length >= 4 &&
      policyNotEvaluationRuntime &&
      noPolicyEngine &&
      schedulingNotRetryPolicy,
    boundaryCount: boundaries.length,
    policyNotEvaluationRuntime,
    noPolicyEngine,
    schedulingNotRetryPolicy,
  });
}

export function buildRetryPolicyDiagnostics(): Readonly<{
  inventory: ReturnType<typeof verifyInventoryCompleteness>;
  honestProduct: ReturnType<typeof verifyHonestProductBaseline>;
  architecture: ReturnType<typeof verifyArchitectureIntegrity>;
  ownership: ReturnType<typeof verifyOwnershipBoundaries>;
  honesty: ReturnType<typeof verifyHonestyBoundaries>;
  technicalDebtDelta: typeof W5_N20_A_TECHNICAL_DEBT_DELTA;
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
    technicalDebtDelta: W5_N20_A_TECHNICAL_DEBT_DELTA,
    ok:
      inventory.ok &&
      honestProduct.ok &&
      architecture.ok &&
      ownership.ok &&
      honesty.ok &&
      !W5_N20_A_BINDING_FINDINGS.retryPolicyFunctionsAfterSliceA,
  });
}
