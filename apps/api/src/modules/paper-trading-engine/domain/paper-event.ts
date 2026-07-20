/**
 * Immutable paper trading event (US208).
 */
export type PaperEventRecord = Readonly<{
  id: string;
  sessionId: string;
  type: string;
  timestamp: string;
  payload: Readonly<Record<string, unknown>>;
}>;

export type CreatePaperEventInput = Readonly<{
  id: string;
  sessionId: string;
  type: string;
  timestamp: string;
  payload: Readonly<Record<string, unknown>>;
}>;

export function createPaperEventRecord(input: CreatePaperEventInput): PaperEventRecord {
  assertIso(input.timestamp, 'timestamp');
  return Object.freeze({
    id: required(input.id, 'event id'),
    sessionId: required(input.sessionId, 'session id'),
    type: required(input.type, 'type'),
    timestamp: input.timestamp,
    payload: Object.freeze({ ...input.payload }),
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
