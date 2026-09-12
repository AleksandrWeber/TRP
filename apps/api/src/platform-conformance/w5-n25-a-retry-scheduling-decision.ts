/**
 * W5-N25-a — Notification Retry Scheduling Decision Conformance Registry.
 *
 * Validates the canonical platform decision inventory and Honest Product baseline.
 * Discovery and evidence assembly only — no runtime behaviour changes.
 */

import {
  W5_N25_A_ARCHITECTURE_CLAIMS,
  W5_N25_A_BINDING_FINDINGS,
  W5_N25_A_HONEST_PRODUCT_BASELINE,
  W5_N25_A_SLICE_ID,
  W5_N25_A_SUBSTRATE_OWNERS,
  W5_N25_A_RETRY_SCHEDULING_DECISION_INVENTORY,
  W5_N25_A_TECHNICAL_DEBT_DELTA,
  rowsByKind,
  rowsHonestyBoundaries,
} from './w5-n25-a-retry-scheduling-decision-inventory';

export const W5_N25_A_CONFORMANCE_SLICE_ID = W5_N25_A_SLICE_ID;

export const W5_N25_A_REQUIRED_REPORTS = Object.freeze([
  'w5-n25-a-inventory.md',
  'w5-n25-a-implementation-report.md',
  'w5-n25-a-architecture-review.md',
  'w5-n25-a-security-review.md',
  'w5-n25-a-product-review.md',
  'w5-n25-a-validation-report.md',
] as const);

export function verifyInventoryCompleteness(): Readonly<{
  ok: boolean;
  rowCount: number;
  noRowAuthorizesDecisionFunctional: boolean;
  noRowAuthorizesW5N25Complete: boolean;
  requiredOwnershipRowsPresent: boolean;
}> {
  const ownershipIds = new Set(rowsByKind('ownership').map((entry) => entry.artifactId));
  const requiredOwnership = [
    'own-platform-decision-layer',
    'own-notification-delivery-domain',
    'own-pc06-routing-delivery',
    'own-w5-n17-delivery-reliability-consume',
    'own-w5-n18-retry-execution-consume',
    'own-w5-n19-retry-scheduling-consume',
    'own-w5-n20-retry-policy-consume',
    'own-w5-n21-retry-backoff-consume',
    'own-w5-n22-retry-backoff-calculation-consume',
    'own-w5-n23-retry-eligibility-consume',
    'own-w5-n24-retry-scheduling-consume',
    'own-secret-vault-consume',
    'own-connection-management-consume',
    'own-workspace-isolation-notifications',
    'own-notification-durable-queue',
    'own-honest-product-boundaries',
  ];
  const requiredOwnershipRowsPresent = requiredOwnership.every((id) => ownershipIds.has(id));
  const noRowAuthorizesDecisionFunctional = W5_N25_A_RETRY_SCHEDULING_DECISION_INVENTORY.every(
    (entry) => !entry.authorizesDecisionFunctional,
  );
  const noRowAuthorizesW5N25Complete = W5_N25_A_RETRY_SCHEDULING_DECISION_INVENTORY.every(
    (entry) => !entry.authorizesW5N25Complete,
  );
  return Object.freeze({
    ok:
      W5_N25_A_RETRY_SCHEDULING_DECISION_INVENTORY.length >= 50 &&
      noRowAuthorizesDecisionFunctional &&
      noRowAuthorizesW5N25Complete &&
      requiredOwnershipRowsPresent,
    rowCount: W5_N25_A_RETRY_SCHEDULING_DECISION_INVENTORY.length,
    noRowAuthorizesDecisionFunctional,
    noRowAuthorizesW5N25Complete,
    requiredOwnershipRowsPresent,
  });
}

