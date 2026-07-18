import { toInstrument, type Instrument } from '../../market-data/instrument';
import { Timeframe, isTimeframe } from '../../market-data/timeframe';
import { assertIso8601, assertNonEmpty, assertNonNegativeInteger, freezeDeep } from './assert';
import { toMarketDataSourceId, type MarketDataSourceId } from './market-data-source';
import { toMarketEventId, type MarketEventId } from './market-event-id';
import { MarketHealthStatus, isMarketHealthStatus } from './market-status';
import { MarketStreamChannel, isMarketStreamChannel } from './market-stream-channel';
import { toMarketStreamId, type MarketStreamId } from './market-stream-id';

/**
 * Durable market stream checkpoint contract (US126).
 * Records last accepted semantic market event for recovery (ADR-018 #25).
 */
export type MarketCheckpoint = Readonly<{
  workspaceId: string;
  sourceId: MarketDataSourceId;
  instrument: Instrument;
  channel: MarketStreamChannel;
  streamId: MarketStreamId;
  timeframe?: Timeframe;
  lastSequence: number;
  lastEventId: MarketEventId | null;
  lastOccurredAt: string | null;
  health: MarketHealthStatus;
  updatedAt: string;
}>;

export type MarketCheckpointInput = {
  workspaceId: string;
  sourceId: MarketDataSourceId | string;
  instrument: Instrument | string;
  channel: MarketStreamChannel | string;
  streamId: MarketStreamId | string;
  timeframe?: Timeframe | string;
  lastSequence: number;
  lastEventId?: MarketEventId | string | null;
  lastOccurredAt?: string | null;
  health: MarketHealthStatus | string;
  updatedAt: string;
};

export function createMarketCheckpoint(input: MarketCheckpointInput): MarketCheckpoint {
  const workspaceId = assertNonEmpty(input.workspaceId, 'workspaceId');
  const sourceId = toMarketDataSourceId(assertNonEmpty(String(input.sourceId), 'sourceId'));
  const instrument = toInstrument(assertNonEmpty(String(input.instrument), 'instrument'));
  const streamId = toMarketStreamId(assertNonEmpty(String(input.streamId), 'streamId'));
  assertNonNegativeInteger(input.lastSequence, 'lastSequence');
  const updatedAt = assertIso8601(input.updatedAt, 'updatedAt');

  if (!isMarketStreamChannel(String(input.channel))) {
    throw new Error('channel must be a supported MarketStreamChannel');
  }
  const channel = input.channel as MarketStreamChannel;

  if (!isMarketHealthStatus(String(input.health))) {
    throw new Error('health must be a supported MarketHealthStatus');
  }
  const health = input.health as MarketHealthStatus;

  let timeframe: Timeframe | undefined;
  if (channel === MarketStreamChannel.CLOSED_CANDLE) {
    if (input.timeframe === undefined || !isTimeframe(String(input.timeframe))) {
      throw new Error('timeframe is required for closed_candle checkpoints');
    }
    timeframe = input.timeframe as Timeframe;
  } else if (input.timeframe !== undefined) {
    throw new Error('timeframe is only allowed for closed_candle checkpoints');
  }

  const lastEventId =
    input.lastEventId === undefined || input.lastEventId === null
      ? null
      : toMarketEventId(assertNonEmpty(String(input.lastEventId), 'lastEventId'));

  const lastOccurredAt =
    input.lastOccurredAt === undefined || input.lastOccurredAt === null
      ? null
      : assertIso8601(input.lastOccurredAt, 'lastOccurredAt');

  return freezeDeep({
    workspaceId,
    sourceId,
    instrument,
    channel,
    streamId,
    ...(timeframe !== undefined ? { timeframe } : {}),
    lastSequence: input.lastSequence,
    lastEventId,
    lastOccurredAt,
    health,
    updatedAt,
  });
}
