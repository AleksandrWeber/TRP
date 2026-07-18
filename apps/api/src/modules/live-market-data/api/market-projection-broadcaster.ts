import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import type { LatestMarketState } from '../projection/latest-market-state';
import { toLatestView } from './market-data-query.service';
import type { MarketLatestStateView } from './market-data-views';

export type MarketProjectionCursor = Readonly<{
  /** Monotonic projection version last delivered for the stream. */
  projectionVersion: number;
  streamId: string;
}>;

export type MarketProjectionEnvelope = Readonly<{
  type: 'snapshot' | 'update' | 'refresh';
  workspaceId: string;
  streamId: string;
  cursor: MarketProjectionCursor;
  projection: MarketLatestStateView;
  /** Explicit: client cache is never authoritative. */
  authoritative: false;
  publishedAt: string;
}>;

export type MarketProjectionSubscription = Readonly<{
  next: () => MarketProjectionEnvelope | null;
  push: (envelope: MarketProjectionEnvelope) => 'accepted' | 'dropped';
  close: () => void;
  pending: () => number;
  droppedCount: () => number;
}>;

/**
 * Detached fan-out for live market projections (US147).
 * Publish is non-blocking for producers; slow subscribers drop via bounded buffers.
 * Channel failures never throw back into ingestion.
 */
@Injectable()
export class MarketProjectionBroadcaster {
  private readonly subject = new Subject<MarketProjectionEnvelope>();
  private sequence = 0;

  /**
   * Publish a canonical projection update.
   * Never accepts raw provider payloads.
   */
  publish(
    state: LatestMarketState,
    publishedAt: string,
    type: 'snapshot' | 'update' | 'refresh' = 'update',
  ): void {
    try {
      const projection = toLatestView(state);
      const envelope: MarketProjectionEnvelope = Object.freeze({
        type,
        workspaceId: state.workspaceId,
        streamId: state.streamId,
        cursor: Object.freeze({
          projectionVersion: state.projectionVersion,
          streamId: state.streamId,
        }),
        projection,
        authoritative: false as const,
        publishedAt,
      });
      this.sequence += 1;
      this.subject.next(envelope);
    } catch {
      // Channel must never affect market ingestion.
    }
  }

  /**
   * Subscribe with workspace filter, optional stream filter, cursor resume, and backpressure.
   */
  subscribe(options: {
    workspaceId: string;
    streamId?: string;
    /** Resume after this cursor; older/equal updates are skipped. */
    afterCursor?: MarketProjectionCursor | null;
    /** Max queued events per subscriber before drop-oldest. */
    maxBuffered?: number;
  }): MarketProjectionSubscription {
    const maxBuffered = options.maxBuffered ?? 32;
    const queue: MarketProjectionEnvelope[] = [];
    let closed = false;
    let dropped = 0;

    const subscription = this.subject.subscribe((envelope) => {
      if (closed) return;
      if (envelope.workspaceId !== options.workspaceId) return;
      if (options.streamId !== undefined && envelope.streamId !== options.streamId) return;
      if (options.afterCursor) {
        if (
          envelope.streamId === options.afterCursor.streamId &&
          envelope.cursor.projectionVersion <= options.afterCursor.projectionVersion
        ) {
          return;
        }
      }
      if (queue.length >= maxBuffered) {
        queue.shift();
        dropped += 1;
      }
      queue.push(envelope);
    });

    return {
      next: () => {
        if (closed) return null;
        return queue.shift() ?? null;
      },
      push: (envelope) => {
        if (closed) return 'dropped';
        if (envelope.workspaceId !== options.workspaceId) return 'dropped';
        if (queue.length >= maxBuffered) {
          queue.shift();
          dropped += 1;
          queue.push(envelope);
          return 'dropped';
        }
        queue.push(envelope);
        return 'accepted';
      },
      close: () => {
        closed = true;
        subscription.unsubscribe();
        queue.length = 0;
      },
      pending: () => queue.length,
      droppedCount: () => dropped,
    };
  }

  publishedCount(): number {
    return this.sequence;
  }
}
