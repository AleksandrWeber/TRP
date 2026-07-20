export const ORDER_SIDES = Object.freeze(['BUY', 'SELL'] as const);

export type OrderSide = (typeof ORDER_SIDES)[number];

export function isOrderSide(value: string): value is OrderSide {
  return (ORDER_SIDES as readonly string[]).includes(value);
}

export function assertOrderSide(value: string): OrderSide {
  if (!isOrderSide(value)) {
    throw new Error(`invalid order side: ${value}`);
  }
  return value;
}
