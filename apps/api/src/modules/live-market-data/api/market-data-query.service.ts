import { Injectable } from '@nestjs/common';
import type { DurableMarketCheckpoint } from '../checkpoints/market-checkpoint-persistence';
import { MarketCheckpointStore } from '../checkpoints/market-checkpoint-store';
import type { ClosedCandleEvent } from '../domain/closed-candle-event';
import type { MarkPriceEvent } from '../domain/mark-price-event';
import type { MarketSubscription } from '../domain/market-subscription';
import type { LatestMarketState } from '../projection/latest-market-state';
import { LatestMarketStateProjection } from '../projection/latest-market-state-projection';
import { MarketStatusService, type MarketStatusSnapshot } from '../status/market-status.service';
import { MarketSubscriptionRegistry } from '../subscriptions/market-subscription-registry';
import type {
  MarketCheckpointView,
  MarketClosedCandleView,
  MarketLatestStateView,
  MarketMarkPriceView,
  MarketStreamDetailView,
  MarketStreamStatusView,
  MarketSubscriptionView,
} from './market-data-views';

const FORBIDDEN_PROVIDER_KEYS = new Set([
  'binance',
  'filterType',
  'tickSize',
  'stepSize',
  'bookTicker',
  'kline',
  'e',
  'E',
  's',
  'k',
  'x',
  'raw',
  'payload',
]);

function assertCanonical<T extends object>(view: T): T {
  assertNoForbiddenKeys(view);
  return view;
}

function assertNoForbiddenKeys(value: unknown, path = ''): void {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      assertNoForbiddenKeys(value[i], `${path}[${i}]`);
    }
    return;
  }
  if (typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_PROVIDER_KEYS.has(key)) {
      throw new Error(`provider-specific field leaked into API view: ${path}${key}`);
    }
    assertNoForbiddenKeys(child, `${path}${key}.`);
  }
}

/**
 * Read-only market-data query facade (US146 / ADR-017).
 * Assembles workspace-scoped canonical views. No Orders/Sessions/strategy.
 */
@Injectable()
export class MarketDataQueryService {
  constructor(
    private readonly subscriptions: MarketSubscriptionRegistry,
    private readonly status: MarketStatusService,
    private readonly latest: LatestMarketStateProjection,
    private readonly checkpoints: MarketCheckpointStore,
  ) {}

  listSubscriptions(workspaceId: string): ReadonlyArray<MarketSubscriptionView> {
    return Object.freeze(this.subscriptions.list(workspaceId).map(toSubscriptionView));
  }

  getSubscription(workspaceId: string, id: string): MarketSubscriptionView | null {
    const row = this.subscriptions.get(workspaceId, id);
    return row ? toSubscriptionView(row) : null;
  }

  listStatuses(workspaceId: string): ReadonlyArray<MarketStreamStatusView> {
    return Object.freeze(this.status.listByWorkspace(workspaceId).map(toStatusView));
  }

  getStatus(workspaceId: string, streamId: string): MarketStreamStatusView | null {
    const row = this.status.get(workspaceId, streamId);
    return row ? toStatusView(row) : null;
  }

  listLatest(workspaceId: string): ReadonlyArray<MarketLatestStateView> {
    return Object.freeze(this.latest.listByWorkspace(workspaceId).map(toLatestView));
  }

  getLatest(workspaceId: string, streamId: string): MarketLatestStateView | null {
    const row = this.latest.get(workspaceId, streamId);
    return row ? toLatestView(row) : null;
  }

  async listCheckpoints(workspaceId: string): Promise<ReadonlyArray<MarketCheckpointView>> {
    const rows = await this.checkpoints.listByWorkspace(workspaceId);
    return Object.freeze(rows.map(toCheckpointView));
  }

  async getCheckpoint(workspaceId: string, streamId: string): Promise<MarketCheckpointView | null> {
    const row = await this.checkpoints.get(workspaceId, streamId);
    return row ? toCheckpointView(row) : null;
  }

