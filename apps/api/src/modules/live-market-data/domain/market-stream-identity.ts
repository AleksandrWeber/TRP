import { toInstrument, type Instrument } from '../../market-data/instrument';
import type { Timeframe } from '../../market-data/timeframe';
import { assertNonEmpty } from './assert';
import { toMarketDataSourceId, type MarketDataSourceId } from './market-data-source';
import { MarketStreamChannel } from './market-stream-channel';
import { toMarketStreamId, type MarketStreamId } from './market-stream-id';

export type MarketStreamIdentityParts = {
  workspaceId: string;
  sourceId: MarketDataSourceId | string;
  instrument: Instrument | string;
  channel: MarketStreamChannel;
  timeframe?: Timeframe;
};

/**
 * Deterministic stream identity (US127).
 * Derived from workspace / source / instrument / channel [/ timeframe].
 * Does not include UUIDs, wall-clock processing time, or operational metadata.
 */
export function buildMarketStreamId(parts: MarketStreamIdentityParts): MarketStreamId {
  const workspaceId = assertNonEmpty(parts.workspaceId, 'workspaceId');
  const sourceId = toMarketDataSourceId(assertNonEmpty(String(parts.sourceId), 'sourceId'));
  const instrument = toInstrument(assertNonEmpty(String(parts.instrument), 'instrument'));
  const channel = parts.channel;

  if (channel === MarketStreamChannel.CLOSED_CANDLE) {
    if (parts.timeframe === undefined) {
      throw new Error('timeframe is required for closed_candle stream identity');
    }
    return toMarketStreamId(
      `${workspaceId}:${sourceId}:${instrument}:${channel}:${parts.timeframe}`,
    );
  }

  if (parts.timeframe !== undefined) {
    throw new Error('timeframe is only allowed for closed_candle stream identity');
  }

  return toMarketStreamId(`${workspaceId}:${sourceId}:${instrument}:${channel}`);
}
