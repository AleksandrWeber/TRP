import { Inject, Injectable } from '@nestjs/common';
import { createMarketCheckpoint } from '../domain/market-checkpoint';
import { isClosedCandleEvent, type MarketEvent } from '../domain/market-event';
import type { MarketHealthStatus } from '../domain/market-status';
import {
  MARKET_CHECKPOINT_PERSISTENCE,
  type DurableMarketCheckpoint,
  type MarketCheckpointPersistence,
} from './market-checkpoint-persistence';

export type AdvanceMarketCheckpointInput = {
  /** Accepted canonical event (post integrity admit). */
  event: MarketEvent;
  health: MarketHealthStatus;
  updatedAt: string;
  /**
   * Must be true only after the event was durably persisted/published
   * (Outbox transaction committed). Checkpoints never advance ahead of it.
   */
  eventDurablyRecorded: boolean;
};

/**
 * Durable market stream checkpoint store (US141 / ADR-018 #25).
 * Advances only after durable event persistence; regression is rejected;
 * operational heartbeat never moves semantic progress.
 */
@Injectable()
export class MarketCheckpointStore {
  constructor(
    @Inject(MARKET_CHECKPOINT_PERSISTENCE)
    private readonly persistence: MarketCheckpointPersistence,
  ) {}

  async get(workspaceId: string, streamId: string): Promise<DurableMarketCheckpoint | null> {
    return this.persistence.load(workspaceId, streamId);
  }

  async listByWorkspace(workspaceId: string): Promise<DurableMarketCheckpoint[]> {
    return this.persistence.listByWorkspace(workspaceId);
  }

  /**
   * Advance semantic progress from an accepted, durably recorded event.
   */
  async advance(input: AdvanceMarketCheckpointInput): Promise<DurableMarketCheckpoint> {
    if (!input.eventDurablyRecorded) {
      throw new Error('checkpoint must not advance before the accepted event is durably recorded');
    }

    const { event } = input;
    const existing = await this.persistence.load(event.workspaceId, String(event.streamId));
    if (existing && event.sequence <= existing.lastSequence) {
      throw new Error(
        `checkpoint regression rejected: sequence ${event.sequence} <= ${existing.lastSequence}`,
      );
    }

    const checkpoint = createMarketCheckpoint({
      workspaceId: event.workspaceId,
      sourceId: event.sourceId,
      instrument: event.instrument,
      channel: event.channel,
      streamId: event.streamId,
      ...(isClosedCandleEvent(event) ? { timeframe: event.timeframe } : {}),
      lastSequence: event.sequence,
      lastEventId: event.eventId,
      lastOccurredAt: event.occurredAt,
      health: input.health,
      updatedAt: input.updatedAt,
    });

    const durable: DurableMarketCheckpoint = Object.freeze({
      ...checkpoint,
      heartbeatAt: existing?.heartbeatAt ?? null,
    });
    await this.persistence.save(durable);
    return durable;
  }

  /**
   * Operational heartbeat only (US141 / ADR-018 #50-#53).
   * Never changes lastSequence / lastEventId / lastOccurredAt / updatedAt.
   */
  async recordHeartbeat(
    workspaceId: string,
    streamId: string,
    heartbeatAt: string,
  ): Promise<DurableMarketCheckpoint> {
    const existing = await this.persistence.load(workspaceId, streamId);
    if (!existing) {
      throw new Error(`no checkpoint for stream: ${streamId}`);
    }
    const next: DurableMarketCheckpoint = Object.freeze({
      ...existing,
      heartbeatAt,
    });
    await this.persistence.save(next);
    return next;
  }
}
