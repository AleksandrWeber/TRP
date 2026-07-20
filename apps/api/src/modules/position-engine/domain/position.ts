import { FinancialDecimal } from '../../financial';
import { assertPositionSide, type PositionSide } from './position-side';
import { assertPositionStatus, isOpenPositionStatus, type PositionStatus } from './position-status';

/**
 * Position aggregate root — trade state for one symbol (US205).
 * Financial metrics are derived via PositionCalculator; never mutated ad hoc.
 */
export type Position = Readonly<{
  id: string;
  portfolioId: string;
  symbol: string;
  side: PositionSide;
  status: PositionStatus;
  quantity: string;
  entryPrice: string;
  markPrice: string;
  averageEntryPrice: string;
  realizedPnL: string;
  unrealizedPnL: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}>;

export type OpenPositionInput = Readonly<{
  id: string;
  portfolioId: string;
  symbol: string;
  side: PositionSide | string;
  quantity: string;
  entryPrice: string;
  markPrice?: string;
  createdAt: string;
  updatedAt: string;
}>;

export type IncreasePositionInput = Readonly<{
  quantity: string;
  price: string;
  updatedAt: string;
}>;

export type ReducePositionInput = Readonly<{
  quantity: string;
  price: string;
  updatedAt: string;
}>;

export type MarkPositionInput = Readonly<{
  markPrice: string;
  updatedAt: string;
}>;

export function openPosition(input: OpenPositionInput): Position {
  const id = required(input.id, 'position id');
  const portfolioId = required(input.portfolioId, 'portfolio id');
  const symbol = normalizeSymbol(input.symbol);
  const side = assertPositionSide(input.side);
  const quantity = FinancialDecimal.from(input.quantity).assertPositive('quantity').toString();
  const entryPrice = FinancialDecimal.from(input.entryPrice)
    .assertPositive('entryPrice')
    .toString();
  const markPrice = FinancialDecimal.from(input.markPrice ?? input.entryPrice)
    .assertPositive('markPrice')
    .toString();
  assertIso(input.createdAt, 'createdAt');
  assertIso(input.updatedAt, 'updatedAt');

  return Object.freeze({
    id,
    portfolioId,
    symbol,
    side,
    status: 'OPEN' as const,
    quantity,
    entryPrice,
    markPrice,
    averageEntryPrice: entryPrice,
    realizedPnL: '0',
    unrealizedPnL: '0',
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    closedAt: null,
  });
}

export function increasePosition(position: Position, input: IncreasePositionInput): Position {
  assertMutable(position);
  const addQty = FinancialDecimal.from(input.quantity).assertPositive('quantity');
  const price = FinancialDecimal.from(input.price).assertPositive('price');
  assertIso(input.updatedAt, 'updatedAt');

  const oldQty = FinancialDecimal.from(position.quantity);
  const newQty = oldQty.plus(addQty);
  const averageEntryPrice = FinancialDecimal.from(position.averageEntryPrice)
    .times(oldQty)
    .plus(price.times(addQty))
    .dividedBy(newQty)
    .toString();

  return Object.freeze({
    ...position,
    quantity: newQty.toString(),
    averageEntryPrice,
    status: position.status === 'PARTIALLY_CLOSED' ? ('OPEN' as const) : position.status,
    updatedAt: input.updatedAt,
  });
}

export function reducePosition(
  position: Position,
  input: ReducePositionInput,
): Readonly<{ position: Position; realizedDelta: string }> {
  assertMutable(position);
  const reduceQty = FinancialDecimal.from(input.quantity).assertPositive('quantity');
  const price = FinancialDecimal.from(input.price).assertPositive('price');
  assertIso(input.updatedAt, 'updatedAt');

  const currentQty = FinancialDecimal.from(position.quantity);
  if (reduceQty.compare(currentQty) > 0) {
    throw new Error('reduce quantity exceeds position quantity');
  }

  const remaining = currentQty.minus(reduceQty);
  const realizedDelta = calculateRealizedDelta(
    position.side,
    position.averageEntryPrice,
    price,
    reduceQty,
  );
  const realizedPnL = FinancialDecimal.from(position.realizedPnL).plus(realizedDelta).toString();

  if (remaining.isZero()) {
    return Object.freeze({
      position: Object.freeze({
        ...position,
        quantity: '0',
        status: 'CLOSED' as const,
        realizedPnL,
        unrealizedPnL: '0',
        updatedAt: input.updatedAt,
        closedAt: input.updatedAt,
      }),
      realizedDelta: realizedDelta.toString(),
    });
  }

  return Object.freeze({
    position: Object.freeze({
      ...position,
      quantity: remaining.toString(),
      status: 'PARTIALLY_CLOSED' as const,
      realizedPnL,
      updatedAt: input.updatedAt,
    }),
    realizedDelta: realizedDelta.toString(),
  });
}

