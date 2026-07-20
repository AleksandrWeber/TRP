export const ORDER_STATUSES = Object.freeze([
  'CREATED',
  'VALIDATED',
  'PENDING',
  'PARTIALLY_FILLED',
  'FILLED',
  'CANCELLED',
  'EXPIRED',
  'REJECTED',
] as const);

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const OPEN_ORDER_STATUSES = Object.freeze([
  'CREATED',
  'VALIDATED',
  'PENDING',
  'PARTIALLY_FILLED',
] as const);

export const TERMINAL_ORDER_STATUSES = Object.freeze([
  'FILLED',
  'CANCELLED',
  'EXPIRED',
  'REJECTED',
] as const);

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function assertOrderStatus(value: string): OrderStatus {
  if (!isOrderStatus(value)) {
    throw new Error(`invalid order status: ${value}`);
  }
  return value;
}

export function isOpenOrderStatus(status: OrderStatus): boolean {
  return (OPEN_ORDER_STATUSES as readonly string[]).includes(status);
}

export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return (TERMINAL_ORDER_STATUSES as readonly string[]).includes(status);
}

export function isImmutableOrderStatus(status: OrderStatus): boolean {
  return (
    status === 'FILLED' || status === 'CANCELLED' || status === 'EXPIRED' || status === 'REJECTED'
  );
}
