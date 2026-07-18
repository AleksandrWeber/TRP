import { Injectable } from '@nestjs/common';
import { MarketHealthStatus } from '../domain/market-status';
import { isMarketStreamHealthy } from '../status/market-health-evaluator';
import type { MarketStatusService } from '../status/market-status.service';

export type RequiredStreamRef = Readonly<{
  workspaceId: string;
  streamId: string;
}>;

export type LiveMarketProbeResult = Readonly<{
  ok: boolean;
  reason: string | null;
  checkedAt: string;
  details: Readonly<Record<string, unknown>>;
}>;

/**
 * Live-market readiness and liveness probes (US145).
 *
 * Readiness fails when a *required* stream cannot become healthy.
 * Liveness does not fail solely because one provider stream is recovering.
 */
@Injectable()
export class LiveMarketHealthProbes {
  private required: RequiredStreamRef[] = [];

  constructor(private readonly status: MarketStatusService) {}

  setRequiredStreams(streams: ReadonlyArray<RequiredStreamRef>): void {
    this.required = [...streams];
  }

  requiredStreams(): ReadonlyArray<RequiredStreamRef> {
    return Object.freeze([...this.required]);
  }

  readiness(checkedAt: string): LiveMarketProbeResult {
    const failing: Array<{ streamId: string; status: string | 'missing' }> = [];
    for (const ref of this.required) {
      const snapshot = this.status.get(ref.workspaceId, ref.streamId);
      if (!snapshot) {
        failing.push({ streamId: ref.streamId, status: 'missing' });
        continue;
      }
      if (!isMarketStreamHealthy(snapshot.status)) {
        failing.push({ streamId: ref.streamId, status: snapshot.status });
      }
    }

    if (failing.length > 0) {
      return Object.freeze({
        ok: false,
        reason: 'required streams are not healthy',
        checkedAt,
        details: Object.freeze({ failing }),
      });
    }

    return Object.freeze({
      ok: true,
      reason: null,
      checkedAt,
      details: Object.freeze({ required: this.required.length }),
    });
  }

  /**
   * Process is live if the status service is reachable.
   * A single stream in RECOVERING must not fail liveness.
   */
  liveness(checkedAt: string, workspaceId?: string): LiveMarketProbeResult {
    const snapshots =
      workspaceId !== undefined
        ? this.status.listByWorkspace(workspaceId)
        : this.status.listByWorkspace(this.required[0]?.workspaceId ?? '');

    const recovering = snapshots.filter((row) => row.status === MarketHealthStatus.RECOVERING);
    const failed = snapshots.filter((row) => row.status === MarketHealthStatus.FAILED);

    // Liveness fails only on total hard failure of all known streams (if any),
    // never solely because of recovery.
    if (snapshots.length > 0 && failed.length === snapshots.length) {
      return Object.freeze({
        ok: false,
        reason: 'all known streams are failed',
        checkedAt,
        details: Object.freeze({
          streamCount: snapshots.length,
          recovering: recovering.length,
          failed: failed.length,
        }),
      });
    }

    return Object.freeze({
      ok: true,
      reason: null,
      checkedAt,
      details: Object.freeze({
        streamCount: snapshots.length,
        recovering: recovering.length,
        failed: failed.length,
      }),
    });
  }
}
