import { createHash } from 'node:crypto';
import { isStrategyTimeframe, type StrategyTimeframe } from '../../strategies/strategy';

export const STRATEGY_CHECKPOINT_SCHEMA_VERSION = 1;
export const STRATEGY_RUNTIME_VERSION = '1';

/**
 * Semantic closed-candle progress pointer for Strategy Runtime (US215).
 * OHLC values are intentionally excluded — resume needs identity, not prices.
 */
export type LastProcessedCandle = Readonly<{
  streamId: string;
  sequence: number;
  openTime: string;
  instrument: string;
  timeframe: StrategyTimeframe;
}>;

/**
 * Versioned Strategy Runtime checkpoint (US215 / ADR-014 / ADR-017).
 * Durable resume pointer only. Does not own Orders, Risk, Execution, Fills,
 * Positions, or Trading Session lifecycle/lease state.
 */
export type StrategyCheckpoint = Readonly<{
  id: string;
  workspaceId: string;
  deploymentId: string;
  sessionId: string;
  lastProcessedCandle: LastProcessedCandle;
  lastProcessedEventId: string;
  runtimeVersion: string;
  /** Optimistic concurrency / advance counter. */
  version: number;
  updatedAt: string;
}>;

export type CreateStrategyCheckpointInput = Readonly<{
  workspaceId: string;
  deploymentId: string;
  sessionId: string;
  lastProcessedCandle: LastProcessedCandle;
  lastProcessedEventId: string;
  runtimeVersion?: string;
  updatedAt: string;
}>;

export type AdvanceStrategyCheckpointInput = Readonly<{
  lastProcessedCandle: LastProcessedCandle;
  lastProcessedEventId: string;
  runtimeVersion?: string;
  updatedAt: string;
}>;

export function createStrategyCheckpoint(input: CreateStrategyCheckpointInput): StrategyCheckpoint {
  const workspaceId = required(input.workspaceId, 'workspace id');
  const deploymentId = required(input.deploymentId, 'deployment id');
  const sessionId = required(input.sessionId, 'session id');
  const lastProcessedCandle = normalizeCandle(input.lastProcessedCandle);
  const lastProcessedEventId = required(input.lastProcessedEventId, 'last processed event id');
  const runtimeVersion = required(
    input.runtimeVersion ?? STRATEGY_RUNTIME_VERSION,
    'runtime version',
  );
  assertIso(input.updatedAt, 'updatedAt');

  return deepFreeze({
    id: deterministicCheckpointId(workspaceId, sessionId),
    workspaceId,
    deploymentId,
    sessionId,
    lastProcessedCandle,
    lastProcessedEventId,
    runtimeVersion,
    version: 1,
    updatedAt: input.updatedAt,
  });
}

/**
 * Advances checkpoint progress. Same progress is a successful no-op identity.
 * Sequence must be strictly monotonic on the same stream.
 */
export function advanceStrategyCheckpoint(
  current: StrategyCheckpoint,
  input: AdvanceStrategyCheckpointInput,
): StrategyCheckpoint {
  const lastProcessedCandle = normalizeCandle(input.lastProcessedCandle);
  const lastProcessedEventId = required(input.lastProcessedEventId, 'last processed event id');
  const runtimeVersion = required(
    input.runtimeVersion ?? current.runtimeVersion,
    'runtime version',
  );
  assertIso(input.updatedAt, 'updatedAt');

  if (
    sameProgress(current, lastProcessedCandle, lastProcessedEventId) &&
    runtimeVersion === current.runtimeVersion
  ) {
    return current;
  }

  assertMonotonicAdvance(current.lastProcessedCandle, lastProcessedCandle);

  return deepFreeze({
    ...current,
    lastProcessedCandle,
    lastProcessedEventId,
    runtimeVersion,
    version: current.version + 1,
    updatedAt: input.updatedAt,
  });
}

export function sameProgress(
  checkpoint: StrategyCheckpoint,
  candle: LastProcessedCandle,
  eventId: string,
): boolean {
  const normalized = normalizeCandle(candle);
  return (
    checkpoint.lastProcessedEventId === required(eventId, 'last processed event id') &&
    checkpoint.lastProcessedCandle.streamId === normalized.streamId &&
    checkpoint.lastProcessedCandle.sequence === normalized.sequence &&
    checkpoint.lastProcessedCandle.openTime === normalized.openTime &&
    checkpoint.lastProcessedCandle.instrument === normalized.instrument &&
    checkpoint.lastProcessedCandle.timeframe === normalized.timeframe
  );
}

export function deterministicCheckpointId(workspaceId: string, sessionId: string): string {
  const digest = createHash('sha256').update(`${workspaceId}:${sessionId}`).digest('hex');
  return `scp_${digest.slice(0, 32)}`;
}

function assertMonotonicAdvance(current: LastProcessedCandle, next: LastProcessedCandle): void {
  if (current.streamId !== next.streamId) {
    throw new Error('strategy checkpoint stream id cannot change');
  }
  if (next.sequence <= current.sequence) {
    throw new Error('strategy checkpoint candle sequence must advance monotonically');
  }
  if (next.openTime <= current.openTime) {
    throw new Error('strategy checkpoint candle openTime must advance monotonically');
  }
}

function normalizeCandle(input: LastProcessedCandle): LastProcessedCandle {
  const streamId = required(input.streamId, 'candle stream id');
  const sequence = nonNegativeInteger(input.sequence, 'candle sequence');
  assertIso(input.openTime, 'candle openTime');
  const instrument = normalizeInstrument(input.instrument);
  const timeframe = assertTimeframe(input.timeframe);
  return Object.freeze({
    streamId,
    sequence,
    openTime: input.openTime,
    instrument,
    timeframe,
  });
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

function deepFreeze<T extends object>(value: T): Readonly<T> {
  for (const nested of Object.values(value)) {
    if (nested && typeof nested === 'object') Object.freeze(nested);
  }
  return Object.freeze(value);
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

function assertIso(value: string, label: string): void {
  if (Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new Error(`${label} must be an ISO-8601 UTC timestamp`);
  }
}
