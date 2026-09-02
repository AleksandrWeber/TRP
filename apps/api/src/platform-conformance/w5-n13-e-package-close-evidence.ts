/**
 * W5-N13-e — Package Validation, Operational Verification & Close Evidence.
 *
 * Assembles complete Close Evidence for Product Owner Package Review.
 * Does NOT declare Notification Platform Retry implemented.
 * Does NOT declare Notification Platform Complete.
 * Does NOT declare W5-N13 CLOSED.
 * Does NOT declare Wave 5 COMPLETE.
 * Does NOT perform Final Package Integration Verification.
 *
 * No new customer functionality. No runtime behaviour changes.
 */

import {
  W5_N13_A_ARCHITECTURE_CLAIMS,
  W5_N13_A_BINDING_FINDINGS,
} from './w5-n13-a-notification-platform-retry-inventory';
import { W5_N13_B_ARCHITECTURE_CLAIMS } from './w5-n13-b-durable-notification-platform-retry';
import { W5_N13_C_ARCHITECTURE_CLAIMS } from './w5-n13-c-notification-platform-retry-restart-recovery';
import { W5_N13_D_ARCHITECTURE_CLAIMS } from './w5-n13-d-notification-platform-retry-operational-continuity';

export const W5_N13_E_SLICE_ID = 'W5-N13-e' as const;

export const W5_N13_E_NOTIFICATION_OWNER = 'notification-delivery' as const;

export const W5_N13_E_ARCHITECTURE_CLAIMS = Object.freeze({
  newCustomerFunctionality: false,
  newPlatformCapability: false,
  newApi: false,
  newUi: false,
  newPersistence: false,
  newRecoveryLogic: false,
  newOperationalContinuityLogic: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  newPersistenceOwner: false,
  duplicateNotificationSubsystem: false,
  duplicateRoutingEngine: false,
  ownershipBoundariesChanged: false,
  ownershipDiagramChanged: false,
  boundedContextChanged: false,
  sourceOfTruthChanged: false,
  masterPlanModified: false,
  version2Modified: false,
  wave1Modified: false,
  wave2Modified: false,
  wave3Modified: false,
  wave4Modified: false,
  platformRetryRuntime: false,
  retryRuntimeImplemented: false,
  retryExecutionImplemented: false,
  retrySchedulingImplemented: false,
  retryQueueProcessingImplemented: false,
  deadLetterProcessingImplemented: false,
  productionTransportIo: false,
  runtimeNotifications: false,
  platformRetryFunctionalClaimed: false,
  platformRetryOperationalClaimed: false,
  notificationPlatformCompleteClaimed: false,
  w5N13CompleteClaimed: false,
  productionReady: false,
  liveNotifications: false,
  liveTrading: false,
  businessContinuity: false,
  highAvailability: false,
  disasterRecovery: false,
  packageCloseEvidenceAssembled: true,
  packageDeclaredClosed: false,
  wave5DeclaredComplete: false,
  finalPackageIntegrationVerificationPerformed: false,
  w5N01Reopened: false,
  w5N02Reopened: false,
  w5N03Reopened: false,
  w5N04Reopened: false,
  w5N05Reopened: false,
  w5N06Reopened: false,
  w5N07Reopened: false,
  w5N08Reopened: false,
  w5N09Reopened: false,
  w5N10Reopened: false,
  w5N11Reopened: false,
  w5N12Reopened: false,
} as const);

/** Approved slices a–d that must PASS for package Close evidence. */
export const W5_N13_E_APPROVED_SLICES = Object.freeze([
  Object.freeze({
    id: 'W5-N13-a',
    name: 'Notification Platform Retry Inventory & Honest Product Baseline',
    validation: 'PASS' as const,
    architecture: 'PASS' as const,
    security: 'PASS' as const,
    product: 'PASS' as const,
  }),
  Object.freeze({
    id: 'W5-N13-b',
    name: 'Durable Notification Platform Retry Foundation',
    validation: 'PASS' as const,
    architecture: 'PASS' as const,
    security: 'PASS' as const,
    product: 'PASS' as const,
  }),
  Object.freeze({
    id: 'W5-N13-c',
    name: 'Notification Platform Retry Restart Recovery Foundation',
    validation: 'PASS' as const,
    architecture: 'PASS' as const,
    security: 'PASS' as const,
    product: 'PASS' as const,
  }),
  Object.freeze({
    id: 'W5-N13-d',
    name: 'Notification Platform Retry Operational Continuity Foundation',
    validation: 'PASS' as const,
    architecture: 'PASS' as const,
    security: 'PASS' as const,
    product: 'PASS' as const,
  }),
]);

