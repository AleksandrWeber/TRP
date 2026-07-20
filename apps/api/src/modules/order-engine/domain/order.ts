import { FinancialDecimal } from '../../financial';
import { assertOrderSide, type OrderSide } from './order-side';
import { assertOrderStatus, isImmutableOrderStatus, type OrderStatus } from './order-status';
import { assertOrderType, requiresRequestedPrice, type OrderType } from './order-type';
import { assertTimeInForce, type TimeInForce } from './time-in-force';

/**
 * Order aggregate root — trading order lifecycle state (US206).
 * Single source of truth for order transitions; fills update quantities here.
 */
export type Order = Readonly<{
  id: string;
  portfolioId: string;
  positionId: string | null;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: string;
  requestedPrice: string | null;
  executedPrice: string | null;
  filledQuantity: string;
  remainingQuantity: string;
  status: OrderStatus;
  timeInForce: TimeInForce;
  createdAt: string;
  updatedAt: string;
  executedAt: string | null;
  cancelledAt: string | null;
}>;

export type CreateOrderInput = Readonly<{
  id: string;
  portfolioId: string;
  symbol: string;
  side: OrderSide | string;
  type: OrderType | string;
  quantity: string;
  requestedPrice?: string | null;
  timeInForce?: TimeInForce | string;
  createdAt: string;
  updatedAt: string;
}>;

export type ApplyFillInput = Readonly<{
  quantity: string;
  price: string;
  updatedAt: string;
  positionId?: string | null;
}>;

export function createOrder(input: CreateOrderInput): Order {
  const id = required(input.id, 'order id');
  const portfolioId = required(input.portfolioId, 'portfolio id');
  const symbol = normalizeSymbol(input.symbol);
  const side = assertOrderSide(String(input.side).toUpperCase());
  const type = assertOrderType(String(input.type).toUpperCase());
  const quantity = FinancialDecimal.from(input.quantity).assertPositive('quantity').toString();
  const timeInForce = assertTimeInForce(String(input.timeInForce ?? 'GTC').toUpperCase());
  assertIso(input.createdAt, 'createdAt');
  assertIso(input.updatedAt, 'updatedAt');

  let requestedPrice: string | null = null;
  if (
    input.requestedPrice !== undefined &&
    input.requestedPrice !== null &&
    input.requestedPrice !== ''
  ) {
    requestedPrice = FinancialDecimal.from(input.requestedPrice)
      .assertPositive('requestedPrice')
      .toString();
  } else if (requiresRequestedPrice(type)) {
    throw new Error(`${type} orders require a requested price`);
  }

  return Object.freeze({
    id,
    portfolioId,
    positionId: null,
    symbol,
    side,
    type,
    quantity,
    requestedPrice,
    executedPrice: null,
    filledQuantity: '0',
    remainingQuantity: quantity,
    status: 'CREATED' as const,
    timeInForce,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    executedAt: null,
    cancelledAt: null,
  });
}

export function withOrderStatus(
  order: Order,
  status: OrderStatus,
  updatedAt: string,
  extras?: Readonly<{ cancelledAt?: string | null; executedAt?: string | null }>,
): Order {
  assertIso(updatedAt, 'updatedAt');
  return Object.freeze({
    ...order,
    status,
    updatedAt,
    cancelledAt: extras?.cancelledAt !== undefined ? extras.cancelledAt : order.cancelledAt,
    executedAt: extras?.executedAt !== undefined ? extras.executedAt : order.executedAt,
  });
}

export function withOrderPatch(
  order: Order,
  patch: Readonly<{
    requestedPrice?: string | null;
    timeInForce?: TimeInForce | string;
    quantity?: string;
    updatedAt: string;
  }>,
): Order {
  assertMutable(order);
  assertIso(patch.updatedAt, 'updatedAt');

  let quantity = order.quantity;
  let remainingQuantity = order.remainingQuantity;
  if (patch.quantity !== undefined) {
    const filled = FinancialDecimal.from(order.filledQuantity);
    const nextQty = FinancialDecimal.from(patch.quantity).assertPositive('quantity');
    if (nextQty.compare(filled) < 0) {
      throw new Error('quantity cannot be less than filled quantity');
    }
    quantity = nextQty.toString();
    remainingQuantity = nextQty.minus(filled).toString();
  }

  let requestedPrice = order.requestedPrice;
  if (patch.requestedPrice !== undefined) {
    if (patch.requestedPrice === null || patch.requestedPrice === '') {
      if (requiresRequestedPrice(order.type)) {
        throw new Error(`${order.type} orders require a requested price`);
      }
      requestedPrice = null;
    } else {
      requestedPrice = FinancialDecimal.from(patch.requestedPrice)
        .assertPositive('requestedPrice')
        .toString();
    }
  }

  const timeInForce =
    patch.timeInForce !== undefined
      ? assertTimeInForce(String(patch.timeInForce).toUpperCase())
      : order.timeInForce;

  return Object.freeze({
    ...order,
    quantity,
    remainingQuantity,
    requestedPrice,
    timeInForce,
    updatedAt: patch.updatedAt,
  });
}