  async getStreamDetail(
    workspaceId: string,
    streamId: string,
  ): Promise<MarketStreamDetailView | null> {
    const subscription =
      this.subscriptions.list(workspaceId).find((row) => String(row.streamId) === streamId) ?? null;
    const status = this.status.get(workspaceId, streamId);
    const latest = this.latest.get(workspaceId, streamId);
    const checkpoint = await this.checkpoints.get(workspaceId, streamId);

    if (!subscription && !status && !latest && !checkpoint) {
      return null;
    }

    return Object.freeze({
      workspaceId,
      streamId,
      subscription: subscription ? toSubscriptionView(subscription) : null,
      status: status ? toStatusView(status) : null,
      latest: latest ? toLatestView(latest) : null,
      checkpoint: checkpoint ? toCheckpointView(checkpoint) : null,
    });
  }
}

export function toSubscriptionView(row: MarketSubscription): MarketSubscriptionView {
  return assertCanonical(
    Object.freeze({
      id: String(row.id),
      workspaceId: row.workspaceId,
      sourceId: String(row.sourceId),
      instrument: String(row.instrument),
      channel: String(row.channel),
      streamId: String(row.streamId),
      ...(row.timeframe !== undefined ? { timeframe: String(row.timeframe) } : {}),
      state: String(row.state),
      updatedAt: row.updatedAt,
    }),
  );
}

export function toStatusView(row: MarketStatusSnapshot): MarketStreamStatusView {
  return assertCanonical(
    Object.freeze({
      workspaceId: row.workspaceId,
      sourceId: row.sourceId,
      instrument: row.instrument,
      streamId: row.streamId,
      status: String(row.status),
      sequence: row.sequence,
      reason: row.reason,
      updatedAt: row.updatedAt,
      lastOperationalMessageAt: row.lastOperationalMessageAt,
      operationalOnly: true as const,
    }),
  );
}

export function toCheckpointView(row: DurableMarketCheckpoint): MarketCheckpointView {
  return assertCanonical(
    Object.freeze({
      workspaceId: row.workspaceId,
      streamId: String(row.streamId),
      sourceId: String(row.sourceId),
      instrument: String(row.instrument),
      channel: String(row.channel),
      ...(row.timeframe !== undefined ? { timeframe: String(row.timeframe) } : {}),
      lastSequence: row.lastSequence,
      lastEventId: row.lastEventId !== null ? String(row.lastEventId) : null,
      lastOccurredAt: row.lastOccurredAt,
      health: String(row.health),
      heartbeatAt: row.heartbeatAt,
      updatedAt: row.updatedAt,
    }),
  );
}

export function toLatestView(row: LatestMarketState): MarketLatestStateView {
  return assertCanonical(
    Object.freeze({
      workspaceId: row.workspaceId,
      streamId: row.streamId,
      sourceId: row.sourceId,
      instrument: row.instrument,
      channel: row.channel,
      ...(row.timeframe !== undefined ? { timeframe: row.timeframe } : {}),
      latestClosedCandle: row.latestClosedCandle
        ? toClosedCandleView(row.latestClosedCandle)
        : null,
      latestMarkPrice: row.latestMarkPrice ? toMarkPriceView(row.latestMarkPrice) : null,
      checkpoint: row.checkpoint ? toCheckpointView(row.checkpoint) : null,
      freshnessAt: row.freshnessAt,
      projectionVersion: row.projectionVersion,
      updatedAt: row.updatedAt,
      authoritative: false as const,
    }),
  );
}

function toClosedCandleView(event: ClosedCandleEvent): MarketClosedCandleView {
  return Object.freeze({
    eventId: String(event.eventId),
    instrument: String(event.instrument),
    timeframe: String(event.timeframe),
    openTime: event.openTime,
    closeTime: event.closeTime,
    open: event.open,
    high: event.high,
    low: event.low,
    close: event.close,
    volume: event.volume,
    exchangeOccurredAt: event.exchangeOccurredAt,
    sequence: event.sequence,
  });
}

function toMarkPriceView(event: MarkPriceEvent): MarketMarkPriceView {
  return Object.freeze({
    eventId: String(event.eventId),
    instrument: String(event.instrument),
    price: event.price,
    exchangeOccurredAt: event.exchangeOccurredAt,
    sequence: event.sequence,
  });
}
