/**
 * Durable synchronization / recovery log entry (US210).
 */
export type SynchronizationLog = Readonly<{
  id: string;
  sessionId: string;
  kind: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  details: Readonly<Record<string, unknown>>;
}>;

export type CreateSynchronizationLogInput = Readonly<{
  id: string;
  sessionId: string;
  kind: string;
  status: string;
  startedAt: string;
  completedAt?: string | null;
  details?: Readonly<Record<string, unknown>>;
}>;

export function createSynchronizationLog(input: CreateSynchronizationLogInput): SynchronizationLog {
  assertIso(input.startedAt, 'startedAt');
  if (input.completedAt != null) {
    assertIso(input.completedAt, 'completedAt');
  }
  return Object.freeze({
    id: required(input.id, 'log id'),
    sessionId: required(input.sessionId, 'session id'),
    kind: required(input.kind, 'kind'),
    status: required(input.status, 'status'),
    startedAt: input.startedAt,
    completedAt: input.completedAt ?? null,
    details: Object.freeze({ ...(input.details ?? {}) }),
  });
}

export function rehydrateSynchronizationLog(row: {
  id: string;
  sessionId: string;
  kind: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  details: Record<string, unknown>;
}): SynchronizationLog {
  return createSynchronizationLog(row);
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