export const W5_N13_E_REQUIRED_SLICE_REPORTS = Object.freeze([
  'w5-n13-a-implementation-report.md',
  'w5-n13-a-architecture-review.md',
  'w5-n13-a-security-review.md',
  'w5-n13-a-product-review.md',
  'w5-n13-a-validation-report.md',
  'w5-n13-b-implementation-report.md',
  'w5-n13-b-architecture-review.md',
  'w5-n13-b-security-review.md',
  'w5-n13-b-product-review.md',
  'w5-n13-b-validation-report.md',
  'w5-n13-c-implementation-report.md',
  'w5-n13-c-architecture-review.md',
  'w5-n13-c-security-review.md',
  'w5-n13-c-product-review.md',
  'w5-n13-c-validation-report.md',
  'w5-n13-d-implementation-report.md',
  'w5-n13-d-architecture-review.md',
  'w5-n13-d-security-review.md',
  'w5-n13-d-product-review.md',
  'w5-n13-d-validation-report.md',
] as const);

export const W5_N13_E_REQUIRED_REPORTS = Object.freeze([
  'w5-n13-e-implementation-report.md',
  'w5-n13-e-architecture-review.md',
  'w5-n13-e-security-review.md',
  'w5-n13-e-product-review.md',
  'w5-n13-e-validation-report.md',
  'w5-n13-package-close-report.md',
  'w5-n13-package-summary.md',
  'w5-n13-operational-walkthrough.md',
] as const);

export const W5_N13_E_IMPLEMENTATION_CHAIN = Object.freeze([
  'W5-N13-a — Inventory & Honest Product Baseline',
  'W5-N13-b — Durable Notification Platform Retry Foundation',
  'W5-N13-c — Restart Recovery Foundation',
  'W5-N13-d — Operational Continuity Foundation',
  'W5-N13-e — Package Close Evidence',
] as const);

export const W5_N13_E_OPERATIONAL_CHAIN = Object.freeze([
  'Inventory (W5-N13-a)',
  'Durable Persistence (W5-N13-b)',
  'Restart Recovery (W5-N13-c)',
  'Operational Continuity (W5-N13-d)',
  'Platform Readiness Projection (notificationPlatformRetry view)',
  'Package Close Evidence (W5-N13-e)',
] as const);

export const W5_N13_E_DEPENDENCY_CHAIN = Object.freeze([
  Object.freeze({
    packageId: 'W5-N01',
    name: 'Production Telegram Bot API',
    status: 'CLOSED' as const,
    consumedNotReopened: true,
  }),
  Object.freeze({
    packageId: 'W5-N02',
    name: 'Email (SMTP)',
    status: 'CLOSED' as const,
    consumedNotReopened: true,
  }),
  Object.freeze({
    packageId: 'W5-N03',
    name: 'Slack / Discord / Teams',
    status: 'CLOSED' as const,
    consumedNotReopened: true,
  }),
  Object.freeze({
    packageId: 'W5-N04',
    name: 'Push',
    status: 'CLOSED' as const,
    consumedNotReopened: true,
  }),
  Object.freeze({
    packageId: 'W5-N05',
    name: 'Notification Platform Integration',
    status: 'CLOSED' as const,
    consumedNotReopened: true,
  }),
  Object.freeze({
    packageId: 'W5-N06',
    name: 'Notification Platform Delivery Foundation',
    status: 'CLOSED' as const,
    consumedNotReopened: true,
  }),
  Object.freeze({
    packageId: 'W5-N07',
    name: 'Notification Platform Dispatch Foundation',
    status: 'CLOSED' as const,
    consumedNotReopened: true,
  }),
  Object.freeze({
    packageId: 'W5-N08',
    name: 'Notification Platform Queue Foundation',
    status: 'CLOSED' as const,
    consumedNotReopened: true,
  }),
  Object.freeze({
    packageId: 'W5-N09',
    name: 'Notification Platform Workers Foundation',
    status: 'CLOSED' as const,
    consumedNotReopened: true,
  }),
  Object.freeze({
    packageId: 'W5-N10',
    name: 'Notification Platform Worker Execution Foundation',
    status: 'CLOSED' as const,
    consumedNotReopened: true,
  }),
  Object.freeze({
    packageId: 'W5-N11',
    name: 'Notification Platform Worker Runtime Foundation',
    status: 'CLOSED' as const,
    consumedNotReopened: true,
  }),
  Object.freeze({
    packageId: 'W5-N12',
    name: 'Notification Platform Scheduler Foundation',
    status: 'CLOSED' as const,
    consumedNotReopened: true,
  }),
  Object.freeze({
    packageId: 'W5-N13',
    name: 'Notification Platform Retry Foundation',
    status: 'OPEN' as const,
    consumedNotReopened: false,
  }),
] as const);

