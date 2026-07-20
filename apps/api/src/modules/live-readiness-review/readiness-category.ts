/**
 * Immutable readiness categories for US200 Live Readiness Review.
 */

export const READINESS_CATEGORIES = Object.freeze([
  'Execution',
  'Determinism',
  'Performance',
  'Regression',
  'Chaos',
  'Diagnostics',
  'Configuration',
  'Architecture',
] as const);

export type ReadinessCategory = (typeof READINESS_CATEGORIES)[number];

export function isReadinessCategory(value: unknown): value is ReadinessCategory {
  return typeof value === 'string' && (READINESS_CATEGORIES as readonly string[]).includes(value);
}
