import type { LiveEventRecord } from './domain/live-event';
import type { LiveSession } from './domain/live-session';
import type { SynchronizationLog } from './domain/synchronization-log';
import type { LiveTradingDomainEvent } from './live-trading-events';

export const LIVE_TRADING_REPOSITORY = Symbol('LIVE_TRADING_REPOSITORY');

export interface LiveTradingRepository {
  createSession(session: LiveSession): Promise<LiveSession>;

  saveSession(session: LiveSession): Promise<LiveSession>;

  findSessionById(sessionId: string): Promise<LiveSession | null>;

  listSessionsByWorkspaceId(workspaceId: string): Promise<LiveSession[]>;

  findActiveSessionByAccountId(workspaceId: string, accountId: string): Promise<LiveSession | null>;

  deleteSession(sessionId: string): Promise<void>;

  appendEvent(event: LiveTradingDomainEvent, eventId: string): Promise<void>;

  listEventsBySessionId(sessionId: string): Promise<LiveEventRecord[]>;

  createSynchronizationLog(log: SynchronizationLog): Promise<SynchronizationLog>;

  saveSynchronizationLog(log: SynchronizationLog): Promise<SynchronizationLog>;

  listSynchronizationLogsBySessionId(sessionId: string): Promise<SynchronizationLog[]>;

  listSynchronizationLogsByWorkspaceId(workspaceId: string): Promise<SynchronizationLog[]>;

  /** Track processed exchange execution IDs to prevent duplicates. */
  hasProcessedExecution(sessionId: string, executionId: string): Promise<boolean>;

  markExecutionProcessed(sessionId: string, executionId: string): Promise<void>;
}
