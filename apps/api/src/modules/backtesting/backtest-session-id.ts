/**
 * Branded BacktestSession identity (US118).
 */
export type BacktestSessionId = string & { readonly __brand: 'BacktestSessionId' };

export function toBacktestSessionId(value: string): BacktestSessionId {
  return value as BacktestSessionId;
}
