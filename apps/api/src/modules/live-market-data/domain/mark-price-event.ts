import { toInstrument, type Instrument } from '../../market-data/instrument';
import {
  assertNonEmpty,
  assertNonNegativeInteger,
  assertPositiveNumber,
  freezeDeep,
} from './assert';
import type { MarketEventEnvelope } from './market-event-envelope';
import { MarketEventType } from './market-event-type';
import { toMarketEventId, type MarketEventId } from './market-event-id';
import { toMarketDataSourceId, type MarketDataSourceId } from './market-data-source';
import { MarketStreamChannel } from './market-stream-channel';
import { toMarketStreamId, type MarketStreamId } from './market-stream-id';
import type { MarketEventTimestampInput } from './market-event-timestamps';
import { resolveMarketEventTimestamps } from './resolve-market-event-timestamps';
import { buildMarkPriceSemanticIdentity } from './market-event-identity';
import { buildMarketStreamId } from './market-stream-identity';

/**
 * Immutable mark-price market event (US126, US127).
 * Distinct from closed-candle. No Position / Portfolio / fill calculation.
 */
export type MarkPriceEvent = MarketEventEnvelope &
  Readonly<{
    eventType: MarketEventType.MARK_PRICE;
    channel: MarketStreamChannel.MARK_PRICE;
    price: number;
  }>;

export type MarkPriceEventInput = {
  eventId?: MarketEventId | string;
  schemaVersion?: number;
  workspaceId: string;
  sourceId: MarketDataSourceId | string;
  instrument: Instrument | string;
  streamId?: MarketStreamId | string;
  sequence: number;
  price: number;
} & MarketEventTimestampInput;

export function createMarkPriceEvent(input: MarkPriceEventInput): MarkPriceEvent {
  const workspaceId = assertNonEmpty(input.workspaceId, 'workspaceId');
  const instrument = toInstrument(assertNonEmpty(String(input.instrument), 'instrument'));
  const sourceId = toMarketDataSourceId(assertNonEmpty(String(input.sourceId), 'sourceId'));
  const schemaVersion = input.schemaVersion ?? 1;
  assertNonNegativeInteger(schemaVersion, 'schemaVersion');
  if (schemaVersion < 1) {
    throw new Error('schemaVersion must be greater than or equal to 1');
  }
  assertNonNegativeInteger(input.sequence, 'sequence');
  const price = assertPositiveNumber(input.price, 'price');
  const timestamps = resolveMarketEventTimestamps(input);

  const streamId =
    input.streamId !== undefined
      ? toMarketStreamId(assertNonEmpty(String(input.streamId), 'streamId'))
      : buildMarketStreamId({
          workspaceId,
          sourceId,
          instrument,
          channel: MarketStreamChannel.MARK_PRICE,
        });

  const semanticIdentity = buildMarkPriceSemanticIdentity({
    workspaceId,
    sourceId,
    instrument,
    channel: MarketStreamChannel.MARK_PRICE,
    exchangeOccurredAt: timestamps.exchangeOccurredAt,
    price,
  });

  const eventId = toMarketEventId(
    assertNonEmpty(String(input.eventId ?? `sem:${semanticIdentity}`), 'eventId'),
  );

  return freezeDeep({
    eventId,
    eventType: MarketEventType.MARK_PRICE,
    schemaVersion,
    workspaceId,
    sourceId,
    instrument,
    channel: MarketStreamChannel.MARK_PRICE,
    streamId,
    sequence: input.sequence,
    semanticIdentity,
    ...timestamps,
    price,
  });
}
