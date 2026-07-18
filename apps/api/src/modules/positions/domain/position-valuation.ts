import { FinancialDecimal, roundMoney, roundPrice, type FinancialPrecision } from '../../financial';
import type { Position } from './position';

export const POSITION_VALUATION_SCHEMA_VERSION = 1;

export type PositionMarkPrice = Readonly<{
  workspaceId: string;
  instrument: string;
  marketStreamId: string;
  marketEventId: string;
  marketSequence: number;
  markPrice: string;
  occurredAt: string;
  recordedAt: string;
}>;

export type PositionValuation = Readonly<{
  id: string;
  workspaceId: string;
  paperAccountId: string;
  positionId: string;
  instrument: string;
  positionVersion: number;
  version: number;
  marketStreamId: string;
  marketEventId: string;
  marketSequence: number;
  markPrice: string;
  quantity: string;
  costBasis: string;
  realizedPnl: string;
  marketValue: string;
  unrealizedPnl: string;
  occurredAt: string;
  recordedAt: string;
}>;

/**
 * Rebuildable mark-to-market calculation (US175 / ADR-015).
 * It copies Position accounting inputs but never changes Position or Ledger.
 */
export function valuePosition(
  position: Position,
  mark: PositionMarkPrice,
  current: PositionValuation | null,
  precision: FinancialPrecision,
): PositionValuation {
  assertMark(position, mark, current);
  const markPrice = roundPrice(mark.markPrice, precision).assertPositive('mark price');
  const quantity = FinancialDecimal.from(position.quantity);
  const marketValue = roundMoney(markPrice.times(quantity), precision);
  const unrealizedPnl = roundMoney(marketValue.minus(position.costBasis), precision);

  return Object.freeze({
    id: `valuation:${position.id}`,
    workspaceId: position.workspaceId,
    paperAccountId: position.paperAccountId,
    positionId: position.id,
    instrument: position.instrument,
    positionVersion: position.version,
    version: (current?.version ?? 0) + 1,
    marketStreamId: mark.marketStreamId,
    marketEventId: mark.marketEventId,
    marketSequence: mark.marketSequence,
    markPrice: markPrice.toString(),
    quantity: quantity.toString(),
    costBasis: FinancialDecimal.from(position.costBasis).toString(),
    realizedPnl: FinancialDecimal.from(position.realizedPnl).toString(),
    marketValue: marketValue.toString(),
    unrealizedPnl: unrealizedPnl.toString(),
    occurredAt: mark.occurredAt,
    recordedAt: mark.recordedAt,
  });
}

function assertMark(
  position: Position,
  mark: PositionMarkPrice,
  current: PositionValuation | null,
): void {
  if (mark.workspaceId !== position.workspaceId || mark.instrument !== position.instrument) {
    throw new Error('mark price does not belong to Position identity');
  }
  if (!Number.isSafeInteger(mark.marketSequence) || mark.marketSequence < 1) {
    throw new Error('mark price sequence must be a positive integer');
  }
  if (mark.marketEventId.trim() === '' || mark.marketStreamId.trim() === '') {
    throw new Error('mark price event and stream identity are required');
  }
  assertIso(mark.occurredAt, 'occurredAt');
  assertIso(mark.recordedAt, 'recordedAt');
  if (current && current.marketStreamId !== mark.marketStreamId) {
    throw new Error('Position valuation cannot switch mark-price streams');
  }
  if (current && mark.marketSequence <= current.marketSequence) {
    throw new Error('mark price is duplicate or out of order');
  }
}

function assertIso(value: string, label: string): void {
  if (Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new Error(`${label} must be an ISO-8601 UTC timestamp`);
  }
}
