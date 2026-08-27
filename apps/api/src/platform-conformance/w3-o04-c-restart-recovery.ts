/**
 * W3-O04-c — Kill Switch Restart Recovery Foundation registry.
 *
 * Normal process restart recovery for W3-O04-b durable state on trading-session.
 * Reuses existing persistence hydrate — not a second recovery engine.
 * Not operational continuity, Command Center, or Kill Switch execution.
 */

export const W3_O04_C_SLICE_ID = 'W3-O04-c' as const;

export const W3_O04_C_KILL_SWITCH_OWNER = 'trading-session' as const;

export const W3_O04_C_RECOVERED_ARTIFACT_IDS = Object.freeze([
  'persist-paper-session-kill-switch',
  'state-paper-kill-switch-armed',
] as const);

export const W3_O04_C_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  newKillSwitchEngine: false,
  newRuntimeController: false,
  secondRecoveryEngine: false,
  ownershipBoundariesChanged: false,
  masterPlanModified: false,
  version2Redesigned: false,
  wave1Modified: false,
  wave2Modified: false,
  w3O01Redesigned: false,
  w3O02Redesigned: false,
  w3O03Redesigned: false,
  w3O04bPersistenceRedesigned: false,
  normalProcessRestartRecovery: true,
  killSwitchStateRestoredAfterRestart: true,
  recoveryDeterministic: true,
  recoveryIdempotent: true,
  recoveryCanFabricateMissingState: false,
  recoveryCanRecoverCorruptedState: false,
  operationalContinuity: false,
  readinessEvaluation: false,
  commandCenterControls: false,
  killSwitchExecution: false,
  admissionPolicyWired: false,
  businessContinuity: false,
  highAvailability: false,
  disasterRecovery: false,
  productionRestartSafe: false,
  killSwitchCompleteClaimed: false,
  customerVisibleFeature: false,
} as const);

export const W3_O04_C_EXPLICIT_OUT = Object.freeze([
  'operational-continuity',
  'readiness-evaluation',
  'command-center-controls',
  'kill-switch-execution',
  'admission-policy-wiring',
  'monitoring',
  'business-continuity',
  'high-availability',
  'disaster-recovery',
  'live-trading-enablement',
  'second-recovery-engine',
  'w3-o04-d',
] as const);

export const W3_O04_C_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze([
    'TD-047 restart recovery foundation — durable paper Kill Switch state restores after normal process restart',
  ] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'TD-047 operational continuity — honest continuity surfaces (W3-O04-d)',
    'TD-047 package Close — walkthrough and honesty evidence (W3-O04-e)',
  ] as const),
} as const);

export const W3_O04_C_TRANSITION_MATRIX = Object.freeze({
  before: Object.freeze([
    'Persistence only (W3-O04-b)',
    'Restart recovery not implemented',
  ] as const),
  after: Object.freeze([
    'Persistence (W3-O04-b)',
    'Restart recovery (W3-O04-c)',
    'Recovery deterministic, idempotent, fail-honest on corruption',
  ] as const),
  stillMissing: Object.freeze([
    'Operational continuity (W3-O04-d)',
    'Package Close (W3-O04-e)',
    'Command Center visibility',
    'Kill Switch execution / admission block proof',
  ] as const),
} as const);
