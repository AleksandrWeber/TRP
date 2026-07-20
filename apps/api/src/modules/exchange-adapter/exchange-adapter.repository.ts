import type { ExchangeConnection } from './domain/exchange-connection';
import type { ExchangeDomainEvent } from './exchange-adapter-events';

export const EXCHANGE_ADAPTER_REPOSITORY = Symbol('EXCHANGE_ADAPTER_REPOSITORY');

export interface ExchangeAdapterRepository {
  createConnection(connection: ExchangeConnection): Promise<ExchangeConnection>;

  saveConnection(connection: ExchangeConnection): Promise<ExchangeConnection>;

  findConnectionById(connectionId: string): Promise<ExchangeConnection | null>;

  findConnectionByWorkspaceAndExchange(
    workspaceId: string,
    exchangeId: string,
  ): Promise<ExchangeConnection | null>;

  listConnectionsByWorkspaceId(workspaceId: string): Promise<ExchangeConnection[]>;

  appendEvent(event: ExchangeDomainEvent, eventId: string): Promise<void>;

  listEventsByConnectionId(connectionId: string): Promise<ExchangeDomainEvent[]>;
}
