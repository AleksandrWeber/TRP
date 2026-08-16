import { Inject, Injectable } from '@nestjs/common';
import { FinancialDecimal } from '../financial';
import { LedgerService } from '../ledger';
import { PaperAccountService } from '../paper-account';
import { POSITION_REPOSITORY, type PositionRepository } from '../positions';
import { StrategyDeploymentService, type StrategyDeployment } from '../strategy-deployment';
import {
  RUNTIME_LEASE_SESSION_STATUS_RUNNING,
  STRATEGY_RUNTIME_PORT,
  type EvaluationCandleInput,
  type StrategyRuntimePort,
} from '../strategy-runtime';
import type { TradingSession } from '../trading-session/domain/trading-session';
import { TradingSessionStatus } from '../trading-session/domain/trading-session-status';
import {
  TRADING_SESSION_REPOSITORY,
  type TradingSessionRepository,
} from '../trading-session/persistence/trading-session.repository';
import type {
  RunStrategyTradingPipelineCommand,
  StrategyTradingPipelineRiskContext,
} from './strategy-trading-pipeline.service';

export type AssembleRuntimePipelineInput = Readonly<{
  session: TradingSession;
  deployment: StrategyDeployment;
  event: EvaluationCandleInput;
  nowIso: string;
  recordedAt: string;
  actorId: string;
  correlationId?: string;
}>;

/**
 * Assembles a production `RunStrategyTradingPipelineCommand` from existing
 * Session / Deployment / Ledger / Position / Portfolio reads.
 * Not a risk engine. Risk decisions remain Canonical Risk inside the pipeline.
 */
@Injectable()
export class PipelineCommandAssembler {
  constructor(
    @Inject(TRADING_SESSION_REPOSITORY)
    private readonly sessions: TradingSessionRepository,
    @Inject(StrategyDeploymentService)
    private readonly deployments: StrategyDeploymentService,
    @Inject(PaperAccountService)
    private readonly accounts: PaperAccountService,
    @Inject(LedgerService)
    private readonly ledger: LedgerService,
    @Inject(POSITION_REPOSITORY)
    private readonly positions: PositionRepository,
    @Inject(STRATEGY_RUNTIME_PORT)
    private readonly runtime: StrategyRuntimePort,
  ) {}

  async listArmedStrategySessions(): Promise<TradingSession[]> {
    const running = await this.sessions.findByStatuses([TradingSessionStatus.RUNNING]);
    return running.filter((session) => session.origin === 'strategy' && session.lease !== null);
  }

  loadDeployment(workspaceId: string, deploymentId: string): Promise<StrategyDeployment | null> {
    return this.deployments.get(workspaceId, deploymentId);
  }

  async canEvaluate(session: TradingSession): Promise<boolean> {
    const lifecycle = await this.runtime.getLifecycle(session.workspaceId, session.id);
    return lifecycle.acceptsTicks && lifecycle.state === 'ARMED';
  }

  candleMatchesDeployment(event: EvaluationCandleInput, deployment: StrategyDeployment): boolean {
    return (
      event.instrument.toUpperCase() === deployment.instrument.toUpperCase() &&
      event.timeframe === deployment.timeframe
    );
  }

  async assemble(input: AssembleRuntimePipelineInput): Promise<RunStrategyTradingPipelineCommand> {
    const { session, deployment, event } = input;
    if (!session.lease) {
      throw new Error('trading session has no active lease');
    }
    const account = await this.accounts.get(session.workspaceId, session.paperAccountId);
    if (!account) {
      throw new Error('paper account not found in workspace');
    }
    const cash = await this.ledger.summarizeAccount(session.workspaceId, session.paperAccountId);
    const position = await this.positions.findByIdentity(
      session.workspaceId,
      session.paperAccountId,
      event.instrument.toUpperCase(),
    );
    const referencePrice = decimalText(event.close);
    const quantity = quantityFromDeployment(
      deployment.parameters,
      cash.availableCash,
      referencePrice,
    );
    const reservationAmount = reservationFor(quantity, referencePrice);

    const risk: StrategyTradingPipelineRiskContext = Object.freeze({
      account: {
        id: account.id,
        workspaceId: account.workspaceId,
        mode: account.mode,
        status: account.status,
        version: account.version,
      },
      session: {
        id: session.id,
        workspaceId: session.workspaceId,
        paperAccountId: session.paperAccountId,
        status: session.status,
        version: session.version,
        fencingToken: session.lease.fencingToken,
        reconciled: true,
      },
      cash: {
        workspaceId: cash.workspaceId,
        paperAccountId: cash.paperAccountId,
        currency: cash.currency || account.currency,
        availableCash: cash.availableCash,
        version: cash.version,
        reconciled: true,
      },
      reservation: null,
      position: position
        ? {
            workspaceId: position.workspaceId,
            paperAccountId: position.paperAccountId,
            instrument: position.instrument,
            availableQuantity: position.quantity,
            version: position.version,
            reconciled: true,
          }
        : null,
      portfolio: {
        workspaceId: session.workspaceId,
        paperAccountId: session.paperAccountId,
        checkpointId: cash.checkpoint || `portfolio:${session.paperAccountId}:v${cash.version}`,
        version: cash.version,
        reconciled: true,
      },
      duplicateIntent: false,
      unresolvedReconciliation: false,
    });

    return Object.freeze({
      workspaceId: session.workspaceId,
      sessionId: session.id,
      deploymentId: deployment.id,
      paperAccountId: session.paperAccountId,
      sessionFencingToken: session.lease.fencingToken,
      lease: {
        sessionId: session.id,
        fencingToken: session.lease.fencingToken,
        ownerId: session.lease.ownerId,
        expiresAt: session.lease.expiresAt,
        sessionStatus: RUNTIME_LEASE_SESSION_STATUS_RUNNING,
      },
      event,
      quantity,
      reservation: {
        currency: account.currency,
        amount: reservationAmount,
        idempotencyKey: `runtime:${session.id}:${event.eventId}`,
      },
      risk,
      referencePrice,
      nowIso: input.nowIso,
      recordedAt: input.recordedAt,
      actorId: input.actorId,
      ...(input.correlationId !== undefined ? { correlationId: input.correlationId } : {}),
    });
  }
}

function quantityFromDeployment(
  parameters: Readonly<Record<string, unknown>>,
  availableCash: string,
  referencePrice: string,
): string {
  const explicit = parameters.quantity ?? parameters.size;
  if (typeof explicit === 'string' && explicit.trim() !== '') {
    return FinancialDecimal.from(explicit).assertPositive('quantity').toString();
  }
  if (typeof explicit === 'number' && Number.isFinite(explicit)) {
    return FinancialDecimal.from(decimalText(explicit)).assertPositive('quantity').toString();
  }
  const riskPerTrade = parameters.riskPerTrade;
  if (typeof riskPerTrade === 'number' && riskPerTrade > 0 && riskPerTrade < 1) {
    const notional = FinancialDecimal.from(availableCash || '0').times(String(riskPerTrade));
    const price = FinancialDecimal.from(referencePrice);
    if (price.isPositive()) {
      const sized = notional.dividedBy(price);
      if (sized.isPositive()) return sized.toString();
    }
  }
  return '1';
}

function reservationFor(quantity: string, referencePrice: string): string {
  const notional = FinancialDecimal.from(quantity).times(referencePrice);
  const multiplier = FinancialDecimal.from('1.002');
  return notional.times(multiplier.toString()).toString();
}

function decimalText(value: number): string {
  if (!Number.isFinite(value)) {
    throw new Error('price must be finite');
  }
  return FinancialDecimal.from(value.toString()).toString();
}