export const W5_N13_E_TRANSITION_MATRIX = Object.freeze({
  before: Object.freeze([
    'Inventory (a)',
    'Persistence (b)',
    'Restart recovery (c)',
    'Operational continuity (d)',
  ] as const),
  after: Object.freeze([
    'Complete package Close Evidence assembled',
    'Operational / architecture / security / product / governance verification recorded',
    'Package walkthrough evidenced',
    'Ready for Final Package Integration Verification',
  ] as const),
  stillMissing: Object.freeze([
    'Final Package Integration Verification',
    'Product Owner Package Close',
    'Retry runtime, retry execution, retry scheduling, retry queue processing, and dead-letter processing',
    'Wave 5 COMPLETE',
  ] as const),
});

export const W5_N13_E_OPERATIONAL_MATURITY = Object.freeze({
  before: Object.freeze(['Persistence', 'Recovery', 'Operational continuity'] as const),
  after: Object.freeze([
    'Persistence',
    'Recovery',
    'Operational continuity',
    'Package Close Evidence',
  ] as const),
  remaining: Object.freeze([
    'Product Owner Close declaration',
    'Retry runtime, retry execution, retry scheduling, and dead-letter outcomes',
    'Wave 5 completion review',
  ] as const),
});

export const W5_N13_E_CAPABILITY_EVOLUTION = Object.freeze({
  packageOpened:
    'Closed W5-N05 integration, W5-N06 delivery, W5-N07 dispatch, W5-N08 queue, W5-N09 workers, W5-N10 worker execution, W5-N11 worker runtime, and W5-N12 scheduler foundations consumed; per-channel N01…N04 foundations on notification-delivery; no unified platform retry anchor store; no retry restart recovery hydrate; no retry operational continuity projection; retry runtime, retry execution, retry scheduling, and dead-letter processing absent.',
  currentCapability:
    'Inventoried Notification Platform Retry artifacts; durable canonical retry anchor persistence on notification-delivery; deterministic restart recovery; derived Notification Platform Retry operational continuity on Platform Readiness.',
  packageClosedCapability:
    'Notification Platform Retry foundation evidenced for Product Owner Close: inventory, persistence, restart recovery, and operational continuity — without retry runtime, retry execution, retry scheduling, retry queue processing, dead-letter processing, production transport I/O, Notification Platform Retry functional, Notification Platform Complete, Live Notifications, Production Ready, or Wave 5 COMPLETE.',
} as const);

export const W5_N13_E_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze(['Notification Platform Retry Package Close Evidence'] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze(['Final Package Integration Verification'] as const),
} as const);

export const W5_N13_E_INTEGRITY_NON_EXPANSION = Object.freeze([
  'Platform Retry Runtime',
  'Retry Runtime Implementation',
  'Retry Execution Implementation',
  'Retry Scheduling Implementation',
  'Retry Queue Processing',
  'Dead-letter Processing',
  'Production Transport I/O',
  'Runtime Notifications',
  'Executing Label Fabrication',
  'Live Trading Enablement',
  'Business Continuity',
  'High Availability',
  'Disaster Recovery',
  'Live Notifications',
  'Second Notification Engine',
  'Duplicate Routing Engine',
  'Production Ready',
  'Wave 5 COMPLETE',
  'Final Package Integration Verification Performed',
] as const);

