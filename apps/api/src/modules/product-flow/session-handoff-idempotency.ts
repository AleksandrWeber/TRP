/** Process-local consume marker. Not a Session field and not an Orchestrator mutation. */
export const SESSION_HANDOFF_IDEMPOTENCY_PREFIX = 'handoff:' as const;

export function sessionHandoffIdempotencyKey(sessionHandoffIntentId: string): string {
  return `${SESSION_HANDOFF_IDEMPOTENCY_PREFIX}${sessionHandoffIntentId}`;
}

export function sessionHandoffIntentIdFromKey(idempotencyKey: string): string | null {
  if (!idempotencyKey.startsWith(SESSION_HANDOFF_IDEMPOTENCY_PREFIX)) return null;
  const id = idempotencyKey.slice(SESSION_HANDOFF_IDEMPOTENCY_PREFIX.length).trim();
  return id === '' ? null : id;
}
