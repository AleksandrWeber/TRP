import type { Instrument } from '../../market-data/instrument';
import type { MarketDataSourceId } from './market-data-source';
import type { MarketEventId } from './market-event-id';
import type { MarketEventSemanticIdentity } from './market-event-identity';
import type { MarketEventTimestamps } from './market-event-timestamps';
import type { MarketEventType } from './market-event-type';
import type { MarketStreamChannel } from './market-stream-channel';
import type { MarketStreamId } from './market-stream-id';

/**
 * Shared immutable market event envelope (US126, US127).
 * Provider-neutral. Workspace / instrument / source / stream scoped.
 * No strategy, Order, Risk, or accounting fields.
 */
export type MarketEventEnvelope = Readonly<{
  eventId: MarketEventId;
  eventType: MarketEventType;
  schemaVersion: number;
  workspaceId: string;
  sourceId: MarketDataSourceId;
  instrument: Instrument;
  channel: MarketStreamChannel;
  streamId: MarketStreamId;
  /** Monotonic sequence within the stream. */
  sequence: number;
  /** Semantic deduplication identity (excludes operational timestamps). */
  semanticIdentity: MarketEventSemanticIdentity;
}> &
  MarketEventTimestamps;