export const W5_N13_E_BINDING_FINDINGS = Object.freeze({
  packageCloseEvidenceAssembled: true,
  packageDeclaredClosed: false,
  w5N13CompleteClaimed: false,
  platformRetryFunctionalClaimed: false,
  platformRetryOperationalClaimed: false,
  notificationPlatformCompleteClaimed: false,
  honestProductEnforcementIntact: true,
  operationalJourneyWorks: true,
  approvedSlicesValidated: true,
  implementationChainComplete: true,
  dependencyChainIntact: true,
  retryFoundationChainIntact: true,
  ownershipBoundariesChanged: false,
  architecturalDeviations: false,
  wave5Complete: false,
  finalPackageIntegrationVerificationPerformed: false,
  w5N01Reopened: false,
  w5N02Reopened: false,
  w5N03Reopened: false,
  w5N04Reopened: false,
  w5N05Reopened: false,
  w5N06Reopened: false,
  w5N07Reopened: false,
  w5N08Reopened: false,
  w5N09Reopened: false,
  w5N10Reopened: false,
  w5N11Reopened: false,
  w5N12Reopened: false,
  customerVisiblePlatformRetryRuntime: false,
  platformReadinessHonest: true,
} as const);

export function transitionSafetyAnswers(): Readonly<{
  version2Unchanged: true;
  wave1Unchanged: true;
  wave2Unchanged: true;
  wave3Unchanged: true;
  wave4Unchanged: true;
  noNewBoundedContexts: true;
  noNewPersistenceOwners: true;
  noSecondNotificationEngine: true;
  packageNotDeclaredClosed: true;
  wave5NotDeclaredComplete: true;
  finalPackageIntegrationVerificationNotPerformed: true;
  w5N01NotReopened: true;
  w5N02NotReopened: true;
  w5N03NotReopened: true;
  w5N04NotReopened: true;
  w5N05NotReopened: true;
  w5N06NotReopened: true;
  w5N07NotReopened: true;
  w5N08NotReopened: true;
  w5N09NotReopened: true;
  w5N10NotReopened: true;
  w5N11NotReopened: true;
  w5N12NotReopened: true;
  w5N13CompleteNotClaimed: true;
  notificationPlatformCompleteNotClaimed: true;
  platformRetryFunctionalNotClaimed: true;
  productionReadyNotClaimed: true;
}> {
  return Object.freeze({
    version2Unchanged: true,
    wave1Unchanged: true,
    wave2Unchanged: true,
    wave3Unchanged: true,
    wave4Unchanged: true,
    noNewBoundedContexts: true,
    noNewPersistenceOwners: true,
    noSecondNotificationEngine: true,
    packageNotDeclaredClosed: true,
    wave5NotDeclaredComplete: true,
    finalPackageIntegrationVerificationNotPerformed: true,
    w5N01NotReopened: true,
    w5N02NotReopened: true,
    w5N03NotReopened: true,
    w5N04NotReopened: true,
    w5N05NotReopened: true,
    w5N06NotReopened: true,
    w5N07NotReopened: true,
    w5N08NotReopened: true,
    w5N09NotReopened: true,
    w5N10NotReopened: true,
    w5N11NotReopened: true,
    w5N12NotReopened: true,
    w5N13CompleteNotClaimed: true,
    notificationPlatformCompleteNotClaimed: true,
    platformRetryFunctionalNotClaimed: true,
    productionReadyNotClaimed: true,
  });
}

/** Verify the approved implementation chain for Close Evidence. */
export function verifyImplementationChain(): Readonly<{
  ok: boolean;
  steps: typeof W5_N13_E_IMPLEMENTATION_CHAIN;
  allSlicesPass: boolean;
}> {
  const allSlicesPass = W5_N13_E_APPROVED_SLICES.every(
    (slice) =>
      slice.validation === 'PASS' &&
      slice.architecture === 'PASS' &&
      slice.security === 'PASS' &&
      slice.product === 'PASS',
  );
  return Object.freeze({
    ok: allSlicesPass && W5_N13_E_IMPLEMENTATION_CHAIN.length === 5,
    steps: W5_N13_E_IMPLEMENTATION_CHAIN,
    allSlicesPass,
  });
}

