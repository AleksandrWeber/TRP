import type { ClosedCandleEvent } from '../domain/closed-candle-event';
import { isClosedCandleEvent } from '../domain/market-event';
import { MarketHealthStatus } from '../domain/market-status';
import type { MarketDataSourceId } from '../domain/market-data-source';
import type { MarketStreamId } from '../domain/market-stream-id';
import { MarketDataValidator } from '../normalization/market-data-validator';
import type {
  ClosedCandleBackfillBar,
  LiveMarketBackfillRequest,
  LiveMarketConnector,
} from '../ports/live-market-connector';
import {
  detectClosedCandleGap,
  enumerateGapOpenTimes,
  markGapUnresolved,
  type ClosedCandleGap,
} from './closed-candle-gap';
import { mapBackfillBarToClosedCandleDraft } from './map-backfill-bar-to-draft';
import {
  MarketStreamIntegrityController,
  type MarketStreamAdmitResult,
} from './market-stream-integrity-controller';
import {
  MarketStreamIntegrityStatus,
  type MarketStreamIntegrityState,
} from './market-stream-integrity-state';
import { timeframeDurationMs } from './timeframe-duration';

export type GapRecoveryRequest = {
  streamId: MarketStreamId | string;
  workspaceId: string;
  sourceId: MarketDataSourceId | string;
  instrument: string;
  timeframe: ClosedCandleEvent['timeframe'];
  /** Deferred live event that exposed the gap (optional). */
  deferredEvent?: ClosedCandleEvent;
  /** Clock / operational stamps for recovered drafts. */
  recoveredAt: string;
};

export type GapRecoveryResult = Readonly<{
  outcome: 'recovered' | 'unresolved' | 'noop';
  gap: ClosedCandleGap | null;
  admitted: ReadonlyArray<MarketStreamAdmitResult>;
  state: MarketStreamIntegrityState | null;
  /** True when connector may leave RECOVERING (US139). */
  gapClosed: boolean;
}>;

export type GapRecoveryBackfill = {
  backfill(request: LiveMarketBackfillRequest): Promise<ClosedCandleBackfillBar[]>;
};

/**
 * REST gap recovery for closed-candle streams (US139).
 * Recovered bars use the same validate → admit path as live events.
 * Overlaps are eliminated by semantic/event-id dedup in the integrity gate.
 * Health stays recovering until the gap closes; unrecoverable gaps stay visible.
 */
export class ClosedCandleGapRecoveryService {
  constructor(
    private readonly integrity: MarketStreamIntegrityController,
    private readonly validator: MarketDataValidator,
    private readonly connector: GapRecoveryBackfill,
  ) {}

  /**
   * Detect a time gap from stream state + deferred candle, then REST-repair it.
   */
  async recover(request: GapRecoveryRequest): Promise<GapRecoveryResult> {
    const state = this.integrity.getState(request.streamId);
    const lastOpen = resolveLastOpenTime(state, request.deferredEvent);
    const nextOpen = request.deferredEvent?.openTime;

    if (!nextOpen || lastOpen === null) {
      return {
        outcome: 'noop',
        gap: null,
        admitted: [],
        state,
        gapClosed: false,
      };
    }

    const gap = detectClosedCandleGap({
      streamId: String(request.streamId),
      timeframe: request.timeframe,
      lastAcceptedOpenTime: lastOpen,
      nextObservedOpenTime: nextOpen,
    });

    if (!gap) {
      // Sequence gap without open-time hole — still try sequence fill via empty range noop.
      if (state?.status === MarketStreamIntegrityStatus.BLOCKED_GAP && request.deferredEvent) {
        return this.recoverSequenceGap(request, state);
      }
      return {
        outcome: 'noop',
        gap: null,
        admitted: [],
        state,
        gapClosed: state?.status === MarketStreamIntegrityStatus.READY,
      };
    }

    this.integrity.markRecovering(
      request.streamId,
      request.recoveredAt,
      `recovering ${gap.missingIntervalCount} missing candle interval(s)`,
    );

    const durationMs = timeframeDurationMs(request.timeframe);
    const fromIso = gap.fromOpenTime;
    const toIso = new Date(Date.parse(gap.toOpenTime) + durationMs - 1).toISOString();

    const bars = await this.connector.backfill({
      workspaceId: request.workspaceId,
      instrument: request.instrument,
      timeframe: request.timeframe,
      from: fromIso,
      to: toIso,
    });

    const admitted = this.admitRecoveredBars(request, state, bars);
    return this.finalize(request, gap, admitted);
  }

  /**
   * Notify an optional WebSocket connector that gap recovery finished (US134/US139).
   */
  notifyConnectorGapComplete(
    connector: LiveMarketConnector & { markGapRecoveryComplete?: () => void },
  ): void {
    connector.markGapRecoveryComplete?.();
  }

