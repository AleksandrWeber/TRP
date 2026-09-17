/**
 * V3-L02-S-EM1 — EmergencyManager isolation inventory (SB-05).
 * Canonical L02-relevant modules must not depend on EmergencyManager / cancel-all.
 */

export const V3_L02_S_EM1_SLICE_ID = 'L02-S-EM1' as const;

/** Module roots (under apps/api/src/modules) that form the L02 normal capital path. */
export const V3_L02_S_EM1_CANONICAL_PATH_MODULE_ROOTS = [
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

/** Forbidden import path segments for canonical L02 modules. */
export const V3_L02_S_EM1_FORBIDDEN_IMPORT_SEGMENTS = [
  'live-trading-engine',
  'emergency-manager',
  'EmergencyManager',
] as const;