export function verifyHonestProductBaseline(): Readonly<{
  ok: boolean;
  noCustomerVisibleImplemented: boolean;
  infrastructureDocumented: boolean;
  plannedExplicit: boolean;
  notImplementedExplicit: boolean;
  decisionNotAuthorized: boolean;
  deliveryOnlyNotControlPlane: boolean;
}> {
  const implemented = W5_N25_A_HONEST_PRODUCT_BASELINE.implementedCapabilities;
  const noCustomerVisibleImplemented =
    implemented.length === 1 && implemented[0]?.includes('None') === true;
  const infrastructureDocumented =
    W5_N25_A_HONEST_PRODUCT_BASELINE.infrastructureCapabilities.length >= 8;
  const plannedExplicit = W5_N25_A_HONEST_PRODUCT_BASELINE.plannedCapabilities.length >= 1;
  const notImplementedExplicit =
    W5_N25_A_HONEST_PRODUCT_BASELINE.notYetImplementedCapabilities.length >= 5;
  const decisionNotAuthorized = !W5_N25_A_BINDING_FINDINGS.decisionFunctionalAuthorized;
  const deliveryOnlyNotControlPlane = !W5_N25_A_ARCHITECTURE_CLAIMS.notificationControlPlane;
  return Object.freeze({
    ok:
      noCustomerVisibleImplemented &&
      infrastructureDocumented &&
      plannedExplicit &&
      notImplementedExplicit &&
      decisionNotAuthorized &&
      deliveryOnlyNotControlPlane,
    noCustomerVisibleImplemented,
    infrastructureDocumented,
    plannedExplicit,
    notImplementedExplicit,
    decisionNotAuthorized,
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
  const ownershipUnchanged = !W5_N25_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged;
  const noDuplicateSubsystem =
    !W5_N25_A_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem &&
    !W5_N25_A_ARCHITECTURE_CLAIMS.duplicateDecisionSubsystem &&
    !W5_N25_A_ARCHITECTURE_CLAIMS.duplicateRetrySubsystem;
  const noRuntimeScheduler =
    !W5_N25_A_ARCHITECTURE_CLAIMS.runtimeSchedulerIntroduced &&
    !W5_N25_A_ARCHITECTURE_CLAIMS.retryEngineIntroduced &&
    !W5_N25_A_ARCHITECTURE_CLAIMS.schedulerPlatformIntroduced &&
    !W5_N25_A_ARCHITECTURE_CLAIMS.workflowEngineIntroduced &&
    !W5_N25_A_ARCHITECTURE_CLAIMS.eventBusProductIntroduced &&
    !W5_N25_A_ARCHITECTURE_CLAIMS.orchestrationPlatformIntroduced &&
    !W5_N25_A_ARCHITECTURE_CLAIMS.workerIntroduced &&
    !W5_N25_A_ARCHITECTURE_CLAIMS.timerImplementationIntroduced &&
    !W5_N25_A_ARCHITECTURE_CLAIMS.runtimeDecisionLogicIntroduced &&
    !W5_N25_A_ARCHITECTURE_CLAIMS.runtimeDecisionEngineIntroduced &&
    !W5_N25_A_ARCHITECTURE_CLAIMS.runtimeSchedulingIntroduced;
  const noMasterPlanChange = !W5_N25_A_ARCHITECTURE_CLAIMS.masterPlanModified;
  const exchangeAdapterUntouched = W5_N25_A_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched;
  const notificationControlPlaneForbidden = !W5_N25_A_ARCHITECTURE_CLAIMS.notificationControlPlane;
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
    'own-platform-decision-layer',
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
    'own-w5-n24-retry-scheduling-consume',
  ];
  const coreOwnership = ownershipRows.filter((entry) =>
    coreOwnershipIds.includes(entry.artifactId),
  );
  const substrateOwnersFrozen = coreOwnership.every((entry) =>
    (W5_N25_A_SUBSTRATE_OWNERS as readonly string[]).includes(entry.owner),
  );
  return Object.freeze({
    ok:
      W5_N25_A_BINDING_FINDINGS.ownershipBoundariesVerified &&
      !W5_N25_A_BINDING_FINDINGS.ownershipBoundariesChanged &&
      !W5_N25_A_ARCHITECTURE_CLAIMS.newPersistenceOwner &&
      substrateOwnersFrozen,
    substrateOwnersFrozen,
    ownershipVerified: W5_N25_A_BINDING_FINDINGS.ownershipBoundariesVerified,
    newPersistenceOwner: W5_N25_A_ARCHITECTURE_CLAIMS.newPersistenceOwner,
  });
}

export function verifyHonestyBoundaries(): Readonly<{
  ok: boolean;
  boundaryCount: number;
  inventoryOnlyNotRuntimeDecisionLogic: boolean;
  inventoryOnlyNotSchedulingDecisions: boolean;
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
  noRuntimeDecisionEngine: boolean;
  noTimerImplementation: boolean;
}> {
  const boundaries = rowsHonestyBoundaries();
  const ids = new Set(boundaries.map((entry) => entry.artifactId));
  const inventoryOnlyNotRuntimeDecisionLogic = ids.has(
    'honesty-inventory-only-not-runtime-decision-logic',
  );
  const inventoryOnlyNotSchedulingDecisions = ids.has(
    'honesty-inventory-only-not-scheduling-decisions',
  );
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
  const noRuntimeDecisionEngine = ids.has('honesty-no-runtime-decision-engine');
  const noTimerImplementation = ids.has('honesty-no-timer-implementation');
  return Object.freeze({
    ok:
      boundaries.length >= 10 &&
      inventoryOnlyNotRuntimeDecisionLogic &&
      inventoryOnlyNotSchedulingDecisions &&
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
      noRuntimeDecisionEngine &&
      noTimerImplementation,
    boundaryCount: boundaries.length,
    inventoryOnlyNotRuntimeDecisionLogic,
    inventoryOnlyNotSchedulingDecisions,
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
    noRuntimeDecisionEngine,
    noTimerImplementation,
  });
}

export function buildDecisionDiagnostics(): Readonly<{
  inventory: ReturnType<typeof verifyInventoryCompleteness>;
  honestProduct: ReturnType<typeof verifyHonestProductBaseline>;
  architecture: ReturnType<typeof verifyArchitectureIntegrity>;
  ownership: ReturnType<typeof verifyOwnershipBoundaries>;
  honesty: ReturnType<typeof verifyHonestyBoundaries>;
  technicalDebtDelta: typeof W5_N25_A_TECHNICAL_DEBT_DELTA;
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
    technicalDebtDelta: W5_N25_A_TECHNICAL_DEBT_DELTA,
    ok:
      inventory.ok &&
      honestProduct.ok &&
      architecture.ok &&
      ownership.ok &&
      honesty.ok &&
      !W5_N25_A_BINDING_FINDINGS.decisionFunctionsAfterSliceA,
  });
}
