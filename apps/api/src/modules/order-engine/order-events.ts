/**
 * Application events for US206 Order Lifecycle Engine.
 * Persisted via OrderEventPublisher; also collected in-memory for tests.
 */

export const ORDER_EVENT_TYPES = Object.freeze([
  'OrderCreated',
  'OrderValidated',
  'OrderSubmitted',
  'OrderPartiallyFilled',
  'OrderFilled',
  'OrderCancelled',
  'OrderExpired',
  'OrderRejected',
  'OrderUpdated',
  'OrderHistoryCreated',
] as const);

export type OrderEventType = (typeof ORDER_EVENT_TYPES)[number];

type OrderEventBase<Type extends OrderEventType> = Readonly<{
  eventType: Type;
  orderId: string;
  occurredAt: string;
}>;

export type OrderCreatedEvent = OrderEventBase<'OrderCreated'> &
  Readonly<{
    portfolioId: string;
    symbol: string;
    side: string;
    type: string;
    quantity: string;
  }>;

export type OrderValidatedEvent = OrderEventBase<'OrderValidated'> &
  Readonly<{
    status: string;
  }>;

export type OrderSubmittedEvent = OrderEventBase<'OrderSubmitted'> &
  Readonly<{
    status: string;
  }>;

export type OrderPartiallyFilledEvent = OrderEventBase<'OrderPartiallyFilled'> &
  Readonly<{
    fillQuantity: string;
    fillPrice: string;
    filledQuantity: string;
    remainingQuantity: string;
  }>;

export type OrderFilledEvent = OrderEventBase<'OrderFilled'> &
  Readonly<{
    fillQuantity: string;
    fillPrice: string;
    executedPrice: string;
    filledQuantity: string;
  }>;

export type OrderCancelledEvent = OrderEventBase<'OrderCancelled'> &
  Readonly<{
    reason: string;
  }>;

export type OrderExpiredEvent = OrderEventBase<'OrderExpired'> &
  Readonly<{
    reason: string;
  }>;

export type OrderRejectedEvent = OrderEventBase<'OrderRejected'> &
  Readonly<{
    reason: string;
  }>;

export type OrderUpdatedEvent = OrderEventBase<'OrderUpdated'> &
  Readonly<{
    status: string;
    filledQuantity: string;
    remainingQuantity: string;
  }>;

export type OrderHistoryCreatedEvent = OrderEventBase<'OrderHistoryCreated'> &
  Readonly<{
    previousStatus: string;
    currentStatus: string;
    reason: string;
  }>;

export type OrderDomainEvent =
  | OrderCreatedEvent
  | OrderValidatedEvent
  | OrderSubmittedEvent
  | OrderPartiallyFilledEvent
  | OrderFilledEvent
  | OrderCancelledEvent
  | OrderExpiredEvent
  | OrderRejectedEvent
  | OrderUpdatedEvent
  | OrderHistoryCreatedEvent;
