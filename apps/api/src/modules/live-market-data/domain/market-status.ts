import { toInstrument, type Instrument } from '../../market-data/instrument';
import { assertNonEmpty, assertNonNegativeInteger, freezeDeep } from './assert';
import type { MarketEventEnvelope } from './market-event-envelope';
import { MarketEventType } from './market-event-type';
import { toMarketEventId, type MarketEventId } from './market-event-id';
import { toMarketDataSourceId, type MarketDataSourceId } from './market-data-source';
import { MarketStreamChannel } from './market-stream-channel';
import { toMarketStreamId, type MarketStreamId } from './market-stream-id';
import type { MarketEventTimestampInput } from './market-event-timestamps';
import { resolveMarketEventTimestamps } from './resolve-market-event-timestamps';
import { buildMarketStatusSemanticIdentity } from './market-event-identity';
import { buildMarketStreamId } from './market-stream-identity';

/**
 * Market stream health / status values (US126 / US144).
 * Operational state only — never alters candle/price business semantics.
 *
 * US144 required surface: disconnected, connecting, recovering, healthy,
 * stale, unavailable, failed. `unknown`/`degraded` remain for bootstrap and
 * unresolved-gap reporting.
 */
export enum MarketHealthStatus {
  UNKNOWN = 'unknown',
  CONNECTING = 'connecting',
  HEALTHY = 'healthy',
  /** Operationally connected but data is older than the staleness threshold. */
  STALE = 'stale',
  DEGRADED = 'degraded',
  RECOVERING = 'recovering',
  /** Required stream cannot become healthy (unresolved gap / hard block). */
  UNAVAILABLE = 'unavailable',
  DISCONNECTED = 'disconnected',
  FAILED = 'failed',
}

export function isMarketHealthStatus(value: string): value is MarketHealthStatus {
  return (Object.values(MarketHealthStatus) as string[]).includes(value);
}

/**
 * Immutable market status event (US126, US127).
 * Observability only — no trading decisions.
 */
export type MarketStatusEvent = MarketEventEnvelope &
  Readonly<{
    eventType: MarketEventType.STATUS_CHANGED;
    channel: MarketStreamChannel.MARKET_STATUS;
    status: MarketHealthStatus;
    reason?: string;
  }>;

export type MarketStatusEventInput = {
  eventId?: MarketEventId | string;
  schemaVersion?: number;
  workspaceId: string;
  sourceId: MarketDataSourceId | string;
  instrument: Instrument | string;
  streamId?: MarketStreamId | string;
  sequence: number;
  status: MarketHealthStatus | string;
  reason?: string;
} & MarketEventTimestampInput;

export function createMarketStatusEvent(input: MarketStatusEventInput): MarketStatusEvent {
  const workspaceId = assertNonEmpty(input.workspaceId, 'workspaceId');
  const instrument = toInstrument(assertNonEmpty(String(input.instrument), 'instrument'));
  const sourceId = toMarketDataSourceId(assertNonEmpty(String(input.sourceId), 'sourceId'));
  const schemaVersion = input.schemaVersion ?? 1;
  assertNonNegativeInteger(schemaVersion, 'schemaVersion');
  if (schemaVersion < 1) {
    throw new Error('schemaVersion must be greater than or equal to 1');
  }
  assertNonNegativeInteger(input.sequence, 'sequence');
  const timestamps = resolveMarketEventTimestamps(input);

  if (!isMarketHealthStatus(String(input.status))) {
    throw new Error('status must be a supported MarketHealthStatus');
  }
  const status = input.status as MarketHealthStatus;
  const reason = input.reason === undefined ? undefined : assertNonEmpty(input.reason, 'reason');

  const streamId =
    input.streamId !== undefined
      ? toMarketStreamId(assertNonEmpty(String(input.streamId), 'streamId'))
      : buildMarketStreamId({
          workspaceId,
          sourceId,
          instrument,
          channel: MarketStreamChannel.MARKET_STATUS,
        });

  const semanticIdentity = buildMarketStatusSemanticIdentity({
    workspaceId,
    sourceId,
    instrument,
    channel: MarketStreamChannel.MARKET_STATUS,
    streamId,
    status,
    exchangeOccurredAt: timestamps.exchangeOccurredAt,
    reason,
  });

  const eventId = toMarketEventId(
    assertNonEmpty(String(input.eventId ?? `sem:${semanticIdentity}`), 'eventId'),
  );

  return freezeDeep({
    eventId,
    eventType: MarketEventType.STATUS_CHANGED,
    schemaVersion,
    workspaceId,
    sourceId,
    instrument,
    channel: MarketStreamChannel.MARKET_STATUS,
    streamId,
    sequence: input.sequence,
    semanticIdentity,
    ...timestamps,
    status,
    ...(reason !== undefined ? { reason } : {}),
  });
}
