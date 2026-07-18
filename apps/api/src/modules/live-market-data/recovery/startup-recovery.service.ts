import type { Timeframe } from '../../market-data/timeframe';
import type { DurableMarketCheckpoint } from '../checkpoints/market-checkpoint-persistence';
import type { MarketCheckpointStore } from '../checkpoints/market-checkpoint-store';
import { detectClosedCandleGap } from '../integrity/closed-candle-gap';
import type { ClosedCandleGapRecoveryService } from '../integrity/gap-recovery-service';
import {
  createInitialIntegrityState,
  MarketStreamIntegrityStatus,
} from '../integrity/market-stream-integrity-state';
import type { MarketStreamIntegrityController } from '../integrity/market-stream-integrity-controller';
import { timeframeDurationMs } from '../integrity/timeframe-duration';
import { mapBackfillBarToClosedCandleDraft } from '../integrity/map-backfill-bar-to-draft';
import { MarketStreamChannel } from '../domain/market-stream-channel';
import { MarketHealthStatus } from '../domain/market-status';
import type { MarketSubscription } from '../domain/market-subscription';
import { MarketSubscriptionState } from '../domain/market-subscription';
import type { MarketEvent } from '../domain/market-event';
import type { MarketDataValidator } from '../normalization/market-data-validator';
import type { LiveMarketConnector } from '../ports/live-market-connector';
import type { MarketSubscriptionRegistry } from '../subscriptions/market-subscription-registry';
import { LiveEventBuffer } from './live-event-buffer';

export type StartupRecoveryDeps = {
  subscriptions: MarketSubscriptionRegistry;
  checkpoints: MarketCheckpointStore;
  integrity: MarketStreamIntegrityController;
  validator: MarketDataValidator;
  /** Optional — used when a deferred live event exposes a mid-stream gap. */
  gapRecovery?: ClosedCandleGapRecoveryService;
  connector: LiveMarketConnector & { markGapRecoveryComplete?: () => void };
  now?: () => string;
};

export type StreamRecoveryReport = Readonly<{
  streamId: string;
  subscriptionId: string;
  checkpointSequence: number | null;
  gapTriggered: boolean;
  gapClosed: boolean;
  bufferedDrained: number;
  health: MarketHealthStatus;
  liveEnabled: boolean;
}>;

export type StartupRecoveryResult = Readonly<{
  restoredSubscriptions: number;
  reports: ReadonlyArray<StreamRecoveryReport>;
  /** True only when every restored stream finished checkpoint reconciliation. */
  allHealthy: boolean;
}>;

/**
 * Startup recovery and resubscription (US142 / ADR-014).
 * Loads durable subscriptions/checkpoints (not process memory), reconnects,
 * detects elapsed gaps, backfills, drains buffered live events, then enables
 * live delivery. Healthy only after checkpoint reconciliation.
 */
export class StartupRecoveryService {
  private readonly buffer = new LiveEventBuffer();
  private readonly now: () => string;

  constructor(private readonly deps: StartupRecoveryDeps) {
    this.now = deps.now ?? (() => new Date().toISOString());
  }

  getBuffer(): LiveEventBuffer {
    return this.buffer;
  }

  /**
   * Offer a live market event during/after recovery.
   * Deferred until the stream is reconciled.
   */
  offerLiveEvent(event: MarketEvent): 'live' | 'buffered' {
    return this.buffer.offer(event);
  }

  async recover(): Promise<StartupRecoveryResult> {
    const at = this.now();

    // 1. Load durable desired state — never start from empty process memory.
    await this.deps.subscriptions.hydrate();
    const desired = this.deps.subscriptions
      .desiredFor(this.deps.connector.sourceId)
      .filter((row) => row.state !== MarketSubscriptionState.STOPPED);

    // 2. Reconnect connector and resubscribe idempotently.
    await this.deps.connector.connect();
    for (const sub of desired) {
      await this.deps.connector.subscribe({
        workspaceId: sub.workspaceId,
        instrument: sub.instrument,
        channel: sub.channel,
        ...(sub.timeframe !== undefined ? { timeframe: sub.timeframe } : {}),
      });
      await this.deps.subscriptions.markActive(sub.workspaceId, String(sub.id), at);
    }

    const reports: StreamRecoveryReport[] = [];
    for (const sub of desired) {
      reports.push(await this.reconcileStream(sub, at));
    }

    return Object.freeze({
      restoredSubscriptions: desired.length,
      reports: Object.freeze(reports),
      allHealthy: reports.every(
        (row) => row.liveEnabled && row.health === MarketHealthStatus.HEALTHY,
      ),
    });
  }

