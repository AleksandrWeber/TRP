import type { MarketEvent } from '../domain/market-event';

/**
 * Per-stream live-event buffer during startup recovery (US142).
 * New live events are deferred until ordering/checkpoint reconciliation is safe.
 */
export class LiveEventBuffer {
  private readonly byStream = new Map<string, MarketEvent[]>();
  private readonly liveEnabled = new Set<string>();

  /** True when the stream may accept live delivery (post-reconciliation). */
  isLive(streamId: string): boolean {
    return this.liveEnabled.has(String(streamId));
  }

  enableLive(streamId: string): void {
    this.liveEnabled.add(String(streamId));
  }

  /**
   * Buffer or pass-through. Returns `buffered` until the stream is live-safe.
   */
  offer(event: MarketEvent): 'live' | 'buffered' {
    const key = String(event.streamId);
    if (this.liveEnabled.has(key)) {
      return 'live';
    }
    const queue = this.byStream.get(key) ?? [];
    queue.push(event);
    this.byStream.set(key, queue);
    return 'buffered';
  }

  /** Drain buffered events in sequence order for ordered merge. */
  drain(streamId: string): ReadonlyArray<MarketEvent> {
    const key = String(streamId);
    const queue = this.byStream.get(key) ?? [];
    this.byStream.delete(key);
    return Object.freeze(
      [...queue].sort(
        (a, b) => a.sequence - b.sequence || a.occurredAt.localeCompare(b.occurredAt),
      ),
    );
  }

  size(streamId: string): number {
    return this.byStream.get(String(streamId))?.length ?? 0;
  }
}
