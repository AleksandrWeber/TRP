/**
 * Normalized exchange order types used at the adapter boundary (US209).
 * Distinct from Trading Core Order aggregate — translation only.
 */
export const EXCHANGE_ORDER_SIDES = Object.freeze(['BUY', 'SELL'] as const);
export type ExchangeOrderSide = (typeof EXCHANGE_ORDER_SIDES)[number];

export const EXCHANGE_ORDER_TYPES = Object.freeze(['MARKET', 'LIMIT'] as const);
export type ExchangeOrderType = (typeof EXCHANGE_ORDER_TYPES)[number];

export const EXCHANGE_ORDER_STATUSES = Object.freeze([
  'ACCEPTED',
  'REJECTED',
  'PARTIALLY_FILLED',
  'FILLED',
  'CANCELLED',
] as const);
export type ExchangeOrderStatus = (typeof EXCHANGE_ORDER_STATUSES)[number];

export type ExchangeOrderRequest = Readonly<{
  clientOrderId: string;
  symbol: string;
  side: ExchangeOrderSide;
  type: ExchangeOrderType;
  quantity: string;
  price: string | null;
  reduceOnly?: boolean;
}>;

export type ExchangeCancelRequest = Readonly<{
  exchangeOrderId: string;
  clientOrderId?: string;
  symbol?: string;
}>;

export type ExchangeOrderSnapshot = Readonly<{
  exchangeOrderId: string;
  clientOrderId: string;
  symbol: string;
  side: ExchangeOrderSide;
  type: ExchangeOrderType;
  quantity: string;
  price: string | null;
  filledQuantity: string;
  status: ExchangeOrderStatus;
  rawStatus: string;
  updatedAt: string;
}>;

export type ExchangeOrderResponse = Readonly<{
  accepted: boolean;
  order: ExchangeOrderSnapshot | null;
  rejectReason: string | null;
}>;

export function createExchangeOrderRequest(input: ExchangeOrderRequest): ExchangeOrderRequest {
  return Object.freeze({
    clientOrderId: required(input.clientOrderId, 'clientOrderId'),
    symbol: required(input.symbol, 'symbol'),
    side: assertSide(input.side),
    type: assertType(input.type),
    quantity: required(input.quantity, 'quantity'),
    price:
      input.price === null || input.price === undefined ? null : required(input.price, 'price'),
    reduceOnly: input.reduceOnly === true,
  });
}

function assertSide(value: string): ExchangeOrderSide {
  if (!(EXCHANGE_ORDER_SIDES as readonly string[]).includes(value)) {
    throw new Error(`invalid exchange order side: ${value}`);
  }
  return value as ExchangeOrderSide;
}

function assertType(value: string): ExchangeOrderType {
  if (!(EXCHANGE_ORDER_TYPES as readonly string[]).includes(value)) {
    throw new Error(`invalid exchange order type: ${value}`);
  }
  return value as ExchangeOrderType;
}

function required(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} is required`);
  return trimmed;
}
