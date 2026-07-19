import type { ExecutedTrade } from './executed-trade';

/**
 * Outcome of processing one scheduler signal (US016).
 *
 * - OPENED    — BUY opened a new virtual position.
 * - CLOSED    — SELL closed the existing virtual position.
 * - HELD      — HOLD; statistics recorded, no trade.
 * - IGNORED   — BUY with an open position / SELL without one / missing strategy.
 * - DUPLICATE — the exact signal was already processed (idempotency guard).
 * - FAILED    — processing threw; the executor recorded it and kept running.
 */
export const SIGNAL_EXECUTION_STATUSES = [
  'OPENED',
  'CLOSED',
  'HELD',
  'IGNORED',
  'DUPLICATE',
  'FAILED',
] as const;
export type SignalExecutionStatus = (typeof SIGNAL_EXECUTION_STATUSES)[number];

export type SignalExecution = Readonly<{
  status: SignalExecutionStatus;
  /** The trade opened or closed; null for non-trading outcomes. */
  trade: ExecutedTrade | null;
  /** Human-readable explanation for non-trading outcomes. */
  reason: string | null;
}>;

export function createSignalExecution(input: SignalExecution): SignalExecution {
  if (!SIGNAL_EXECUTION_STATUSES.includes(input.status)) {
    throw new Error(`SignalExecution status is not supported: ${input.status}`);
  }
  const trades = input.status === 'OPENED' || input.status === 'CLOSED';
  if (trades && input.trade === null) {
    throw new Error(`SignalExecution ${input.status} requires a trade`);
  }
  if (!trades && input.trade !== null) {
    throw new Error(`SignalExecution ${input.status} must not carry a trade`);
  }
  return Object.freeze({ ...input });
}
