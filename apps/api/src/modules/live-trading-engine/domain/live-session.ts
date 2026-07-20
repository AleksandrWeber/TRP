import {
  assertLiveSessionStatus,
  isActiveLiveSessionStatus,
  isTerminalLiveSessionStatus,
  type LiveSessionStatus,
} from './session-status';
import { assertSynchronizationState, type SynchronizationState } from './synchronization-state';

/**
 * LiveSession aggregate root (US210).
 * Orchestration only — Trading Core mutations go through Order/Risk/Position/Portfolio.
 */
export type LiveSession = Readonly<{
  id: string;
  workspaceId: string;
  ownerId: string;
  portfolioId: string;
  portfolioWorkspaceKey: string;
  exchange: string;
  accountId: string;
  status: LiveSessionStatus;
  startedAt: string | null;
  stoppedAt: string | null;
  lastHeartbeat: string | null;
  reconnectCount: number;
  synchronizationState: SynchronizationState;
  /** Kill-switch freeze — blocks new orders independent of exchange connectivity. */
  tradingFrozen: boolean;
  createdAt: string;
  updatedAt: string;
}>;

export type CreateLiveSessionInput = Readonly<{
  id: string;
  workspaceId: string;
  ownerId: string;
  portfolioId: string;
  portfolioWorkspaceKey: string;
  exchange: string;
  accountId: string;
  createdAt: string;
  updatedAt: string;
}>;

export function createLiveSession(input: CreateLiveSessionInput): LiveSession {
  const id = required(input.id, 'session id');
  const workspaceId = required(input.workspaceId, 'workspace id');
  const ownerId = required(input.ownerId, 'owner id');
  const portfolioId = required(input.portfolioId, 'portfolio id');
  const portfolioWorkspaceKey = required(input.portfolioWorkspaceKey, 'portfolio workspace key');
  const exchange = required(input.exchange, 'exchange').toUpperCase();
  const accountId = required(input.accountId, 'account id');
  assertIso(input.createdAt, 'createdAt');
  assertIso(input.updatedAt, 'updatedAt');

  return Object.freeze({
    id,
    workspaceId,
    ownerId,
    portfolioId,
    portfolioWorkspaceKey,
    exchange,
    accountId,
    status: 'CREATED' as const,
    startedAt: null,
    stoppedAt: null,
    lastHeartbeat: null,
    reconnectCount: 0,
    synchronizationState: 'SYNCED' as const,
    tradingFrozen: false,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  });
}

export function beginConnecting(session: LiveSession, now: string): LiveSession {
  assertIso(now, 'now');
  if (session.status !== 'CREATED' && session.status !== 'STOPPED' && session.status !== 'FAILED') {
    throw new Error(`live session cannot connect from ${session.status}`);
  }
  return Object.freeze({
    ...session,
    status: 'CONNECTING' as const,
    stoppedAt: null,
    updatedAt: now,
  });
}

export function markConnected(session: LiveSession, now: string): LiveSession {
  assertIso(now, 'now');
  if (session.status !== 'CONNECTING' && session.status !== 'RECONNECTING') {
    throw new Error(`live session cannot mark connected from ${session.status}`);
  }
  return Object.freeze({
    ...session,
    status: 'CONNECTED' as const,
    lastHeartbeat: now,
    updatedAt: now,
  });
}

export function startLiveSession(session: LiveSession, now: string): LiveSession {
  assertIso(now, 'now');
  if (
    session.status !== 'CONNECTED' &&
    session.status !== 'PAUSED' &&
    session.status !== 'CREATED'
  ) {
    throw new Error(`live session cannot start from ${session.status}`);
  }
  return Object.freeze({
    ...session,
    status: 'RUNNING' as const,
    startedAt: session.startedAt ?? now,
    stoppedAt: null,
    lastHeartbeat: now,
    updatedAt: now,
  });
}

export function pauseLiveSession(session: LiveSession, now: string): LiveSession {
  assertIso(now, 'now');
  if (session.status !== 'RUNNING') {
    throw new Error(`live session cannot pause from ${session.status}`);
  }
  return Object.freeze({
    ...session,
    status: 'PAUSED' as const,
    updatedAt: now,
  });
}

export function resumeLiveSession(session: LiveSession, now: string): LiveSession {
  assertIso(now, 'now');
  if (session.status !== 'PAUSED') {
    throw new Error(`live session cannot resume from ${session.status}`);
  }
  return Object.freeze({
    ...session,
    status: 'RUNNING' as const,
    lastHeartbeat: now,
    updatedAt: now,
  });
}

