/**
 * Indicator port of the Technical Indicators Engine (US011).
 * A pure calculation: input in, immutable result out. Implementations must be
 * stateless and deterministic — no I/O, no provider access, no trading logic,
 * no input mutation.
 */
export interface Indicator<TInput, TResult> {
  /** Stable registry key, e.g. 'sma', 'ema'. */
  id(): string;
  /** Human-readable name, e.g. 'Simple Moving Average'. */
  name(): string;
  calculate(input: TInput): TResult;
}
