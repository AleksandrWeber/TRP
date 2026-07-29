import { Inject, Injectable } from '@nestjs/common';
import {
  CanonicalOrderPathService,
  type CanonicalExecutionPathResult,
  type CanonicalRiskSnapshot,
} from '../canonical-order-path';
import { orderFillRecordedEnvelope, type PaperFill } from '../execution-engine';
import type { Order } from '../orders/domain/order';
import { ORDER_PROPOSAL_PORT, type OrderProposalPort } from '../orders/ports/order-proposal.port';
import { PositionAccountingConsumer, type FillAccountingResult } from '../positions';
import type { RiskDecision } from '../risk';
import {
  STRATEGY_RUNTIME_PORT,
  type StrategyRuntimePort,
} from '../strategy-runtime/ports/strategy-runtime.port';
import type { EvaluationCandleInput } from '../strategy-runtime/domain/evaluation-candle';
import type { EvaluationResult } from '../strategy-runtime/domain/evaluation-result';
import { EvaluationStatus } from '../strategy-runtime/domain/evaluation-result';
import type { RuntimeLeaseProofInput } from '../strategy-runtime/domain/runtime-lease-proof';
import type { SignalIntent } from '../strategy-runtime/domain/signal-intent';
import type { EvaluateTickCommand } from '../strategy-runtime/runtime-evaluation.service';

export const STRATEGY_TRADING_PIPELINE_PORT = Symbol('STRATEGY_TRADING_PIPELINE_PORT');

export type StrategyTradingPipelineRiskContext = Omit<CanonicalRiskSnapshot, 'market'> &
  Readonly<{
    /** Optional override; default market snapshot is derived from the closed candle. */
    market?: CanonicalRiskSnapshot['market'];
  }>;

export type RunStrategyTradingPipelineCommand = Readonly<{
  workspaceId: string;
  sessionId: string;
  deploymentId: string;
  paperAccountId: string;
  sessionFencingToken: number;
  lease: RuntimeLeaseProofInput;
  event: EvaluationCandleInput;
  quantity: string;
  reservation: Readonly<{
    currency: string;
    amount: string;
    idempotencyKey?: string;
  }>;
  risk: StrategyTradingPipelineRiskContext;
  referencePrice: string;
  nowIso: string;
  recordedAt: string;
  actorId: string;
  correlationId?: string;
}>;

export type StrategyTradingPipelineOutcome =
  | 'no_action'
  | 'already_processed'
  | 'rejected_not_admitted'
  | 'rejected_lifecycle'
  | 'order_rejected'
  | 'filled'
  | 'resting'
  | 'already_executed';

export type StrategyTradingPipelineResult = Readonly<{
  outcome: StrategyTradingPipelineOutcome;
  evaluation: EvaluationResult;
  signalIntent: SignalIntent | null;
  order: Order | null;
  riskDecision: RiskDecision | null;
  fill: PaperFill | null;
  accounting: FillAccountingResult | null;
  execution: CanonicalExecutionPathResult['execution'];
}>;

/**
 * End-to-end strategy trading pipeline (US223 / ADR-012).
 * Closed candle → Runtime evaluate → SignalIntent → Order proposal →
 * canonical Risk/Execution → existing Fill accounting. No parallel paths.
 */
@Injectable()
export class StrategyTradingPipelineService {
  constructor(
    @Inject(STRATEGY_RUNTIME_PORT)
    private readonly runtime: StrategyRuntimePort,
    @Inject(ORDER_PROPOSAL_PORT)
    private readonly proposals: OrderProposalPort,
    @Inject(CanonicalOrderPathService)
    private readonly canonicalPath: CanonicalOrderPathService,
    @Inject(PositionAccountingConsumer)
    private readonly accounting: PositionAccountingConsumer,
  ) {}

