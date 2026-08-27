/**
 * W3-O02-b — Notification Durable Queue Persistence Foundation registry.
 *
 * Extends existing notification-delivery owner snapshot with queue work items.
 * Not a new persistence owner / second Outbox / restart recovery engine.
 */

export const W3_O02_B_SLICE_ID = 'W3-O02-b' as const;

export const W3_O02_B_QUEUE_OWNER = 'notification-delivery' as const;

export const W3_O02_B_PERSISTED_ARTIFACTS = Object.freeze([
  Object.freeze({
    artifactId: 'notification-delivery-queue-item',
    artifact: 'NotificationDeliveryQueueItem',
    owner: W3_O02_B_QUEUE_OWNER,
    statuses: Object.freeze(['pending', 'in-flight', 'retryable', 'completed', 'failed'] as const),
    storage: 'notification-delivery-owner-snapshot-queue',
    durableAdapter:
      'apps/api/src/modules/notification-delivery/adapters/durable-notification-store.ts',
    domainModel: 'apps/api/src/modules/notification-delivery/domain/delivery-queue.ts',
    storeEvidence:
      'apps/api/src/modules/notification-delivery/adapters/in-memory-notification-store.ts',
  }),
] as const);

export const W3_O02_B_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  newEventStore: false,
  newKnowledgeLake: false,
  newProjectionStore: false,
  newLedger: false,
  newOutbox: false,
  newInbox: false,
  secondNotificationQueueProduct: false,
  ownershipBoundariesChanged: false,
  masterPlanModified: false,
  ownershipDiagramChanged: false,
  boundedContextChanged: false,
  sourceOfTruthChanged: false,
  version2Redesigned: false,
  wave1Modified: false,
  wave2Modified: false,
  w3O01Redesigned: false,
  td045MergedIntoTd035: false,
  automaticRestartRecovery: false,
  queuedNotificationsSurviveRestartClaimed: false,
  retryExecutionImplemented: false,
  customerVisibleQueueUi: false,
  wave5TransportsClaimed: false,
} as const);

export const W3_O02_B_EXPLICIT_OUT = Object.freeze([
  'restart-recovery',
  'replay',
  'retry-execution',
  'retry-engine',
  'scheduler',
  'workflow-engine',
  'event-bus',
  'monitoring',
  'business-continuity',
  'disaster-recovery',
  'high-availability',
  'wave-5-notification-providers',
  'notification-delivery-redesign',
  'paper-outbox-redesign',
  'second-outbox',
  'w3-o02-c',
] as const);

export const W3_O02_B_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze([
    'TD-045-persistence-gap — in-flight notification queue work can be written to durable owner snapshot',
  ] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'TD-045-restart-recovery — hydrate/resume owed queue work after API restart (W3-O02-c)',
    'TD-045-retry-execution — execute retryable queue items (out of O02-b; later honesty/retry slices)',
    'TD-045-degraded-honesty — abandoned / unavailable continuity (W3-O02-d)',
    'TD-049 / TD-050 — Wave 5 production notification transports',
  ] as const),
} as const);
