export const PAPER_POSITION_SIDES = ['LONG'] as const;
export type PaperPositionSide = (typeof PAPER_POSITION_SIDES)[number];

export const PAPER_POSITION_STATUSES = ['OPEN', 'CLOSED'] as const;
export type PaperPositionStatus = (typeof PAPER_POSITION_STATUSES)[number];

/**
 * Simulated cash-market position (US010).
 * Exit details live in TradeResult history; the position remains the compact
 * lifecycle record required by the domain contract.
 */
export type PaperPosition = Readonly<{
  id: string;
  strategyId: string;
  symbol: string;
  side: PaperPositionSide;
  quantity: number;
  entryPrice: number;
  entryTime: string;
  status: PaperPositionStatus;
}>;

export function createPaperPosition(input: PaperPosition): PaperPosition {
  assertNonEmpty(input.id, 'PaperPosition id');
  assertNonEmpty(input.strategyId, 'PaperPosition strategyId');
  if (!/^[A-Z0-9]+$/.test(input.symbol)) {
    throw new Error('PaperPosition symbol must contain only uppercase letters and numbers');
  }
  if (!PAPER_POSITION_SIDES.includes(input.side)) {
    throw new Error(`PaperPosition side is not supported: ${input.side}`);
  }
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
    throw new Error('PaperPosition quantity must be a finite positive number');
  }
  if (!Number.isFinite(input.entryPrice) || input.entryPrice <= 0) {
    throw new Error('PaperPosition entryPrice must be a finite positive number');
  }
  if (!Number.isFinite(Date.parse(input.entryTime))) {
    throw new Error('PaperPosition entryTime must be a valid ISO-8601 timestamp');
  }
  if (!PAPER_POSITION_STATUSES.includes(input.status)) {
    throw new Error(`PaperPosition status is not supported: ${input.status}`);
  }
  return Object.freeze({ ...input });
}

function assertNonEmpty(value: string, field: string): void {
  if (value.trim() === '') {
    throw new Error(`${field} must not be empty`);
  }
}
