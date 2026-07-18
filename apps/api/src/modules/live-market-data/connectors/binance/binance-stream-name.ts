import type { Timeframe } from '../../../market-data/timeframe';
import { MarketStreamChannel } from '../../domain/market-stream-channel';
import type { LiveMarketSubscribeRequest } from '../../ports/live-market-connector';
import { timeframeToBinanceInterval } from './binance-timeframe';

/**
 * Build Binance stream name from canonical subscribe request (US133).
 * Adapter-internal — not a public payload.
 */
export function toBinanceStreamName(request: LiveMarketSubscribeRequest): string {
  const symbol = String(request.instrument).trim().toLowerCase();
  if (symbol === '') {
    throw new Error('instrument must not be empty');
  }

  switch (request.channel) {
    case MarketStreamChannel.CLOSED_CANDLE: {
      if (request.timeframe === undefined) {
        throw new Error('timeframe is required for closed_candle subscriptions');
      }
      const interval = timeframeToBinanceInterval(request.timeframe as Timeframe);
      return `${symbol}@kline_${interval}`;
    }
    case MarketStreamChannel.MARK_PRICE:
      // Spot mark/ticker proxy — bookTicker is public and credential-free.
      return `${symbol}@bookTicker`;
    case MarketStreamChannel.MARKET_STATUS:
      throw new Error('market_status is not a Binance stream channel');
    default: {
      const _exhaustive: never = request.channel;
      throw new Error(`unsupported channel: ${_exhaustive}`);
    }
  }
}

export function subscriptionKey(request: LiveMarketSubscribeRequest): string {
  const instrument = String(request.instrument).trim().toUpperCase();
  const tf = request.timeframe ?? '';
  return `${request.workspaceId}:${instrument}:${request.channel}:${tf}`;
}
