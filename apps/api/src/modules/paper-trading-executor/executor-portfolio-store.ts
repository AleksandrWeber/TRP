import { Injectable } from '@nestjs/common';
import { createExecutedTrade, type ExecutedTrade } from './domain/executed-trade';
import { freezeSignalStats, type SignalStats } from './domain/strategy-portfolio';

/** Mutable per-strategy state; exposed to callers only as frozen copies. */
type PortfolioState = {
  workspaceId: string;
  strategyId: string;
  /** Insertion-ordered; contains the OPEN trade and every CLOSED trade. */
  trades: ExecutedTrade[];
  openTradeId: string | null;
  stats: {
    buy: number;
    sell: number;
    hold: number;
    ignored: number;
    duplicates: number;
    failures: number;
  };
  /** Idempotency guard — signal keys already processed for this strategy. */
  processedSignals: Set<string>;
};

export type MutableSignalStat = keyof PortfolioState['stats'];

/**
 * Process-local store of executor portfolios and trade history (US016).
 * One portfolio per (workspace, strategy). Nothing is ever deleted
 * automatically — history only grows.
 */
@Injectable()
export class ExecutorPortfolioStore {
  private readonly states = new Map<string, PortfolioState>();

  /** True when the (workspace, strategy) signal key was already processed. */
  isProcessed(workspaceId: string, strategyId: string, signalKey: string): boolean {
    return this.state(workspaceId, strategyId).processedSignals.has(signalKey);
  }

  markProcessed(workspaceId: string, strategyId: string, signalKey: string): void {
    this.state(workspaceId, strategyId).processedSignals.add(signalKey);
  }

  increment(workspaceId: string, strategyId: string, stat: MutableSignalStat): void {
    this.state(workspaceId, strategyId).stats[stat] += 1;
  }

  openTrade(workspaceId: string, trade: ExecutedTrade): ExecutedTrade {
    const state = this.state(workspaceId, trade.strategyId);
    if (state.openTradeId !== null) {
      throw new Error(`Open trade already exists for strategy: ${trade.strategyId}`);
    }
    const stored = createExecutedTrade(trade);
    if (stored.status !== 'OPEN') {
      throw new Error('openTrade requires an OPEN trade');
    }
    state.trades.push(stored);
    state.openTradeId = stored.tradeId;
    return stored;
  }

  closeTrade(
    workspaceId: string,
    strategyId: string,
    exit: { exitPrice: number; closeTime: string; profitLoss: number },
  ): ExecutedTrade {
    const state = this.state(workspaceId, strategyId);
    const index = state.trades.findIndex((trade) => trade.tradeId === state.openTradeId);
    if (state.openTradeId === null || index === -1) {
      throw new Error(`No open trade to close for strategy: ${strategyId}`);
    }
    const closed = createExecutedTrade({
      ...state.trades[index],
      exitPrice: exit.exitPrice,
      closeTime: exit.closeTime,
      profitLoss: exit.profitLoss,
      status: 'CLOSED',
    });
    state.trades[index] = closed;
    state.openTradeId = null;
    return closed;
  }

  getOpenTrade(workspaceId: string, strategyId: string): ExecutedTrade | null {
    const state = this.states.get(stateKey(workspaceId, strategyId));
    if (!state || state.openTradeId === null) return null;
    return state.trades.find((trade) => trade.tradeId === state.openTradeId) ?? null;
  }

  /** Every trade for one strategy, oldest first. */
  listTrades(workspaceId: string, strategyId?: string): ReadonlyArray<ExecutedTrade> {
    const states = [...this.states.values()].filter(
      (state) =>
        state.workspaceId === workspaceId &&
        (strategyId === undefined || state.strategyId === strategyId),
    );
    return Object.freeze(states.flatMap((state) => [...state.trades]));
  }

  getStats(workspaceId: string, strategyId: string): SignalStats | null {
    const state = this.states.get(stateKey(workspaceId, strategyId));
    return state ? freezeSignalStats(state.stats) : null;
  }

  /** Strategy ids that have executor state within the workspace. */
  listStrategyIds(workspaceId: string): ReadonlyArray<string> {
    return Object.freeze(
      [...this.states.values()]
        .filter((state) => state.workspaceId === workspaceId)
        .map((state) => state.strategyId),
    );
  }

  has(workspaceId: string, strategyId: string): boolean {
    return this.states.has(stateKey(workspaceId, strategyId));
  }

  clear(): void {
    this.states.clear();
  }

  private state(workspaceId: string, strategyId: string): PortfolioState {
    const key = stateKey(workspaceId, strategyId);
    let state = this.states.get(key);
    if (!state) {
      state = {
        workspaceId,
        strategyId,
        trades: [],
        openTradeId: null,
        stats: { buy: 0, sell: 0, hold: 0, ignored: 0, duplicates: 0, failures: 0 },
        processedSignals: new Set<string>(),
      };
      this.states.set(key, state);
    }
    return state;
  }
}

function stateKey(workspaceId: string, strategyId: string): string {
  return `${workspaceId}::${strategyId}`;
}
