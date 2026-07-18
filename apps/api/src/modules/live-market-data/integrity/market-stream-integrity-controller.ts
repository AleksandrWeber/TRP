import type { MarketEvent } from '../domain/market-event';
import { MarketHealthStatus } from '../domain/market-status';
import type { MarketStreamId } from '../domain/market-stream-id';
import {
  createInitialIntegrityState,
  MarketStreamIntegrityStatus,
  type MarketStreamIntegrityMetrics,
  type MarketStreamIntegrityState,
} from './market-stream-integrity-state';

export type MarketStreamAdmitAccepted = Readonly<{
  outcome: 'accepted';
  event: MarketEvent;
  state: MarketStreamIntegrityState;
}>;

export type MarketStreamAdmitDuplicate = Readonly<{
  outcome: 'duplicate';
  kind: 'semantic' | 'event_id';
  event: MarketEvent;
  state: MarketStreamIntegrityState;
}>;

export type MarketStreamAdmitStale = Readonly<{
  outcome: 'stale';
  event: MarketEvent;
  lastAppliedSequence: number;
  receivedSequence: number;
  state: MarketStreamIntegrityState;
}>;

export type MarketStreamAdmitDeferredGap = Readonly<{
  outcome: 'deferred_gap';
  event: MarketEvent;
  expectedSequence: number;
  receivedSequence: number;
  state: MarketStreamIntegrityState;
}>;

export type MarketStreamAdmitResult =
  | MarketStreamAdmitAccepted
  | MarketStreamAdmitDuplicate
  | MarketStreamAdmitStale
  | MarketStreamAdmitDeferredGap;

/**
 * Per-stream semantic deduplication and sequence ordering (US138 / ADR-013).
 * Exact duplicates have no second business effect. Stale sequences are ignored
 * and measured. Missing predecessors block only that stream.
 */
export class MarketStreamIntegrityController {
  private readonly states = new Map<string, MutableState>();

  getState(streamId: MarketStreamId | string): MarketStreamIntegrityState | null {
    const row = this.states.get(String(streamId));
    return row ? freezeState(row) : null;
  }

  /**
   * Seed or replace stream progress (e.g. from durable checkpoint).
   */
  seed(state: MarketStreamIntegrityState): void {
    const key = String(state.streamId);
    this.states.set(key, {
      ...state,
      seenSemantic: new Set(
        state.lastSemanticIdentity !== null ? [state.lastSemanticIdentity] : [],
      ),
      seenEventIds: new Set(state.lastEventId !== null ? [String(state.lastEventId)] : []),
      metrics: { ...state.metrics },
    });
  }

  admit(event: MarketEvent, updatedAt: string): MarketStreamAdmitResult {
    const key = String(event.streamId);
    let row = this.states.get(key);
    if (!row) {
      row = toMutable(
        createInitialIntegrityState({
          streamId: event.streamId,
          workspaceId: event.workspaceId,
          updatedAt,
        }),
      );
      this.states.set(key, row);
    } else if (!row.workspaceId) {
      row.workspaceId = event.workspaceId;
    }

    if (row.seenSemantic.has(event.semanticIdentity)) {
      row.metrics.duplicateCount += 1;
      row.updatedAt = updatedAt;
      return {
        outcome: 'duplicate',
        kind: 'semantic',
        event,
        state: freezeState(row),
      };
    }

    if (row.seenEventIds.has(String(event.eventId))) {
      row.metrics.duplicateCount += 1;
      row.updatedAt = updatedAt;
      return {
        outcome: 'duplicate',
        kind: 'event_id',
        event,
        state: freezeState(row),
      };
    }

    const expectedNext = row.lastAppliedSequence + 1;
    if (event.sequence > expectedNext) {
      row.metrics.deferredGapCount += 1;
      row.status = MarketStreamIntegrityStatus.BLOCKED_GAP;
      row.health = MarketHealthStatus.RECOVERING;
      row.blockedSequence = event.sequence;
      row.expectedSequence = expectedNext;
      row.lastError = `missing predecessor sequence ${expectedNext}`;
      row.updatedAt = updatedAt;
      return {
        outcome: 'deferred_gap',
        event,
        expectedSequence: expectedNext,
        receivedSequence: event.sequence,
        state: freezeState(row),
      };
    }

    if (event.sequence <= row.lastAppliedSequence) {
      row.metrics.staleSequenceCount += 1;
      row.updatedAt = updatedAt;
      return {
        outcome: 'stale',
        event,
        lastAppliedSequence: row.lastAppliedSequence,
        receivedSequence: event.sequence,
        state: freezeState(row),
      };
    }

    // Contiguous next sequence — accept.
    row.lastAppliedSequence = event.sequence;
    row.lastEventId = event.eventId;
    row.lastSemanticIdentity = event.semanticIdentity;
    row.lastOccurredAt = event.occurredAt;
    row.seenSemantic.add(event.semanticIdentity);
    row.seenEventIds.add(String(event.eventId));
    row.metrics.acceptedCount += 1;
    row.status = MarketStreamIntegrityStatus.READY;
    row.health = MarketHealthStatus.HEALTHY;
    row.blockedSequence = null;
    row.expectedSequence = null;
    row.lastError = null;
    row.updatedAt = updatedAt;

    return {
      outcome: 'accepted',
      event,
      state: freezeState(row),
    };
  }

