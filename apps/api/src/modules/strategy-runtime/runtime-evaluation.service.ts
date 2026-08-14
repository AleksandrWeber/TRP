import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';
import {
  StrategyDeploymentService,
  StrategyDeploymentStatus,
  type StrategyDeployment,
} from '../strategy-deployment';
import { toDurableEventId, type DurableEventEnvelope } from '../event-processing';
import { TransactionalOutboxAppender } from '../event-processing/transactional-outbox-appender';
import { createEvaluationCandle, type EvaluationCandle } from './domain/evaluation-candle';
import type { EvaluationCandleInput } from './domain/evaluation-candle';
import {
  evaluationAlreadyProcessed,
  evaluationCompleted,
  evaluationNotAdmitted,
  type EvaluationResult,
} from './domain/evaluation-result';
import { decideRuntimeEvaluation, EvaluationOutcomeKind } from './domain/runtime-evaluation';
import type { RuntimeLeaseProofInput } from './domain/runtime-lease-proof';
import { createSignalIntent, type SignalIntent } from './domain/signal-intent';
import {
  advanceStrategyCheckpoint,
  createStrategyCheckpoint,
  type StrategyCheckpoint,
} from './domain/strategy-checkpoint';
import { admitClosedCandleTick, TickAdmissionStatus } from './domain/tick-admission';
import {
  SIGNAL_INTENT_REPOSITORY,
  type SignalIntentRepository,
} from './persistence/signal-intent.repository';
import {
  STRATEGY_CHECKPOINT_REPOSITORY,
  type StrategyCheckpointRepository,
} from './persistence/strategy-checkpoint.repository';

export type EvaluateTickCommand = Readonly<{
  workspaceId: string;
  sessionId: string;
  deploymentId: string;
  event: EvaluationCandleInput;
  lease: RuntimeLeaseProofInput;
  nowIso: string;
  recordedAt: string;
  actorId: string;
  correlationId?: string;
}>;

/**
 * Strategy Runtime evaluation pipeline (US219).
 * Admits a semantic tick, decides Intent | NO_ACTION, and commits Intent
 * (when actionable) + Checkpoint + Outbox atomically. No Orders/Risk/Execution.
 */
@Injectable()
export class RuntimeEvaluationService {
  constructor(
    @Inject(StrategyDeploymentService)
    private readonly deployments: StrategyDeploymentService,
    @Inject(SIGNAL_INTENT_REPOSITORY)
    private readonly intents: SignalIntentRepository,
    @Inject(STRATEGY_CHECKPOINT_REPOSITORY)
    private readonly checkpoints: StrategyCheckpointRepository,
    @Inject(PrismaTransactionService)
    private readonly transactions: PrismaTransactionService,
    @Inject(TransactionalOutboxAppender)
    private readonly outbox: TransactionalOutboxAppender,
  ) {}

