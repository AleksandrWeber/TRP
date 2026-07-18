import type { AcceptedMarketStreamState } from './domain/accepted-market-stream-state';
import type { DurableEventEnvelope } from './domain/durable-event-envelope';
import type { OutboxRecord } from './domain/outbox-record';

/**
 * Transactional write boundary for accepted market state + Outbox (US128).
 * Both commit or neither.
 */
export type AcceptMarketEventCommand = {
  state: AcceptedMarketStreamState;
  envelope: DurableEventEnvelope;
  recordedAt: string;
};

export type AcceptMarketEventResult = {
  state: AcceptedMarketStreamState;
  outbox: OutboxRecord;
};

export interface TransactionalOutboxWriter {
  /**
   * Persist accepted durable state and Outbox event atomically.
   * On failure, neither state nor outbox row remains.
   */
  acceptMarketEvent(command: AcceptMarketEventCommand): Promise<AcceptMarketEventResult>;

  getAcceptedState(
    workspaceId: string,
    streamId: string,
  ): Promise<AcceptedMarketStreamState | null>;
}
