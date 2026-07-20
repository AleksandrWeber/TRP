export const PAPER_TRADE_ACTIONS = ['OPEN_LONG', 'CLOSE_LONG', 'IGNORED'] as const;
export type PaperTradeAction = (typeof PAPER_TRADE_ACTIONS)[number];

/**
 * Result of one manual paper-trading request (US010).
 * positionId is null only for IGNORED decisions because no position exists.
 */
export type TradeResult = Readonly<{
  positionId: string | null;
  action: PaperTradeAction;
  price: number;
  quantity: number;
  realizedPnL: number;
  timestamp: string;
}>;

export function createTradeResult(input: TradeResult): TradeResult {
  if (input.positionId !== null && input.positionId.trim() === '') {
    throw new Error('TradeResult positionId must not be empty');
  }
  if (!PAPER_TRADE_ACTIONS.includes(input.action)) {
    throw new Error(`TradeResult action is not supported: ${input.action}`);
  }
  if (input.action === 'IGNORED' && input.positionId !== null) {
    throw new Error('Ignored TradeResult positionId must be null');
  }
  if (input.action !== 'IGNORED' && input.positionId === null) {
    throw new Error('Executed TradeResult positionId is required');
  }
  if (!Number.isFinite(input.price) || input.price <= 0) {
    throw new Error('TradeResult price must be a finite positive number');
  }
  if (!Number.isFinite(input.quantity) || input.quantity < 0) {
    throw new Error('TradeResult quantity must be a finite non-negative number');
  }
  if (input.action === 'IGNORED' && (input.quantity !== 0 || input.realizedPnL !== 0)) {
    throw new Error('Ignored TradeResult quantity and realizedPnL must be zero');
  }
  if (input.action !== 'IGNORED' && input.quantity === 0) {
    throw new Error('Executed TradeResult quantity must be greater than zero');
  }
  if (!Number.isFinite(input.realizedPnL)) {
    throw new Error('TradeResult realizedPnL must be finite');
  }
  if (!Number.isFinite(Date.parse(input.timestamp))) {
    throw new Error('TradeResult timestamp must be a valid ISO-8601 timestamp');
  }
  return Object.freeze({ ...input });
}
