/**
 * Fenced runtime lease (US157 / ADR-014).
 * Wall-clock expiry is operational only — never financial semantics.
 */
export type SessionLease = Readonly<{
  ownerId: string;
  fencingToken: number;
  acquiredAt: string;
  expiresAt: string;
  heartbeatAt: string;
}>;

export type AcquireLeaseInput = Readonly<{
  ownerId: string;
  acquiredAt: string;
  expiresAt: string;
  previousToken: number;
}>;

export function createSessionLease(input: AcquireLeaseInput): SessionLease {
  const ownerId = required(input.ownerId, 'lease owner id');
  assertIso(input.acquiredAt, 'acquiredAt');
  assertIso(input.expiresAt, 'expiresAt');
  if (Date.parse(input.expiresAt) <= Date.parse(input.acquiredAt)) {
    throw new Error('lease expiresAt must be after acquiredAt');
  }
  if (!Number.isInteger(input.previousToken) || input.previousToken < 0) {
    throw new Error('previous fencing token must be a non-negative integer');
  }
  return Object.freeze({
    ownerId,
    fencingToken: input.previousToken + 1,
    acquiredAt: input.acquiredAt,
    expiresAt: input.expiresAt,
    heartbeatAt: input.acquiredAt,
  });
}

export function heartbeatLease(
  lease: SessionLease,
  heartbeatAt: string,
  expiresAt: string,
): SessionLease {
  assertIso(heartbeatAt, 'heartbeatAt');
  assertIso(expiresAt, 'expiresAt');
  if (Date.parse(expiresAt) <= Date.parse(heartbeatAt)) {
    throw new Error('lease expiresAt must be after heartbeatAt');
  }
  return Object.freeze({
    ...lease,
    heartbeatAt,
    expiresAt,
  });
}

export function isLeaseExpired(lease: SessionLease, nowIso: string): boolean {
  assertIso(nowIso, 'now');
  return Date.parse(nowIso) >= Date.parse(lease.expiresAt);
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
