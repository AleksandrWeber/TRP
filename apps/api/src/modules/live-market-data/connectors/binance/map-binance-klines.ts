import { toInstrument, type Instrument } from '../../../market-data/instrument';
import type { Timeframe } from '../../../market-data/timeframe';
import type { ClosedCandleBackfillBar } from '../../ports/live-market-connector';
import type { BinanceKlineTuple } from './binance-rest.types';
import { timeframeDurationMs } from './binance-timeframe';

/**
 * Map validated Binance klines to closed-candle backfill bars (US132).
 * Incomplete / open candles are excluded.
 */
export function mapBinanceKlinesToClosedBars(options: {
  klines: unknown;
  instrument: Instrument | string;
  timeframe: Timeframe;
  fromIso: string;
  toIso: string;
  nowMs: number;
}): ClosedCandleBackfillBar[] {
  if (!Array.isArray(options.klines)) {
    throw new Error('Binance klines response must be an array');
  }

  const instrument = toInstrument(String(options.instrument).trim().toUpperCase());
  const fromMs = Date.parse(options.fromIso);
  const toMs = Date.parse(options.toIso);
  if (Number.isNaN(fromMs) || Number.isNaN(toMs)) {
    throw new Error('from and to must be valid ISO-8601 datetimes');
  }

  const durationMs = timeframeDurationMs(options.timeframe);
  const bars: ClosedCandleBackfillBar[] = [];

  for (const row of options.klines) {
    const kline = assertKline(row);
    const openMs = kline[0];
    const closeMs = kline[6];
    const open = Number(kline[1]);
    const high = Number(kline[2]);
    const low = Number(kline[3]);
    const close = Number(kline[4]);
    const volume = Number(kline[5]);

    assertFinite(open, 'open');
    assertFinite(high, 'high');
    assertFinite(low, 'low');
    assertFinite(close, 'close');
    assertFinite(volume, 'volume');
    if (volume < 0) throw new Error('Binance kline volume must not be negative');
    if (high < low) throw new Error('Binance kline high must be >= low');
    if (closeMs < openMs) throw new Error('Binance kline closeTime must be >= openTime');

    // Only fully closed candles: close time must not be in the future, and
    // the interval must have elapsed.
    if (closeMs > options.nowMs) continue;
    if (openMs + durationMs - 1 > options.nowMs) continue;
    if (openMs < fromMs || closeMs > toMs) continue;

    bars.push(
      Object.freeze({
        instrument,
        timeframe: options.timeframe,
        openTime: new Date(openMs).toISOString(),
        closeTime: new Date(closeMs).toISOString(),
        open,
        high,
        low,
        close,
        volume,
        exchangeOccurredAt: new Date(openMs).toISOString(),
      }),
    );
  }

  return bars.sort((a, b) => a.openTime.localeCompare(b.openTime));
}

function assertKline(row: unknown): BinanceKlineTuple {
  if (!Array.isArray(row) || row.length < 7) {
    throw new Error('Binance kline row is incomplete');
  }
  if (typeof row[0] !== 'number' || typeof row[6] !== 'number') {
    throw new Error('Binance kline timestamps must be numbers');
  }
  for (const idx of [1, 2, 3, 4, 5]) {
    if (typeof row[idx] !== 'string' && typeof row[idx] !== 'number') {
      throw new Error('Binance kline OHLCV fields are invalid');
    }
  }
  return row as BinanceKlineTuple;
}

function assertFinite(value: number, field: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`Binance kline ${field} must be a finite number`);
  }
}
