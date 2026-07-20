import type { ExecutionMode, RecoveryStatus, SessionState } from '../trading-session/domain';
import type { RunnerStatus } from '../paper-trading-runner';

/**
 * Immutable DTOs for the US190 Research API.
 */

export type CreateResearchSessionRequest = Readonly<{
  executionMode: ExecutionMode;
  strategyId: string;
  workspaceId: string;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type ResearchSessionResponse = Readonly<{
  sessionId: string;
  status: SessionState;
  runnerStatus: RunnerStatus;
  recoveryStatus: RecoveryStatus;
  executionMode: ExecutionMode;
  startedAt: string | null;
  stoppedAt: string | null;
  cycleNumber: number;
}>;

export type SessionSummary = Readonly<{
  sessionId: string;
  status: SessionState;
  executionMode: ExecutionMode;
}>;

export function createResearchSessionRequest(
  properties: CreateResearchSessionRequest,
): CreateResearchSessionRequest {
  const request: CreateResearchSessionRequest = {
    executionMode: properties.executionMode,
    strategyId: properties.strategyId,
    workspaceId: properties.workspaceId,
    ...(properties.metadata === undefined
      ? {}
      : { metadata: Object.freeze({ ...properties.metadata }) }),
  };
  return Object.freeze(request);
}

export function createResearchSessionResponse(
  properties: ResearchSessionResponse,
): ResearchSessionResponse {
  return Object.freeze({
    sessionId: properties.sessionId,
    status: properties.status,
    runnerStatus: properties.runnerStatus,
    recoveryStatus: properties.recoveryStatus,
    executionMode: properties.executionMode,
    startedAt: properties.startedAt,
    stoppedAt: properties.stoppedAt,
    cycleNumber: properties.cycleNumber,
  });
}

export function createSessionSummary(properties: SessionSummary): SessionSummary {
  return Object.freeze({
    sessionId: properties.sessionId,
    status: properties.status,
    executionMode: properties.executionMode,
  });
}
