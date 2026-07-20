import type { PaperExecution } from './domain/paper-execution';
import type { PaperEventRecord } from './domain/paper-event';
import type { PaperSession } from './domain/paper-session';
import type { PaperTradingDomainEvent } from './paper-trading-events';

export const PAPER_TRADING_REPOSITORY = Symbol('PAPER_TRADING_REPOSITORY');

export interface PaperTradingRepository {
  createSession(session: PaperSession): Promise<PaperSession>;

  saveSession(session: PaperSession): Promise<PaperSession>;

  findSessionById(sessionId: string): Promise<PaperSession | null>;

  listSessionsByWorkspaceId(workspaceId: string): Promise<PaperSession[]>;

  deleteSession(sessionId: string): Promise<void>;

  createExecution(execution: PaperExecution): Promise<PaperExecution>;

  listExecutionsBySessionId(sessionId: string): Promise<PaperExecution[]>;

  appendEvent(event: PaperTradingDomainEvent, eventId: string): Promise<void>;

  listEventsBySessionId(sessionId: string): Promise<PaperEventRecord[]>;
}
