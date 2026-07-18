import { createHash } from 'node:crypto';
import {
  FinancialDecimal,
  roundMoney,
  roundPrice,
  roundQuantity,
  type FinancialPrecision,
} from '../../financial';
import type { PaperFill } from '../../execution-engine';

export const POSITION_SCHEMA_VERSION = 1;

export enum PositionSide {
  FLAT = 'flat',
  LONG = 'long',
}

export type Position = Readonly<{
  id: string;
  workspaceId: string;
  paperAccountId: string;
  instrument: string;
  side: PositionSide;
  quantity: string;
  averageEntryPrice: string;
  costBasis: string;
  realizedPnl: string;
  version: number;
  lastAppliedFillId: string;
  lastAppliedFillSequence: number;
  occurredAt: string;
  recordedAt: string;
}>;

export type PositionAccountingTransition = Readonly<{
  position: Position;
  costBasisReleased: string;
  realizedPnlDelta: string;
}>;

/**
 * Long-only Position accounting derived exclusively from one immutable Fill
 * (US172 / ADR-015). Fees remain separate Ledger movements and do not alter
 * Position cost basis or realized PnL.
 */
export function applyFillToPosition(
  current: Position | null,
  fill: PaperFill,
  precision: FinancialPrecision,
  recordedAt: string,
): PositionAccountingTransition {
  assertIso(recordedAt, 'recordedAt');
  assertCurrentIdentity(current, fill);

  const fillQuantity = roundQuantity(fill.quantity, precision).assertPositive('fill quantity');
  const fillPrice = roundPrice(fill.price, precision).assertPositive('fill price');
  const fillNotional = roundMoney(fill.grossNotional, precision).assertPositive('fill notional');
  const expectedNotional = roundMoney(fillPrice.times(fillQuantity), precision);
  if (!fillNotional.equals(expectedNotional)) {
    throw new Error('Fill gross notional does not match rounded price and quantity');
  }

  const priorQuantity = FinancialDecimal.from(current?.quantity ?? '0');
  const priorCost = FinancialDecimal.from(current?.costBasis ?? '0');
  const priorRealized = FinancialDecimal.from(current?.realizedPnl ?? '0');
  const nextVersion = (current?.version ?? 0) + 1;

  if (fill.side === 'buy') {
    const quantity = roundQuantity(priorQuantity.plus(fillQuantity), precision);
    const costBasis = roundMoney(priorCost.plus(fillNotional), precision);
    const averageEntryPrice = roundPrice(costBasis.dividedBy(quantity), precision);
    return transition(fill, current, recordedAt, {
      side: PositionSide.LONG,
      quantity,
      averageEntryPrice,
      costBasis,
      realizedPnl: priorRealized,
      version: nextVersion,
      costBasisReleased: FinancialDecimal.zero(),
      realizedPnlDelta: FinancialDecimal.zero(),
    });
  }

  if (priorQuantity.compare(fillQuantity) < 0) {
    throw new Error('sell Fill quantity cannot exceed open long Position quantity');
  }
  if (current === null || current.side !== PositionSide.LONG) {
    throw new Error('sell Fill requires an open long Position');
  }

  const remainingQuantity = roundQuantity(priorQuantity.minus(fillQuantity), precision);
  const costBasisReleased = remainingQuantity.isZero()
    ? priorCost
    : roundMoney(FinancialDecimal.from(current.averageEntryPrice).times(fillQuantity), precision);
  const costBasis = remainingQuantity.isZero()
    ? FinancialDecimal.zero()
    : roundMoney(priorCost.minus(costBasisReleased), precision);
  const realizedPnlDelta = roundMoney(fillNotional.minus(costBasisReleased), precision);
  const realizedPnl = roundMoney(priorRealized.plus(realizedPnlDelta), precision);
  const averageEntryPrice = remainingQuantity.isZero()
    ? FinancialDecimal.zero()
    : roundPrice(costBasis.dividedBy(remainingQuantity), precision);

  return transition(fill, current, recordedAt, {
    side: remainingQuantity.isZero() ? PositionSide.FLAT : PositionSide.LONG,
    quantity: remainingQuantity,
    averageEntryPrice,
    costBasis,
    realizedPnl,
    version: nextVersion,
    costBasisReleased,
    realizedPnlDelta,
  });
}

function transition(
  fill: PaperFill,
  current: Position | null,
  recordedAt: string,
  values: {
    side: PositionSide;
    quantity: FinancialDecimal;
    averageEntryPrice: FinancialDecimal;
    costBasis: FinancialDecimal;
    realizedPnl: FinancialDecimal;
    version: number;
    costBasisReleased: FinancialDecimal;
    realizedPnlDelta: FinancialDecimal;
  },
): PositionAccountingTransition {
  const position = Object.freeze({
    id: current?.id ?? positionId(fill.workspaceId, fill.paperAccountId, fill.instrument),
    workspaceId: fill.workspaceId,
    paperAccountId: fill.paperAccountId,
    instrument: fill.instrument,
    side: values.side,
    quantity: values.quantity.toString(),
    averageEntryPrice: values.averageEntryPrice.toString(),
    costBasis: values.costBasis.toString(),
    realizedPnl: values.realizedPnl.toString(),
    version: values.version,
    lastAppliedFillId: fill.id,
    lastAppliedFillSequence: (current?.lastAppliedFillSequence ?? 0) + 1,
    occurredAt: fill.occurredAt,
    recordedAt,
  });
  return Object.freeze({
    position,
    costBasisReleased: values.costBasisReleased.toString(),
    realizedPnlDelta: values.realizedPnlDelta.toString(),
  });
}

function assertCurrentIdentity(current: Position | null, fill: PaperFill): void {
  if (!current) return;
  if (
    current.workspaceId !== fill.workspaceId ||
    current.paperAccountId !== fill.paperAccountId ||
    current.instrument !== fill.instrument
  ) {
    throw new Error('Fill does not belong to the Position identity');
  }
  if (current.lastAppliedFillId === fill.id) {
    throw new Error('Fill has already been applied to Position');
  }
}

function positionId(workspaceId: string, paperAccountId: string, instrument: string): string {
  const hash = createHash('sha256')
    .update(`${workspaceId}:${paperAccountId}:${instrument}`)
    .digest('hex')
    .slice(0, 32);
  return `pos_${hash}`;
}

function assertIso(value: string, label: string): void {
  if (Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new Error(`${label} must be an ISO-8601 UTC timestamp`);
  }
}
