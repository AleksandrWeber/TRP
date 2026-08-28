/**
 * W4-E01-c — Exchange Connectivity Restart Recovery Foundation registry.
 *
 * Normal process restart recovery for W4-E01-b durable state on exchange-adapter owner.
 * Reuses existing persistence hydrate — not a second recovery engine.
 * Not operational continuity, REST/WebSocket I/O, or connection establishment.
 */

export const W4_E01_C_SLICE_ID = 'W4-E01-c' as const;

export const W4_E01_C_EXCHANGE_CONNECTIVITY_OWNER = 'exchange-adapter' as const;

export const W4_E01_C_RECOVERED_ARTIFACT_IDS = Object.freeze([
  'persist-binance-connection-continuity',
] as const);

export const W4_E01_C_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  newExchangeSubsystem: false,
  duplicateExchangeConnectivityEngine: false,
  secondRecoveryEngine: false,
  ownershipBoundariesChanged: false,
  masterPlanModified: false,
  version2Redesigned: false,
  wave1Modified: false,
  wave2Modified: false,
  wave3Modified: false,
  w4E01aInventoryRedesigned: false,
  w4E01bPersistenceRedesigned: false,
  normalProcessRestartRecovery: true,
  exchangeConnectivityStateRestoredAfterRestart: true,
  recoveryDeterministic: true,
  recoveryIdempotent: true,
  recoveryCanFabricateMissingState: false,
  recoveryCanRecoverCorruptedState: false,
  operationalContinuity: false,
  restImplementation: false,
  websocketImplementation: false,
  exchangeIoEstablished: false,
  customerVisibleFeature: false,
  exchangeConnectivityCompleteClaimed: false,
  binanceConnectedClaimed: false,
  productionReady: false,
} as const);

export const W4_E01_C_EXPLICIT_OUT = Object.freeze([
  'operational-continuity',
  'rest-connectivity',
  'websocket-connectivity',
  'connection-establishment',
  'live-trading-enablement',
  'second-recovery-engine',
  'w4-e01-d',
] as const);

export const W4_E01_C_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze([
    'W4-E01 restart recovery foundation — durable exchange connectivity state restores after normal process restart',
  ] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W4-E01-d operational continuity — exchange connectivity readiness projection',
    'W4-E01-e package Close — walkthrough and honesty evidence',
  ] as const),
} as const);

export const W4_E01_C_TRANSITION_MATRIX = Object.freeze({
  before: Object.freeze([
    'Durable persistence (W4-E01-b)',
    'Restart recovery not implemented',
  ] as const),
  after: Object.freeze([
    'Durable persistence (W4-E01-b)',
    'Restart recovery (W4-E01-c)',
    'Recovery deterministic, idempotent, fail-honest on corruption',
  ] as const),
  stillMissing: Object.freeze([
    'Operational Continuity (W4-E01-d)',
    'Package Close (W4-E01-e)',
    'REST/WebSocket I/O and live connection establishment',
  ] as const),
} as const);