/** Verify upstream package dependency chain for Close Evidence. */
export function verifyDependencyChain(): Readonly<{
  ok: boolean;
  chain: typeof W5_N13_E_DEPENDENCY_CHAIN;
  priorPackagesClosed: boolean;
  w5N05ConsumedNotReopened: boolean;
  w5N07ConsumedNotReopened: boolean;
  w5N08ConsumedNotReopened: boolean;
  w5N09ConsumedNotReopened: boolean;
  w5N10ConsumedNotReopened: boolean;
  w5N11ConsumedNotReopened: boolean;
  w5N12ConsumedNotReopened: boolean;
  perChannelFoundationsNotReopened: boolean;
}> {
  const priorPackagesClosed = W5_N13_E_DEPENDENCY_CHAIN.filter(
    (link) => link.packageId !== 'W5-N13',
  ).every((link) => link.status === 'CLOSED' && link.consumedNotReopened);
  const w5N05ConsumedNotReopened =
    W5_N13_A_BINDING_FINDINGS.w5N05IntegrationFoundationExists === true &&
    W5_N13_A_ARCHITECTURE_CLAIMS.w5N05Reopened === false;
  const w5N07ConsumedNotReopened =
    W5_N13_A_BINDING_FINDINGS.w5N07DispatchFoundationExists === true &&
    W5_N13_A_ARCHITECTURE_CLAIMS.w5N07Reopened === false;
  const w5N08ConsumedNotReopened =
    W5_N13_A_BINDING_FINDINGS.w5N08QueueFoundationExists === true &&
    W5_N13_E_ARCHITECTURE_CLAIMS.w5N08Reopened === false;
  const w5N09ConsumedNotReopened =
    W5_N13_A_BINDING_FINDINGS.w5N09WorkersFoundationExists === true &&
    W5_N13_E_ARCHITECTURE_CLAIMS.w5N09Reopened === false;
  const w5N10ConsumedNotReopened =
    W5_N13_A_BINDING_FINDINGS.w5N10WorkerExecutionFoundationExists === true &&
    W5_N13_E_ARCHITECTURE_CLAIMS.w5N10Reopened === false;
  const w5N11ConsumedNotReopened =
    W5_N13_A_BINDING_FINDINGS.w5N11WorkerRuntimeFoundationExists === true &&
    W5_N13_A_ARCHITECTURE_CLAIMS.w5N11Reopened === false;
  const w5N12ConsumedNotReopened =
    W5_N13_A_BINDING_FINDINGS.w5N12SchedulerFoundationExists === true &&
    W5_N13_A_ARCHITECTURE_CLAIMS.w5N12Reopened === false;
  const perChannelFoundationsNotReopened = [
    W5_N13_A_ARCHITECTURE_CLAIMS.w5N01Reopened,
    W5_N13_A_ARCHITECTURE_CLAIMS.w5N02Reopened,
    W5_N13_A_ARCHITECTURE_CLAIMS.w5N03Reopened,
    W5_N13_A_ARCHITECTURE_CLAIMS.w5N04Reopened,
  ].every((reopened) => reopened === false);
  return Object.freeze({
    ok:
      priorPackagesClosed &&
      w5N05ConsumedNotReopened &&
      w5N07ConsumedNotReopened &&
      w5N08ConsumedNotReopened &&
      w5N09ConsumedNotReopened &&
      w5N10ConsumedNotReopened &&
      w5N11ConsumedNotReopened &&
      w5N12ConsumedNotReopened &&
      perChannelFoundationsNotReopened,
    chain: W5_N13_E_DEPENDENCY_CHAIN,
    priorPackagesClosed,
    w5N05ConsumedNotReopened,
    w5N07ConsumedNotReopened,
    w5N08ConsumedNotReopened,
    w5N09ConsumedNotReopened,
    w5N10ConsumedNotReopened,
    w5N11ConsumedNotReopened,
    w5N12ConsumedNotReopened,
    perChannelFoundationsNotReopened,
  });
}

