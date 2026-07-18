import { toInstrument, type Instrument } from '../../market-data/instrument';
import { Timeframe, isTimeframe } from '../../market-data/timeframe';
import {
  assertFiniteNumber,
  assertIso8601,
  assertNonEmpty,
  assertNonNegativeInteger,
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
import { buildClosedCandleSemanticIdentity } from './market-event-identity';
import { buildMarketStreamId } from './market-stream-identity';

/**
 * Immutable closed-candle market event (US126, US127).
 * Distinct from mark-price. Provider-neutral OHLCV payload only.
 */
export type ClosedCandleEvent = MarketEventEnvelope &
  Readonly<{
    eventType: MarketEventType.CLOSED_CANDLE;
    channel: MarketStreamChannel.CLOSED_CANDLE;
    timeframe: Timeframe;
    openTime: string;
    closeTime: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;

export type ClosedCandleEventInput = {
  eventId?: MarketEventId | string;
  schemaVersion?: number;
  workspaceId: string;
  sourceId: MarketDataSourceId | string;
  instrument: Instrument | string;
  /** Optional; when omitted, derived deterministically (US127). */
  streamId?: MarketStreamId | string;
  sequence: number;
  timeframe: Timeframe | string;
  openTime: string;
  closeTime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
} & MarketEventTimestampInput;

export function createClosedCandleEvent(input: ClosedCandleEventInput): ClosedCandleEvent {
  const workspaceId = assertNonEmpty(input.workspaceId, 'workspaceId');
  const instrument = toInstrument(assertNonEmpty(String(input.instrument), 'instrument'));
  const sourceId = toMarketDataSourceId(assertNonEmpty(String(input.sourceId), 'sourceId'));
  const schemaVersion = input.schemaVersion ?? 1;
  assertNonNegativeInteger(schemaVersion, 'schemaVersion');
  if (schemaVersion < 1) {
    throw new Error('schemaVersion must be greater than or equal to 1');
  }
  assertNonNegativeInteger(input.sequence, 'sequence');

  const timeframe =
    typeof input.timeframe === 'string' && isTimeframe(input.timeframe)
      ? input.timeframe
      : (input.timeframe as Timeframe);
  if (!isTimeframe(String(timeframe))) {
    throw new Error('timeframe must be a supported Timeframe');
  }

  const streamId =
    input.streamId !== undefined
      ? toMarketStreamId(assertNonEmpty(String(input.streamId), 'streamId'))
      : buildMarketStreamId({
          workspaceId,
          sourceId,
          instrument,
          channel: MarketStreamChannel.CLOSED_CANDLE,
          timeframe,
        });

  const openTime = assertIso8601(input.openTime, 'openTime');
  const closeTime = assertIso8601(input.closeTime, 'closeTime');
  if (openTime > closeTime) {
    throw new Error('openTime must be less than or equal to closeTime');
  }

  const timestamps = resolveMarketEventTimestamps(input);

  const open = assertFiniteNumber(input.open, 'open');
  const high = assertFiniteNumber(input.high, 'high');
  const low = assertFiniteNumber(input.low, 'low');
  const close = assertFiniteNumber(input.close, 'close');
  const volume = assertFiniteNumber(input.volume, 'volume');
  if (volume < 0) {
    throw new Error('volume must not be negative');
  }
  if (high < low) {
    throw new Error('high must be greater than or equal to low');
  }
  if (high < open || high < close) {
    throw new Error('high must be greater than or equal to open and close');
  }
  if (low > open || low > close) {
    throw new Error('low must be less than or equal to open and close');
  }

  const semanticIdentity = buildClosedCandleSemanticIdentity({
    workspaceId,
    sourceId,
    instrument,
    channel: MarketStreamChannel.CLOSED_CANDLE,
    timeframe,
    openTime,
    closeTime,
    open,
    high,
    low,
    close,
    volume,
    exchangeOccurredAt: timestamps.exchangeOccurredAt,
  });

  const eventId = toMarketEventId(
    assertNonEmpty(String(input.eventId ?? `sem:${semanticIdentity}`), 'eventId'),
  );

  return freezeDeep({
    eventId,
    eventType: MarketEventType.CLOSED_CANDLE,
    schemaVersion,
    workspaceId,
    sourceId,
    instrument,
    channel: MarketStreamChannel.CLOSED_CANDLE,
    streamId,
    sequence: input.sequence,
    semanticIdentity,
    ...timestamps,
    timeframe,
    openTime,
    closeTime,
    open,
    high,
    low,
    close,
    volume,
  });
}
