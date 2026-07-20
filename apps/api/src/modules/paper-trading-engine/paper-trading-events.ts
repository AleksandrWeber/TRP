/**
 * Application events for US208 Paper Trading Engine.
 */

export const PAPER_TRADING_EVENT_TYPES = Object.freeze([
  'PaperSessionCreated',
  'PaperSessionStarted',
  'PaperSessionPaused',
  'PaperSessionStopped',
  'PaperTradeExecuted',
  'PaperSessionCompleted',
  'PaperSessionArchived',
] as const);

export type PaperTradingEventType = (typeof PAPER_TRADING_EVENT_TYPES)[number];

type PaperEventBase<Type extends PaperTradingEventType> = Readonly<{
  eventType: Type;
  sessionId: string;
  occurredAt: string;
}>;

export type PaperSessionCreatedEvent = PaperEventBase<'PaperSessionCreated'> &
  Readonly<{
    name: string;
    portfolioId: string;
    initialBalance: string;
  }>;

export type PaperSessionStartedEvent = PaperEventBase<'PaperSessionStarted'> &
  Readonly<{
    status: string;
  }>;

export type PaperSessionPausedEvent = PaperEventBase<'PaperSessionPaused'> &
  Readonly<{
    status: string;
  }>;

export type PaperSessionStoppedEvent = PaperEventBase<'PaperSessionStopped'> &
  Readonly<{
    status: string;
  }>;

export type PaperTradeExecutedEvent = PaperEventBase<'PaperTradeExecuted'> &
  Readonly<{
    orderId: string;
    executionId: string;
    executionPrice: string;
    slippage: string;
    commission: string;
  }>;

export type PaperSessionCompletedEvent = PaperEventBase<'PaperSessionCompleted'> &
  Readonly<{
    status: string;
    currentBalance: string;
  }>;

export type PaperSessionArchivedEvent = PaperEventBase<'PaperSessionArchived'> &
  Readonly<{
    status: string;
  }>;

export type PaperTradingDomainEvent =
  | PaperSessionCreatedEvent
  | PaperSessionStartedEvent
  | PaperSessionPausedEvent
  | PaperSessionStoppedEvent
  | PaperTradeExecutedEvent
  | PaperSessionCompletedEvent
  | PaperSessionArchivedEvent;
