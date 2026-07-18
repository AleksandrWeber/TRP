/**
 * Recorded Binance-shaped fixtures for M1 contract validation (US148).
 * Adapter-local shapes only — never used as canonical domain events.
 */

export type FixtureKline = {
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

const OPEN_MS = Date.parse('2026-07-18T09:00:00.000Z');
const CLOSE_MS = Date.parse('2026-07-18T09:59:59.999Z');
const NOW_MS = Date.parse('2026-07-18T10:00:00.000Z');

export const FIXTURE_NOW_MS = NOW_MS;

/** Valid closed kline. */
export const FIXTURE_VALID_KLINE: FixtureKline = Object.freeze({
  e: 'kline',
  E: NOW_MS,
  s: 'BTCUSDT',
  k: Object.freeze({
    t: OPEN_MS,
    T: CLOSE_MS,
    s: 'BTCUSDT',
    i: '1h',
    o: '100',
    h: '110',
    l: '95',
    c: '105',
    v: '12.5',
    x: true,
  }),
});

/** Duplicate of valid (same semantic candle). */
export const FIXTURE_DUPLICATE_KLINE: FixtureKline = Object.freeze({
  ...FIXTURE_VALID_KLINE,
  E: NOW_MS + 50,
  k: Object.freeze({ ...FIXTURE_VALID_KLINE.k! }),
});

/** Incomplete / open candle (x=false). */
export const FIXTURE_INCOMPLETE_KLINE: FixtureKline = Object.freeze({
  e: 'kline',
  E: NOW_MS,
  s: 'BTCUSDT',
  k: Object.freeze({
    t: OPEN_MS,
    T: CLOSE_MS,
    s: 'BTCUSDT',
    i: '1h',
    o: '100',
    h: '110',
    l: '95',
    c: '105',
    v: '12.5',
    x: false,
  }),
});

/** Malformed — missing k payload. */
export const FIXTURE_MALFORMED_KLINE: FixtureKline = Object.freeze({
  e: 'kline',
  E: NOW_MS,
  s: 'BTCUSDT',
});

/** Stale / out-of-order earlier open relative to a later accepted candle. */
export const FIXTURE_STALE_KLINE: FixtureKline = Object.freeze({
  e: 'kline',
  E: NOW_MS,
  s: 'BTCUSDT',
  k: Object.freeze({
    t: Date.parse('2026-07-18T08:00:00.000Z'),
    T: Date.parse('2026-07-18T08:59:59.999Z'),
    s: 'BTCUSDT',
    i: '1h',
    o: '90',
    h: '95',
    l: '88',
    c: '92',
    v: '8',
    x: true,
  }),
});

/** Next closed candle after valid (sequence continuity). */
export const FIXTURE_NEXT_KLINE: FixtureKline = Object.freeze({
  e: 'kline',
  E: Date.parse('2026-07-18T11:00:00.000Z'),
  s: 'BTCUSDT',
  k: Object.freeze({
    t: Date.parse('2026-07-18T10:00:00.000Z'),
    T: Date.parse('2026-07-18T10:59:59.999Z'),
    s: 'BTCUSDT',
    i: '1h',
    o: '105',
    h: '120',
    l: '104',
    c: '118',
    v: '20',
    x: true,
  }),
});

export type FixtureBookTicker = {
  e?: string;
  u?: number;
  s?: string;
  b?: string;
  B?: string;
  a?: string;
  A?: string;
};

export const FIXTURE_VALID_BOOK_TICKER: FixtureBookTicker = Object.freeze({
  e: 'bookTicker',
  u: 1,
  s: 'BTCUSDT',
  b: '100.0',
  B: '1',
  a: '100.2',
  A: '1',
});

export const FIXTURE_MALFORMED_BOOK_TICKER: FixtureBookTicker = Object.freeze({
  e: 'bookTicker',
  u: 2,
  s: 'BTCUSDT',
  b: 'bad',
  a: '100.2',
});

/**
 * Ordered recorded WebSocket/REST-style sequence for deterministic replay (US150).
 * Includes valid, duplicate overlap, and next candle.
 */
export const RECORDED_STREAM_SEQUENCE: ReadonlyArray<{
  kind: 'kline' | 'book';
  message: FixtureKline | FixtureBookTicker;
  sequence: number;
  nowMs: number;
}> = Object.freeze([
  {
    kind: 'kline' as const,
    message: FIXTURE_VALID_KLINE,
    sequence: 1,
    nowMs: NOW_MS,
  },
  {
    kind: 'kline' as const,
    message: FIXTURE_DUPLICATE_KLINE,
    sequence: 1,
    nowMs: NOW_MS + 100,
  },
  {
    kind: 'book' as const,
    message: FIXTURE_VALID_BOOK_TICKER,
    sequence: 1,
    nowMs: NOW_MS + 200,
  },
  {
    kind: 'kline' as const,
    message: FIXTURE_NEXT_KLINE,
    sequence: 2,
    nowMs: Date.parse('2026-07-18T11:00:00.000Z'),
  },
]);
