import { Injectable } from '@nestjs/common';
import type { ConsumerProjectionHandler } from '../../event-processing/domain/consumer-apply-result';
import type { DurableEventEnvelope } from '../../event-processing/domain/durable-event-envelope';
import { ConsumerCheckpointStatus } from '../../event-processing/domain/consumer-checkpoint';
import { toConsumerId } from '../../event-processing/domain/consumer-id';
import { IdempotentConsumerProcessor } from '../../event-processing/idempotent-consumer.processor';
import type { InboxRepository } from '../../event-processing/repositories/inbox.repository';
import type { ConsumerCheckpointRepository } from '../../event-processing/repositories/consumer-checkpoint.repository';
import type { DurableMarketCheckpoint } from '../checkpoints/market-checkpoint-persistence';
import type { MarketProjectionBroadcaster } from '../api/market-projection-broadcaster';
import type { MarketCheckpointStore } from '../checkpoints/market-checkpoint-store';
import { isClosedCandleEvent, isMarkPriceEvent, type MarketEvent } from '../domain/market-event';
import { toDurableMarketEnvelope } from '../../event-processing/domain/to-durable-market-envelope';
import {
  LATEST_MARKET_STATE_CONSUMER_ID,
  LATEST_MARKET_STATE_CONSUMER_VERSION,
  type LatestMarketState,
} from './latest-market-state';

/**
 * Latest market-state projection (US143 / ADR-013).
 * Applies via Inbox idempotency; rebuildable from retained events + checkpoints.
 * Workspace- and stream-scoped. No strategy / Position / Portfolio / Risk logic.
 * Optional broadcaster fan-out is detached from apply (US147).
 */
@Injectable()
export class LatestMarketStateProjection {
  private readonly byStream = new Map<string, LatestMarketState>();
  private readonly processor: IdempotentConsumerProcessor;
  private readonly handler: ConsumerProjectionHandler<LatestMarketState>;
  private readonly inbox: InboxRepository;
  private readonly consumerCheckpoints: ConsumerCheckpointRepository;

  constructor(
    inbox: InboxRepository,
    consumerCheckpoints: ConsumerCheckpointRepository,
    private readonly marketCheckpoints: MarketCheckpointStore,
    private readonly broadcaster: MarketProjectionBroadcaster | null = null,
  ) {
    this.inbox = inbox;
    this.consumerCheckpoints = consumerCheckpoints;
    this.processor = new IdempotentConsumerProcessor(inbox, consumerCheckpoints);
    this.handler = {
      consumerId: LATEST_MARKET_STATE_CONSUMER_ID,
      consumerVersion: LATEST_MARKET_STATE_CONSUMER_VERSION,
      apply: (event, current) => this.applyEvent(event, current),
      getProjection: (workspaceId, streamId) => this.get(workspaceId, streamId),
      saveProjection: (workspaceId, streamId, projection) => {
        this.byStream.set(key(workspaceId, streamId), projection);
        this.broadcaster?.publish(projection, new Date().toISOString(), 'update');
      },
      clearProjection: (workspaceId, streamId) => {
        this.byStream.delete(key(workspaceId, streamId));
      },
    };
  }

  get(workspaceId: string, streamId: string): LatestMarketState | null {
    const found = this.byStream.get(key(workspaceId, streamId));
    if (!found || found.workspaceId !== workspaceId) return null;
    return found;
  }

  listByWorkspace(workspaceId: string): ReadonlyArray<LatestMarketState> {
    return Object.freeze(
      [...this.byStream.values()].filter((row) => row.workspaceId === workspaceId),
    );
  }

  /**
   * Apply a market event through Inbox idempotency.
   */
  async apply(event: MarketEvent, processedAt: string) {
    const envelope = toDurableMarketEnvelope(event);
    return this.processor.process(envelope, this.handler, processedAt);
  }

