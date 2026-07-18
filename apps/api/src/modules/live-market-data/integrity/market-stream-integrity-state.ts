import type { MarketEventId } from '../domain/market-event-id';
import type { MarketStreamId } from '../domain/market-stream-id';
import { MarketHealthStatus } from '../domain/market-status';

/**
 * Per-stream integrity status (US138 / US139).
 * Independent across streams — no global ordering.
 */
export enum MarketStreamIntegrityStatus {
  READY = 'ready',
  BLOCKED_GAP = 'blocked_gap',
  RECOVERING = 'recovering',
  UNRESOLVED_GAP = 'unresolved_gap',
}

export function isMarketStreamIntegrityStatus(value: string): value is MarketStreamIntegrityStatus {
  return (Object.values(MarketStreamIntegrityStatus) as string[]).includes(value);
}

export type MarketStreamIntegrityMetrics = Readonly<{
  acceptedCount: number;
  duplicateCount: number;
  staleSequenceCount: number;
  deferredGapCount: number;
}>;

export type MarketStreamIntegrityState = Readonly<{
  streamId: MarketStreamId | string;
  workspaceId: string;
  lastAppliedSequence: number;
  lastEventId: MarketEventId | string | null;
  lastSemanticIdentity: string | null;
  lastOccurredAt: string | null;
  status: MarketStreamIntegrityStatus;
  health: MarketHealthStatus;
  blockedSequence: number | null;
  expectedSequence: number | null;
  lastError: string | null;
  metrics: MarketStreamIntegrityMetrics;
  updatedAt: string;
}>;

export function emptyIntegrityMetrics(): MarketStreamIntegrityMetrics {
  return Object.freeze({
    acceptedCount: 0,
    duplicateCount: 0,
    staleSequenceCount: 0,
    deferredGapCount: 0,
  });
}

export function createInitialIntegrityState(input: {
  streamId: MarketStreamId | string;
  workspaceId: string;
  updatedAt: string;
  lastAppliedSequence?: number;
  lastEventId?: MarketEventId | string | null;
  lastSemanticIdentity?: string | null;
  lastOccurredAt?: string | null;
}): MarketStreamIntegrityState {
  return Object.freeze({
    streamId: input.streamId,
    workspaceId: input.workspaceId,
    lastAppliedSequence: input.lastAppliedSequence ?? 0,
    lastEventId: input.lastEventId ?? null,
    lastSemanticIdentity: input.lastSemanticIdentity ?? null,
    lastOccurredAt: input.lastOccurredAt ?? null,
    status: MarketStreamIntegrityStatus.READY,
    health: MarketHealthStatus.HEALTHY,
    blockedSequence: null,
    expectedSequence: null,
    lastError: null,
    metrics: emptyIntegrityMetrics(),
    updatedAt: input.updatedAt,
  });
}