  async run(command: RunStrategyTradingPipelineCommand): Promise<StrategyTradingPipelineResult> {
    const evaluateCommand = toEvaluateCommand(command);
    const evaluation = await this.runtime.evaluate(evaluateCommand);

    if (evaluation.status === EvaluationStatus.ALREADY_PROCESSED) {
      return freezeResult({
        outcome: 'already_processed',
        evaluation,
        signalIntent: evaluation.intent,
        order: null,
        riskDecision: null,
        fill: null,
        accounting: null,
        execution: null,
      });
    }
    if (evaluation.status === EvaluationStatus.REJECTED_NOT_ADMITTED) {
      return freezeResult({
        outcome: 'rejected_not_admitted',
        evaluation,
        signalIntent: null,
        order: null,
        riskDecision: null,
        fill: null,
        accounting: null,
        execution: null,
      });
    }
    if (evaluation.status === EvaluationStatus.REJECTED_LIFECYCLE) {
      return freezeResult({
        outcome: 'rejected_lifecycle',
        evaluation,
        signalIntent: null,
        order: null,
        riskDecision: null,
        fill: null,
        accounting: null,
        execution: null,
      });
    }

    if (!evaluation.intent) {
      return freezeResult({
        outcome: 'no_action',
        evaluation,
        signalIntent: null,
        order: null,
        riskDecision: null,
        fill: null,
        accounting: null,
        execution: null,
      });
    }

    const signalIntent = evaluation.intent;
    const order = await this.proposals.proposeOrderFromSignalIntent({
      kind: 'SIGNAL_INTENT',
      signalIntent,
      paperAccountId: command.paperAccountId,
      sessionFencingToken: command.sessionFencingToken,
      quantity: command.quantity,
      recordedAt: command.recordedAt,
      eligibilityCheckedAt: command.nowIso,
      actorId: command.actorId,
      correlationId: command.correlationId ?? signalIntent.correlationId,
    });
    if (!order) {
      throw new Error('strategy pipeline expected an Order from Signal Intent');
    }

    const market = command.risk.market ?? marketFromCandle(command);
    const pathResult = await this.canonicalPath.runCanonicalPath({
      workspaceId: command.workspaceId,
      orderId: order.id,
      actorId: command.actorId,
      correlationId: command.correlationId,
      evaluatedAt: command.recordedAt,
      recordedAt: command.recordedAt,
      occurredAt: command.recordedAt,
      risk: { ...command.risk, market },
      reservation: command.reservation,
      requireStrategyOrigin: true,
      marketState: {
        streamId: signalIntent.marketCheckpoint.streamId,
        eventId: signalIntent.marketCheckpoint.eventId,
        sequence: signalIntent.marketCheckpoint.sequence,
        referencePrice: command.referencePrice,
        occurredAt: signalIntent.generatedAt,
      },
    });

    if (pathResult.outcome === 'rejected') {
      return freezeResult({
        outcome: 'order_rejected',
        evaluation,
        signalIntent,
        order: pathResult.order,
        riskDecision: pathResult.riskDecision,
        fill: null,
        accounting: null,
        execution: pathResult.execution,
      });
    }

    const fill = pathResult.execution?.fill ?? null;
    let accounting: FillAccountingResult | null = null;
    if (fill) {
      accounting = await this.accounting.process(
        orderFillRecordedEnvelope(fill),
        command.recordedAt,
      );
    }

    return freezeResult({
      outcome: mapPathOutcome(pathResult.outcome),
      evaluation,
      signalIntent,
      order: pathResult.order,
      riskDecision: pathResult.riskDecision,
      fill,
      accounting,
      execution: pathResult.execution,
    });
  }
}

function mapPathOutcome(
  outcome: CanonicalExecutionPathResult['outcome'],
): StrategyTradingPipelineOutcome {
  if (outcome === 'filled') return 'filled';
  if (outcome === 'resting') return 'resting';
  if (outcome === 'already_executed') return 'already_executed';
  if (outcome === 'rejected') return 'order_rejected';
  throw new Error(`unexpected canonical path outcome: ${outcome}`);
}

function toEvaluateCommand(command: RunStrategyTradingPipelineCommand): EvaluateTickCommand {
  return {
    workspaceId: command.workspaceId,
    sessionId: command.sessionId,
    deploymentId: command.deploymentId,
    event: command.event,
    lease: command.lease,
    nowIso: command.nowIso,
    recordedAt: command.recordedAt,
    actorId: command.actorId,
    correlationId: command.correlationId,
  };
}

function marketFromCandle(
  command: RunStrategyTradingPipelineCommand,
): NonNullable<CanonicalRiskSnapshot['market']> {
  return Object.freeze({
    workspaceId: command.workspaceId,
    streamId: command.event.streamId,
    eventId: command.event.eventId,
    sequence: command.event.sequence,
    instrument: command.event.instrument.toUpperCase(),
    health: 'healthy',
    referencePrice: command.referencePrice,
    occurredAt: command.event.closeTime,
    projectionVersion: command.event.sequence,
  });
}

function freezeResult(result: StrategyTradingPipelineResult): StrategyTradingPipelineResult {
  return Object.freeze(result);
}

export interface StrategyTradingPipelinePort {
  run(command: RunStrategyTradingPipelineCommand): Promise<StrategyTradingPipelineResult>;
}
