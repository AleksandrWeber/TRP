import { createHash } from 'node:crypto';
import { FinancialDecimal } from '../../financial';

export enum OrderSide {
  BUY = 'buy',
  SELL = 'sell',
}

export enum OrderType {
  MARKET = 'market',
  LIMIT = 'limit',
}

export enum OrderPositionEffect {
  OPEN_OR_INCREASE_LONG = 'open_or_increase_long',
  REDUCE_ONLY = 'reduce_only',
}

export type OrderMarketCheckpoint = Readonly<{
  streamId: string;
  sequence: number;
  eventId: string;
}>;

export type OrderIntent = Readonly<{
  intentVersion: 1;
  orderId: string;
  clientOrderId: string;
  intentHash: string;
  idempotencyKey: string;
  workspaceId: string;
  paperAccountId: string;
  tradingSessionId: string;
  sessionFencingToken: number;
  mode: 'paper';
  origin: 'manual';
  instrument: string;
  side: OrderSide;
  type: OrderType;
  positionEffect: OrderPositionEffect;
  quantity: string;
  limitPrice: string | null;
  marketCheckpoint: OrderMarketCheckpoint;
  actorId: string;
  correlationId: string | null;
  occurredAt: string;
  recordedAt: string;
}>;

export type CreateOrderIntentInput = Readonly<{
  clientOrderId: string;
  idempotencyKey: string;
  workspaceId: string;
  paperAccountId: string;
  tradingSessionId: string;
  sessionFencingToken: number;
  mode: 'paper';
  origin: 'manual';
  instrument: string;
  side: OrderSide;
  type: OrderType;
  quantity: string;
  limitPrice?: string | null;
  /** SELL intents must be reduce-only so they cannot structurally open a short. */
  reduceOnly?: boolean;
  marketCheckpoint: OrderMarketCheckpoint;
  actorId: string;
  correlationId?: string;
  occurredAt: string;
  recordedAt: string;
}>;

/**
 * Immutable manual paper Order Intent (US159 / ADR-012).
 * Financial values remain canonical decimal strings and semantic identity
 * excludes operational correlation/recorded timestamps.
 */
export function createOrderIntent(input: CreateOrderIntentInput): OrderIntent {
  if (input.mode !== 'paper') throw new Error('order mode must be paper');
  if (input.origin !== 'manual') throw new Error('M2 order origin must be manual');
  if (!Object.values(OrderSide).includes(input.side)) throw new Error('unsupported order side');
  if (!Object.values(OrderType).includes(input.type)) throw new Error('unsupported order type');

  const clientOrderId = identifier(input.clientOrderId, 'client order id');
  const idempotencyKey = identifier(input.idempotencyKey, 'idempotency key');
  const workspaceId = required(input.workspaceId, 'workspace id');
  const paperAccountId = required(input.paperAccountId, 'paper account id');
  const tradingSessionId = required(input.tradingSessionId, 'trading session id');
  const actorId = required(input.actorId, 'actor id');
  const instrument = normalizeInstrument(input.instrument);
  const quantity = storageDecimal(input.quantity, 'order quantity').assertPositive(
    'order quantity',
  );
  const marketCheckpoint = normalizeCheckpoint(input.marketCheckpoint);
  const sessionFencingToken = positiveInteger(input.sessionFencingToken, 'session fencing token');
  assertIso(input.occurredAt, 'occurredAt');
  assertIso(input.recordedAt, 'recordedAt');

  const positionEffect =
    input.side === OrderSide.SELL
      ? OrderPositionEffect.REDUCE_ONLY
      : OrderPositionEffect.OPEN_OR_INCREASE_LONG;
  if (input.side === OrderSide.SELL && input.reduceOnly !== true) {
    throw new Error('sell order intent must be reduce-only');
  }
  if (input.side === OrderSide.BUY && input.reduceOnly === true) {
    throw new Error('buy order intent cannot be reduce-only');
  }

  const limitPrice = normalizeLimitPrice(input.type, input.limitPrice);
  const semanticIdentity = {
    intentVersion: 1 as const,
    workspaceId,
    paperAccountId,
    tradingSessionId,
    sessionFencingToken,
    mode: 'paper' as const,
    origin: 'manual' as const,
    instrument,
    side: input.side,
    type: input.type,
    positionEffect,
    quantity: quantity.toString(),
    limitPrice,
    marketCheckpoint,
    occurredAt: input.occurredAt,
  };
  const intentHash = sha256(stableJson(semanticIdentity));
  const orderId = `ord_${sha256(`${workspaceId}:${clientOrderId}`).slice(0, 32)}`;

  return deepFreeze({
    ...semanticIdentity,
    orderId,
    clientOrderId,
    intentHash,
    idempotencyKey,
    actorId,
    correlationId: optional(input.correlationId),
    recordedAt: input.recordedAt,
  });
}

function normalizeLimitPrice(type: OrderType, value: string | null | undefined): string | null {
  if (type === OrderType.MARKET) {
    if (value !== undefined && value !== null) {
      throw new Error('market order intent cannot have a limit price');
    }
    return null;
  }
  if (value === undefined || value === null) {
    throw new Error('limit order intent requires a limit price');
  }
  return storageDecimal(value, 'limit price').assertPositive('limit price').toString();
}

function normalizeCheckpoint(input: OrderMarketCheckpoint): OrderMarketCheckpoint {
  return Object.freeze({
    streamId: required(input.streamId, 'market checkpoint stream id'),
    sequence: nonNegativeInteger(input.sequence, 'market checkpoint sequence'),
    eventId: required(input.eventId, 'market checkpoint event id'),
  });
}

function storageDecimal(value: string, label: string): FinancialDecimal {
  const decimal = FinancialDecimal.from(value);
  const normalized = decimal.toString();
  const unsigned = normalized.startsWith('-') ? normalized.slice(1) : normalized;
  const [integer, fraction = ''] = unsigned.split('.');
  if (integer.length > 20 || fraction.length > 18) {
    throw new Error(`${label} exceeds DECIMAL(38,18) storage precision`);
  }
  return decimal;
}

function normalizeInstrument(value: string): string {
  const result = required(value, 'instrument').toUpperCase();
  if (!/^[A-Z0-9:_-]{2,40}$/.test(result)) {
    throw new Error('instrument has invalid format');
  }
  return result;
}

function identifier(value: string, label: string): string {
  const result = required(value, label);
  if (!/^[A-Za-z0-9._:-]{1,128}$/.test(result)) {
    throw new Error(`${label} has invalid format`);
  }
  return result;
}

function required(value: string, label: string): string {
  const result = value.trim();
  if (result === '') throw new Error(`${label} is required`);
  return result;
}

function optional(value: string | undefined): string | null {
  const result = value?.trim();
  return result ? result : null;
}

function positiveInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value <= 0)
    throw new Error(`${label} must be a positive integer`);
  return value;
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

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`)
    .join(',')}}`;
}

function deepFreeze<T extends object>(value: T): Readonly<T> {
  for (const nested of Object.values(value)) {
    if (nested && typeof nested === 'object') Object.freeze(nested);
  }
  return Object.freeze(value);
}
