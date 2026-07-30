import { Inject, Injectable } from '@nestjs/common';
import type { Logger } from '../../../logging/logger';
import { LOGGER } from '../../../logging/logger.token';
import {
  createEvaluationCandle,
  STRATEGY_RUNTIME_PORT,
  type EvaluationCandleInput,
  type SignalIntent,
  type StrategyRuntimePort,
} from '../../strategy-runtime';
import {
  decideRecoverySignalIntentGeneration,
  type RecoverySignalIntentGenerationResult,
  type SignalIntentGenerationPlan,
} from '../domain/recovery-signal-intent-generation';
import { RecoveryRuntimeArmingService } from './recovery-runtime-arming.service';
import { RecoveryStrategyEvaluationService } from './recovery-strategy-evaluation.service';

export type RecoverySignalIntentGenerateCommand = Readonly<{
  event: EvaluationCandleInput;
  recordedAt: string;
  actorId: string;
  correlationId?: string;
}>;

export type RecoverySignalIntentGenerateResult = RecoverySignalIntentGenerationResult &
  Readonly<{
    intent: SignalIntent | null;
    intentCreated: boolean;
  }>;

/**
 * US248 — deterministic SignalIntent generation from a completed Strategy
 * Evaluation.
 *
 * Requires a successful US247 evaluation decision on an ARMED Runtime.
 * Persists exactly one SignalIntent through StrategyRuntimePort.emitSignalIntent
 * (canonical SignalIntent publication). Does not create Orders, interact with
 * Execution Engine, mutate Accounting, or write checkpoints.
 */
@Injectable()
export class RecoverySignalIntentGenerationService {
  private readonly logger: Logger;
  private lastResult: RecoverySignalIntentGenerateResult | null = null;
  private readonly convertedDecisions = new Set<string>();
  private readonly generatedEvents = new Set<string>();

  constructor(
    @Inject(STRATEGY_RUNTIME_PORT)
    private readonly runtime: StrategyRuntimePort,
    @Inject(RecoveryRuntimeArmingService)
    private readonly arming: RecoveryRuntimeArmingService,
    @Inject(RecoveryStrategyEvaluationService)
    private readonly evaluation: RecoveryStrategyEvaluationService,
    @Inject(LOGGER) logger: Logger,
  ) {
    this.logger = logger.child(RecoverySignalIntentGenerationService.name);
  }

  getLastResult(): RecoverySignalIntentGenerateResult | null {
    return this.lastResult;
  }

  async generate(
    command: RecoverySignalIntentGenerateCommand,
  ): Promise<RecoverySignalIntentGenerateResult> {
    const evaluation = this.evaluation.getLastResult();
    const arming = this.arming.getLastResult();
    const candle =
      command.event === undefined || command.event === null
        ? null
        : createEvaluationCandle(command.event);

    const lifecycle =
      arming === null
        ? null
        : await this.runtime.getLifecycle(arming.workspaceId, arming.sessionId);
    const diagnostics =
      arming === null
        ? null
        : await this.runtime.getDiagnostics(arming.workspaceId, arming.sessionId);
    const context =
      arming === null || arming.armedState === null
        ? null
        : await this.runtime.loadContext({
            workspaceId: arming.workspaceId,
            sessionId: arming.sessionId,
            deploymentId: arming.armedState.deploymentId,
          });

    const decisionKey =
      evaluation === null || evaluation.eventId === null
        ? null
        : `${evaluation.workspaceId}::${evaluation.sessionId}::${evaluation.eventId}`;
    const eventKey =
      arming === null || candle === null
        ? null
        : `${arming.workspaceId}::${arming.sessionId}::${candle.eventId}`;

    const decided = decideRecoverySignalIntentGeneration({
      evaluation,
      arming,
      lifecycle,
      diagnostics,
      context,
      candle,
      alreadyConverted: decisionKey === null ? false : this.convertedDecisions.has(decisionKey),
      alreadyGenerated: eventKey === null ? false : this.generatedEvents.has(eventKey),
    });

    if (decided.outcome !== 'SIGNAL_INTENT_GENERATED' || decided.plan === null) {
      const result = withIntent(decided, null, false);
      this.lastResult = result;
      this.logResult(result);
      return result;
    }

    const emitted = await this.runtime.emitSignalIntent(toEmitCommand(decided.plan, command));

    if (decisionKey !== null) {
      this.convertedDecisions.add(decisionKey);
    }
    if (eventKey !== null) {
      this.generatedEvents.add(eventKey);
    }

    const result = withIntent(decided, emitted.intent, emitted.created);
    this.lastResult = result;
    this.logResult(result);
    return result;
  }

  private logResult(result: RecoverySignalIntentGenerateResult): void {
    this.logger.info('recovery_signal_intent_generation', {
      outcome: result.outcome,
      reason: result.reason,
      sessionId: result.sessionId,
      workspaceId: result.workspaceId,
      deploymentId: result.deploymentId,
      eventId: result.eventId,
      decisionKind: result.decision?.kind ?? null,
      decisionReason: result.decision?.reason ?? null,
      signalIntentId: result.intent?.id ?? null,
      intentHash: result.intent?.intentHash ?? null,
      intentCreated: result.intentCreated,
      signalIntentGenerated: result.signalIntentGenerated,
      orderCreated: result.orderCreated,
      checkpointEventId: result.restoredContext?.checkpointEventId ?? null,
      checkpointSequence: result.restoredContext?.checkpointSequence ?? null,
      checkpointVersion: result.restoredContext?.checkpointVersion ?? null,
      fencingToken: result.restoredContext?.fencingToken ?? null,
    });
  }
}

function toEmitCommand(
  plan: SignalIntentGenerationPlan,
  command: RecoverySignalIntentGenerateCommand,
) {
  return {
    workspaceId: plan.workspaceId,
    deploymentId: plan.deploymentId,
    sessionId: plan.sessionId,
    strategyVersion: plan.strategyVersion,
    instrument: plan.instrument,
    timeframe: plan.timeframe,
    direction: plan.direction,
    confidence: plan.confidence,
    marketCheckpoint: plan.marketCheckpoint,
    generatedAt: plan.generatedAt,
    recordedAt: command.recordedAt,
    actorId: command.actorId,
    correlationId: command.correlationId,
    metadata: Object.freeze({
      evaluationReason: plan.evaluationReason,
      open: plan.open,
      high: plan.high,
      low: plan.low,
      close: plan.close,
      volume: plan.volume,
      recoverySignalIntentGeneration: true,
      fencingToken: plan.fencingToken,
      checkpointEventId: plan.checkpointEventId,
      checkpointSequence: plan.checkpointSequence,
      checkpointVersion: plan.checkpointVersion,
      runtimeVersion: plan.runtimeVersion,
    }),
  };
}

function withIntent(
  decided: RecoverySignalIntentGenerationResult,
  intent: SignalIntent | null,
  intentCreated: boolean,
): RecoverySignalIntentGenerateResult {
  return Object.freeze({
    ...decided,
    intent,
    intentCreated,
  });
}
