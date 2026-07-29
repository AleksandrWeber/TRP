import { isStrategyTimeframe, type StrategyTimeframe } from '../../strategies/strategy';

/**
 * Canonical closed-candle semantic tick event type (US218).
 * Matches Live Market Data `MarketClosedCandle` — not a timer or scheduler tick.
 */
export const CLOSED_CANDLE_TICK_EVENT_TYPE = 'MarketClosedCandle' as const;

/**
 * Runtime-facing closed-candle tick contract (US218 / ADR-014 / ADR-018).
 * Identity + ordering fields only. OHLC prices are not required for admission.
 */
export type ClosedCandleTickEvent = Readonly<{
  eventType: typeof CLOSED_CANDLE_TICK_EVENT_TYPE;
  eventId: string;
  workspaceId: string;
  streamId: string;
  sequence: number;
  openTime: string;
  closeTime: string;
  instrument: string;
  timeframe: StrategyTimeframe;
}>;

export type ClosedCandleTickEventInput = Readonly<{
  eventType?: string;
  eventId: string;
  workspaceId: string;
  streamId: string;
  sequence: number;
  openTime: string;
  closeTime: string;
  instrument: string;
  timeframe: string;
}>;

export function createClosedCandleTickEvent(
  input: ClosedCandleTickEventInput,
): ClosedCandleTickEvent {
  const eventType = required(input.eventType ?? CLOSED_CANDLE_TICK_EVENT_TYPE, 'event type');
  if (eventType !== CLOSED_CANDLE_TICK_EVENT_TYPE) {
    throw new Error(`tick event type must be ${CLOSED_CANDLE_TICK_EVENT_TYPE}`);
  }

  const openTime = assertIso(input.openTime, 'openTime');
  const closeTime = assertIso(input.closeTime, 'closeTime');
  if (openTime > closeTime) {
    throw new Error('openTime must be less than or equal to closeTime');
  }

  return Object.freeze({
    eventType: CLOSED_CANDLE_TICK_EVENT_TYPE,
    eventId: required(input.eventId, 'event id'),
    workspaceId: required(input.workspaceId, 'workspace id'),
    streamId: required(input.streamId, 'stream id'),
    sequence: nonNegativeInteger(input.sequence, 'sequence'),
    openTime,
    closeTime,
    instrument: normalizeInstrument(input.instrument),
    timeframe: assertTimeframe(input.timeframe),
  });
}

export function isClosedCandleTickEventType(value: string): boolean {
  return value === CLOSED_CANDLE_TICK_EVENT_TYPE;
}

function assertTimeframe(value: string): StrategyTimeframe {
  const timeframe = required(value, 'timeframe');
  if (!isStrategyTimeframe(timeframe)) {
    throw new Error(`unsupported timeframe: ${timeframe}`);
  }
  return timeframe;
}

function normalizeInstrument(value: string): string {
  const instrument = required(value, 'instrument').toUpperCase();
  if (!/^[A-Z0-9]{3,32}$/.test(instrument)) {
    throw new Error('instrument must be 3-32 uppercase letters or digits');
  }
  return instrument;
}

function required(value: string, label: string): string {
  const result = value.trim();
  if (result === '') throw new Error(`${label} is required`);
  return result;
}

function nonNegativeInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
  return value;
}

function assertIso(value: string, label: string): string {
  if (Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new Error(`${label} must be an ISO-8601 UTC timestamp`);
  }
  return value;
}
