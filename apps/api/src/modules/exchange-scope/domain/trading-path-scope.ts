/**
 * RC-27 Epic 4 — Trading-path Exchange Scope alignment helpers.
 *
 * Scope is contextual metadata only. These helpers never route, execute,
 * approve risk, or own Session / Orders / Execution / Accounting.
 */

import { resolveExchangeScopeId } from './exchange-scope-identity';

/**
 * Fail closed when two trading-path artifacts disagree on Exchange Scope.
 * Empty / omitted values resolve to the default Binance scope (RC-19).
 */
export function assertSameExchangeScope(
  left: string | null | undefined,
  right: string | null | undefined,
  label = 'exchange scope',
): void {
  const a = resolveExchangeScopeId(left);
  const b = resolveExchangeScopeId(right);
  if (a !== b) {
    throw new Error(`${label} mismatch: ${a} !== ${b}`);
  }
}

/** True when both sides resolve to the same Exchange Scope identity. */
export function sameExchangeScope(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  return resolveExchangeScopeId(left) === resolveExchangeScopeId(right);
}
