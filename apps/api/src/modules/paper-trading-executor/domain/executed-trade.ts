/**
 * Trade side is the direction of the opening order. US016 is long-only:
 * a BUY signal opens a BUY (long) trade and a SELL signal closes it.
 * 'SELL' is reserved for short trades in a later milestone.
 */
export const EXECUTED_TRADE_SIDES = ['BUY', 'SELL'] as const;
export type ExecutedTradeSide = (typeof EXECUTED_TRADE_SIDES)[number];

export const EXECUTED_TRADE_STATUSES = ['OPEN', 'CLOSED'] as const;
export type ExecutedTradeStatus = (typeof EXECUTED_TRADE_STATUSES)[number];

/**
 * One virtual round-trip trade of the Paper Trading Executor (US016).
 * Created OPEN by a BUY signal; completed (CLOSED) by a SELL signal.
 * Exit fields are null exactly while the trade is OPEN.
 */
export type ExecutedTrade = Readonly<{
  tradeId: string;
  strategyId: string;
  symbol: string;
  side: ExecutedTradeSide;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  /** ISO-8601 moment the position was opened. */
  openTime: string;
  /** ISO-8601 moment the position was closed, or null while OPEN. */
  closeTime: string | null;
  /** Realized profit/loss; always 0 while OPEN. No fees or slippage. */
  profitLoss: number;
  status: ExecutedTradeStatus;
}>;

/** Validating factory — the store never holds a malformed trade. */
export function createExecutedTrade(input: ExecutedTrade): ExecutedTrade {
  assertNonEmpty(input.tradeId, 'ExecutedTrade tradeId');
  assertNonEmpty(input.strategyId, 'ExecutedTrade strategyId');
  if (!/^[A-Z0-9]+$/.test(input.symbol)) {
    throw new Error('ExecutedTrade symbol must contain only uppercase letters and numbers');
  }
  if (!EXECUTED_TRADE_SIDES.includes(input.side)) {
    throw new Error(`ExecutedTrade side is not supported: ${input.side}`);
  }
  if (!EXECUTED_TRADE_STATUSES.includes(input.status)) {
    throw new Error(`ExecutedTrade status is not supported: ${input.status}`);
  }
  assertPositive(input.entryPrice, 'ExecutedTrade entryPrice');
  assertPositive(input.quantity, 'ExecutedTrade quantity');
  assertIsoTimestamp(input.openTime, 'ExecutedTrade openTime');
  if (!Number.isFinite(input.profitLoss)) {
    throw new Error('ExecutedTrade profitLoss must be finite');
  }

  if (input.status === 'OPEN') {
    if (input.exitPrice !== null || input.closeTime !== null) {
      throw new Error('Open ExecutedTrade must not carry exit details');
    }
    if (input.profitLoss !== 0) {
      throw new Error('Open ExecutedTrade profitLoss must be zero');
    }
  } else {
    if (input.exitPrice === null || input.closeTime === null) {
      throw new Error('Closed ExecutedTrade requires exitPrice and closeTime');
    }
    assertPositive(input.exitPrice, 'ExecutedTrade exitPrice');
    assertIsoTimestamp(input.closeTime, 'ExecutedTrade closeTime');
  }

  return Object.freeze({ ...input });
}

function assertNonEmpty(value: string, field: string): void {
  if (value.trim() === '') {
    throw new Error(`${field} must not be empty`);
  }
}

function assertPositive(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be a finite positive number`);
  }
}

function assertIsoTimestamp(value: string, field: string): void {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`${field} must be a valid ISO-8601 timestamp`);
  }
}
