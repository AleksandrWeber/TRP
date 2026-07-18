import type { Timeframe } from '../../../market-data/timeframe';
import type { ClosedCandleDraft } from '../../normalization/closed-candle-draft';
import { BINANCE_SPOT_SOURCE_ID } from './binance-spot.source';
import { timeframeDurationMs } from './binance-timeframe';

/**
 * Internal Binance kline stream payload (US135).
 * Must remain adapter-local — never exported from the public barrel.
 */
export type BinanceKlineStreamMessage = {
  e?: string;
  E?: number;
  s?: string;
  k?: {
    t?: number;
    T?: number;
    s?: string;
    i?: string;
    o?: string;
    h?: string;
    l?: string;
    c?: string;
    v?: string;
    x?: boolean;
  };
};

export type MapBinanceKlineToDraftInput = {
  workspaceId: string;
  timeframe: Timeframe;
  sequence: number;
  message: BinanceKlineStreamMessage;
  receivedAt: string;
  processedAt: string;
  recordedAt: string;
  nowMs: number;
};

/**
 * Map a Binance kline WebSocket message into a provider-neutral ClosedCandleDraft (US135).
 * Incomplete candles set isClosed=false. Raw Binance keys do not appear on the draft.
 */
export function mapBinanceKlineMessageToDraft(
  input: MapBinanceKlineToDraftInput,
): ClosedCandleDraft {
  const k = input.message.k;
  if (!k || typeof k !== 'object') {
    throw new Error('Binance kline message is missing k payload');
  }

  const symbol = String(k.s ?? input.message.s ?? '')
    .trim()
    .toUpperCase();
  if (symbol === '') {
    throw new Error('Binance kline message is missing symbol');
  }

  const openMs = Number(k.t);
  const closeMs = Number(k.T);
  if (!Number.isFinite(openMs) || !Number.isFinite(closeMs)) {
    throw new Error('Binance kline timestamps are invalid');
  }

  const open = Number(k.o);
  const high = Number(k.h);
  const low = Number(k.l);
  const close = Number(k.c);
  const volume = Number(k.v);
  const markedClosed = k.x === true;
  const durationMs = timeframeDurationMs(input.timeframe);
  const intervalElapsed = openMs + durationMs - 1 <= input.nowMs;
  const isClosed = markedClosed && intervalElapsed && closeMs <= input.nowMs;

  return Object.freeze({
    workspaceId: input.workspaceId,
    sourceId: BINANCE_SPOT_SOURCE_ID,
    instrument: symbol,
    timeframe: input.timeframe,
    openTime: new Date(openMs).toISOString(),
    closeTime: new Date(closeMs).toISOString(),
    open,
    high,
    low,
    close,
    volume,
    exchangeOccurredAt: new Date(openMs).toISOString(),
    receivedAt: input.receivedAt,
    processedAt: input.processedAt,
    recordedAt: input.recordedAt,
    sequence: input.sequence,
    isClosed,
  });
}
