/**
 * W3-O05-c — Monitoring & Security Health Restart Recovery Foundation registry.
 *
 * Normal process restart recovery for W3-O05-b durable state on security-platform.
 * Reuses existing persistence hydrate — not a second recovery engine.
 * Not operational continuity, monitoring evaluation, or dashboards.
 */

export const W3_O05_C_SLICE_ID = 'W3-O05-c' as const;

export const W3_O05_C_MONITORING_OWNER = 'security-platform' as const;

export const W3_O05_C_RECOVERED_ARTIFACT_IDS = Object.freeze([
  'persist-monitoring-health-state',
] as const);

export const W3_O05_C_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  newMonitoringPlatform: false,
  newIncidentSystem: false,
  secondRecoveryEngine: false,
  ownershipBoundariesChanged: false,
  masterPlanModified: false,
  version2Redesigned: false,
  wave1Modified: false,
  wave2Modified: false,
  w3O01Redesigned: false,
  w3O02Redesigned: false,
  w3O03Redesigned: false,
  w3O04Redesigned: false,
  w3O05bPersistenceRedesigned: false,
  normalProcessRestartRecovery: true,
  monitoringStateRestoredAfterRestart: true,
  securityHealthStateRestoredAfterRestart: true,
  recoveryDeterministic: true,
  recoveryIdempotent: true,
  recoveryCanFabricateMissingState: false,
  recoveryCanRecoverCorruptedState: false,
  operationalContinuity: false,
  monitoringEvaluation: false,
  securityHealthEvaluation: false,
  alerting: false,
  dashboards: false,
  businessContinuity: false,
  highAvailability: false,
  disasterRecovery: false,
  productionReady: false,
  monitoringCompleteClaimed: false,
  securityHealthCompleteClaimed: false,
  customerVisibleFeature: false,
} as const);

export const W3_O05_C_EXPLICIT_OUT = Object.freeze([
  'operational-continuity',
  'monitoring-evaluation',
  'security-health-evaluation',
  'alerting',
  'dashboard-rendering',
  'incident-management-product',
  'live-trading-enablement',
  'business-continuity',
  'high-availability',
  'disaster-recovery',
  'second-recovery-engine',
  'w3-o05-d',
] as const);

export const W3_O05_C_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze([
    'W3-O05 restart recovery foundation — durable monitoring health state restores after normal process restart',
  ] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W3-O05-d operational continuity — monitoring readiness projection',
    'W3-O05-e package Close — walkthrough and honesty evidence',
  ] as const),
} as const);

export const W3_O05_C_TRANSITION_MATRIX = Object.freeze({
  before: Object.freeze([
    'Durable persistence (W3-O05-b)',
    'Restart recovery not implemented',
  ] as const),
  after: Object.freeze([
    'Durable persistence (W3-O05-b)',
    'Restart recovery (W3-O05-c)',
    'Recovery deterministic, idempotent, fail-honest on corruption',
  ] as const),
  stillMissing: Object.freeze([
    'Operational Continuity (W3-O05-d)',
    'Package Close (W3-O05-e)',
    'Monitoring evaluation / dashboards / alerting',
  ] as const),
} as const);
