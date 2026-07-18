/**
 * Branded durable consumer identity (US129).
 */
export type ConsumerId = string & { readonly __brand: 'ConsumerId' };

export function toConsumerId(value: string): ConsumerId {
  return value as ConsumerId;
}
