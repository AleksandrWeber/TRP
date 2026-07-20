import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { EvaluationSchedulerService, type EvaluationResultEvent } from '../evaluation-scheduler';
import { MarketDataCacheService } from '../market-data-cache';
import { MarketDataProviderRegistry, type Ticker } from '../market-data-domain';
import { StrategyDomainService } from '../strategies';
import type { ExecutedTrade } from './domain/executed-trade';
import { ExecutorPortfolioNotFoundError } from './domain/paper-trading-executor.error';
import { createSignalExecution, type SignalExecution } from './domain/signal-execution';
import { freezeStrategyPortfolio, type StrategyPortfolio } from './domain/strategy-portfolio';
import { ExecutorPortfolioStore } from './executor-portfolio-store';
import { executeVirtualSignal } from './virtual-signal-executor';

/**
 * Paper Trading Executor (US016).
 *
 * Subscribes to Evaluation Scheduler results and executes virtual trades
 * only — no real exchange orders, risk management, stop loss, take profit,
 * leverage, fees, or slippage.
 *
 * Rules: BUY opens one long position when none exists (second BUY ignored);
 * SELL closes the open position (SELL without one ignored); HOLD only
 * records statistics. Each (workspace, strategy) signal is processed at most
 * once — re-delivery of the same SignalResult can never duplicate a trade.
 * Prices come exclusively through MarketDataCacheService; the active provider
 * is reachable only inside the cache-miss loader.
 */
@Injectable()
export class PaperTradingExecutorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaperTradingExecutorService.name);
  private unsubscribe: (() => void) | null = null;

  constructor(
    @Inject(EvaluationSchedulerService) private readonly scheduler: EvaluationSchedulerService,
    @Inject(StrategyDomainService) private readonly strategies: StrategyDomainService,
    @Inject(MarketDataCacheService) private readonly cache: MarketDataCacheService,
    @Inject(MarketDataProviderRegistry) private readonly providers: MarketDataProviderRegistry,
    @Inject(ExecutorPortfolioStore) private readonly store: ExecutorPortfolioStore,
  ) {}

  onModuleInit(): void {
    this.unsubscribe = this.scheduler.onResult(async (event) => {
      await this.process(event);
    });
    this.logger.log('Paper trading executor subscribed to evaluation scheduler results');
  }

  onModuleDestroy(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.logger.log('Paper trading executor unsubscribed');
  }

  /**
   * Process one scheduler evaluation result. Never throws — every failure is
   * recorded as a FAILED outcome so the executor (and scheduler) survive.
   */
  async process(event: EvaluationResultEvent): Promise<SignalExecution> {
    const { workspaceId, strategyId, result } = event;

    try {
      const execution = await executeVirtualSignal({
        workspaceId,
        strategyId,
        result,
        store: this.store,
        resolvePrice: async (symbol) => (await this.cachedTicker(symbol)).price,
        resolveQuantity: async () =>
          (await this.strategies.getById(workspaceId, strategyId))?.positionSize ?? null,
        createTradeId: randomUUID,
      });
      if (execution.trade) {
        this.logger.log(
          `${execution.status === 'OPENED' ? 'Opened' : 'Closed'} paper position ${execution.trade.tradeId} for strategy ${strategyId}`,
        );
      }
      return execution;
    } catch (error) {
      this.store.increment(workspaceId, strategyId, 'failures');
      this.logger.error(
        `Paper execution failed for strategy ${strategyId} (workspace ${workspaceId}); executor continues`,
        error instanceof Error ? error.stack : String(error),
      );
      return createSignalExecution({
        status: 'FAILED',
        trade: null,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /** Per-strategy portfolio; unrealized PnL uses the current cached price. */
  async getPortfolio(workspaceId: string, strategyId: string): Promise<StrategyPortfolio> {
    if (!this.store.has(workspaceId, strategyId)) {
      throw new ExecutorPortfolioNotFoundError(workspaceId, strategyId);
    }
    return this.buildPortfolio(workspaceId, strategyId);
  }

  async listPortfolios(workspaceId: string): Promise<ReadonlyArray<StrategyPortfolio>> {
    const strategyIds = this.store.listStrategyIds(workspaceId);
    return Object.freeze(
      await Promise.all(strategyIds.map((id) => this.buildPortfolio(workspaceId, id))),
    );
  }

  /** Complete trade history (OPEN + CLOSED); nothing is deleted. */
  listTrades(workspaceId: string, strategyId?: string): ReadonlyArray<ExecutedTrade> {
    return this.store.listTrades(workspaceId, strategyId);
  }

  private async buildPortfolio(
    workspaceId: string,
    strategyId: string,
  ): Promise<StrategyPortfolio> {
    const trades = this.store.listTrades(workspaceId, strategyId);
    const open = this.store.getOpenTrade(workspaceId, strategyId);
    const closed = trades.filter((trade) => trade.status === 'CLOSED');

    let unrealizedPnL = 0;
    if (open) {
      const ticker = await this.cachedTicker(open.symbol);
      unrealizedPnL = round8((ticker.price - open.entryPrice) * open.quantity);
    }

    return freezeStrategyPortfolio({
      workspaceId,
      strategyId,
      currentPosition: open,
      unrealizedPnL,
      realizedPnL: round8(closed.reduce((sum, trade) => sum + trade.profitLoss, 0)),
      totalTrades: trades.length,
      wins: closed.filter((trade) => trade.profitLoss > 0).length,
      losses: closed.filter((trade) => trade.profitLoss < 0).length,
      signalStats: this.store.getStats(workspaceId, strategyId) ?? {
        buy: 0,
        sell: 0,
        hold: 0,
        ignored: 0,
        duplicates: 0,
        failures: 0,
      },
      generatedAt: new Date().toISOString(),
    });
  }

  private cachedTicker(symbol: string): Promise<Ticker> {
    return this.cache.getTicker(symbol, () => this.providers.getActive().getTicker(symbol));
  }
}

function round8(value: number): number {
  return Math.round((value + Number.EPSILON) * 100_000_000) / 100_000_000;
}
