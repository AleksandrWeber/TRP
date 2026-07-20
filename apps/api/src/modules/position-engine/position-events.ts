/**
 * Application events for US205 Position Engine.
 * Persisted via PositionEventPublisher; also collected in-memory for tests.
 */

export const POSITION_EVENT_TYPES = Object.freeze([
  'PositionOpened',
  'PositionIncreased',
  'PositionReduced',
  'PositionClosed',
  'PositionUpdated',
  'PositionMarked',
  'PnLUpdated',
] as const);

export type PositionEventType = (typeof POSITION_EVENT_TYPES)[number];

type PositionEventBase<Type extends PositionEventType> = Readonly<{
  eventType: Type;
  positionId: string;
  occurredAt: string;
}>;

export type PositionOpenedEvent = PositionEventBase<'PositionOpened'> &
  Readonly<{
    portfolioId: string;
    symbol: string;
    side: string;
    quantity: string;
    entryPrice: string;
  }>;

export type PositionIncreasedEvent = PositionEventBase<'PositionIncreased'> &
  Readonly<{
    quantity: string;
    price: string;
    averageEntryPrice: string;
  }>;

export type PositionReducedEvent = PositionEventBase<'PositionReduced'> &
  Readonly<{
    quantity: string;
    price: string;
    remainingQuantity: string;
    realizedPnL: string;
  }>;

export type PositionClosedEvent = PositionEventBase<'PositionClosed'> &
  Readonly<{
    price: string;
    realizedPnL: string;
  }>;

export type PositionUpdatedEvent = PositionEventBase<'PositionUpdated'> &
  Readonly<{
    status: string;
    quantity: string;
  }>;

export type PositionMarkedEvent = PositionEventBase<'PositionMarked'> &
  Readonly<{
    markPrice: string;
    unrealizedPnL: string;
  }>;

export type PnLUpdatedEvent = PositionEventBase<'PnLUpdated'> &
  Readonly<{
    realizedPnL: string;
    unrealizedPnL: string;
  }>;

export type PositionDomainEvent =
  | PositionOpenedEvent
  | PositionIncreasedEvent
  | PositionReducedEvent
  | PositionClosedEvent
  | PositionUpdatedEvent
  | PositionMarkedEvent
  | PnLUpdatedEvent;
