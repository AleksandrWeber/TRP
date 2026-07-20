import type { ExchangeCapabilities } from './domain/exchange-capabilities';
import type { ExchangeId } from './domain/exchange-id';
import type { ExchangeOrderSnapshot } from './domain/exchange-order';
import type {
  ExchangeBalance,
  ExchangeExecution,
  ExchangePosition,
  ExchangeTicker,
} from './domain/exchange-market';

/**
 * Exchange Adapter domain events (US209).
 * Adapters emit events only — never mutate Portfolio / Position / Order / Risk.
 */
export const EXCHANGE_EVENT_TYPES = Object.freeze([
  'ExchangeConnected',
  'ExchangeDisconnected',
  'OrderAccepted',
  'OrderRejected',
  'OrderFilled',
  'OrderCancelled',
  'ExecutionReceived',
  'BalanceUpdated',
  'PositionUpdated',
  'TickerUpdated',
  'HeartbeatReceived',
] as const);

export type ExchangeEventType = (typeof EXCHANGE_EVENT_TYPES)[number];

type ExchangeEventBase<Type extends ExchangeEventType> = Readonly<{
  eventType: Type;
  connectionId: string;
  exchangeId: ExchangeId;
  occurredAt: string;
}>;

export type ExchangeConnectedEvent = ExchangeEventBase<'ExchangeConnected'> &
  Readonly<{
    capabilities: ExchangeCapabilities;
  }>;

export type ExchangeDisconnectedEvent = ExchangeEventBase<'ExchangeDisconnected'> &
  Readonly<{
    reason: string | null;
  }>;

export type OrderAcceptedEvent = ExchangeEventBase<'OrderAccepted'> &
  Readonly<{
    order: ExchangeOrderSnapshot;
  }>;

export type OrderRejectedEvent = ExchangeEventBase<'OrderRejected'> &
  Readonly<{
    clientOrderId: string;
    reason: string;
  }>;

export type OrderFilledEvent = ExchangeEventBase<'OrderFilled'> &
  Readonly<{
    order: ExchangeOrderSnapshot;
  }>;

export type OrderCancelledEvent = ExchangeEventBase<'OrderCancelled'> &
  Readonly<{
    order: ExchangeOrderSnapshot;
  }>;

export type ExecutionReceivedEvent = ExchangeEventBase<'ExecutionReceived'> &
  Readonly<{
    execution: ExchangeExecution;
  }>;

export type BalanceUpdatedEvent = ExchangeEventBase<'BalanceUpdated'> &
  Readonly<{
    balances: readonly ExchangeBalance[];
  }>;

export type PositionUpdatedEvent = ExchangeEventBase<'PositionUpdated'> &
  Readonly<{
    positions: readonly ExchangePosition[];
  }>;

export type TickerUpdatedEvent = ExchangeEventBase<'TickerUpdated'> &
  Readonly<{
    ticker: ExchangeTicker;
  }>;

export type HeartbeatReceivedEvent = ExchangeEventBase<'HeartbeatReceived'> &
  Readonly<{
    latencyMs: number;
  }>;

export type ExchangeDomainEvent =
  | ExchangeConnectedEvent
  | ExchangeDisconnectedEvent
  | OrderAcceptedEvent
  | OrderRejectedEvent
  | OrderFilledEvent
  | OrderCancelledEvent
  | ExecutionReceivedEvent
  | BalanceUpdatedEvent
  | PositionUpdatedEvent
  | TickerUpdatedEvent
  | HeartbeatReceivedEvent;