  private recoverSequenceGap(
    request: GapRecoveryRequest,
    state: MarketStreamIntegrityState,
  ): GapRecoveryResult {
    // Without a time hole, REST cannot invent missing sequences — remain visible.
    const unresolved = this.integrity.markUnresolvedGap(
      request.streamId,
      request.recoveredAt,
      `unrecoverable sequence gap: expected ${state.expectedSequence}, blocked ${state.blockedSequence}`,
    );
    return {
      outcome: 'unresolved',
      gap: null,
      admitted: [],
      state: unresolved,
      gapClosed: false,
    };
  }

  private admitRecoveredBars(
    request: GapRecoveryRequest,
    prior: MarketStreamIntegrityState | null,
    bars: ClosedCandleBackfillBar[],
  ): MarketStreamAdmitResult[] {
    const sorted = [...bars].sort((a, b) => a.openTime.localeCompare(b.openTime));
    let nextSequence = (prior?.lastAppliedSequence ?? 0) + 1;
    const admitted: MarketStreamAdmitResult[] = [];

    for (const bar of sorted) {
      const draft = mapBackfillBarToClosedCandleDraft({
        bar,
        workspaceId: request.workspaceId,
        sourceId: request.sourceId,
        sequence: nextSequence,
        receivedAt: request.recoveredAt,
        processedAt: request.recoveredAt,
        recordedAt: request.recoveredAt,
      });

      const validated = this.validator.validateClosedCandle({
        draft,
        rawMessage: { recovery: true, openTime: bar.openTime },
        quarantinedAt: request.recoveredAt,
      });

      if (validated.outcome === 'quarantined') {
        continue;
      }

      const result = this.integrity.admit(validated.event, request.recoveredAt);
      admitted.push(result);
      if (result.outcome === 'accepted') {
        nextSequence = result.state.lastAppliedSequence + 1;
      }
    }

    return admitted;
  }

  private finalize(
    request: GapRecoveryRequest,
    gap: ClosedCandleGap,
    admitted: MarketStreamAdmitResult[],
  ): GapRecoveryResult {
    const expectedOpens = new Set(enumerateGapOpenTimes(gap));
    const acceptedOpens = new Set(
      admitted
        .filter((row) => row.outcome === 'accepted')
        .map((row) => row.event)
        .filter(isClosedCandleEvent)
        .map((event) => event.openTime),
    );

    // Overlaps count as covered (duplicate outcome still means the interval exists).
    for (const row of admitted) {
      if (row.outcome === 'duplicate' && isClosedCandleEvent(row.event)) {
        acceptedOpens.add(row.event.openTime);
      }
    }

    const missing = [...expectedOpens].filter((open) => !acceptedOpens.has(open));
    if (missing.length > 0) {
      const unresolvedGap = markGapUnresolved(
        gap,
        `unresolved missing open times: ${missing.join(',')}`,
      );
      const state = this.integrity.markUnresolvedGap(
        request.streamId,
        request.recoveredAt,
        unresolvedGap.reason ?? 'unresolved gap',
      );
      return {
        outcome: 'unresolved',
        gap: unresolvedGap,
        admitted,
        state,
        gapClosed: false,
      };
    }

    let state = this.integrity.getState(request.streamId);
    if (request.deferredEvent) {
      const live = this.integrity.admit(request.deferredEvent, request.recoveredAt);
      admitted.push(live);
      state = live.state;
      if (live.outcome === 'deferred_gap') {
        const unresolvedGap = markGapUnresolved(
          gap,
          `live event still blocked after recovery at sequence ${live.receivedSequence}`,
        );
        state = this.integrity.markUnresolvedGap(
          request.streamId,
          request.recoveredAt,
          unresolvedGap.reason ?? 'live still blocked',
        );
        return {
          outcome: 'unresolved',
          gap: unresolvedGap,
          admitted,
          state,
          gapClosed: false,
        };
      }
    }

    state = this.integrity.markReady(request.streamId, request.recoveredAt);
    return {
      outcome: 'recovered',
      gap,
      admitted,
      state,
      gapClosed: true,
    };
  }
}

function resolveLastOpenTime(
  state: MarketStreamIntegrityState | null,
  deferred?: ClosedCandleEvent,
): string | null {
  if (state?.lastOccurredAt) {
    return state.lastOccurredAt;
  }
  void deferred;
  return null;
}

export function streamHealthAfterRecovery(
  state: MarketStreamIntegrityState | null,
): MarketHealthStatus {
  if (!state) return MarketHealthStatus.UNKNOWN;
  return state.health;
}
