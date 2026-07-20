export const ORDER_TYPES = Object.freeze([
  'MARKET',
  'LIMIT',
  'STOP',
  'STOP_LIMIT',
  'TAKE_PROFIT',
] as const);

export type OrderType = (typeof ORDER_TYPES)[number];

export function isOrderType(value: string): value is OrderType {
  return (ORDER_TYPES as readonly string[]).includes(value);
}

export function assertOrderType(value: string): OrderType {
  if (!isOrderType(value)) {
    throw new Error(`invalid order type: ${value}`);
  }
  return value;
}

/** Types that require a requested price at creation. */
export function requiresRequestedPrice(type: OrderType): boolean {
  return type === 'LIMIT' || type === 'STOP' || type === 'STOP_LIMIT' || type === 'TAKE_PROFIT';
}
