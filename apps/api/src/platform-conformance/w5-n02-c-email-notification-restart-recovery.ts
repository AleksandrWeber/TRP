/**
 * W5-N02-c — Email Notification Restart Recovery Foundation registry.
 *
 * Normal process restart recovery for W5-N02-b durable anchors on notification-delivery owner.
 * Reuses existing persistence hydrate — not a second recovery engine.
 * Not operational continuity, SMTP I/O, or customer-visible functionality.
 */

export const W5_N02_C_SLICE_ID = 'W5-N02-c' as const;

export const W5_N02_C_NOTIFICATION_OWNER = 'notification-delivery' as const;

export const W5_N02_C_RECOVERED_ARTIFACT_IDS = Object.freeze([
  'persist-email-notification-anchor',
] as const);

export const W5_N02_C_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateNotificationSubsystem: false,
  duplicateRoutingEngine: false,
  secondRecoveryEngine: false,
  ownershipBoundariesChanged: false,
  masterPlanModified: false,
  version2Redesigned: false,
  wave1Modified: false,
  wave2Modified: false,
  wave3Modified: false,
  wave4Modified: false,
  exchangeAdapterUntouched: true,
  normalProcessRestartRecovery: true,
  emailNotificationAnchorStateRestoredAfterRestart: true,
  recoveryDeterministic: true,
  recoveryIdempotent: true,
  recoveryCanFabricateMissingState: false,
  recoveryCanRecoverCorruptedState: false,
  operationalContinuity: false,
  smtpTransport: false,
  outboundNotificationDelivery: false,
  runtimeNotifications: false,
  customerVisibleFeature: false,
  emailRealDeliveryClaimed: false,
  w5N02CompleteClaimed: false,
  wave5CompleteClaimed: false,
} as const);

export const W5_N02_C_EXPLICIT_OUT = Object.freeze([
  'operational-continuity',
  'smtp-transport',
  'outbound-email-delivery',
  'runtime-notifications',
  'live-trading-enablement',
  'second-recovery-engine',
  'w5-n02-d',
] as const);

export const W5_N02_C_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze(['Email Notification Restart Recovery Foundation'] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W5-N02-d — Email notification operational continuity foundation',
    'W5-N02-e — Security verification + package Close evidence',
  ] as const),
} as const);

export const W5_N02_C_TRANSITION_MATRIX = Object.freeze({
  before: Object.freeze([
    'Inventory (W5-N02-a)',
    'Durable persistence (W5-N02-b)',
    'Restart recovery not implemented',
  ] as const),
  after: Object.freeze([
    'Inventory (W5-N02-a)',
    'Durable persistence (W5-N02-b)',
    'Restart recovery (W5-N02-c)',
    'Recovery deterministic, idempotent, fail-honest on corruption',
  ] as const),
  stillMissing: Object.freeze([
    'Operational Continuity (W5-N02-d)',
    'Package Close (W5-N02-e)',
    'SMTP I/O and outbound Email delivery',
  ] as const),
} as const);
