import { resolveExchangeScopeId } from '../../exchange-scope';
import { createTacticalEnvelope, type TacticalEnvelope } from '../../tactical-envelope';
import type { SessionLease } from './session-lease';
import { isLeaseExpired } from './session-lease';
import { assertTransition } from './session-transitions';
import { TradingSessionStatus, TERMINAL_SESSION_STATUSES } from './trading-session-status';

export const TRADING_SESSION_SCHEMA_VERSION = 1;

export const TRADING_SESSION_ORIGINS = ['manual', 'strategy'] as const;

export type TradingSessionOrigin = (typeof TRADING_SESSION_ORIGINS)[number];

export function isTradingSessionOrigin(value: string): value is TradingSessionOrigin {
  return (TRADING_SESSION_ORIGINS as readonly string[]).includes(value);
}

export type TradingSession = Readonly<{
  id: string;
  workspaceId: string;
  paperAccountId: string;
  /** RC-19 Epic 1 — Exchange Scope identity (default Binance). */
  exchangeScopeId: string;
  /** Opaque immutable deployment reference; distinct from Session runtime (ADR-014). */
  deploymentId: string;
  /**
   * RC-19 Epic 3 — optional Tactical Envelope stub.
   * Exists but is not yet active: Runtime ignores this field.
   */
  tacticalEnvelope: TacticalEnvelope | null;
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
  /** Optional; defaults to Binance Exchange Scope (or caller's explicit id). */
  exchangeScopeId?: string;
  deploymentId: string;
  /** Optional; defaults to null (no envelope — current behaviour preserved). */
  tacticalEnvelope?: TacticalEnvelope | null;
  origin: TradingSessionOrigin;
  actorId: string;
  correlationId?: string;
  idempotencyKey: string;
  createdAt: string;
  recordedAt: string;
}>;

export function createTradingSession(input: CreateTradingSessionInput): TradingSession {
  if (!isTradingSessionOrigin(input.origin)) {
    throw new Error(`unsupported trading session origin: ${String(input.origin)}`);
  }
  assertIso(input.createdAt, 'createdAt');
  assertIso(input.recordedAt, 'recordedAt');
  return Object.freeze({
    id: required(input.id, 'session id'),
    workspaceId: required(input.workspaceId, 'workspace id'),
    paperAccountId: required(input.paperAccountId, 'paper account id'),
    exchangeScopeId: resolveExchangeScopeId(input.exchangeScopeId),
    deploymentId: required(input.deploymentId, 'deployment id'),
    tacticalEnvelope:
      input.tacticalEnvelope === undefined || input.tacticalEnvelope === null
        ? null
        : createTacticalEnvelope(input.tacticalEnvelope),
    origin: input.origin,
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