export function beginReconnecting(session: LiveSession, now: string): LiveSession {
  assertIso(now, 'now');
  if (!isActiveLiveSessionStatus(session.status) || session.status === 'RECONNECTING') {
    if (session.status === 'RECONNECTING') {
      throw new Error('live session is already reconnecting');
    }
    throw new Error(`live session cannot reconnect from ${session.status}`);
  }
  return Object.freeze({
    ...session,
    status: 'RECONNECTING' as const,
    reconnectCount: session.reconnectCount + 1,
    updatedAt: now,
  });
}

export function stopLiveSession(session: LiveSession, now: string): LiveSession {
  assertIso(now, 'now');
  if (isTerminalLiveSessionStatus(session.status)) {
    throw new Error(`live session cannot stop from ${session.status}`);
  }
  return Object.freeze({
    ...session,
    status: 'STOPPED' as const,
    stoppedAt: now,
    updatedAt: now,
  });
}

export function failLiveSession(session: LiveSession, now: string): LiveSession {
  assertIso(now, 'now');
  if (session.status === 'ARCHIVED') {
    throw new Error('archived live session cannot fail');
  }
  return Object.freeze({
    ...session,
    status: 'FAILED' as const,
    stoppedAt: session.stoppedAt ?? now,
    updatedAt: now,
  });
}

export function archiveLiveSession(session: LiveSession, now: string): LiveSession {
  assertIso(now, 'now');
  if (session.status === 'ARCHIVED') {
    throw new Error('live session is already archived');
  }
  if (isActiveLiveSessionStatus(session.status)) {
    throw new Error('active live session cannot be archived; stop it first');
  }
  return Object.freeze({
    ...session,
    status: 'ARCHIVED' as const,
    stoppedAt: session.stoppedAt ?? now,
    updatedAt: now,
  });
}

export function withHeartbeat(session: LiveSession, now: string): LiveSession {
  assertIso(now, 'now');
  if (isTerminalLiveSessionStatus(session.status)) {
    throw new Error(`cannot heartbeat session in status ${session.status}`);
  }
  return Object.freeze({
    ...session,
    lastHeartbeat: now,
    updatedAt: now,
  });
}

export function withSynchronizationState(
  session: LiveSession,
  synchronizationState: SynchronizationState,
  now: string,
): LiveSession {
  assertIso(now, 'now');
  assertSynchronizationState(synchronizationState);
  return Object.freeze({
    ...session,
    synchronizationState,
    updatedAt: now,
  });
}

export function freezeTrading(session: LiveSession, now: string): LiveSession {
  assertIso(now, 'now');
  return Object.freeze({
    ...session,
    tradingFrozen: true,
    updatedAt: now,
  });
}

export function unfreezeTrading(session: LiveSession, now: string): LiveSession {
  assertIso(now, 'now');
  return Object.freeze({
    ...session,
    tradingFrozen: false,
    updatedAt: now,
  });
}

export function rehydrateLiveSession(row: {
  id: string;
  workspaceId: string;
  ownerId: string;
  portfolioId: string;
  portfolioWorkspaceKey: string;
  exchange: string;
  accountId: string;
  status: string;
  startedAt: string | null;
  stoppedAt: string | null;
  lastHeartbeat: string | null;
  reconnectCount: number;
  synchronizationState: string;
  tradingFrozen?: boolean;
  createdAt: string;
  updatedAt: string;
}): LiveSession {
  if (!Number.isInteger(row.reconnectCount) || row.reconnectCount < 0) {
    throw new Error('reconnectCount must be a non-negative integer');
  }
  return Object.freeze({
    id: row.id,
    workspaceId: row.workspaceId,
    ownerId: row.ownerId,
    portfolioId: row.portfolioId,
    portfolioWorkspaceKey: row.portfolioWorkspaceKey,
    exchange: required(row.exchange, 'exchange').toUpperCase(),
    accountId: required(row.accountId, 'account id'),
    status: assertLiveSessionStatus(row.status),
    startedAt: row.startedAt,
    stoppedAt: row.stoppedAt,
    lastHeartbeat: row.lastHeartbeat,
    reconnectCount: row.reconnectCount,
    synchronizationState: assertSynchronizationState(row.synchronizationState),
    tradingFrozen: row.tradingFrozen === true,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function liveSessionPortfolioWorkspaceKey(sessionId: string): string {
  return `live-session:${required(sessionId, 'session id')}`;
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
