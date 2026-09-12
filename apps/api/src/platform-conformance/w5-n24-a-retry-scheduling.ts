/**
 * W5-N24-a — Notification Retry Scheduling Conformance Registry.
 *
 * Validates the canonical platform scheduling inventory and Honest Product baseline.
 * Discovery and evidence assembly only — no runtime behaviour changes.
 */

import {
  W5_N24_A_ARCHITECTURE_CLAIMS,
  W5_N24_A_BINDING_FINDINGS,
  W5_N24_A_HONEST_PRODUCT_BASELINE,
  W5_N24_A_SLICE_ID,
  W5_N24_A_SUBSTRATE_OWNERS,
  W5_N24_A_RETRY_SCHEDULING_INVENTORY,
  W5_N24_A_TECHNICAL_DEBT_DELTA,
  rowsByKind,
  rowsHonestyBoundaries,
} from './w5-n24-a-retry-scheduling-inventory';

export const W5_N24_A_CONFORMANCE_SLICE_ID = W5_N24_A_SLICE_ID;

export const W5_N24_A_REQUIRED_REPORTS = Object.freeze([
  'w5-n24-a-inventory.md',
  'w5-n24-a-implementation-report.md',
  'w5-n24-a-architecture-review.md',
  'w5-n24-a-security-review.md',
  'w5-n24-a-product-review.md',
  'w5-n24-a-validation-report.md',
] as const);

export function verifyInventoryCompleteness(): Readonly<{
  ok: boolean;
  rowCount: number;
  noRowAuthorizesSchedulingFunctional: boolean;
  noRowAuthorizesW5N24Complete: boolean;
  requiredOwnershipRowsPresent: boolean;
}> {
  const ownershipIds = new Set(rowsByKind('ownership').map((entry) => entry.artifactId));
  const requiredOwnership = [
    'own-platform-scheduling-layer',
    'own-notification-delivery-domain',
    'own-pc06-routing-delivery',
    'own-w5-n17-delivery-reliability-consume',
    'own-w5-n18-retry-execution-consume',
    'own-w5-n19-retry-scheduling-consume',
    'own-w5-n20-retry-policy-consume',
    'own-w5-n21-retry-backoff-consume',
    'own-w5-n22-retry-backoff-calculation-consume',
    'own-w5-n23-retry-eligibility-consume',
    'own-secret-vault-consume',
    'own-connection-management-consume',
    'own-workspace-isolation-notifications',
    'own-notification-durable-queue',
    'own-honest-product-boundaries',
  ];
  const requiredOwnershipRowsPresent = requiredOwnership.every((id) => ownershipIds.has(id));
  const noRowAuthorizesSchedulingFunctional = W5_N24_A_RETRY_SCHEDULING_INVENTORY.every(
    (entry) => !entry.authorizesSchedulingFunctional,
  );
  const noRowAuthorizesW5N24Complete = W5_N24_A_RETRY_SCHEDULING_INVENTORY.every(
    (entry) => !entry.authorizesW5N24Complete,
  );
  return Object.freeze({
    ok:
      W5_N24_A_RETRY_SCHEDULING_INVENTORY.length >= 50 &&
      noRowAuthorizesSchedulingFunctional &&
      noRowAuthorizesW5N24Complete &&
      requiredOwnershipRowsPresent,
    rowCount: W5_N24_A_RETRY_SCHEDULING_INVENTORY.length,
    noRowAuthorizesSchedulingFunctional,
    noRowAuthorizesW5N24Complete,
    requiredOwnershipRowsPresent,
  });
}

export function verifyHonestProductBaseline(): Readonly<{
  ok: boolean;
  noCustomerVisibleImplemented: boolean;
  infrastructureDocumented: boolean;
  plannedExplicit: boolean;
  notImplementedExplicit: boolean;
  schedulingNotAuthorized: boolean;
  deliveryOnlyNotControlPlane: boolean;
}> {
  const implemented = W5_N24_A_HONEST_PRODUCT_BASELINE.implementedCapabilities;
  const noCustomerVisibleImplemented =
    implemented.length === 1 && implemented[0]?.includes('None') === true;
  const infrastructureDocumented =
    W5_N24_A_HONEST_PRODUCT_BASELINE.infrastructureCapabilities.length >= 8;
  const plannedExplicit = W5_N24_A_HONEST_PRODUCT_BASELINE.plannedCapabilities.length >= 1;
  const notImplementedExplicit =
    W5_N24_A_HONEST_PRODUCT_BASELINE.notYetImplementedCapabilities.length >= 5;
  const schedulingNotAuthorized = !W5_N24_A_BINDING_FINDINGS.schedulingFunctionalAuthorized;
  const deliveryOnlyNotControlPlane = !W5_N24_A_ARCHITECTURE_CLAIMS.notificationControlPlane;
  return Object.freeze({
    ok:
      noCustomerVisibleImplemented &&
      infrastructureDocumented &&
      plannedExplicit &&
      notImplementedExplicit &&
      schedulingNotAuthorized &&
      deliveryOnlyNotControlPlane,
    noCustomerVisibleImplemented,
    infrastructureDocumented,
    plannedExplicit,
    notImplementedExplicit,
    schedulingNotAuthorized,
    deliveryOnlyNotControlPlane,
  });
}

