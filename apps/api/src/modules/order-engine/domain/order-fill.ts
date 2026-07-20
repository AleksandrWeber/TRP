import { FinancialDecimal } from '../../financial';

/**
 * Immutable order fill (US206).
 */
export type OrderFill = Readonly<{
  id: string;
  orderId: string;
  timestamp: string;
  quantity: string;
  price: string;
  fee: string;
}>;

export type CreateOrderFillInput = Readonly<{
  id: string;
  orderId: string;
  timestamp: string;
  quantity: string;
  price: string;
  fee?: string;
}>;

export function createOrderFill(input: CreateOrderFillInput): OrderFill {
  const id = required(input.id, 'fill id');
  const orderId = required(input.orderId, 'order id');
  assertIso(input.timestamp, 'timestamp');
  const quantity = FinancialDecimal.from(input.quantity).assertPositive('quantity').toString();
  const price = FinancialDecimal.from(input.price).assertPositive('price').toString();
  const fee = FinancialDecimal.from(input.fee ?? '0')
    .assertNonNegative('fee')
    .toString();

  return Object.freeze({
    id,
    orderId,
    timestamp: input.timestamp,
    quantity,
    price,
    fee,
  });
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
