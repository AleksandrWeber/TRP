/**
 * V3-L02-S-ISO1 — Cross-workspace / cross-actor / live-path isolation inventory (SB-07).
 */

export const V3_L02_S_ISO1_SLICE_ID = 'L02-S-ISO1' as const;

/** Canonical L02 capital-path module roots (same set as EM1). */
export const V3_L02_S_ISO1_CANONICAL_PATH_MODULE_ROOTS = [
  'orders',
  'canonical-order-path',
  'execution-engine',
  'execution-adapter',
  'trading-session',
  'workspace',
  'positions',
  'ledger',
  'risk',
] as const;

export const V3_L02_S_ISO1_FORBIDDEN_IMPORT_SEGMENTS = [
  'live-trading-engine',
  'emergency-manager',
  'EmergencyManager',
] as const;
