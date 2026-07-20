import type { ExecutionMode, TradingSessionProperties } from '../trading-session/domain';

/**
 * Persistence-agnostic contract for research sessions (US190).
 * Implementations belong to a later infrastructure story.
 */
export type ResearchSessionRecord = Readonly<{
  sessionId: string;
  workspaceId: string;
  strategyId: string;
  executionMode: ExecutionMode;
  metadata: Readonly<Record<string, unknown>> | null;
  tradingSession: TradingSessionProperties;
}>;

export interface ResearchSessionRepository {
  save(record: ResearchSessionRecord): Promise<void>;
  findById(sessionId: string): Promise<ResearchSessionRecord | null>;
  findAll(): Promise<readonly ResearchSessionRecord[]>;
  delete(sessionId: string): Promise<void>;
}
