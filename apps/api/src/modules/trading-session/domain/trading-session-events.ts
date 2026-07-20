import type { ExecutionMode, RecoveryStatus, SessionState } from './trading-session-aggregate';
import type { RuntimeLeaseProperties } from './runtime-lease';

type TradingSessionEvent<Type extends string> = Readonly<{
  eventType: Type;
  sessionId: string;
  workspaceId: string;
  occurredAt: string;
  metadataVersion: number;
}>;

export type TradingSessionCreated = TradingSessionEvent<'TradingSessionCreated'> &
  Readonly<{
    deploymentId: string;
    strategyId: string;
    executionMode: ExecutionMode;
    currentState: SessionState.CREATED;
  }>;

export type TradingSessionStarted = TradingSessionEvent<'TradingSessionStarted'> &
  Readonly<{
    startedAt: string;
    currentState: SessionState.RUNNING;
  }>;

export type TradingSessionPaused = TradingSessionEvent<'TradingSessionPaused'> &
  Readonly<{
    pausedAt: string;
    currentState: SessionState.PAUSED;
  }>;

export type TradingSessionResumed = TradingSessionEvent<'TradingSessionResumed'> &
  Readonly<{
    resumedAt: string;
    currentState: SessionState.RUNNING;
  }>;

export type TradingSessionStopped = TradingSessionEvent<'TradingSessionStopped'> &
  Readonly<{
    stoppedAt: string;
    currentState: SessionState.STOPPED;
  }>;

export type TradingSessionFailed = TradingSessionEvent<'TradingSessionFailed'> &
  Readonly<{
    failedAt: string;
    reason: string;
    currentState: SessionState.FAILED;
  }>;

type RuntimeLeaseEvent<Type extends string> = TradingSessionEvent<Type> &
  Readonly<{
    lease: RuntimeLeaseProperties;
  }>;

export type RuntimeLeaseAcquired = RuntimeLeaseEvent<'RuntimeLeaseAcquired'>;

export type RuntimeLeaseReleased = RuntimeLeaseEvent<'RuntimeLeaseReleased'> &
  Readonly<{
    releasedAt: string;
  }>;

export type RuntimeLeaseExpired = RuntimeLeaseEvent<'RuntimeLeaseExpired'> &
  Readonly<{
    expiredAt: string;
  }>;

export type RuntimeHeartbeatReceived = RuntimeLeaseEvent<'RuntimeHeartbeatReceived'> &
  Readonly<{
    heartbeatAt: string;
  }>;

export type RuntimeHeartbeatExpired = RuntimeLeaseEvent<'RuntimeHeartbeatExpired'> &
  Readonly<{
    lastHeartbeatAt: string;
    expiredAt: string;
  }>;

type TradingSessionRecoveryEvent<Type extends string> = TradingSessionEvent<Type> &
  Readonly<{
    recoveryId: string;
    recoveryAttempt: number;
  }>;

export type TradingSessionRecoveryStarted =
  TradingSessionRecoveryEvent<'TradingSessionRecoveryStarted'> &
    Readonly<{
      recoveryStartedAt: string;
      recoveryStatus: RecoveryStatus.RECOVERING;
    }>;

export type TradingSessionRecoveryCompleted =
  TradingSessionRecoveryEvent<'TradingSessionRecoveryCompleted'> &
    Readonly<{
      recoveryCompletedAt: string;
      recoveryStatus: RecoveryStatus.RECOVERED;
    }>;

export type TradingSessionRecoveryFailed =
  TradingSessionRecoveryEvent<'TradingSessionRecoveryFailed'> &
    Readonly<{
      recoveryFailedAt: string;
      reason: string;
      recoveryStatus: RecoveryStatus.FAILED;
    }>;

export type TradingSessionRecoverySkipped = TradingSessionEvent<'TradingSessionRecoverySkipped'> &
  Readonly<{
    reason: string;
    recoveryStatus: RecoveryStatus.NOT_REQUIRED;
  }>;

export type TradingSessionDomainEvent =
  | TradingSessionCreated
  | TradingSessionStarted
  | TradingSessionPaused
  | TradingSessionResumed
  | TradingSessionStopped
  | TradingSessionFailed
  | RuntimeLeaseAcquired
  | RuntimeLeaseReleased
  | RuntimeLeaseExpired
  | RuntimeHeartbeatReceived
  | RuntimeHeartbeatExpired
  | TradingSessionRecoveryStarted
  | TradingSessionRecoveryCompleted
  | TradingSessionRecoveryFailed
  | TradingSessionRecoverySkipped;
