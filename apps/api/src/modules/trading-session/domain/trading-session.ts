import type { SessionLease } from './session-lease';
import { isLeaseExpired } from './session-lease';
import { assertTransition } from './session-transitions';
import { TradingSessionStatus, TERMINAL_SESSION_STATUSES } from './trading-session-status';

export const TRADING_SESSION_SCHEMA_VERSION = 1;

export type TradingSessionOrigin = 'manual';

export type TradingSession = Readonly<{
  id: string;
  workspaceId: string;
  paperAccountId: string;
  /** Opaque immutable deployment reference; distinct from Session runtime (ADR-014). */
  deploymentId: string;
  origin: TradingSessionOrigin;
  status: TradingSessionStatus;
  lease: SessionLease | null;
  /** Last fencing generation released; used to mint the next lease token. */
  lastFencingToken: number;
  version: number;
  failureReason: string | null;
  createdAt: string;
  recordedAt: string;
  actorId: string;
  correlationId: string | null;
  idempotencyKey: string;
}>;

export type CreateTradingSessionInput = Readonly<{
  id: string;
  workspaceId: string;
  paperAccountId: string;
  deploymentId: string;
  origin: TradingSessionOrigin;
  actorId: string;
  correlationId?: string;
  idempotencyKey: string;
  createdAt: string;
  recordedAt: string;
}>;

export function createTradingSession(input: CreateTradingSessionInput): TradingSession {
  if (input.origin !== 'manual') {
    throw new Error('trading session origin must be manual for M2');
  }
  assertIso(input.createdAt, 'createdAt');
  assertIso(input.recordedAt, 'recordedAt');
  return Object.freeze({
    id: required(input.id, 'session id'),
    workspaceId: required(input.workspaceId, 'workspace id'),
    paperAccountId: required(input.paperAccountId, 'paper account id'),
    deploymentId: required(input.deploymentId, 'deployment id'),
    origin: 'manual',
    status: TradingSessionStatus.CREATED,
    lease: null,
    lastFencingToken: 0,
    version: 1,
    failureReason: null,
    createdAt: input.createdAt,
    recordedAt: input.recordedAt,
    actorId: required(input.actorId, 'actor id'),
    correlationId: input.correlationId?.trim() ? input.correlationId.trim() : null,
    idempotencyKey: required(input.idempotencyKey, 'idempotency key'),
  });
}

export function transitionSession(
  session: TradingSession,
  to: TradingSessionStatus,
  recordedAt: string,
  options: { failureReason?: string | null } = {},
): TradingSession {
  assertTransition(session.status, to);
  assertIso(recordedAt, 'recordedAt');
  if (TERMINAL_SESSION_STATUSES.has(session.status)) {
    throw new Error(`trading session is terminal: ${session.status}`);
  }
  return Object.freeze({
    ...session,
    status: to,
    version: session.version + 1,
    recordedAt,
    failureReason:
      to === TradingSessionStatus.FAILED
        ? required(options.failureReason ?? '', 'failure reason')
        : options.failureReason === undefined
          ? session.failureReason
          : options.failureReason,
  });
}

export function attachLease(session: TradingSession, lease: SessionLease): TradingSession {
  return Object.freeze({
    ...session,
    lease,
    lastFencingToken: lease.fencingToken,
  });
}

export function clearLease(session: TradingSession): TradingSession {
  return Object.freeze({
    ...session,
    lease: null,
  });
}

export function replaceLeaseHeartbeat(
  session: TradingSession,
  lease: SessionLease,
  recordedAt: string,
): TradingSession {
  assertIso(recordedAt, 'recordedAt');
  return Object.freeze({
    ...session,
    lease,
    recordedAt,
    version: session.version + 1,
  });
}

export function assertLeaseCurrent(
  session: TradingSession,
  fencingToken: number,
  nowIso: string,
): SessionLease {
  if (session.lease === null) {
    throw new Error('trading session has no active lease');
  }
  if (session.lease.fencingToken !== fencingToken) {
    throw new Error('stale fencing token rejected');
  }
  if (isLeaseExpired(session.lease, nowIso)) {
    throw new Error('lease expired');
  }
  return session.lease;
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
