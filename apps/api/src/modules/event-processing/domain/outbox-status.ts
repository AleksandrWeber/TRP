/**
 * Outbox delivery status (US128).
 * Envelope/payload fields are immutable; only delivery metadata mutates.
 */
export enum OutboxStatus {
  PENDING = 'pending',
  PUBLISHING = 'publishing',
  PUBLISHED = 'published',
  DEAD_LETTER = 'dead_letter',
}

export function isOutboxStatus(value: string): value is OutboxStatus {
  return (Object.values(OutboxStatus) as string[]).includes(value);
}
