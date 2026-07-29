/**
 * Opaque Session lease proof consumed by Strategy Runtime (US218 / ADR-014).
 * Runtime validates fencing + expiry; it does not own Session lifecycle or
 * import Trading Session persistence.
 */
export const RUNTIME_LEASE_SESSION_STATUS_RUNNING = 'RUNNING' as const;

export type RuntimeLeaseProof = Readonly<{
  sessionId: string;
  fencingToken: number;
  ownerId: string;
  expiresAt: string;
  sessionStatus: typeof RUNTIME_LEASE_SESSION_STATUS_RUNNING | string;
}>;

export type RuntimeLeaseProofInput = Readonly<{
  sessionId: string;
  fencingToken: number;
  ownerId: string;
  expiresAt: string;
  sessionStatus: string;
}>;

export function createRuntimeLeaseProof(input: RuntimeLeaseProofInput): RuntimeLeaseProof {
  return Object.freeze({
    sessionId: required(input.sessionId, 'session id'),
    fencingToken: positiveInteger(input.fencingToken, 'fencing token'),
    ownerId: required(input.ownerId, 'lease owner id'),
    expiresAt: assertIso(input.expiresAt, 'expiresAt'),
    sessionStatus: required(input.sessionStatus, 'session status'),
  });
}

/**
 * Validates that the caller holds a current RUNNING Session lease.
 * Wall-clock expiry is operational only (ADR-014 / ADR-018 #53).
 */
export function assertRuntimeLeaseValid(
  lease: RuntimeLeaseProof,
  expectedSessionId: string,
  nowIso: string,
): void {
  const sessionId = required(expectedSessionId, 'expected session id');
  assertIso(nowIso, 'nowIso');

  if (lease.sessionId !== sessionId) {
    throw new Error('lease session id does not match runtime session');
  }
  if (lease.sessionStatus !== RUNTIME_LEASE_SESSION_STATUS_RUNNING) {
    throw new Error(`session status ${lease.sessionStatus} is not tick-eligible`);
  }
  if (Date.parse(nowIso) >= Date.parse(lease.expiresAt)) {
    throw new Error('lease expired');
  }
}

function required(value: string, label: string): string {
  const result = value.trim();
  if (result === '') throw new Error(`${label} is required`);
  return result;
}

function positiveInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${label} must be a positive integer`);
  }
  return value;
}

function assertIso(value: string, label: string): string {
  if (Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new Error(`${label} must be an ISO-8601 UTC timestamp`);
  }
  return value;
}
