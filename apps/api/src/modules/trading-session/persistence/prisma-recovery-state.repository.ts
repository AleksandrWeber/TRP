import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  isRecoveryPhase,
  type DurableRecoveryState,
  type RecoveryPhase,
} from '../domain/durable-recovery-state';
import type { DiscoveryResumeIntent } from '../domain/force-confirm-recovering';
import { isTradingSessionStatus, TradingSessionStatus } from '../domain/trading-session-status';
import type { RecoveryStateRepository } from '../domain/recovery-state.repository';

type RecoveryStateRow = Prisma.SessionRecoveryStateGetPayload<Record<string, never>>;

export class PrismaRecoveryStateRepository implements RecoveryStateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveRecoveryState(
    recoveryState: DurableRecoveryState,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(recoveryState);
    await client.sessionRecoveryState.upsert({
      where: { sessionId: recoveryState.sessionId },
      create: data,
      update: data,
    });
  }

  async loadRecoveryState(sessionId: string): Promise<DurableRecoveryState | null> {
    const row = await this.prisma.sessionRecoveryState.findUnique({
      where: { sessionId },
    });
    return row ? toDomain(row) : null;
  }

  async clearRecoveryState(sessionId: string, transaction?: TransactionContext): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    await client.sessionRecoveryState.deleteMany({ where: { sessionId } });
  }
}

function toRow(state: DurableRecoveryState): Prisma.SessionRecoveryStateUncheckedCreateInput {
  return {
    sessionId: state.sessionId,
    workspaceId: state.workspaceId,
    recoveryId: state.recoveryId,
    recoveryAttempt: state.recoveryAttempt,
    phase: state.phase,
    preRecoveryStatus: state.preRecoveryStatus,
    resumeIntent: state.resumeIntent,
    fencingToken: state.fencingToken,
    lastSemanticEventId: state.lastSemanticEventId,
    lastAttemptedPhase: state.lastAttemptedPhase,
    startedAt: new Date(state.startedAt),
    updatedAt: new Date(state.updatedAt),
    completedAt: state.completedAt !== null ? new Date(state.completedAt) : null,
    failedAt: state.failedAt !== null ? new Date(state.failedAt) : null,
    failureReason: state.failureReason,
    incidentId: state.incidentId,
    schemaVersion: state.schemaVersion,
  };
}

function toDomain(row: RecoveryStateRow): DurableRecoveryState {
  if (!isRecoveryPhase(row.phase)) {
    throw new Error(`Invalid recovery phase in store: ${row.phase}`);
  }
  if (!isTradingSessionStatus(row.preRecoveryStatus)) {
    throw new Error(`Invalid preRecoveryStatus in store: ${row.preRecoveryStatus}`);
  }
  if (!isResumeIntent(row.resumeIntent)) {
    throw new Error(`Invalid resumeIntent in store: ${row.resumeIntent}`);
  }
  const lastAttemptedPhase =
    row.lastAttemptedPhase === null
      ? null
      : isRecoveryPhase(row.lastAttemptedPhase)
        ? row.lastAttemptedPhase
        : (() => {
            throw new Error(`Invalid lastAttemptedPhase in store: ${row.lastAttemptedPhase}`);
          })();

  return Object.freeze({
    sessionId: row.sessionId,
    workspaceId: row.workspaceId,
    recoveryId: row.recoveryId,
    recoveryAttempt: row.recoveryAttempt,
    phase: row.phase as RecoveryPhase,
    preRecoveryStatus: row.preRecoveryStatus,
    resumeIntent: row.resumeIntent,
    fencingToken: row.fencingToken,
    lastSemanticEventId: row.lastSemanticEventId,
    lastAttemptedPhase,
    startedAt: row.startedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    failedAt: row.failedAt?.toISOString() ?? null,
    failureReason: row.failureReason,
    incidentId: row.incidentId,
    schemaVersion: row.schemaVersion,
  });
}

function isResumeIntent(value: string): value is DiscoveryResumeIntent {
  return (
    value === TradingSessionStatus.RUNNING ||
    value === TradingSessionStatus.PAUSED ||
    value === TradingSessionStatus.STOPPED
  );
}