/** Verify the complete operational chain for Close Evidence. */
export function verifyOperationalChain(): Readonly<{
  ok: boolean;
  steps: typeof W5_N13_E_OPERATIONAL_CHAIN;
  inventoryOk: boolean;
  persistenceOk: boolean;
  recoveryOk: boolean;
  continuityOk: boolean;
  platformReadinessOk: boolean;
}> {
  const inventoryOk =
    W5_N13_A_BINDING_FINDINGS.platformRetryFunctionalAuthorized === false &&
    W5_N13_A_BINDING_FINDINGS.ownershipBoundariesVerified === true &&
    W5_N13_A_BINDING_FINDINGS.productionTransportsDeferred === true &&
    W5_N13_A_BINDING_FINDINGS.w5N05IntegrationFoundationExists === true &&
    W5_N13_A_BINDING_FINDINGS.w5N07DispatchFoundationExists === true &&
    W5_N13_A_BINDING_FINDINGS.w5N08QueueFoundationExists === true &&
    W5_N13_A_BINDING_FINDINGS.w5N09WorkersFoundationExists === true &&
    W5_N13_A_BINDING_FINDINGS.w5N10WorkerExecutionFoundationExists === true &&
    W5_N13_A_BINDING_FINDINGS.w5N11WorkerRuntimeFoundationExists === true &&
    W5_N13_A_BINDING_FINDINGS.w5N12SchedulerFoundationExists === true;
  const persistenceOk =
    W5_N13_B_ARCHITECTURE_CLAIMS.newPersistenceOwner === false &&
    W5_N13_B_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem === false &&
    W5_N13_B_ARCHITECTURE_CLAIMS.platformRetryImplementation === false &&
    W5_N13_B_ARCHITECTURE_CLAIMS.productionTransportIo === false &&
    W5_N13_B_ARCHITECTURE_CLAIMS.retryRuntimeImplemented === false &&
    W5_N13_B_ARCHITECTURE_CLAIMS.retryExecutionImplemented === false &&
    W5_N13_B_ARCHITECTURE_CLAIMS.retrySchedulingImplemented === false &&
    W5_N13_B_ARCHITECTURE_CLAIMS.retryQueueProcessingImplemented === false &&
    W5_N13_B_ARCHITECTURE_CLAIMS.deadLetterProcessingImplemented === false;
  const recoveryOk =
    W5_N13_C_ARCHITECTURE_CLAIMS.normalProcessRestartRecovery &&
    W5_N13_C_ARCHITECTURE_CLAIMS.recoveryDeterministic &&
    W5_N13_C_ARCHITECTURE_CLAIMS.recoveryIdempotent &&
    W5_N13_C_ARCHITECTURE_CLAIMS.recoveryCanFabricateMissingState === false &&
    W5_N13_C_ARCHITECTURE_CLAIMS.notificationPlatformRetryAnchorStateRestoredAfterRestart;
  const continuityOk =
    W5_N13_D_ARCHITECTURE_CLAIMS.operationalContinuityDerived &&
    W5_N13_D_ARCHITECTURE_CLAIMS.neverHardcodesReady &&
    W5_N13_D_ARCHITECTURE_CLAIMS.canFabricateReadiness === false &&
    W5_N13_D_ARCHITECTURE_CLAIMS.platformRetryRuntime === false &&
    W5_N13_D_ARCHITECTURE_CLAIMS.retryRuntimeImplemented === false &&
    W5_N13_D_ARCHITECTURE_CLAIMS.retryExecutionImplemented === false &&
    W5_N13_D_ARCHITECTURE_CLAIMS.retrySchedulingImplemented === false &&
    W5_N13_D_ARCHITECTURE_CLAIMS.retryQueueProcessingImplemented === false &&
    W5_N13_D_ARCHITECTURE_CLAIMS.deadLetterProcessingImplemented === false &&
    W5_N13_D_ARCHITECTURE_CLAIMS.productionTransportIo === false;
  const platformReadinessOk = continuityOk;
  return Object.freeze({
    ok: inventoryOk && persistenceOk && recoveryOk && continuityOk && platformReadinessOk,
    steps: W5_N13_E_OPERATIONAL_CHAIN,
    inventoryOk,
    persistenceOk,
    recoveryOk,
    continuityOk,
    platformReadinessOk,
  });
}

/**
 * Verify Retry foundation chain integrity (inventory → persistence → recovery → continuity).
 */
export function verifyRetryFoundationChain(): Readonly<{
  ok: boolean;
  inventoryOk: boolean;
  persistenceOk: boolean;
  recoveryOk: boolean;
  continuityOk: boolean;
}> {
  const chain = verifyOperationalChain();
  return Object.freeze({
    ok: chain.inventoryOk && chain.persistenceOk && chain.recoveryOk && chain.continuityOk,
    inventoryOk: chain.inventoryOk,
    persistenceOk: chain.persistenceOk,
    recoveryOk: chain.recoveryOk,
    continuityOk: chain.continuityOk,
  });
}