  /**
   * Rebuild projection from retained ordered events and optional checkpoint seed (US143).
   * Clears existing projection, Inbox entries, and consumer checkpoint for the stream,
   * then replays through the same Inbox-idempotent path.
   */
  async rebuild(options: {
    workspaceId: string;
    streamId: string;
    events: ReadonlyArray<MarketEvent>;
    checkpoint?: DurableMarketCheckpoint | null;
    rebuiltAt: string;
  }): Promise<LatestMarketState | null> {
    this.byStream.delete(key(options.workspaceId, options.streamId));

    const ordered = [...options.events]
      .filter(
        (event) =>
          event.workspaceId === options.workspaceId && String(event.streamId) === options.streamId,
      )
      .sort((a, b) => a.sequence - b.sequence);

    const consumerId = toConsumerId(LATEST_MARKET_STATE_CONSUMER_ID);
    for (const event of ordered) {
      await this.inbox.remove(consumerId, String(event.eventId));
    }
    await this.consumerCheckpoints.save(
      Object.freeze({
        consumerId,
        consumerVersion: LATEST_MARKET_STATE_CONSUMER_VERSION,
        streamId: options.streamId,
        workspaceId: options.workspaceId,
        lastAppliedSequence: 0,
        lastAppliedEventId: null,
        status: ConsumerCheckpointStatus.READY,
        blockedSequence: null,
        lastError: null,
        updatedAt: options.rebuiltAt,
      }),
    );

    for (const event of ordered) {
      await this.apply(event, options.rebuiltAt);
    }

    let state = this.get(options.workspaceId, options.streamId);
    const checkpoint =
      options.checkpoint ??
      (await this.marketCheckpoints.get(options.workspaceId, options.streamId));

    if (!state && checkpoint) {
      state = emptyStateFromCheckpoint(checkpoint, options.rebuiltAt);
      this.byStream.set(key(options.workspaceId, options.streamId), state);
    } else if (state && checkpoint) {
      state = Object.freeze({
        ...state,
        checkpoint,
        updatedAt: options.rebuiltAt,
      });
      this.byStream.set(key(options.workspaceId, options.streamId), state);
    }

    return state;
  }

  private applyEvent(
    envelope: DurableEventEnvelope,
    current: LatestMarketState | null,
  ): LatestMarketState {
    const payload = reconstructMarketEvent(envelope);
    const base: LatestMarketState =
      current ??
      Object.freeze({
        workspaceId: envelope.workspaceId,
        streamId: envelope.aggregateId,
        sourceId: String(payload.sourceId),
        instrument: String(payload.instrument),
        channel: String(payload.channel),
        ...(isClosedCandleEvent(payload) ? { timeframe: String(payload.timeframe) } : {}),
        latestClosedCandle: null,
        latestMarkPrice: null,
        checkpoint: null,
        freshnessAt: null,
        projectionVersion: 0,
        updatedAt: envelope.recordedAt,
      });

    let latestClosedCandle = base.latestClosedCandle;
    let latestMarkPrice = base.latestMarkPrice;
    if (isClosedCandleEvent(payload)) {
      latestClosedCandle = payload;
    } else if (isMarkPriceEvent(payload)) {
      latestMarkPrice = payload;
    }

    return Object.freeze({
      ...base,
      latestClosedCandle,
      latestMarkPrice,
      freshnessAt: payload.occurredAt,
      projectionVersion: base.projectionVersion + 1,
      updatedAt: envelope.recordedAt,
    });
  }
}

function key(workspaceId: string, streamId: string): string {
  return `${workspaceId}::${streamId}`;
}

function reconstructMarketEvent(envelope: DurableEventEnvelope): MarketEvent {
  return {
    ...(envelope.payload as object),
    eventId: envelope.eventId,
    eventType: envelope.eventType,
    schemaVersion: envelope.schemaVersion,
    workspaceId: envelope.workspaceId,
    streamId: envelope.aggregateId,
    sequence: envelope.aggregateVersion,
    occurredAt: envelope.occurredAt,
    recordedAt: envelope.recordedAt,
  } as unknown as MarketEvent;
}

function emptyStateFromCheckpoint(
  checkpoint: DurableMarketCheckpoint,
  updatedAt: string,
): LatestMarketState {
  return Object.freeze({
    workspaceId: checkpoint.workspaceId,
    streamId: String(checkpoint.streamId),
    sourceId: String(checkpoint.sourceId),
    instrument: String(checkpoint.instrument),
    channel: String(checkpoint.channel),
    ...(checkpoint.timeframe !== undefined ? { timeframe: String(checkpoint.timeframe) } : {}),
    latestClosedCandle: null,
    latestMarkPrice: null,
    checkpoint,
    freshnessAt: checkpoint.lastOccurredAt,
    projectionVersion: 0,
    updatedAt,
  });
}
