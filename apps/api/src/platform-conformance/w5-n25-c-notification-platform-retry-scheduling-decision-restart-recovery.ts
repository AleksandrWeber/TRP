/**
 * W5-N25-c — Notification Platform Retry Scheduling Decision Restart Recovery Foundation registry.
 *
 * Normal process restart recovery for W5-N25-b durable decision anchors on notification-delivery owner.
 * Reuses existing persistence hydrate — not a second recovery engine.
 * Not operational continuity, runtime decision logic, scheduling, eligibility, backoff, execution,
 * or customer-visible functionality.
 */

export const W5_N25_C_SLICE_ID = 'W5-N25-c' as const;

export const W5_N25_C_NOTIFICATION_OWNER = 'notification-delivery' as const;

export const W5_N25_C_RECOVERED_ARTIFACT_IDS = Object.freeze([
  'persist-candidate-decision-anchor',
] as const);

export const W5_N25_C_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateNotificationSubsystem: false,
  duplicateDecisionSubsystem: false,
  duplicateRetrySubsystem: false,
  duplicateRoutingEngine: false,
  secondRecoveryEngine: false,
  runtimeDecisionEngineIntroduced: false,
  retryEngineIntroduced: false,
  retryPlatformIntroduced: false,
  workflowEngineIntroduced: false,
  eventBusProductIntroduced: false,
  runtimeSchedulerIntroduced: false,
  workerIntroduced: false,
  runtimeDecisionLogicIntroduced: false,
  ownershipBoundariesChanged: false,
  masterPlanModified: false,
  version2Redesigned: false,
  wave1Modified: false,
  wave2Modified: false,
  wave3Modified: false,
  wave4Modified: false,
  exchangeAdapterUntouched: true,
  connectionManagementUntouched: true,
  secretVaultUntouched: true,
  workspaceOwnershipUntouched: true,
  normalProcessRestartRecovery: true,
  notificationPlatformRetrySchedulingDecisionAnchorStateRestoredAfterRestart: true,
  recoveryDeterministic: true,
  recoveryIdempotent: true,
  recoveryCanFabricateMissingState: false,
  recoveryCanRecoverCorruptedState: false,
  operationalContinuity: false,
  runtimeDecisionLogicImplemented: false,
  runtimeSchedulingImplemented: false,
  backoffCalculationImplemented: false,
  eligibilityDeterminationImplemented: false,
  executionImplemented: false,
  restartRecoveryImplemented: true,
  outboundNotificationDelivery: false,
  runtimeNotifications: false,
  customerVisibleFeature: false,
  decisionFunctionalClaimed: false,
  w5N25CompleteClaimed: false,
  notificationPlatformCompleteClaimed: false,
  wave5CompleteClaimed: false,
} as const);

export const W5_N25_C_EXPLICIT_OUT = Object.freeze([
  'runtime-decision-logic',
  'scheduling-decisions',
  'runtime-scheduling',
  'eligibility-determination',
  'backoff-calculation',
  'retry-execution',
  'operational-continuity',
  'production-transport-i/o',
  'runtime-notifications',
  'second-recovery-engine',
  'runtime-decision-engine',
  'retry-engine',
  'retry-platform',
  'workflow-engine',
  'event-bus-product',
  'runtime-scheduler',
  'workers',
  'timers',
  'orchestration',
] as const);

export const W5_N25_C_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze([
    'Notification Retry Scheduling Decision Restart Recovery Foundation',
  ] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W5-N25-d — Operational Continuity Foundation',
    'W5-N25-e — Package Validation, Operational Verification & Close Evidence',
  ] as const),
} as const);

export const W5_N25_C_TRANSITION_MATRIX = Object.freeze({
  before: Object.freeze([
    'Inventory (W5-N25-a)',
    'Durable persistence (W5-N25-b)',
    'Restart recovery not implemented',
  ] as const),
  after: Object.freeze([
    'Inventory (W5-N25-a)',
    'Durable persistence (W5-N25-b)',
    'Restart recovery (W5-N25-c)',
    'Recovery deterministic, idempotent, fail-honest on corruption',
  ] as const),
  stillMissing: Object.freeze([
    'Operational continuity (W5-N25-d)',
    'Package Close (W5-N25-e)',
    'Runtime decision logic',
  ] as const),
} as const);
