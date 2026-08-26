/**
 * Paper Order domain (W2-S04-b).
 *
 * Intent to trade only. No execution, fills, positions, PnL, or balance changes.
 */

export const PAPER_ORDER_SIDES = ['BUY', 'SELL'] as const;
export type PaperOrderSide = (typeof PAPER_ORDER_SIDES)[number];

export const PAPER_ORDER_TYPES = ['LIMIT', 'MARKET', 'STOP', 'STOP_LIMIT'] as const;
export type PaperOrderType = (typeof PAPER_ORDER_TYPES)[number];

export const PAPER_ORDER_STATUSES = [
  'DRAFT',
  'PENDING',
  'CANCELLED',
  'REJECTED',
  'FILLED',
] as const;
export type PaperOrderStatus = (typeof PAPER_ORDER_STATUSES)[number];

export type PaperOrder = Readonly<{
  id: string;
  workspaceId: string;
  paperAccountId: string;
  exchange: string;
  symbol: string;
  side: PaperOrderSide;
  orderType: PaperOrderType;
  quantity: string;
  limitPrice: string | null;
  stopPrice: string | null;
  status: PaperOrderStatus;
  createdAt: string;
  updatedAt: string;
}>;

export type CreatePaperOrderInput = Readonly<{
  id: string;
  workspaceId: string;
  paperAccountId: string;
  exchange: string;
  symbol: string;
  side: string;
  orderType: string;
  quantity: string;
  limitPrice?: string | null;
  stopPrice?: string | null;
  status: Extract<PaperOrderStatus, 'DRAFT' | 'PENDING' | 'REJECTED'>;
  createdAt: string;
  rejectionReason?: string;
}>;

export function isPaperOrderSide(value: string): value is PaperOrderSide {
  return (PAPER_ORDER_SIDES as readonly string[]).includes(value);
}

export function isPaperOrderType(value: string): value is PaperOrderType {
  return (PAPER_ORDER_TYPES as readonly string[]).includes(value);
}

export function isPaperOrderStatus(value: string): value is PaperOrderStatus {
  return (PAPER_ORDER_STATUSES as readonly string[]).includes(value);
}

export function createPaperOrder(input: CreatePaperOrderInput): PaperOrder {
  const id = required(input.id, 'order id');
  const workspaceId = required(input.workspaceId, 'workspace id');
  const paperAccountId = required(input.paperAccountId, 'paper account id');
  const exchange = required(input.exchange, 'exchange').toUpperCase();
  const symbol = required(input.symbol, 'symbol').toUpperCase();
  const side = normalizeSide(input.side);
  const orderType = normalizeOrderType(input.orderType);
  const quantity = normalizePositiveDecimal(input.quantity, 'quantity');
  const limitPrice = normalizeOptionalPrice(input.limitPrice, 'limit price');
  const stopPrice = normalizeOptionalPrice(input.stopPrice, 'stop price');
  assertPricesForType(orderType, limitPrice, stopPrice);
  assertIso(input.createdAt, 'createdAt');

  return Object.freeze({
    id,
    workspaceId,
    paperAccountId,
    exchange,
    symbol,
    side,
    orderType,
    quantity,
    limitPrice,
    stopPrice,
    status: input.status,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
}

export function updatePaperOrder(
  order: PaperOrder,
  patch: Readonly<{
    exchange?: string;
    symbol?: string;
    side?: string;
    orderType?: string;
    quantity?: string;
    limitPrice?: string | null;
    stopPrice?: string | null;
  }>,
  updatedAt: string,
): PaperOrder {
  if (order.status !== 'DRAFT' && order.status !== 'PENDING') {
    throw new Error(`paper order cannot update from ${order.status}`);
  }
  assertIso(updatedAt, 'updatedAt');
  const exchange = required(patch.exchange ?? order.exchange, 'exchange').toUpperCase();
  const symbol = required(patch.symbol ?? order.symbol, 'symbol').toUpperCase();
  const side = normalizeSide(patch.side ?? order.side);
  const orderType = normalizeOrderType(patch.orderType ?? order.orderType);
  const quantity = normalizePositiveDecimal(patch.quantity ?? order.quantity, 'quantity');
  const limitPrice =
    patch.limitPrice !== undefined
      ? normalizeOptionalPrice(patch.limitPrice, 'limit price')
      : order.limitPrice;
  const stopPrice =
    patch.stopPrice !== undefined
      ? normalizeOptionalPrice(patch.stopPrice, 'stop price')
      : order.stopPrice;
  assertPricesForType(orderType, limitPrice, stopPrice);

  return Object.freeze({
    ...order,
    exchange,
    symbol,
    side,
    orderType,
    quantity,
    limitPrice,
    stopPrice,
    updatedAt,
  });
}

export function cancelPaperOrder(order: PaperOrder, updatedAt: string): PaperOrder {
  if (order.status !== 'DRAFT' && order.status !== 'PENDING') {
    throw new Error(`paper order cannot cancel from ${order.status}`);
  }
  assertIso(updatedAt, 'updatedAt');
  return Object.freeze({
    ...order,
    status: 'CANCELLED',
    updatedAt,
  });
}

/**
 * Local paper fill completion (W2-S04-c).
 * FILLED means a Paper Fill was created from Market Data — not exchange acceptance.
 */
export function markPaperOrderFilled(order: PaperOrder, updatedAt: string): PaperOrder {
  if (order.status !== 'PENDING') {
    throw new Error(`paper order cannot fill from ${order.status}`);
  }
  assertIso(updatedAt, 'updatedAt');
  return Object.freeze({
    ...order,
    status: 'FILLED',
    updatedAt,
  });
}

function normalizeSide(value: string): PaperOrderSide {
  const side = required(value, 'side').toUpperCase();
  if (!isPaperOrderSide(side)) {
    throw new Error(`unsupported paper order side: ${side}`);
  }
  return side;
}

function normalizeOrderType(value: string): PaperOrderType {
  const orderType = required(value, 'order type')
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  if (!isPaperOrderType(orderType)) {
    throw new Error(`unsupported paper order type: ${orderType}`);
  }
  return orderType;
}

function assertPricesForType(
  orderType: PaperOrderType,
  limitPrice: string | null,
  stopPrice: string | null,
): void {
  switch (orderType) {
    case 'MARKET':
      if (limitPrice !== null || stopPrice !== null) {
        throw new Error('market orders must not include limit or stop price');
      }
      return;
    case 'LIMIT':
      if (limitPrice === null) throw new Error('limit price is required for limit orders');
      if (stopPrice !== null) throw new Error('limit orders must not include stop price');
      return;
    case 'STOP':
      if (stopPrice === null) throw new Error('stop price is required for stop orders');
      if (limitPrice !== null) throw new Error('stop orders must not include limit price');
      return;
    case 'STOP_LIMIT':
      if (limitPrice === null) throw new Error('limit price is required for stop limit orders');
      if (stopPrice === null) throw new Error('stop price is required for stop limit orders');
      return;
  }
}

function normalizeOptionalPrice(value: string | null | undefined, label: string): string | null {
  if (value === undefined || value === null || value.trim() === '') return null;
  return normalizePositiveDecimal(value, label);
}

function normalizePositiveDecimal(value: string, label: string): string {
  const trimmed = required(value, label);
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,8})?$/.test(trimmed)) {
    throw new Error(`${label} must be a positive decimal`);
  }
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`${label} must be a positive decimal`);
  }
  return trimmed;
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
