/**
 * W4-E03-c — OKX Exchange Connectivity Restart Recovery Foundation registry.
 *
 * Normal process restart recovery for W4-E03-b durable state on exchange-adapter owner.
 * Reuses existing persistence hydrate — not a second recovery engine.
 * Not operational continuity, REST/WebSocket I/O, or connection establishment.
 */

export const W4_E03_C_SLICE_ID = 'W4-E03-c' as const;

export const W4_E03_C_EXCHANGE_CONNECTIVITY_OWNER = 'exchange-adapter' as const;

export const W4_E03_C_RECOVERED_ARTIFACT_IDS = Object.freeze([
  'persist-okx-connection-continuity',
] as const);

export const W4_E03_C_ARCHITECTURE_CLAIMS = Object.freeze({
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
  w4E03aInventoryRedesigned: false,
  w4E03bPersistenceRedesigned: false,
  normalProcessRestartRecovery: true,
  okxExchangeConnectivityStateRestoredAfterRestart: true,
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
  okxConnectedClaimed: false,
  productionReady: false,
} as const);

export const W4_E03_C_EXPLICIT_OUT = Object.freeze([
  'operational-continuity',
  'rest-connectivity',
  'websocket-connectivity',
  'connection-establishment',
  'live-trading-enablement',
  'second-recovery-engine',
  'w4-e03-d',
] as const);

export const W4_E03_C_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze([
    'W4-E03 restart recovery foundation — durable OKX exchange connectivity state restores after normal process restart',
  ] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W4-E03-d operational continuity — OKX exchange connectivity readiness projection',
    'W4-E03-e package Close — walkthrough and honesty evidence',
  ] as const),
} as const);

export const W4_E03_C_TRANSITION_MATRIX = Object.freeze({
  before: Object.freeze([
    'Inventory (W4-E03-a)',
    'Durable persistence (W4-E03-b)',
    'Restart recovery not implemented',
  ] as const),
  after: Object.freeze([
    'Inventory (W4-E03-a)',
    'Durable persistence (W4-E03-b)',
    'Restart recovery (W4-E03-c)',
    'Recovery deterministic, idempotent, fail-honest on corruption',
  ] as const),
  stillMissing: Object.freeze([
    'Operational Continuity (W4-E03-d)',
    'Package Close (W4-E03-e)',
    'REST/WebSocket I/O and live connection establishment',
  ] as const),
} as const);