export function closePosition(
  position: Position,
  input: Readonly<{ price: string; updatedAt: string }>,
): Readonly<{ position: Position; realizedDelta: string }> {
  assertMutable(position);
  if (FinancialDecimal.from(position.quantity).isZero()) {
    throw new Error('position quantity is already zero');
  }
  return reducePosition(position, {
    quantity: position.quantity,
    price: input.price,
    updatedAt: input.updatedAt,
  });
}

export function markPosition(position: Position, input: MarkPositionInput): Position {
  assertMutable(position);
  const markPrice = FinancialDecimal.from(input.markPrice).assertPositive('markPrice').toString();
  assertIso(input.updatedAt, 'updatedAt');
  return Object.freeze({
    ...position,
    markPrice,
    updatedAt: input.updatedAt,
  });
}

export function withUnrealizedPnL(position: Position, unrealizedPnL: string): Position {
  return Object.freeze({
    ...position,
    unrealizedPnL: FinancialDecimal.from(unrealizedPnL).toString(),
  });
}

export function rehydratePosition(row: {
  id: string;
  portfolioId: string;
  symbol: string;
  side: string;
  status: string;
  quantity: string;
  entryPrice: string;
  markPrice: string;
  averageEntryPrice: string;
  realizedPnL: string;
  unrealizedPnL: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}): Position {
  return Object.freeze({
    id: row.id,
    portfolioId: row.portfolioId,
    symbol: normalizeSymbol(row.symbol),
    side: assertPositionSide(row.side),
    status: assertPositionStatus(row.status),
    quantity: FinancialDecimal.from(row.quantity).assertNonNegative('quantity').toString(),
    entryPrice: FinancialDecimal.from(row.entryPrice).assertPositive('entryPrice').toString(),
    markPrice: FinancialDecimal.from(row.markPrice).assertPositive('markPrice').toString(),
    averageEntryPrice: FinancialDecimal.from(row.averageEntryPrice)
      .assertPositive('averageEntryPrice')
      .toString(),
    realizedPnL: FinancialDecimal.from(row.realizedPnL).toString(),
    unrealizedPnL: FinancialDecimal.from(row.unrealizedPnL).toString(),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    closedAt: row.closedAt,
  });
}

function calculateRealizedDelta(
  side: PositionSide,
  averageEntryPrice: string,
  exitPrice: FinancialDecimal,
  quantity: FinancialDecimal,
): FinancialDecimal {
  const entry = FinancialDecimal.from(averageEntryPrice);
  if (side === 'LONG') {
    return exitPrice.minus(entry).times(quantity);
  }
  return entry.minus(exitPrice).times(quantity);
}

function assertMutable(position: Position): void {
  if (position.status === 'CLOSED' || position.status === 'LIQUIDATED') {
    throw new Error('closed positions are immutable');
  }
  if (!isOpenPositionStatus(position.status)) {
    throw new Error(`position cannot be mutated in status ${position.status}`);
  }
}

function normalizeSymbol(value: string): string {
  const symbol = required(value, 'symbol').toUpperCase();
  if (!/^[A-Z0-9._-]{1,32}$/.test(symbol)) {
    throw new Error('symbol must be 1-32 uppercase letters, digits, dots, underscores, or hyphens');
  }
  return symbol;
}

function required(value: string, label: string): string {
  const result = value.trim();
  if (result === '') throw new Error(`${label} is required`);
  return result;
}

function assertIso(value: string, label: string): void {
  if (Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new Error(`${label} must be an ISO-8601 UTC timestamp`);
  }
}
