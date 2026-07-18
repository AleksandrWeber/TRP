import { toInstrument, type Instrument } from '../../market-data/instrument';
import { Timeframe, isTimeframe } from '../../market-data/timeframe';
import { assertIso8601, assertNonEmpty, freezeDeep } from './assert';
import { toMarketDataSourceId, type MarketDataSourceId } from './market-data-source';
import { MarketStreamChannel, isMarketStreamChannel } from './market-stream-channel';
import { toMarketSubscriptionId, type MarketSubscriptionId } from './market-subscription-id';
import { toMarketStreamId, type MarketStreamId } from './market-stream-id';

/**
 * Desired subscription state (US126).
 * Independent of connector socket instances. No Trading Session behavior.
 */
export enum MarketSubscriptionState {
  DESIRED = 'desired',
  ACTIVE = 'active',
  PAUSED = 'paused',
  STOPPED = 'stopped',
}

export function isMarketSubscriptionState(value: string): value is MarketSubscriptionState {
  return (Object.values(MarketSubscriptionState) as string[]).includes(value);
}

/**
 * Workspace-scoped market subscription contract (US126).
 */
export type MarketSubscription = Readonly<{
  id: MarketSubscriptionId;
  workspaceId: string;
  sourceId: MarketDataSourceId;
  instrument: Instrument;
  channel: MarketStreamChannel;
  streamId: MarketStreamId;
  /** Required for closed-candle subscriptions; omitted for mark-price/status. */
  timeframe?: Timeframe;
  state: MarketSubscriptionState;
  updatedAt: string;
}>;

export type MarketSubscriptionInput = {
  id: MarketSubscriptionId | string;
  workspaceId: string;
  sourceId: MarketDataSourceId | string;
  instrument: Instrument | string;
  channel: MarketStreamChannel | string;
  streamId: MarketStreamId | string;
  timeframe?: Timeframe | string;
  state: MarketSubscriptionState | string;
  updatedAt: string;
};

export function createMarketSubscription(input: MarketSubscriptionInput): MarketSubscription {
  const id = toMarketSubscriptionId(assertNonEmpty(String(input.id), 'id'));
  const workspaceId = assertNonEmpty(input.workspaceId, 'workspaceId');
  const sourceId = toMarketDataSourceId(assertNonEmpty(String(input.sourceId), 'sourceId'));
  const instrument = toInstrument(assertNonEmpty(String(input.instrument), 'instrument'));
  const streamId = toMarketStreamId(assertNonEmpty(String(input.streamId), 'streamId'));
  const updatedAt = assertIso8601(input.updatedAt, 'updatedAt');

  if (!isMarketStreamChannel(String(input.channel))) {
    throw new Error('channel must be a supported MarketStreamChannel');
  }
  const channel = input.channel as MarketStreamChannel;

  if (!isMarketSubscriptionState(String(input.state))) {
    throw new Error('state must be a supported MarketSubscriptionState');
  }
  const state = input.state as MarketSubscriptionState;

  let timeframe: Timeframe | undefined;
  if (channel === MarketStreamChannel.CLOSED_CANDLE) {
    if (input.timeframe === undefined || !isTimeframe(String(input.timeframe))) {
      throw new Error('timeframe is required for closed_candle subscriptions');
    }
    timeframe = input.timeframe as Timeframe;
  } else if (input.timeframe !== undefined) {
    throw new Error('timeframe is only allowed for closed_candle subscriptions');
  }

  return freezeDeep({
    id,
    workspaceId,
    sourceId,
    instrument,
    channel,
    streamId,
    ...(timeframe !== undefined ? { timeframe } : {}),
    state,
    updatedAt,
  });
}
