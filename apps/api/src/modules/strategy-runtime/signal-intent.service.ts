import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';
import { toDurableEventId, type DurableEventEnvelope } from '../event-processing';
import { TransactionalOutboxAppender } from '../event-processing/transactional-outbox-appender';
import {
  createSignalIntent,
  type CreateSignalIntentInput,
  type SignalIntent,
  type SignalIntentDirection,
  type SignalIntentMarketCheckpoint,
  type SignalIntentMetadata,
} from './domain/signal-intent';
import {
  SIGNAL_INTENT_REPOSITORY,
  type SignalIntentRepository,
} from './persistence/signal-intent.repository';

export type EmitSignalIntentCommand = Readonly<{
  workspaceId: string;
  deploymentId: string;
  sessionId: string;
  strategyVersion: string;
  instrument: string;
  timeframe: string;
  direction: SignalIntentDirection;
  confidence?: number | null;
  marketCheckpoint: SignalIntentMarketCheckpoint;
  generatedAt: string;
  recordedAt: string;
  actorId: string;
  correlationId?: string;
  metadata?: SignalIntentMetadata;
}>;

export type EmitSignalIntentResult = Readonly<{
  intent: SignalIntent;
  created: boolean;
}>;

/**
 * Signal Intent application boundary (US214).
 * Append-only create + query for Strategy Runtime. No Orders, Risk evaluation,
 * Execution Engine, Fill, or Trading Session lifecycle coupling.
 */
@Injectable()
export class SignalIntentService {
  constructor(
    @Inject(SIGNAL_INTENT_REPOSITORY)
    private readonly intents: SignalIntentRepository,
    @Inject(PrismaTransactionService)
    private readonly transactions: PrismaTransactionService,
    @Inject(TransactionalOutboxAppender)
    private readonly outbox: TransactionalOutboxAppender,
  ) {}

  /**
   * Persist a Signal Intent atomically with Outbox `SignalIntentCreated`.
   * Duplicate semantic identity is a successful no-op (ADR-018 #2).
   */
  async emit(command: EmitSignalIntentCommand): Promise<EmitSignalIntentResult> {
    const intent = createSignalIntent({
      workspaceId: command.workspaceId,
      deploymentId: command.deploymentId,
      sessionId: command.sessionId,
      strategyVersion: command.strategyVersion,
      instrument: command.instrument,
      timeframe: command.timeframe,
      direction: command.direction,
      confidence: command.confidence,
      marketCheckpoint: command.marketCheckpoint,
      generatedAt: command.generatedAt,
      recordedAt: command.recordedAt,
      actorId: required(command.actorId, 'actor id'),
      correlationId: command.correlationId,
      metadata: command.metadata,
    } satisfies CreateSignalIntentInput);

    const existing = await this.intents.findByIntentHash(intent.workspaceId, intent.intentHash);
    if (existing) {
      assertSameIntent(existing, intent);
      return { intent: existing, created: false };
    }

    const envelope = createdEnvelope(intent);

    try {
      const created = await this.transactions.run(async (transaction) => {
        const appended = await this.intents.append(intent, transaction);
        await this.outbox.append(transaction, envelope, command.recordedAt);
        return appended;
      });
      return { intent: created, created: true };
    } catch (error) {
      if (isUniqueConflict(error)) {
        const raced = await this.intents.findByIntentHash(intent.workspaceId, intent.intentHash);
        if (raced) {
          assertSameIntent(raced, intent);
          return { intent: raced, created: false };
        }
      }
      throw error;
    }
  }

  get(workspaceId: string, intentId: string): Promise<SignalIntent | null> {
    return this.intents.findById(workspaceId, intentId);
  }

  getByIntentHash(workspaceId: string, intentHash: string): Promise<SignalIntent | null> {
    return this.intents.findByIntentHash(workspaceId, intentHash);
  }

  listBySession(workspaceId: string, sessionId: string): Promise<SignalIntent[]> {
    return this.intents.listBySession(workspaceId, sessionId);
  }
}

function createdEnvelope(intent: SignalIntent): DurableEventEnvelope {
  return Object.freeze({
    eventId: toDurableEventId(`signal-intent:${intent.id}:created:v1`),
    eventType: 'SignalIntentCreated',
    schemaVersion: 1,
    aggregateType: 'SignalIntent',
    aggregateId: intent.id,
    aggregateVersion: 1,
    workspaceId: intent.workspaceId,
    occurredAt: intent.generatedAt,
    recordedAt: intent.recordedAt,
    ...(intent.correlationId !== null ? { correlationId: intent.correlationId } : {}),
    actorId: intent.actorId,
    payload: Object.freeze({
      signalIntentId: intent.id,
      intentHash: intent.intentHash,
      deploymentId: intent.deploymentId,
      sessionId: intent.sessionId,
      strategyVersion: intent.strategyVersion,
      instrument: intent.instrument,
      timeframe: intent.timeframe,
      direction: intent.direction,
      confidence: intent.confidence,
      marketCheckpoint: intent.marketCheckpoint,
      generatedAt: intent.generatedAt,
    }),
  });
}

function assertSameIntent(existing: SignalIntent, candidate: SignalIntent): void {
  if (existing.intentHash !== candidate.intentHash || existing.id !== candidate.id) {
    throw new Error('signal intent identity conflict');
  }
}

function required(value: string, label: string): string {
  const result = value.trim();
  if (result === '') throw new Error(`${label} is required`);
  return result;
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
