import { Inject, Injectable } from '@nestjs/common';
import { MarketDataCacheService } from '../market-data-cache';
import { MarketDataProviderRegistry } from '../market-data-domain';
import { SignalEngineService } from '../signal-engine';
import { StrategyDomainService } from '../strategies';
import type { PaperPosition } from './domain/paper-position';
import type { TradeResult } from './domain/trade-result';
import { PaperTradingEngine } from './paper-trading.engine';
import { PnLCalculator, type PortfolioSummary } from './pnl-calculator';
import { PositionRegistry } from './position-registry';
import { TradeHistory } from './trade-history';

/**
 * On-request application orchestration for paper trading (US010).
 *
 * Strategy → SignalEngineService → cached ticker → PaperTradingEngine.
 * The engine receives only SignalResult + resolved execution inputs. This
 * service obtains prices exclusively through MarketDataCacheService; the
 * active provider is reachable only inside the cache-miss loader.
 */
@Injectable()
export class PaperTradingService {
  constructor(
    @Inject(StrategyDomainService) private readonly strategies: StrategyDomainService,
    @Inject(SignalEngineService) private readonly signals: SignalEngineService,
    @Inject(MarketDataCacheService) private readonly cache: MarketDataCacheService,
    @Inject(MarketDataProviderRegistry) private readonly providers: MarketDataProviderRegistry,
    @Inject(PaperTradingEngine) private readonly engine: PaperTradingEngine,
    @Inject(PositionRegistry) private readonly positions: PositionRegistry,
    @Inject(TradeHistory) private readonly history: TradeHistory,
    @Inject(PnLCalculator) private readonly pnl: PnLCalculator,
  ) {}

  /** Returns null for a missing/foreign-workspace strategy (mapped to 404). */
  async execute(workspaceId: string, strategyId: string): Promise<TradeResult | null> {
    const strategy = await this.strategies.getById(workspaceId, strategyId);
    if (!strategy) return null;

    const signal = await this.signals.evaluate(workspaceId, strategyId);
    if (!signal) return null;

    // If a strategy's symbol changes while a position is open, mark the
    // existing position using its own symbol so PnL never mixes instruments.
    const open = this.positions.getOpenByStrategy(workspaceId, strategyId);
    const executionSymbol = open?.symbol ?? signal.symbol;
    const ticker = await this.cachedTicker(executionSymbol);

    return this.engine.execute(workspaceId, signal, ticker.price, strategy.positionSize);
  }

  listPositions(workspaceId: string): ReadonlyArray<PaperPosition> {
    return this.positions.list(workspaceId);
  }

  listHistory(workspaceId: string): ReadonlyArray<TradeResult> {
    return this.history.list(workspaceId);
  }

  async portfolio(workspaceId: string): Promise<PortfolioSummary> {
    const positions = this.positions.list(workspaceId);
    const history = this.history.list(workspaceId);
    const symbols = [
      ...new Set(
        positions
          .filter((position) => position.status === 'OPEN')
          .map((position) => position.symbol),
      ),
    ];
    const prices = Object.fromEntries(
      await Promise.all(
        symbols.map(async (symbol) => {
          const ticker = await this.cachedTicker(symbol);
          return [symbol, ticker.price] as const;
        }),
      ),
    );
    return this.pnl.portfolio(positions, history, prices);
  }

  private cachedTicker(symbol: string) {
    return this.cache.getTicker(symbol, () => this.providers.getActive().getTicker(symbol));
  }
}
