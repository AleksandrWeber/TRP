import type { SignalResult } from '../signal-engine';
import type { ExecutedTrade } from './domain/executed-trade';
import { createSignalExecution, type SignalExecution } from './domain/signal-execution';
import { ExecutorPortfolioStore } from './executor-portfolio-store';

export type VirtualSignalExecutionInput = {
  workspaceId: string;
  strategyId: string;
  result: SignalResult;
  store: ExecutorPortfolioStore;
  resolvePrice: (symbol: string) => Promise<number>;
  resolveQuantity: () => Promise<number | null>;
  createTradeId: () => string;
};

/**
 * Shared BUY / SELL / HOLD state machine for paper trading and historical
 * research. Infrastructure concerns (price source, quantity source and id
 * generation) remain caller-owned, while execution semantics stay identical.
 */
export async function executeVirtualSignal(
  input: VirtualSignalExecutionInput,
): Promise<SignalExecution> {
  const { workspaceId, strategyId, result, store } = input;
  const signalKey = `${result.timestamp}::${result.signal}`;

  if (store.isProcessed(workspaceId, strategyId, signalKey)) {
    store.increment(workspaceId, strategyId, 'duplicates');
    return createSignalExecution({
      status: 'DUPLICATE',
      trade: null,
      reason: `Signal already processed: ${signalKey}`,
    });
  }
  store.markProcessed(workspaceId, strategyId, signalKey);

  switch (result.signal) {
    case 'HOLD':
      store.increment(workspaceId, strategyId, 'hold');
      return createSignalExecution({ status: 'HELD', trade: null, reason: 'HOLD signal' });
    case 'BUY':
      return openPosition(input);
    case 'SELL':
      return closePosition(input);
  }
}

async function openPosition(input: VirtualSignalExecutionInput): Promise<SignalExecution> {
  const { workspaceId, strategyId, result, store } = input;
  store.increment(workspaceId, strategyId, 'buy');

  if (store.getOpenTrade(workspaceId, strategyId)) {
    store.increment(workspaceId, strategyId, 'ignored');
    return createSignalExecution({
      status: 'IGNORED',
      trade: null,
      reason: 'BUY ignored: position already open',
    });
  }

  const quantity = await input.resolveQuantity();
  if (quantity === null) {
    store.increment(workspaceId, strategyId, 'ignored');
    return createSignalExecution({
      status: 'IGNORED',
      trade: null,
      reason: 'BUY ignored: strategy not found in workspace',
    });
  }

  const trade = store.openTrade(workspaceId, {
    tradeId: input.createTradeId(),
    strategyId,
    symbol: result.symbol,
    side: 'BUY',
    entryPrice: await input.resolvePrice(result.symbol),
    exitPrice: null,
    quantity,
    openTime: result.timestamp,
    closeTime: null,
    profitLoss: 0,
    status: 'OPEN',
  });
  return createSignalExecution({ status: 'OPENED', trade, reason: null });
}

async function closePosition(input: VirtualSignalExecutionInput): Promise<SignalExecution> {
  const { workspaceId, strategyId, result, store } = input;
  store.increment(workspaceId, strategyId, 'sell');

  const open = store.getOpenTrade(workspaceId, strategyId);
  if (!open) {
    store.increment(workspaceId, strategyId, 'ignored');
    return createSignalExecution({
      status: 'IGNORED',
      trade: null,
      reason: 'SELL ignored: no open position',
    });
  }

  const exitPrice = await input.resolvePrice(open.symbol);
  const trade: ExecutedTrade = store.closeTrade(workspaceId, strategyId, {
    exitPrice,
    closeTime: result.timestamp,
    profitLoss: round8((exitPrice - open.entryPrice) * open.quantity),
  });
  return createSignalExecution({ status: 'CLOSED', trade, reason: null });
}

function round8(value: number): number {
  return Math.round((value + Number.EPSILON) * 100_000_000) / 100_000_000;
}