export function verifyArchitectureIntegrity(): Readonly<{
  ok: boolean;
  ownershipUnchanged: boolean;
  noDuplicateSubsystem: boolean;
  noRuntimeScheduler: boolean;
  noMasterPlanChange: boolean;
  exchangeAdapterUntouched: boolean;
  notificationControlPlaneForbidden: boolean;
}> {
  const ownershipUnchanged = !W5_N24_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged;
  const noDuplicateSubsystem =
    !W5_N24_A_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem &&
    !W5_N24_A_ARCHITECTURE_CLAIMS.duplicateSchedulingSubsystem &&
    !W5_N24_A_ARCHITECTURE_CLAIMS.duplicateRetrySubsystem;
  const noRuntimeScheduler =
    !W5_N24_A_ARCHITECTURE_CLAIMS.runtimeSchedulerIntroduced &&
    !W5_N24_A_ARCHITECTURE_CLAIMS.retryEngineIntroduced &&
    !W5_N24_A_ARCHITECTURE_CLAIMS.schedulerPlatformIntroduced &&
    !W5_N24_A_ARCHITECTURE_CLAIMS.workflowEngineIntroduced &&
    !W5_N24_A_ARCHITECTURE_CLAIMS.eventBusProductIntroduced &&
    !W5_N24_A_ARCHITECTURE_CLAIMS.orchestrationPlatformIntroduced &&
    !W5_N24_A_ARCHITECTURE_CLAIMS.workerIntroduced &&
    !W5_N24_A_ARCHITECTURE_CLAIMS.timerImplementationIntroduced &&
    !W5_N24_A_ARCHITECTURE_CLAIMS.runtimeSchedulingIntroduced;
  const noMasterPlanChange = !W5_N24_A_ARCHITECTURE_CLAIMS.masterPlanModified;
  const exchangeAdapterUntouched = W5_N24_A_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched;
  const notificationControlPlaneForbidden = !W5_N24_A_ARCHITECTURE_CLAIMS.notificationControlPlane;
  return Object.freeze({
    ok:
      ownershipUnchanged &&
      noDuplicateSubsystem &&
      noRuntimeScheduler &&
      noMasterPlanChange &&
      exchangeAdapterUntouched &&
      notificationControlPlaneForbidden,
    ownershipUnchanged,
    noDuplicateSubsystem,
    noRuntimeScheduler,
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
    'own-platform-scheduling-layer',
    'own-notification-delivery-domain',
    'own-pc06-routing-delivery',
    'own-secret-vault-consume',
    'own-connection-management-consume',
    'own-notification-durable-queue',
    'own-w5-n17-delivery-reliability-consume',
    'own-w5-n18-retry-execution-consume',
    'own-w5-n19-retry-scheduling-consume',
    'own-w5-n20-retry-policy-consume',
    'own-w5-n21-retry-backoff-consume',
    'own-w5-n22-retry-backoff-calculation-consume',
    'own-w5-n23-retry-eligibility-consume',
  ];
  const coreOwnership = ownershipRows.filter((entry) =>
    coreOwnershipIds.includes(entry.artifactId),
  );
  const substrateOwnersFrozen = coreOwnership.every((entry) =>
    (W5_N24_A_SUBSTRATE_OWNERS as readonly string[]).includes(entry.owner),
  );
  return Object.freeze({
    ok:
      W5_N24_A_BINDING_FINDINGS.ownershipBoundariesVerified &&
      !W5_N24_A_BINDING_FINDINGS.ownershipBoundariesChanged &&
      !W5_N24_A_ARCHITECTURE_CLAIMS.newPersistenceOwner &&
      substrateOwnersFrozen,
    substrateOwnersFrozen,
    ownershipVerified: W5_N24_A_BINDING_FINDINGS.ownershipBoundariesVerified,
    newPersistenceOwner: W5_N24_A_ARCHITECTURE_CLAIMS.newPersistenceOwner,
  });
}

export function verifyHonestyBoundaries(): Readonly<{
  ok: boolean;
  boundaryCount: number;
  inventoryOnlyNotEligibilityDetermination: boolean;
  inventoryOnlyNotBackoffCalculation: boolean;
  inventoryOnlyNotRuntimeScheduling: boolean;
  inventoryOnlyNotExecution: boolean;
  inventoryOnlyNotLifecycle: boolean;
  inventoryOnlyNotTimers: boolean;
  inventoryOnlyNotWorkers: boolean;
  inventoryOnlyNotOrchestration: boolean;
  inventoryOutputInformational: boolean;
  noRuntimeScheduler: boolean;
  noRetryEngine: boolean;
  noTimerImplementation: boolean;
}> {
  const boundaries = rowsHonestyBoundaries();
  const ids = new Set(boundaries.map((entry) => entry.artifactId));
  const inventoryOnlyNotEligibilityDetermination = ids.has(
    'honesty-inventory-only-not-eligibility-determination',
  );
  const inventoryOnlyNotBackoffCalculation = ids.has(
    'honesty-inventory-only-not-backoff-calculation',
  );
  const inventoryOnlyNotRuntimeScheduling = ids.has(
    'honesty-inventory-only-not-runtime-scheduling',
  );
  const inventoryOnlyNotExecution = ids.has('honesty-inventory-only-not-execution');
  const inventoryOnlyNotLifecycle = ids.has('honesty-inventory-only-not-retry-lifecycle');
  const inventoryOnlyNotTimers = ids.has('honesty-inventory-only-not-timers');
  const inventoryOnlyNotWorkers = ids.has('honesty-inventory-only-not-workers');
  const inventoryOnlyNotOrchestration = ids.has('honesty-inventory-only-not-orchestration');
  const inventoryOutputInformational = ids.has('honesty-inventory-output-informational');
  const noRuntimeScheduler = ids.has('honesty-no-runtime-scheduler');
  const noRetryEngine = ids.has('honesty-no-retry-engine');
  const noTimerImplementation = ids.has('honesty-no-timer-implementation');
  return Object.freeze({
    ok:
      boundaries.length >= 10 &&
      inventoryOnlyNotEligibilityDetermination &&
      inventoryOnlyNotBackoffCalculation &&
      inventoryOnlyNotRuntimeScheduling &&
      inventoryOnlyNotExecution &&
      inventoryOnlyNotLifecycle &&
      inventoryOnlyNotTimers &&
      inventoryOnlyNotWorkers &&
      inventoryOnlyNotOrchestration &&
      inventoryOutputInformational &&
      noRuntimeScheduler &&
      noRetryEngine &&
      noTimerImplementation,
    boundaryCount: boundaries.length,
    inventoryOnlyNotEligibilityDetermination,
    inventoryOnlyNotBackoffCalculation,
    inventoryOnlyNotRuntimeScheduling,
    inventoryOnlyNotExecution,
    inventoryOnlyNotLifecycle,
    inventoryOnlyNotTimers,
    inventoryOnlyNotWorkers,
    inventoryOnlyNotOrchestration,
    inventoryOutputInformational,
    noRuntimeScheduler,
    noRetryEngine,
    noTimerImplementation,
  });
}

export function buildSchedulingDiagnostics(): Readonly<{
  inventory: ReturnType<typeof verifyInventoryCompleteness>;
  honestProduct: ReturnType<typeof verifyHonestProductBaseline>;
  architecture: ReturnType<typeof verifyArchitectureIntegrity>;
  ownership: ReturnType<typeof verifyOwnershipBoundaries>;
  honesty: ReturnType<typeof verifyHonestyBoundaries>;
  technicalDebtDelta: typeof W5_N24_A_TECHNICAL_DEBT_DELTA;
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
    technicalDebtDelta: W5_N24_A_TECHNICAL_DEBT_DELTA,
    ok:
      inventory.ok &&
      honestProduct.ok &&
      architecture.ok &&
      ownership.ok &&
      honesty.ok &&
      !W5_N24_A_BINDING_FINDINGS.schedulingFunctionsAfterSliceA,
  });
}
