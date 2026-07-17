/**
 * Branded user identity (US105).
 * Opaque string — not interchangeable with other entity ids at the type level.
 */
export type UserId = string & { readonly __brand: 'UserId' };

export function toUserId(value: string): UserId {
  return value as UserId;
}