  private async reconcileStream(
    sub: MarketSubscription,
    at: string,
  ): Promise<StreamRecoveryReport> {
    const streamId = String(sub.streamId);
    const checkpoint = await this.deps.checkpoints.get(sub.workspaceId, streamId);

    // Seed integrity from durable checkpoint (survives restart).
    if (checkpoint) {
      this.deps.integrity.seed(
        createInitialIntegrityState({
          streamId: checkpoint.streamId,
          workspaceId: checkpoint.workspaceId,
          updatedAt: checkpoint.updatedAt,
          lastAppliedSequence: checkpoint.lastSequence,
          lastEventId: checkpoint.lastEventId,
          lastOccurredAt: checkpoint.lastOccurredAt,
        }),
      );
      this.deps.integrity.markRecovering(streamId, at, 'startup checkpoint reconciliation');
    }

    let gapTriggered = false;
    let gapClosed = true;

    if (
      sub.channel === MarketStreamChannel.CLOSED_CANDLE &&
      sub.timeframe !== undefined &&
      checkpoint?.lastOccurredAt
    ) {
      const currentOpen = alignOpenTime(at, sub.timeframe);
      const gap = detectClosedCandleGap({
        streamId,
        timeframe: sub.timeframe,
        lastAcceptedOpenTime: checkpoint.lastOccurredAt,
        nextObservedOpenTime: currentOpen,
      });
      if (gap) {
        gapTriggered = true;
        gapClosed = await this.backfillElapsed(
          sub,
          checkpoint,
          gap.fromOpenTime,
          gap.toOpenTime,
          at,
        );
      }
    }

    // Drain buffered live events in order after gap repair.
    const drained = this.buffer.drain(streamId);
    let drainedCount = 0;
    for (const event of drained) {
      const result = this.deps.integrity.admit(event, at);
      if (
        result.outcome === 'accepted' ||
        result.outcome === 'duplicate' ||
        result.outcome === 'stale'
      ) {
        drainedCount += 1;
      } else if (result.outcome === 'deferred_gap') {
        gapClosed = false;
        break;
      }
    }

    const integrityState = this.deps.integrity.getState(streamId);
    const reconciled =
      gapClosed &&
      (integrityState === null ||
        integrityState.status === MarketStreamIntegrityStatus.READY ||
        integrityState.status === MarketStreamIntegrityStatus.RECOVERING ||
        (!checkpoint && integrityState.status !== MarketStreamIntegrityStatus.BLOCKED_GAP));

    // If still blocked/unresolved after drain, do not go healthy.
    const blocked =
      integrityState?.status === MarketStreamIntegrityStatus.BLOCKED_GAP ||
      integrityState?.status === MarketStreamIntegrityStatus.UNRESOLVED_GAP;

    let health = MarketHealthStatus.RECOVERING;
    let liveEnabled = false;
    if (reconciled && !blocked) {
      if (integrityState) {
        this.deps.integrity.markReady(streamId, at);
      }
      this.buffer.enableLive(streamId);
      this.deps.connector.markGapRecoveryComplete?.();
      health = MarketHealthStatus.HEALTHY;
      liveEnabled = true;
    } else if (integrityState?.status === MarketStreamIntegrityStatus.UNRESOLVED_GAP) {
      health = MarketHealthStatus.DEGRADED;
    }

    return Object.freeze({
      streamId,
      subscriptionId: String(sub.id),
      checkpointSequence: checkpoint?.lastSequence ?? null,
      gapTriggered,
      gapClosed,
      bufferedDrained: drainedCount,
      health,
      liveEnabled,
    });
  }

  private async backfillElapsed(
    sub: MarketSubscription,
    checkpoint: DurableMarketCheckpoint,
    fromOpenTime: string,
    toOpenTime: string,
    at: string,
  ): Promise<boolean> {
    if (sub.timeframe === undefined) return true;
    const durationMs = timeframeDurationMs(sub.timeframe);
    const toIso = new Date(Date.parse(toOpenTime) + durationMs - 1).toISOString();

    const bars = await this.deps.connector.backfill({
      workspaceId: sub.workspaceId,
      instrument: sub.instrument,
      timeframe: sub.timeframe,
      from: fromOpenTime,
      to: toIso,
    });

    let nextSequence = checkpoint.lastSequence + 1;
    const expectedOpens = new Set<string>();
    for (let t = Date.parse(fromOpenTime); t <= Date.parse(toOpenTime); t += durationMs) {
      expectedOpens.add(new Date(t).toISOString());
    }

    const covered = new Set<string>();
    for (const bar of [...bars].sort((a, b) => a.openTime.localeCompare(b.openTime))) {
      const draft = mapBackfillBarToClosedCandleDraft({
        bar,
        workspaceId: sub.workspaceId,
        sourceId: sub.sourceId,
        sequence: nextSequence,
        receivedAt: at,
        processedAt: at,
        recordedAt: at,
      });
      const validated = this.deps.validator.validateClosedCandle({
        draft,
        rawMessage: { recovery: true, openTime: bar.openTime },
        quarantinedAt: at,
      });
      if (validated.outcome === 'quarantined') continue;

      const result = this.deps.integrity.admit(validated.event, at);
      if (result.outcome === 'accepted') {
        nextSequence = result.state.lastAppliedSequence + 1;
        covered.add(validated.event.openTime);
      } else if (result.outcome === 'duplicate') {
        covered.add(bar.openTime);
      }
    }

    const missing = [...expectedOpens].filter((open) => !covered.has(open));
    if (missing.length > 0) {
      this.deps.integrity.markUnresolvedGap(
        String(sub.streamId),
        at,
        `startup unresolved missing open times: ${missing.join(',')}`,
      );
      return false;
    }
    return true;
  }
}

function alignOpenTime(iso: string, timeframe: Timeframe): string {
  const durationMs = timeframeDurationMs(timeframe);
  const ms = Date.parse(iso);
  return new Date(Math.floor(ms / durationMs) * durationMs).toISOString();
}
