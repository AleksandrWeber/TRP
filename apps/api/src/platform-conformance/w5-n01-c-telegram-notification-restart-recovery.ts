/**
 * W5-N01-c — Telegram Notification Restart Recovery Foundation registry.
 *
 * Normal process restart recovery for W5-N01-b durable anchors on notification-delivery owner.
 * Reuses existing persistence hydrate — not a second recovery engine.
 * Not operational continuity, Bot API I/O, or customer-visible functionality.
 */

export const W5_N01_C_SLICE_ID = 'W5-N01-c' as const;

export const W5_N01_C_NOTIFICATION_OWNER = 'notification-delivery' as const;

export const W5_N01_C_RECOVERED_ARTIFACT_IDS = Object.freeze([
  'persist-telegram-notification-anchor',
] as const);

export const W5_N01_C_ARCHITECTURE_CLAIMS = Object.freeze({
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
  telegramNotificationAnchorStateRestoredAfterRestart: true,
  recoveryDeterministic: true,
  recoveryIdempotent: true,
  recoveryCanFabricateMissingState: false,
  recoveryCanRecoverCorruptedState: false,
  operationalContinuity: false,
  botApiCommunication: false,
  outboundNotificationDelivery: false,
  runtimeNotifications: false,
  customerVisibleFeature: false,
  telegramRealDeliveryClaimed: false,
  w5N01CompleteClaimed: false,
  wave5CompleteClaimed: false,
} as const);

export const W5_N01_C_EXPLICIT_OUT = Object.freeze([
  'operational-continuity',
  'bot-api-communication',
  'outbound-telegram-delivery',
  'runtime-notifications',
  'live-trading-enablement',
  'second-recovery-engine',
  'w5-n01-d',
] as const);

export const W5_N01_C_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze([
    'W5-N01 restart recovery foundation — durable Telegram notification anchors restore after normal process restart',
  ] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W5-N01-d operational continuity — Telegram notification readiness projection',
    'W5-N01-e package Close — walkthrough and honesty evidence',
  ] as const),
} as const);

export const W5_N01_C_TRANSITION_MATRIX = Object.freeze({
  before: Object.freeze([
    'Inventory (W5-N01-a)',
    'Durable persistence (W5-N01-b)',
    'Restart recovery not implemented',
  ] as const),
  after: Object.freeze([
    'Inventory (W5-N01-a)',
    'Durable persistence (W5-N01-b)',
    'Restart recovery (W5-N01-c)',
    'Recovery deterministic, idempotent, fail-honest on corruption',
  ] as const),
  stillMissing: Object.freeze([
    'Operational Continuity (W5-N01-d)',
    'Package Close (W5-N01-e)',
    'Bot API I/O and outbound Telegram delivery',
  ] as const),
} as const);
