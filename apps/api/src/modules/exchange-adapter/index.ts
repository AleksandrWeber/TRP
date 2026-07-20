export { ExchangeAdapterModule } from './exchange-adapter.module';
export { ExchangeAdapterController } from './exchange-adapter.controller';
export {
  ExchangeAdapterService,
  type ExchangeView,
  type ExchangeConnectionView,
  type ExchangeStatusView,
} from './exchange-adapter.service';
export { ExchangeManager, type ExchangeClock } from './exchange-manager';
export { ExchangeRegistry, type RegisteredAdapter } from './exchange-registry';
export { ExchangeFactory } from './exchange-factory';
export { ExchangeRouter } from './exchange-router';
export { ExchangeEventPublisher } from './exchange-event-publisher';
export {
  EXCHANGE_ADAPTER_REPOSITORY,
  type ExchangeAdapterRepository,
} from './exchange-adapter.repository';
export { PrismaExchangeAdapterRepository } from './prisma-exchange-adapter.repository';
export type { ExchangeAdapter } from './exchange-adapter.port';
export { MockExchangeAdapter, mockClientOrderId } from './adapters/mock.adapter';
export {
  BinanceExchangeAdapter,
  BybitExchangeAdapter,
  OkxExchangeAdapter,
  VenueExchangeAdapter,
} from './adapters/venue.adapters';
export {
  ExchangeAdapterError,
  ExchangeNotFoundError,
  ExchangeNotConnectedError,
  ExchangeAlreadyConnectedError,
  ExchangeConnectionFailedError,
  ExchangeOrderRejectedError,
  ExchangeOrderNotFoundError,
  ExchangeValidationError,
  ExchangeUnsupportedCapabilityError,
  ExchangeAdapterInternalError,
} from './exchange-adapter-errors';
export {
  EXCHANGE_EVENT_TYPES,
  type ExchangeDomainEvent,
  type ExchangeEventType,
} from './exchange-adapter-events';
export {
  EXCHANGE_IDS,
  assertExchangeId,
  isExchangeId,
  type ExchangeId,
} from './domain/exchange-id';
export {
  CONNECTION_STATUSES,
  assertConnectionStatus,
  isConnectionStatus,
  type ConnectionStatus,
} from './domain/connection-status';
export {
  createExchangeCapabilities,
  type ExchangeCapabilities,
} from './domain/exchange-capabilities';
export {
  createExchangeConnection,
  withConnectionStatus,
  withHeartbeat,
  withSynchronization,
  rehydrateExchangeConnection,
  type ExchangeConnection,
  type CreateExchangeConnectionInput,
} from './domain/exchange-connection';
export {
  createExchangeOrderRequest,
  EXCHANGE_ORDER_SIDES,
  EXCHANGE_ORDER_TYPES,
  EXCHANGE_ORDER_STATUSES,
  type ExchangeOrderRequest,
  type ExchangeCancelRequest,
  type ExchangeOrderSnapshot,
  type ExchangeOrderResponse,
  type ExchangeOrderSide,
  type ExchangeOrderType,
  type ExchangeOrderStatus,
} from './domain/exchange-order';
export type {
  ExchangeBalance,
  ExchangePosition,
  ExchangeTicker,
  ExchangeExecution,
} from './domain/exchange-market';
