import { Inject, Injectable, Optional } from '@nestjs/common';
import type { Instrument } from '../../market-data/instrument';
import type { MarketDataSourceId } from '../domain/market-data-source';
import {
  createMarketStatusEvent,
  MarketHealthStatus,
  type MarketStatusEvent,
} from '../domain/market-status';
import { buildMarketStreamId } from '../domain/market-stream-identity';
import { MarketStreamChannel } from '../domain/market-stream-channel';
import {
  evaluateMarketHealth,
  type MarketHealthEvaluationInput,
  type MarketStalenessPolicy,
  DEFAULT_MARKET_STALENESS_POLICY,
} from './market-health-evaluator';
import { assertMarketHealthTransition } from './market-health-transitions';

/** Optional Nest DI token — absent means DEFAULT_MARKET_STALENESS_POLICY. */
export const MARKET_STALENESS_POLICY = Symbol('MARKET_STALENESS_POLICY');

export type MarketStatusStreamKey = {
  workspaceId: string;
  sourceId: MarketDataSourceId | string;
  instrument: Instrument | string;
};

export type MarketStatusSnapshot = Readonly<{
  workspaceId: string;
  sourceId: string;
  instrument: string;
  streamId: string;
  status: MarketHealthStatus;
  sequence: number;
  reason: string | null;
  updatedAt: string;
  /** Last operational activity used for freshness (never domain candle time). */
  lastOperationalMessageAt: string | null;
}>;

export type ApplyMarketStatusInput = MarketStatusStreamKey &
  MarketHealthEvaluationInput & {
    reason?: string;
    /** Operational stamps for the status event envelope. */
    recordedAt: string;
  };

/**
 * Market status and staleness model (US144).
 * Tracks per-stream operational health, enforces explicit transitions, and
 * emits durable versioned MarketStatusChanged events. Never mutates OHLCV/price.
 */
@Injectable()
export class MarketStatusService {
  private readonly byStream = new Map<string, MutableStatus>();
  private readonly policy: MarketStalenessPolicy;
  private readonly emitted: MarketStatusEvent[] = [];

  constructor(
    @Optional()
    @Inject(MARKET_STALENESS_POLICY)
    policy?: Partial<MarketStalenessPolicy>,
  ) {
    this.policy = Object.freeze({
      ...DEFAULT_MARKET_STALENESS_POLICY,
      ...policy,
    });
  }

  getPolicy(): MarketStalenessPolicy {
    return this.policy;
  }

  get(workspaceId: string, streamId: string): MarketStatusSnapshot | null {
    const row = this.byStream.get(key(workspaceId, streamId));
    return row ? freezeSnapshot(row) : null;
  }

  listByWorkspace(workspaceId: string): ReadonlyArray<MarketStatusSnapshot> {
    return Object.freeze(
      [...this.byStream.values()]
        .filter((row) => row.workspaceId === workspaceId)
        .map(freezeSnapshot),
    );
  }

  /** Test/observability helper — emitted durable status events in order. */
  emittedEvents(): ReadonlyArray<MarketStatusEvent> {
    return Object.freeze([...this.emitted]);
  }

  /**
   * Evaluate inputs, apply an explicit transition if status changes, and
   * emit a durable versioned MarketStatusChanged event.
   */
  apply(input: ApplyMarketStatusInput): {
    snapshot: MarketStatusSnapshot;
    changed: boolean;
    event: MarketStatusEvent | null;
  } {
    const streamId = String(
      buildMarketStreamId({
        workspaceId: input.workspaceId,
        sourceId: input.sourceId,
        instrument: input.instrument,
        channel: MarketStreamChannel.MARKET_STATUS,
      }),
    );
    const mapKey = key(input.workspaceId, streamId);
    const nextStatus = evaluateMarketHealth({
      connection: input.connection,
      gapFree: input.gapFree,
      lastOperationalMessageAt: input.lastOperationalMessageAt,
      now: input.now,
      unresolvedGap: input.unresolvedGap,
      policy: this.policy,
    });

    let row = this.byStream.get(mapKey);
    if (!row) {
      row = {
        workspaceId: input.workspaceId,
        sourceId: String(input.sourceId),
        instrument: String(input.instrument),
        streamId,
        status: MarketHealthStatus.UNKNOWN,
        sequence: 0,
        reason: null,
        updatedAt: input.recordedAt,
        lastOperationalMessageAt: null,
      };
      this.byStream.set(mapKey, row);
    }

    row.lastOperationalMessageAt = input.lastOperationalMessageAt;

    if (row.status === nextStatus) {
      row.updatedAt = input.recordedAt;
      return { snapshot: freezeSnapshot(row), changed: false, event: null };
    }

    assertMarketHealthTransition(row.status, nextStatus);
    row.status = nextStatus;
    row.sequence += 1;
    row.reason = input.reason ?? `status -> ${nextStatus}`;
    row.updatedAt = input.recordedAt;

    const event = createMarketStatusEvent({
      workspaceId: row.workspaceId,
      sourceId: row.sourceId,
      instrument: row.instrument,
      streamId: row.streamId,
      sequence: row.sequence,
      status: row.status,
      reason: row.reason,
      schemaVersion: 1,
      exchangeOccurredAt: input.recordedAt,
      occurredAt: input.recordedAt,
      receivedAt: input.recordedAt,
      processedAt: input.recordedAt,
      recordedAt: input.recordedAt,
    });
    this.emitted.push(event);

    return { snapshot: freezeSnapshot(row), changed: true, event };
  }
}

type MutableStatus = {
  workspaceId: string;
  sourceId: string;
  instrument: string;
  streamId: string;
  status: MarketHealthStatus;
  sequence: number;
  reason: string | null;
  updatedAt: string;
  lastOperationalMessageAt: string | null;
};

function key(workspaceId: string, streamId: string): string {
  return `${workspaceId}::${streamId}`;
}

function freezeSnapshot(row: MutableStatus): MarketStatusSnapshot {
  return Object.freeze({
    workspaceId: row.workspaceId,
    sourceId: row.sourceId,
    instrument: row.instrument,
    streamId: row.streamId,
    status: row.status,
    sequence: row.sequence,
    reason: row.reason,
    updatedAt: row.updatedAt,
    lastOperationalMessageAt: row.lastOperationalMessageAt,
  });
}
