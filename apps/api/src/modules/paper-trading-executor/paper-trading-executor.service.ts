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
    const signalKey = `${result.timestamp}::${result.signal}`;

    if (this.store.isProcessed(workspaceId, strategyId, signalKey)) {
      this.store.increment(workspaceId, strategyId, 'duplicates');
      return createSignalExecution({
        status: 'DUPLICATE',
        trade: null,
        reason: `Signal already processed: ${signalKey}`,
      });
    }
    this.store.markProcessed(workspaceId, strategyId, signalKey);

    try {
      switch (result.signal) {
        case 'HOLD':
          this.store.increment(workspaceId, strategyId, 'hold');
          return createSignalExecution({ status: 'HELD', trade: null, reason: 'HOLD signal' });
        case 'BUY':
          this.store.increment(workspaceId, strategyId, 'buy');
          return await this.openPosition(event);
        case 'SELL':
          this.store.increment(workspaceId, strategyId, 'sell');
          return await this.closePosition(event);
      }
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

  private async openPosition(event: EvaluationResultEvent): Promise<SignalExecution> {
    const { workspaceId, strategyId, result } = event;

    if (this.store.getOpenTrade(workspaceId, strategyId)) {
      this.store.increment(workspaceId, strategyId, 'ignored');
      return createSignalExecution({
        status: 'IGNORED',
        trade: null,
        reason: 'BUY ignored: position already open',
      });
    }

    const strategy = await this.strategies.getById(workspaceId, strategyId);
    if (!strategy) {
      this.store.increment(workspaceId, strategyId, 'ignored');
      return createSignalExecution({
        status: 'IGNORED',
        trade: null,
        reason: 'BUY ignored: strategy not found in workspace',
      });
    }

    const ticker = await this.cachedTicker(result.symbol);
    const trade = this.store.openTrade(workspaceId, {
      tradeId: randomUUID(),
      strategyId,
      symbol: result.symbol,
      side: 'BUY',
      entryPrice: ticker.price,
      exitPrice: null,
      quantity: strategy.positionSize,
      openTime: result.timestamp,
      closeTime: null,
      profitLoss: 0,
      status: 'OPEN',
    });
    this.logger.log(
      `Opened paper position ${trade.tradeId} (${trade.symbol} x ${trade.quantity} @ ${trade.entryPrice}) for strategy ${strategyId}`,
    );
    return createSignalExecution({ status: 'OPENED', trade, reason: null });
  }

  private async closePosition(event: EvaluationResultEvent): Promise<SignalExecution> {
    const { workspaceId, strategyId, result } = event;

    const open = this.store.getOpenTrade(workspaceId, strategyId);
    if (!open) {
      this.store.increment(workspaceId, strategyId, 'ignored');
      return createSignalExecution({
        status: 'IGNORED',
        trade: null,
        reason: 'SELL ignored: no open position',
      });
    }

    // Always exit using the open trade's own symbol so PnL never mixes
    // instruments if the strategy's trading pair changed mid-position.
    const ticker = await this.cachedTicker(open.symbol);
    const trade = this.store.closeTrade(workspaceId, strategyId, {
      exitPrice: ticker.price,
      closeTime: result.timestamp,
      profitLoss: round8((ticker.price - open.entryPrice) * open.quantity),
    });
    this.logger.log(
      `Closed paper position ${trade.tradeId} (${trade.symbol} @ ${trade.exitPrice}, PnL ${trade.profitLoss}) for strategy ${strategyId}`,
    );
    return createSignalExecution({ status: 'CLOSED', trade, reason: null });
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
