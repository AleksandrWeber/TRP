/**
 * Branded durable event identity (US128 / ADR-013).
 */
export type DurableEventId = string & { readonly __brand: 'DurableEventId' };

export function toDurableEventId(value: string): DurableEventId {
  return value as DurableEventId;
}