  /**
   * Enter recovering without admitting an event (US139 post-reconnect).
   */
  markRecovering(streamId: MarketStreamId | string, updatedAt: string, reason: string): void {
    const row = this.require(streamId, updatedAt);
    row.status = MarketStreamIntegrityStatus.RECOVERING;
    row.health = MarketHealthStatus.RECOVERING;
    row.lastError = reason;
    row.updatedAt = updatedAt;
  }

  markUnresolvedGap(
    streamId: MarketStreamId | string,
    updatedAt: string,
    reason: string,
  ): MarketStreamIntegrityState {
    const row = this.require(streamId, updatedAt);
    row.status = MarketStreamIntegrityStatus.UNRESOLVED_GAP;
    row.health = MarketHealthStatus.DEGRADED;
    row.lastError = reason;
    row.updatedAt = updatedAt;
    return freezeState(row);
  }

  markReady(streamId: MarketStreamId | string, updatedAt: string): MarketStreamIntegrityState {
    const row = this.require(streamId, updatedAt);
    row.status = MarketStreamIntegrityStatus.READY;
    row.health = MarketHealthStatus.HEALTHY;
    row.blockedSequence = null;
    row.expectedSequence = null;
    row.lastError = null;
    row.updatedAt = updatedAt;
    return freezeState(row);
  }

  metrics(streamId: MarketStreamId | string): MarketStreamIntegrityMetrics | null {
    const row = this.states.get(String(streamId));
    return row ? Object.freeze({ ...row.metrics }) : null;
  }

  private require(streamId: MarketStreamId | string, updatedAt: string): MutableState {
    const key = String(streamId);
    let row = this.states.get(key);
    if (!row) {
      row = toMutable(
        createInitialIntegrityState({
          streamId,
          workspaceId: '',
          updatedAt,
        }),
      );
      this.states.set(key, row);
    }
    return row;
  }
}

type MutableState = {
  streamId: MarketStreamId | string;
  workspaceId: string;
  lastAppliedSequence: number;
  lastEventId: MarketEventIdLike;
  lastSemanticIdentity: string | null;
  lastOccurredAt: string | null;
  status: MarketStreamIntegrityStatus;
  health: MarketHealthStatus;
  blockedSequence: number | null;
  expectedSequence: number | null;
  lastError: string | null;
  metrics: {
    acceptedCount: number;
    duplicateCount: number;
    staleSequenceCount: number;
    deferredGapCount: number;
  };
  updatedAt: string;
  seenSemantic: Set<string>;
  seenEventIds: Set<string>;
};

type MarketEventIdLike = MarketEvent['eventId'] | string | null;

function toMutable(state: MarketStreamIntegrityState): MutableState {
  return {
    ...state,
    metrics: { ...state.metrics },
    seenSemantic: new Set(state.lastSemanticIdentity !== null ? [state.lastSemanticIdentity] : []),
    seenEventIds: new Set(state.lastEventId !== null ? [String(state.lastEventId)] : []),
  };
}

function freezeState(row: MutableState): MarketStreamIntegrityState {
  return Object.freeze({
    streamId: row.streamId,
    workspaceId: row.workspaceId,
    lastAppliedSequence: row.lastAppliedSequence,
    lastEventId: row.lastEventId,
    lastSemanticIdentity: row.lastSemanticIdentity,
    lastOccurredAt: row.lastOccurredAt,
    status: row.status,
    health: row.health,
    blockedSequence: row.blockedSequence,
    expectedSequence: row.expectedSequence,
    lastError: row.lastError,
    metrics: Object.freeze({ ...row.metrics }),
    updatedAt: row.updatedAt,
  });
}