export function applyOrderFill(
  order: Order,
  input: ApplyFillInput,
): Readonly<{ order: Order; fillQuantity: string }> {
  assertExecutable(order);
  const fillQty = FinancialDecimal.from(input.quantity).assertPositive('fill quantity');
  const price = FinancialDecimal.from(input.price).assertPositive('fill price');
  assertIso(input.updatedAt, 'updatedAt');

  const remaining = FinancialDecimal.from(order.remainingQuantity);
  if (fillQty.compare(remaining) > 0) {
    throw new Error('filled quantity would exceed requested quantity');
  }

  const previousFilled = FinancialDecimal.from(order.filledQuantity);
  const newFilled = previousFilled.plus(fillQty);
  const newRemaining = remaining.minus(fillQty);
  const totalQty = FinancialDecimal.from(order.quantity);

  // VWAP executed price across fills
  const previousNotional = FinancialDecimal.from(order.executedPrice ?? '0').times(previousFilled);
  const fillNotional = price.times(fillQty);
  const executedPrice = previousFilled.isZero()
    ? price.toString()
    : previousNotional.plus(fillNotional).dividedBy(newFilled).toString();

  if (newFilled.compare(totalQty) > 0) {
    throw new Error('filled quantity exceeds requested quantity');
  }
  if (newRemaining.isNegative()) {
    throw new Error('remaining quantity cannot be negative');
  }

  const fullyFilled = newRemaining.isZero();
  const status: OrderStatus = fullyFilled ? 'FILLED' : 'PARTIALLY_FILLED';

  return Object.freeze({
    order: Object.freeze({
      ...order,
      filledQuantity: newFilled.toString(),
      remainingQuantity: newRemaining.toString(),
      executedPrice,
      status,
      positionId: input.positionId !== undefined ? input.positionId : order.positionId,
      updatedAt: input.updatedAt,
      executedAt: fullyFilled ? input.updatedAt : (order.executedAt ?? input.updatedAt),
    }),
    fillQuantity: fillQty.toString(),
  });
}

export function rehydrateOrder(row: {
  id: string;
  portfolioId: string;
  positionId: string | null;
  symbol: string;
  side: string;
  type: string;
  quantity: string;
  requestedPrice: string | null;
  executedPrice: string | null;
  filledQuantity: string;
  remainingQuantity: string;
  status: string;
  timeInForce: string;
  createdAt: string;
  updatedAt: string;
  executedAt: string | null;
  cancelledAt: string | null;
}): Order {
  const quantity = FinancialDecimal.from(row.quantity).assertPositive('quantity');
  const filled = FinancialDecimal.from(row.filledQuantity).assertNonNegative('filledQuantity');
  const remaining = FinancialDecimal.from(row.remainingQuantity).assertNonNegative(
    'remainingQuantity',
  );
  if (filled.plus(remaining).compare(quantity) !== 0) {
    throw new Error('filled + remaining must equal quantity');
  }
  if (filled.compare(quantity) > 0) {
    throw new Error('filled quantity exceeds requested quantity');
  }

  return Object.freeze({
    id: row.id,
    portfolioId: row.portfolioId,
    positionId: row.positionId,
    symbol: normalizeSymbol(row.symbol),
    side: assertOrderSide(row.side),
    type: assertOrderType(row.type),
    quantity: quantity.toString(),
    requestedPrice:
      row.requestedPrice === null
        ? null
        : FinancialDecimal.from(row.requestedPrice).assertPositive('requestedPrice').toString(),
    executedPrice:
      row.executedPrice === null
        ? null
        : FinancialDecimal.from(row.executedPrice).assertPositive('executedPrice').toString(),
    filledQuantity: filled.toString(),
    remainingQuantity: remaining.toString(),
    status: assertOrderStatus(row.status),
    timeInForce: assertTimeInForce(row.timeInForce),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    executedAt: row.executedAt,
    cancelledAt: row.cancelledAt,
  });
}

function assertMutable(order: Order): void {
  if (isImmutableOrderStatus(order.status)) {
    throw new Error(`order is immutable in status ${order.status}`);
  }
}

function assertExecutable(order: Order): void {
  if (order.status === 'CANCELLED') {
    throw new Error('cancelled orders cannot be executed');
  }
  if (order.status === 'FILLED') {
    throw new Error('filled orders are immutable');
  }
  if (order.status === 'EXPIRED' || order.status === 'REJECTED') {
    throw new Error(`order cannot be executed in status ${order.status}`);
  }
  if (order.status !== 'PENDING' && order.status !== 'PARTIALLY_FILLED') {
    throw new Error(`order cannot be executed in status ${order.status}`);
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
