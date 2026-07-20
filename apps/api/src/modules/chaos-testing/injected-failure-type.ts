/**
 * Deterministic failure types for US199 Chaos Testing.
 *
 * Injected through test doubles only — no production modifications.
 */

export const INJECTED_FAILURE_TYPES = Object.freeze([
  'MarketDataProvider',
  'Strategy',
  'Repository',
  'SessionLeaseExpiration',
  'ValidationFailure',
  'EventEmissionFailure',
] as const);

export type InjectedFailureType = (typeof INJECTED_FAILURE_TYPES)[number];

export function isInjectedFailureType(value: unknown): value is InjectedFailureType {
  return typeof value === 'string' && (INJECTED_FAILURE_TYPES as readonly string[]).includes(value);
}