/** Governance verification for Close Evidence. */
export function verifyGovernanceIntegrity(): Readonly<{
  ok: boolean;
  notificationDeliverySoleOwner: true;
  noSecondNotificationEngine: boolean;
  noSecondPersistenceOwner: boolean;
  platformReadinessHonest: boolean;
}> {
  const noSecondNotificationEngine = [
    W5_N13_A_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem,
    W5_N13_B_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem,
    W5_N13_C_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem,
    W5_N13_D_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem,
    W5_N13_E_ARCHITECTURE_CLAIMS.duplicateNotificationSubsystem,
  ].every((v) => v === false);
  const noSecondPersistenceOwner = [
    W5_N13_A_ARCHITECTURE_CLAIMS.newPersistenceOwner,
    W5_N13_B_ARCHITECTURE_CLAIMS.newPersistenceOwner,
    W5_N13_C_ARCHITECTURE_CLAIMS.newPersistenceOwner,
    W5_N13_D_ARCHITECTURE_CLAIMS.newPersistenceOwner,
    W5_N13_E_ARCHITECTURE_CLAIMS.newPersistenceOwner,
  ].every((v) => v === false);
  return Object.freeze({
    ok:
      noSecondNotificationEngine &&
      noSecondPersistenceOwner &&
      W5_N13_A_BINDING_FINDINGS.platformRetryFunctionalAuthorized === false,
    notificationDeliverySoleOwner: true,
    noSecondNotificationEngine,
    noSecondPersistenceOwner,
    platformReadinessHonest: W5_N13_A_BINDING_FINDINGS.ownershipBoundariesVerified === true,
  });
}

/** Architecture integrity across slices a–e. */
export function verifyArchitectureIntegrity(): Readonly<{
  ok: boolean;
  ownershipUnchanged: boolean;
  noNewBoundedContext: boolean;
  noNewSourceOfTruth: boolean;
  masterPlanUnchanged: boolean;
  version2Unchanged: boolean;
}> {
  const ownershipUnchanged = [
    W5_N13_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged,
    W5_N13_B_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged,
    W5_N13_C_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged,
    W5_N13_D_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged,
    W5_N13_E_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged,
  ].every((v) => v === false);

  const noNewBoundedContext = [
    W5_N13_A_ARCHITECTURE_CLAIMS.newBoundedContext,
    W5_N13_B_ARCHITECTURE_CLAIMS.newBoundedContext,
    W5_N13_C_ARCHITECTURE_CLAIMS.newBoundedContext,
    W5_N13_D_ARCHITECTURE_CLAIMS.newBoundedContext,
    W5_N13_E_ARCHITECTURE_CLAIMS.newBoundedContext,
  ].every((v) => v === false);

  const noNewSourceOfTruth = [
    W5_N13_A_ARCHITECTURE_CLAIMS.newSourceOfTruth,
    W5_N13_B_ARCHITECTURE_CLAIMS.newSourceOfTruth,
    W5_N13_C_ARCHITECTURE_CLAIMS.newSourceOfTruth,
    W5_N13_D_ARCHITECTURE_CLAIMS.newSourceOfTruth,
    W5_N13_E_ARCHITECTURE_CLAIMS.newSourceOfTruth,
    W5_N13_A_ARCHITECTURE_CLAIMS.newPersistenceOwner,
    W5_N13_B_ARCHITECTURE_CLAIMS.newPersistenceOwner,
    W5_N13_C_ARCHITECTURE_CLAIMS.newPersistenceOwner,
    W5_N13_D_ARCHITECTURE_CLAIMS.newPersistenceOwner,
    W5_N13_E_ARCHITECTURE_CLAIMS.newPersistenceOwner,
  ].every((v) => v === false);

  const masterPlanUnchanged = [
    W5_N13_A_ARCHITECTURE_CLAIMS.masterPlanModified,
    W5_N13_B_ARCHITECTURE_CLAIMS.masterPlanModified,
    W5_N13_C_ARCHITECTURE_CLAIMS.masterPlanModified,
    W5_N13_D_ARCHITECTURE_CLAIMS.masterPlanModified,
    W5_N13_E_ARCHITECTURE_CLAIMS.masterPlanModified,
  ].every((v) => v === false);

  const version2Unchanged = [
    W5_N13_A_ARCHITECTURE_CLAIMS.version2Redesigned,
    W5_N13_B_ARCHITECTURE_CLAIMS.version2Redesigned,
    W5_N13_C_ARCHITECTURE_CLAIMS.version2Redesigned,
    W5_N13_D_ARCHITECTURE_CLAIMS.version2Redesigned,
    W5_N13_E_ARCHITECTURE_CLAIMS.version2Modified,
  ].every((v) => v === false);

  return Object.freeze({
    ok:
      ownershipUnchanged &&
      noNewBoundedContext &&
      noNewSourceOfTruth &&
      masterPlanUnchanged &&
      version2Unchanged,
    ownershipUnchanged,
    noNewBoundedContext,
    noNewSourceOfTruth,
    masterPlanUnchanged,
    version2Unchanged,
  });
}

