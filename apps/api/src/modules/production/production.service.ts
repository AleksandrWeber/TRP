import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DEFAULT_EMA_CROSSOVER_PARAMS, latestEmaCrossoverSignal, STRATEGY_ID } from '@trp/research';
import { getGitCommit } from '../../common/git';
import { BinanceClient } from '../market/binance.client';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { PaperBinanceAdapter } from './adapters/paper-binance.adapter';
import { RiskService } from './risk.service';

const MAX_PAPER_NOTIONAL = 1_000;
const PAPER_CAPITAL = 1_000;

@Injectable()
export class ProductionService {
  private readonly binance = new BinanceClient();

  constructor(
    private readonly prisma: PrismaService,
    private readonly risk: RiskService,
    private readonly adapter: PaperBinanceAdapter,
  ) {}

  async deploy(experimentId: string, approve = false) {
    const experiment = await this.prisma.experiment.findUnique({
      where: { id: experimentId },
      include: { dataset: true, deployment: true },
    });

    if (!experiment) {
      throw new NotFoundException(`Experiment ${experimentId} not found`);
    }

    if (experiment.deployment) {
      throw new BadRequestException('Experiment already deployed');
    }

    if (experiment.verdict === 'fail') {
      throw new BadRequestException('Failed experiments cannot be deployed');
    }

    if (experiment.verdict === 'needs_review' && !approve) {
      throw new BadRequestException('Human approval required for needs_review experiments');
    }

    if (experiment.strategyId !== STRATEGY_ID) {
      throw new BadRequestException(`Unsupported strategy: ${experiment.strategyId}`);
    }

    const deployment = await this.prisma.strategyDeployment.create({
      data: {
        experimentId,
        strategyId: experiment.strategyId,
        strategyVersion: experiment.strategyVersion,
        symbol: experiment.dataset.symbol,
        timeframe: experiment.dataset.timeframe,
        exchange: experiment.dataset.exchange,
        mode: 'paper',
        status: 'active',
        gitCommit: getGitCommit(),
        position: { create: { side: 'flat', quantity: 0 } },
      },
      include: { position: true, experiment: { include: { dataset: true } } },
    });

    return deployment;
  }

  listDeployments() {
    return this.prisma.strategyDeployment.findMany({
      orderBy: { approvedAt: 'desc' },
      include: {
        position: true,
        experiment: { select: { verdict: true, configHash: true } },
        _count: { select: { signals: true, executions: true } },
      },
    });
  }

  async getDeployment(id: string) {
    const deployment = await this.prisma.strategyDeployment.findUnique({
      where: { id },
      include: {
        position: true,
        experiment: { include: { dataset: true } },
        signals: { orderBy: { createdAt: 'desc' }, take: 20, include: { execution: true } },
        executions: { orderBy: { executedAt: 'desc' }, take: 20 },
      },
    });

    if (!deployment) {
      throw new NotFoundException(`Deployment ${id} not found`);
    }

    return deployment;
  }

  async stopDeployment(id: string) {
    const deployment = await this.prisma.strategyDeployment.update({
      where: { id },
      data: { status: 'stopped' },
    });
    return deployment;
  }

  listExecutions(deploymentId?: string) {
    return this.prisma.execution.findMany({
      where: deploymentId ? { deploymentId } : undefined,
      orderBy: { executedAt: 'desc' },
      include: {
        deployment: { select: { symbol: true, strategyId: true } },
        signal: { select: { type: true, timestamp: true } },
      },
      take: 50,
    });
  }

  async tick(deploymentId: string) {
    const deployment = await this.prisma.strategyDeployment.findUnique({
      where: { id: deploymentId },
      include: { position: true },
    });

    if (!deployment) {
      throw new NotFoundException(`Deployment ${deploymentId} not found`);
    }

    const rawBars = await this.binance.fetchKlines(deployment.symbol, deployment.timeframe, 120);
    const bars = this.binance.closedBars(rawBars);

    if (bars.length < DEFAULT_EMA_CROSSOVER_PARAMS.emaSlow + 2) {
      throw new BadRequestException('Insufficient market data for signal evaluation');
    }

    const { signal, timestamp } = latestEmaCrossoverSignal(bars, DEFAULT_EMA_CROSSOVER_PARAMS);
    const price = bars.at(-1)!.close;

    const signalRecord = await this.prisma.signal.create({
      data: {
        deploymentId,
        type: signal,
        price,
        timestamp: new Date(timestamp),
      },
    });

    if (signal === 'hold') {
      return {
        signal: signalRecord,
        execution: null,
        risk: { approved: false, reason: 'No actionable signal' },
        position: deployment.position,
      };
    }

    const position = deployment.position ?? { side: 'flat', quantity: 0, entryPrice: null };
    const quantity = signal === 'buy' ? PAPER_CAPITAL / price : position.quantity;

    const riskDecision = this.risk.evaluate({
      deploymentStatus: deployment.status,
      signalType: signal,
      positionSide: position.side as 'flat' | 'long',
      quantity,
      price,
      maxNotional: MAX_PAPER_NOTIONAL,
    });

    if (!riskDecision.approved) {
      return {
        signal: signalRecord,
        execution: null,
        risk: riskDecision,
        position,
      };
    }

    const orderResult = await this.adapter.submitOrder({
      symbol: deployment.symbol,
      side: signal,
      quantity,
      price,
      mode: 'paper',
    });

    const execution = await this.prisma.execution.create({
      data: {
        deploymentId,
        signalId: signalRecord.id,
        symbol: deployment.symbol,
        side: signal,
        quantity: orderResult.filledQuantity,
        price: orderResult.filledPrice,
        fee: orderResult.fee,
        mode: 'paper',
        status: orderResult.status,
        rejectReason: orderResult.rejectReason,
      },
    });

    await this.prisma.signal.update({
      where: { id: signalRecord.id },
      data: { actedOn: orderResult.status === 'filled' },
    });

    let updatedPosition = position;
    if (orderResult.status === 'filled') {
      if (signal === 'buy') {
        updatedPosition = await this.prisma.productionPosition.update({
          where: { deploymentId },
          data: { side: 'long', quantity, entryPrice: orderResult.filledPrice },
        });
      } else {
        updatedPosition = await this.prisma.productionPosition.update({
          where: { deploymentId },
          data: { side: 'flat', quantity: 0, entryPrice: null },
        });
      }
    }

    return {
      signal: signalRecord,
      execution,
      risk: riskDecision,
      position: updatedPosition,
    };
  }
}
