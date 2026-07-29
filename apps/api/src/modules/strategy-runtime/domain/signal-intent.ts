import { createHash } from 'node:crypto';
import { isStrategyTimeframe, type StrategyTimeframe } from '../../strategies/strategy';

export const SIGNAL_INTENT_SCHEMA_VERSION = 1;

export enum SignalIntentDirection {
  BUY = 'buy',
  SELL = 'sell',
}

export type SignalIntentMarketCheckpoint = Readonly<{
  streamId: string;
  sequence: number;
  eventId: string;
}>;

export type SignalIntentMetadata = Readonly<Record<string, unknown>>;

/**
 * Immutable Signal Intent command fact (US214 / ADR-012 / ADR-017).
 * Canonical Strategy Runtime output. Not an Order. Does not own Risk,
 * Execution, Fills, or Trading Session lifecycle.
 */
export type SignalIntent = Readonly<{
  intentVersion: 1;
  id: string;
  /** SHA-256 semantic identity; used as the idempotency / dedupe key. */
  intentHash: string;
  workspaceId: string;
  deploymentId: string;
  sessionId: string;
  strategyVersion: string;
  instrument: string;
  timeframe: StrategyTimeframe;
  direction: SignalIntentDirection;
  /** Deterministic conviction in [0, 1] when the evaluator supplies it. */
  confidence: number | null;
  marketCheckpoint: SignalIntentMarketCheckpoint;
  generatedAt: string;
  recordedAt: string;
  actorId: string;
  correlationId: string | null;
  metadata: SignalIntentMetadata;
}>;

export type CreateSignalIntentInput = Readonly<{
  workspaceId: string;
  deploymentId: string;
  sessionId: string;
  strategyVersion: string;
  instrument: string;
  timeframe: string;
  direction: SignalIntentDirection;
  confidence?: number | null;
  marketCheckpoint: SignalIntentMarketCheckpoint;
  generatedAt: string;
  recordedAt: string;
  actorId: string;
  correlationId?: string | null;
  metadata?: SignalIntentMetadata;
}>;

/**
 * Builds an immutable Signal Intent with stable semantic identity.
 * Operational correlation/recordedAt are excluded from the identity hash.
 */
export function createSignalIntent(input: CreateSignalIntentInput): SignalIntent {
  const workspaceId = required(input.workspaceId, 'workspace id');
  const deploymentId = required(input.deploymentId, 'deployment id');
  const sessionId = required(input.sessionId, 'session id');
  const strategyVersion = required(input.strategyVersion, 'strategy version');
  const instrument = normalizeInstrument(input.instrument);
  const timeframe = assertTimeframe(input.timeframe);
  const direction = assertDirection(input.direction);
  const confidence = normalizeConfidence(input.confidence);
  const marketCheckpoint = normalizeCheckpoint(input.marketCheckpoint);
  const actorId = required(input.actorId, 'actor id');
  const metadata = freezeJsonObject(input.metadata ?? {}, 'metadata');
  assertIso(input.generatedAt, 'generatedAt');
  assertIso(input.recordedAt, 'recordedAt');

  const semanticIdentity = {
    intentVersion: 1 as const,
    workspaceId,
    deploymentId,
    sessionId,
    strategyVersion,
    instrument,
    timeframe,
    direction,
    confidence,
    marketCheckpoint,
    generatedAt: input.generatedAt,
  };
  const intentHash = sha256(stableStringify(semanticIdentity));
  const id = `si_${intentHash.slice(0, 32)}`;

  return deepFreeze({
    ...semanticIdentity,
    id,
    intentHash,
    recordedAt: input.recordedAt,
    actorId,
    correlationId: optionalId(input.correlationId),
    metadata,
  });
}

export function isSignalIntentDirection(value: string): value is SignalIntentDirection {
  return Object.values(SignalIntentDirection).includes(value as SignalIntentDirection);
}

export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function normalizeCheckpoint(input: SignalIntentMarketCheckpoint): SignalIntentMarketCheckpoint {
  return Object.freeze({
    streamId: required(input.streamId, 'market checkpoint stream id'),
    sequence: nonNegativeInteger(input.sequence, 'market checkpoint sequence'),
    eventId: required(input.eventId, 'market checkpoint event id'),
  });
}

function normalizeConfidence(value: number | null | undefined): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('confidence must be a finite number');
  }
  if (value < 0 || value > 1) {
    throw new Error('confidence must be in [0, 1]');
  }
  return Math.round(value * 10_000) / 10_000;
}

function assertDirection(value: SignalIntentDirection): SignalIntentDirection {
  if (!isSignalIntentDirection(value)) {
    throw new Error('unsupported signal intent direction');
  }
  return value;
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

function freezeJsonObject(
  value: Record<string, unknown>,
  label: string,
): Readonly<Record<string, unknown>> {
  if (value === null || Array.isArray(value) || typeof value !== 'object') {
    throw new Error(`${label} must be a JSON object`);
  }
  return Object.freeze(structuredClone(value));
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

function optionalId(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
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

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
