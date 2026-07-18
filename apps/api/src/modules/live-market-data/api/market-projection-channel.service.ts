import { Injectable } from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { LatestMarketStateProjection } from '../projection/latest-market-state-projection';
import {
  MarketProjectionBroadcaster,
  type MarketProjectionCursor,
  type MarketProjectionEnvelope,
} from './market-projection-broadcaster';

export type OpenProjectionChannelInput = {
  workspaceId: string;
  streamId?: string;
  /** Cursor from prior SSE connection (projectionVersion + streamId). */
  cursorVersion?: number;
  cursorStreamId?: string;
  /** When true, emit current latest snapshots immediately (refresh). */
  refresh?: boolean;
  maxBuffered?: number;
  now?: string;
};

/**
 * SSE-oriented live projection channel (US147).
 * Workspace-filtered, cursor-resumable, backpressured; detached from ingestion.
 */
@Injectable()
export class MarketProjectionChannelService {
  constructor(
    private readonly broadcaster: MarketProjectionBroadcaster,
    private readonly latest: LatestMarketStateProjection,
  ) {}

  /**
   * Open an Observable SSE stream of canonical projection envelopes.
   */
  open(input: OpenProjectionChannelInput): Observable<MessageEvent> {
    const afterCursor = resolveCursor(input);
    const sub = this.broadcaster.subscribe({
      workspaceId: input.workspaceId,
      streamId: input.streamId,
      afterCursor,
      maxBuffered: input.maxBuffered,
    });

    const publishedAt = input.now ?? new Date().toISOString();

    return new Observable<MessageEvent>((observer) => {
      // Optional refresh snapshot(s) for reconnect.
      if (input.refresh) {
        const rows =
          input.streamId !== undefined
            ? [this.latest.get(input.workspaceId, input.streamId)].filter(Boolean)
            : this.latest.listByWorkspace(input.workspaceId);
        for (const state of rows) {
          if (!state) continue;
          if (
            afterCursor &&
            state.streamId === afterCursor.streamId &&
            state.projectionVersion <= afterCursor.projectionVersion
          ) {
            continue;
          }
          this.broadcaster.publish(state, publishedAt, 'refresh');
        }
      }

      const timer = setInterval(() => {
        try {
          let next = sub.next();
          while (next) {
            observer.next(toMessageEvent(next));
            next = sub.next();
          }
        } catch (error) {
          // Channel failure must not affect ingestion; close this client only.
          observer.error(error);
        }
      }, 25);

      return () => {
        clearInterval(timer);
        sub.close();
      };
    });
  }
}

function resolveCursor(input: OpenProjectionChannelInput): MarketProjectionCursor | null {
  if (input.cursorVersion === undefined || input.cursorStreamId === undefined) {
    return null;
  }
  return Object.freeze({
    projectionVersion: input.cursorVersion,
    streamId: input.cursorStreamId,
  });
}

function toMessageEvent(envelope: MarketProjectionEnvelope): MessageEvent {
  return {
    data: envelope,
  } as MessageEvent;
}