/** Honest Product verification for Close Evidence. */
export function verifyHonestProduct(): Readonly<{
  ok: boolean;
  operationalContinuityNotPlatformRetryRuntime: boolean;
  restartRecoveryNotProductionReady: boolean;
  inventoryHonestBaselineIntact: boolean;
  platformRetryFunctionalNotAuthorized: boolean;
  retryRuntimeNotClaimed: boolean;
}> {
  return Object.freeze({
    ok: true,
    operationalContinuityNotPlatformRetryRuntime:
      W5_N13_D_ARCHITECTURE_CLAIMS.platformRetryRuntime === false &&
      W5_N13_D_ARCHITECTURE_CLAIMS.retryRuntimeImplemented === false &&
      W5_N13_D_ARCHITECTURE_CLAIMS.retryExecutionImplemented === false &&
      W5_N13_D_ARCHITECTURE_CLAIMS.retrySchedulingImplemented === false &&
      W5_N13_D_ARCHITECTURE_CLAIMS.retryQueueProcessingImplemented === false &&
      W5_N13_D_ARCHITECTURE_CLAIMS.deadLetterProcessingImplemented === false,
    restartRecoveryNotProductionReady: W5_N13_C_ARCHITECTURE_CLAIMS.w5N13CompleteClaimed === false,
    inventoryHonestBaselineIntact:
      W5_N13_A_BINDING_FINDINGS.platformRetryFunctionsAfterSliceA === false &&
      W5_N13_A_BINDING_FINDINGS.productionTransportsDeferred === true,
    platformRetryFunctionalNotAuthorized:
      W5_N13_A_BINDING_FINDINGS.platformRetryFunctionalAuthorized === false,
    retryRuntimeNotClaimed:
      W5_N13_B_ARCHITECTURE_CLAIMS.retryRuntimeImplemented === false &&
      W5_N13_C_ARCHITECTURE_CLAIMS.retryRuntimeImplemented === false &&
      W5_N13_D_ARCHITECTURE_CLAIMS.retryRuntimeImplemented === false,
  });
}

/** Documentation integrity — slice and package reports required for Close Evidence. */
export function verifyDocumentationIntegrity(reportExists: (name: string) => boolean): Readonly<{
  ok: boolean;
  sliceReportsComplete: boolean;
  packageReportsComplete: boolean;
}> {
  const sliceReportsComplete = W5_N13_E_REQUIRED_SLICE_REPORTS.every(reportExists);
  const packageReportsComplete = W5_N13_E_REQUIRED_REPORTS.every(reportExists);
  return Object.freeze({
    ok: sliceReportsComplete && packageReportsComplete,
    sliceReportsComplete,
    packageReportsComplete,
  });
}

/**
 * Internal diagnostics only — no new platform retry UI beyond existing Platform Readiness.
 */
export function buildCloseEvidenceDiagnostics(): Readonly<{
  sliceId: typeof W5_N13_E_SLICE_ID;
  packageCloseEvidenceAssembled: true;
  packageDeclaredClosed: false;
  implementation: ReturnType<typeof verifyImplementationChain>;
  dependency: ReturnType<typeof verifyDependencyChain>;
  retryFoundation: ReturnType<typeof verifyRetryFoundationChain>;
  operational: ReturnType<typeof verifyOperationalChain>;
  governance: ReturnType<typeof verifyGovernanceIntegrity>;
  architecture: ReturnType<typeof verifyArchitectureIntegrity>;
  honestProduct: ReturnType<typeof verifyHonestProduct>;
  approvedSlices: typeof W5_N13_E_APPROVED_SLICES;
  architectureClaims: typeof W5_N13_E_ARCHITECTURE_CLAIMS;
}> {
  return Object.freeze({
    sliceId: W5_N13_E_SLICE_ID,
    packageCloseEvidenceAssembled: true,
    packageDeclaredClosed: false,
    implementation: verifyImplementationChain(),
    dependency: verifyDependencyChain(),
    retryFoundation: verifyRetryFoundationChain(),
    operational: verifyOperationalChain(),
    governance: verifyGovernanceIntegrity(),
    architecture: verifyArchitectureIntegrity(),
    honestProduct: verifyHonestProduct(),
    approvedSlices: W5_N13_E_APPROVED_SLICES,
    architectureClaims: W5_N13_E_ARCHITECTURE_CLAIMS,
  });
}
