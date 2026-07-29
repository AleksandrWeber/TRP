import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';
import { toDurableEventId, type DurableEventEnvelope } from '../event-processing';
import { TransactionalOutboxAppender } from '../event-processing/transactional-outbox-appender';
import {
  advanceStrategyCheckpoint,
  createStrategyCheckpoint,
  type LastProcessedCandle,
  type StrategyCheckpoint,
} from './domain/strategy-checkpoint';
import {
  STRATEGY_CHECKPOINT_REPOSITORY,
  type StrategyCheckpointRepository,
} from './persistence/strategy-checkpoint.repository';

export type SaveStrategyCheckpointCommand = Readonly<{
  workspaceId: string;
  deploymentId: string;
  sessionId: string;
  lastProcessedCandle: LastProcessedCandle;
  lastProcessedEventId: string;
  runtimeVersion?: string;
  updatedAt: string;
  actorId: string;
  correlationId?: string;
}>;

export type SaveStrategyCheckpointResult = Readonly<{
  checkpoint: StrategyCheckpoint;
  advanced: boolean;
}>;

/**
 * Strategy Checkpoint application boundary (US215).
 * Internal save/load only. Owns Runtime progress pointers — no Orders, Risk,
 * Execution, Fill, Position, or Trading Session lifecycle coupling.
 */
@Injectable()
export class StrategyCheckpointService {
  constructor(
    @Inject(STRATEGY_CHECKPOINT_REPOSITORY)
    private readonly checkpoints: StrategyCheckpointRepository,
    @Inject(PrismaTransactionService)
    private readonly transactions: PrismaTransactionService,
    @Inject(TransactionalOutboxAppender)
    private readonly outbox: TransactionalOutboxAppender,
  ) {}

  load(workspaceId: string, sessionId: string): Promise<StrategyCheckpoint | null> {
    return this.checkpoints.findBySession(workspaceId, sessionId);
  }

  get(workspaceId: string, checkpointId: string): Promise<StrategyCheckpoint | null> {
    return this.checkpoints.findById(workspaceId, checkpointId);
  }

  /**
   * Create or advance the session checkpoint atomically with Outbox
   * `StrategyCheckpointAdvanced`. Identical progress is a successful no-op.
   */
  async save(command: SaveStrategyCheckpointCommand): Promise<SaveStrategyCheckpointResult> {
    const actorId = required(command.actorId, 'actor id');
    const existing = await this.checkpoints.findBySession(command.workspaceId, command.sessionId);

    if (!existing) {
      return this.createInitial(command, actorId);
    }

    return this.advanceExisting(existing, command, actorId);
  }

  private async createInitial(
    command: SaveStrategyCheckpointCommand,
    actorId: string,
  ): Promise<SaveStrategyCheckpointResult> {
    const created = createStrategyCheckpoint({
      workspaceId: command.workspaceId,
      deploymentId: command.deploymentId,
      sessionId: command.sessionId,
      lastProcessedCandle: command.lastProcessedCandle,
      lastProcessedEventId: command.lastProcessedEventId,
      runtimeVersion: command.runtimeVersion,
      updatedAt: command.updatedAt,
    });
    const envelope = advancedEnvelope(created, actorId, command.correlationId);

    try {
      const saved = await this.transactions.run(async (transaction) => {
        const persisted = await this.checkpoints.save(created, null, transaction);
        await this.outbox.append(transaction, envelope, command.updatedAt);
        return persisted;
      });
      return { checkpoint: saved, advanced: true };
    } catch (error) {
      if (isUniqueConflict(error)) {
        const raced = await this.checkpoints.findBySession(command.workspaceId, command.sessionId);
        if (raced) {
          return this.advanceExisting(raced, command, actorId);
        }
      }
      throw error;
    }
  }

  private async advanceExisting(
    existing: StrategyCheckpoint,
    command: SaveStrategyCheckpointCommand,
    actorId: string,
  ): Promise<SaveStrategyCheckpointResult> {
    if (existing.deploymentId !== required(command.deploymentId, 'deployment id')) {
      throw new Error('strategy checkpoint deployment id cannot change');
    }

    const next = advanceStrategyCheckpoint(existing, {
      lastProcessedCandle: command.lastProcessedCandle,
      lastProcessedEventId: command.lastProcessedEventId,
      runtimeVersion: command.runtimeVersion,
      updatedAt: command.updatedAt,
    });

    if (next.version === existing.version) {
      return { checkpoint: existing, advanced: false };
    }

    const envelope = advancedEnvelope(next, actorId, command.correlationId);
    const saved = await this.transactions.run(async (transaction) => {
      const persisted = await this.checkpoints.save(next, existing.version, transaction);
      await this.outbox.append(transaction, envelope, command.updatedAt);
      return persisted;
    });
    return { checkpoint: saved, advanced: true };
  }
}

function advancedEnvelope(
  checkpoint: StrategyCheckpoint,
  actorId: string,
  correlationId: string | undefined,
): DurableEventEnvelope {
  return Object.freeze({
    eventId: toDurableEventId(
      `strategy-checkpoint:${checkpoint.id}:advanced:v${checkpoint.version}`,
    ),
    eventType: 'StrategyCheckpointAdvanced',
    schemaVersion: 1,
    aggregateType: 'StrategyCheckpoint',
    aggregateId: checkpoint.id,
    aggregateVersion: checkpoint.version,
    workspaceId: checkpoint.workspaceId,
    occurredAt: checkpoint.updatedAt,
    recordedAt: checkpoint.updatedAt,
    ...(correlationId !== undefined && correlationId.trim() !== ''
      ? { correlationId: correlationId.trim() }
      : {}),
    actorId,
    payload: Object.freeze({
      checkpointId: checkpoint.id,
      deploymentId: checkpoint.deploymentId,
      sessionId: checkpoint.sessionId,
      lastProcessedCandle: checkpoint.lastProcessedCandle,
      lastProcessedEventId: checkpoint.lastProcessedEventId,
      runtimeVersion: checkpoint.runtimeVersion,
      version: checkpoint.version,
      updatedAt: checkpoint.updatedAt,
    }),
  });
}

function required(value: string, label: string): string {
  const result = value.trim();
  if (result === '') throw new Error(`${label} is required`);
  return result;
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
