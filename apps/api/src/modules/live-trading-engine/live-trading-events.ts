/**
 * Application events for US210 Live Trading Workspace.
 */

export const LIVE_TRADING_EVENT_TYPES = Object.freeze([
  'LiveSessionStarted',
  'LiveSessionStopped',
  'LiveSessionRecovered',
  'LiveSessionPaused',
  'LiveSessionResumed',
  'LiveSessionCreated',
  'LiveOrderSubmitted',
  'LiveOrderFilled',
  'SynchronizationStarted',
  'SynchronizationCompleted',
  'SynchronizationFailed',
  'RecoveryStarted',
  'RecoveryCompleted',
  'HeartbeatLost',
  'HeartbeatRestored',
  'KillSwitchActivated',
  'TradingFrozen',
  'KillSwitchCleared',
] as const);

export type LiveTradingEventType = (typeof LIVE_TRADING_EVENT_TYPES)[number];

type LiveEventBase<Type extends LiveTradingEventType> = Readonly<{
  eventType: Type;
  sessionId: string;
  occurredAt: string;
}>;

export type LiveSessionCreatedEvent = LiveEventBase<'LiveSessionCreated'> &
  Readonly<{
    exchange: string;
    accountId: string;
    portfolioId: string;
  }>;

export type LiveSessionStartedEvent = LiveEventBase<'LiveSessionStarted'> &
  Readonly<{
    status: string;
    exchange: string;
  }>;

export type LiveSessionStoppedEvent = LiveEventBase<'LiveSessionStopped'> &
  Readonly<{
    status: string;
  }>;

export type LiveSessionPausedEvent = LiveEventBase<'LiveSessionPaused'> &
  Readonly<{
    status: string;
  }>;

export type LiveSessionResumedEvent = LiveEventBase<'LiveSessionResumed'> &
  Readonly<{
    status: string;
  }>;

export type LiveSessionRecoveredEvent = LiveEventBase<'LiveSessionRecovered'> &
  Readonly<{
    status: string;
    reconnectCount: number;
  }>;

export type LiveOrderSubmittedEvent = LiveEventBase<'LiveOrderSubmitted'> &
  Readonly<{
    orderId: string;
    exchangeOrderId: string | null;
    symbol: string;
  }>;

export type LiveOrderFilledEvent = LiveEventBase<'LiveOrderFilled'> &
  Readonly<{
    orderId: string;
    exchangeOrderId: string;
    executionId: string;
    price: string;
    quantity: string;
  }>;

export type SynchronizationStartedEvent = LiveEventBase<'SynchronizationStarted'> &
  Readonly<{
    synchronizationState: string;
  }>;

export type SynchronizationCompletedEvent = LiveEventBase<'SynchronizationCompleted'> &
  Readonly<{
    synchronizationState: string;
    inconsistencyCount: number;
  }>;

export type SynchronizationFailedEvent = LiveEventBase<'SynchronizationFailed'> &
  Readonly<{
    reason: string;
  }>;

export type RecoveryStartedEvent = LiveEventBase<'RecoveryStarted'> &
  Readonly<{
    reconnectCount: number;
  }>;

export type RecoveryCompletedEvent = LiveEventBase<'RecoveryCompleted'> &
  Readonly<{
    status: string;
    replayedExecutions: number;
  }>;

export type HeartbeatLostEvent = LiveEventBase<'HeartbeatLost'> &
  Readonly<{
    lastHeartbeat: string | null;
  }>;

export type HeartbeatRestoredEvent = LiveEventBase<'HeartbeatRestored'> &
  Readonly<{
    lastHeartbeat: string;
  }>;

export type KillSwitchActivatedEvent = LiveEventBase<'KillSwitchActivated'> &
  Readonly<{
    cancelledOrders: number;
    closedPositions: number;
    strategyDisabled: boolean;
    tradingFrozen: boolean;
    closePositions: boolean;
  }>;

export type TradingFrozenEvent = LiveEventBase<'TradingFrozen'> &
  Readonly<{
    tradingFrozen: true;
  }>;

export type KillSwitchClearedEvent = LiveEventBase<'KillSwitchCleared'> &
  Readonly<{
    tradingFrozen: false;
  }>;

export type LiveTradingDomainEvent =
  | LiveSessionCreatedEvent
  | LiveSessionStartedEvent
  | LiveSessionStoppedEvent
  | LiveSessionPausedEvent
  | LiveSessionResumedEvent
  | LiveSessionRecoveredEvent
  | LiveOrderSubmittedEvent
  | LiveOrderFilledEvent
  | SynchronizationStartedEvent
  | SynchronizationCompletedEvent
  | SynchronizationFailedEvent
  | RecoveryStartedEvent
  | RecoveryCompletedEvent
  | HeartbeatLostEvent
  | HeartbeatRestoredEvent
  | KillSwitchActivatedEvent
  | TradingFrozenEvent
  | KillSwitchClearedEvent;