  async evaluate(command: EvaluateTickCommand): Promise<EvaluationResult> {
    const workspaceId = required(command.workspaceId, 'workspace id');
    const sessionId = required(command.sessionId, 'session id');
    const deploymentId = required(command.deploymentId, 'deployment id');
    const actorId = required(command.actorId, 'actor id');
    const recordedAt = required(command.recordedAt, 'recordedAt');
    const nowIso = required(command.nowIso, 'nowIso');

    const deployment = await this.deployments.get(workspaceId, deploymentId);
    if (!deployment) {
      throw new Error('strategy deployment not found in workspace');
    }
    if (deployment.status !== StrategyDeploymentStatus.APPROVED) {
      throw new Error('evaluation requires an approved strategy deployment');
    }

    const candle = createEvaluationCandle(command.event);
    const checkpointBefore = await this.checkpoints.findBySession(workspaceId, sessionId);

    if (isSameProcessedTick(checkpointBefore, candle)) {
      return evaluationAlreadyProcessed({
        checkpoint: checkpointBefore!,
        eventId: candle.eventId,
      });
    }

    const admission = admitClosedCandleTick({
      event: candle,
      lease: command.lease,
      checkpoint: checkpointBefore,
      expectedSessionId: sessionId,
      expectedWorkspaceId: workspaceId,
      nowIso,
    });

    if (!admission.admitted) {
      if (
        admission.status === TickAdmissionStatus.REJECTED_DUPLICATE &&
        isSameProcessedTick(checkpointBefore, candle)
      ) {
        return evaluationAlreadyProcessed({
          checkpoint: checkpointBefore!,
          eventId: candle.eventId,
        });
      }
      return evaluationNotAdmitted({
        admissionStatus: admission.status,
        reason: admission.reason,
        eventId: admission.eventId,
        checkpoint: checkpointBefore,
      });
    }

    const decision = decideRuntimeEvaluation({ deployment, candle });

    try {
      return await this.transactions.run(async (transaction) => {
        const current = await this.checkpoints.findBySession(workspaceId, sessionId, transaction);

        if (isSameProcessedTick(current, candle)) {
          return evaluationAlreadyProcessed({
            checkpoint: current!,
            eventId: candle.eventId,
            reason: 'tick already evaluated (concurrent duplicate)',
          });
        }

        const reAdmission = admitClosedCandleTick({
          event: candle,
          lease: command.lease,
          checkpoint: current,
          expectedSessionId: sessionId,
          expectedWorkspaceId: workspaceId,
          nowIso,
        });
        if (!reAdmission.admitted) {
          return evaluationNotAdmitted({
            admissionStatus: reAdmission.status,
            reason: reAdmission.reason,
            eventId: reAdmission.eventId,
            checkpoint: current,
          });
        }

        if (current !== null && current.deploymentId !== deployment.id) {
          throw new Error('strategy checkpoint deployment id cannot change');
        }

        let intent: SignalIntent | null = null;
        let intentCreated = false;

        if (decision.kind === EvaluationOutcomeKind.SIGNAL_INTENT) {
          const candidate = createSignalIntent({
            workspaceId,
            exchangeScopeId: deployment.exchangeScopeId,
            deploymentId: deployment.id,
            sessionId,
            strategyVersion: deployment.strategyVersion,
            instrument: candle.instrument,
            timeframe: candle.timeframe,
            direction: decision.direction,
            confidence: decision.confidence,
            marketCheckpoint: {
              streamId: candle.streamId,
              sequence: candle.sequence,
              eventId: candle.eventId,
            },
            generatedAt: candle.closeTime,
            recordedAt,
            actorId,
            correlationId: command.correlationId,
            metadata: Object.freeze({
              evaluationReason: decision.reason,
              open: candle.open,
              high: candle.high,
              low: candle.low,
              close: candle.close,
              volume: candle.volume,
            }),
          });

          const existing = await this.intents.findByIntentHash(
            workspaceId,
            candidate.intentHash,
            transaction,
          );
          if (existing) {
            assertSameIntent(existing, candidate);
            intent = existing;
            intentCreated = false;
          } else {
            intent = await this.intents.append(candidate, transaction);
            intentCreated = true;
            await this.outbox.append(transaction, signalIntentCreatedEnvelope(intent), recordedAt);
          }
        }

        const nextCheckpoint = buildNextCheckpoint({
          current,
          deployment,
          sessionId,
          candle,
          updatedAt: recordedAt,
        });
        const expectedVersion = current?.version ?? null;
        if (current !== null && nextCheckpoint.version === current.version) {
          throw new Error('evaluation must advance checkpoint after successful decision');
        }

        const savedCheckpoint = await this.checkpoints.save(
          nextCheckpoint,
          expectedVersion,
          transaction,
        );
        await this.outbox.append(
          transaction,
          checkpointAdvancedEnvelope(savedCheckpoint, actorId, command.correlationId),
          recordedAt,
        );

        return evaluationCompleted({
          decision,
          intent,
          intentCreated,
          checkpoint: savedCheckpoint,
          checkpointAdvanced: true,
          reason: decision.reason,
          eventId: candle.eventId,
        });
      });
    } catch (error) {
      if (isUniqueConflict(error) || isOptimisticConflict(error)) {
        const raced = await this.checkpoints.findBySession(workspaceId, sessionId);
        if (isSameProcessedTick(raced, candle)) {
          return evaluationAlreadyProcessed({
            checkpoint: raced!,
            eventId: candle.eventId,
            reason: 'tick already evaluated (race)',
          });
        }
      }
      throw error;
    }
  }
}

function buildNextCheckpoint(input: {
  current: StrategyCheckpoint | null;
  deployment: StrategyDeployment;
  sessionId: string;
  candle: EvaluationCandle;
  updatedAt: string;
}): StrategyCheckpoint {
  const progress = {
    lastProcessedCandle: {
      streamId: input.candle.streamId,
      sequence: input.candle.sequence,
      openTime: input.candle.openTime,
      instrument: input.candle.instrument,
      timeframe: input.candle.timeframe,
    },
    lastProcessedEventId: input.candle.eventId,
    updatedAt: input.updatedAt,
  };

  if (input.current === null) {
    return createStrategyCheckpoint({
      workspaceId: input.deployment.workspaceId,
      deploymentId: input.deployment.id,
      sessionId: input.sessionId,
      ...progress,
    });
  }

  return advanceStrategyCheckpoint(input.current, progress);
}

function isSameProcessedTick(
  checkpoint: StrategyCheckpoint | null,
  candle: EvaluationCandle,
): boolean {
  return (
    checkpoint !== null &&
    checkpoint.lastProcessedEventId === candle.eventId &&
    checkpoint.lastProcessedCandle.streamId === candle.streamId &&
    checkpoint.lastProcessedCandle.sequence === candle.sequence
  );
}

function signalIntentCreatedEnvelope(intent: SignalIntent): DurableEventEnvelope {
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

function checkpointAdvancedEnvelope(
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

function isOptimisticConflict(error: unknown): boolean {
  return error instanceof Error && /optimistic version conflict/.test(error.message);
}
