import type { DurableEventEnvelope } from './durable-event-envelope';

/**
 * Durable accepted market-stream state that publishes with Outbox (US128).
 * Represents last accepted semantic fact for a stream — not trading state.
 */
export type AcceptedMarketStreamState = Readonly<{
  workspaceId: string;
  streamId: string;
  lastSequence: number;
  lastEventId: string;
  lastOccurredAt: string;
  updatedAt: string;
}>;
