import { TradingSession, type TradingSessionProperties } from '../trading-session/domain';
import { PaperTradingRunner, RunnerStatus } from '../paper-trading-runner';
import {
  createResearchSessionResponse,
  createSessionSummary,
  type ResearchSessionResponse,
  type SessionSummary,
} from './research-session.dto';
import type { ResearchSessionRecord } from './research-session.repository';

/**
 * Maps TradingSessionAggregate (+ optional runner) to Research API DTOs.
 * Never returns the aggregate itself.
 */
export class ResearchSessionMapper {
  toResponse(
    session: TradingSession,
    runner: PaperTradingRunner | null = null,
  ): ResearchSessionResponse {
    return createResearchSessionResponse({
      sessionId: session.sessionId,
      status: session.currentState(),
      runnerStatus: runner?.status() ?? RunnerStatus.CREATED,
      recoveryStatus: session.recoveryStatus(),
      executionMode: session.executionMode,
      startedAt: runner?.startedAt() ?? session.startedAt,
      stoppedAt: runner?.stoppedAt() ?? session.stoppedAt,
      cycleNumber: runner?.cycleNumber() ?? 0,
    });
  }

  toSummary(session: TradingSession): SessionSummary {
    return createSessionSummary({
      sessionId: session.sessionId,
      status: session.currentState(),
      executionMode: session.executionMode,
    });
  }

  toRecord(
    session: TradingSession,
    metadata: Readonly<Record<string, unknown>> | null,
  ): ResearchSessionRecord {
    return Object.freeze({
      sessionId: session.sessionId,
      workspaceId: session.workspaceId,
      strategyId: session.strategyId,
      executionMode: session.executionMode,
      metadata: metadata === null ? null : Object.freeze({ ...metadata }),
      tradingSession: session.toProperties(),
    });
  }

  toAggregate(record: ResearchSessionRecord): TradingSession {
    return TradingSession.restore(record.tradingSession as TradingSessionProperties);
  }
}
