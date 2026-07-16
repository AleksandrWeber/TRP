import type {
  BacktestConfig,
  BacktestMetrics,
  BacktestResult,
  OhlcvBar,
  Strategy,
  StrategyParams,
  Trade,
} from '../types';

function applySlippage(price: number, slippageRate: number, side: 'buy' | 'sell'): number {
  return side === 'buy' ? price * (1 + slippageRate) : price * (1 - slippageRate);
}

function computeMetrics(
  trades: Trade[],
  equityCurve: Array<{ timestamp: number; equity: number }>,
  initialCapital: number,
): BacktestMetrics {
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl <= 0);
  const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
  const finalEquity = equityCurve.at(-1)?.equity ?? initialCapital;
  const totalReturn = finalEquity - initialCapital;

  let peak = initialCapital;
  let maxDrawdown = 0;
  for (const point of equityCurve) {
    peak = Math.max(peak, point.equity);
    maxDrawdown = Math.max(maxDrawdown, peak - point.equity);
  }

  const winRate = trades.length > 0 ? wins.length / trades.length : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  const averageWin = wins.length > 0 ? grossProfit / wins.length : 0;
  const averageLoss = losses.length > 0 ? grossLoss / losses.length : 0;
  const expectancy = trades.length > 0 ? trades.reduce((s, t) => s + t.pnl, 0) / trades.length : 0;

  return {
    totalReturn,
    totalReturnPercent: (totalReturn / initialCapital) * 100,
    tradeCount: trades.length,
    winCount: wins.length,
    lossCount: losses.length,
    winRate,
    profitFactor: Number.isFinite(profitFactor) ? profitFactor : 999,
    maxDrawdown,
    maxDrawdownPercent: peak > 0 ? (maxDrawdown / peak) * 100 : 0,
    averageWin,
    averageLoss,
    expectancy,
    finalEquity,
  };
}

export function runBacktest(
  bars: OhlcvBar[],
  strategy: Strategy<StrategyParams>,
  params: StrategyParams,
  config: BacktestConfig,
): BacktestResult {
  const normalizedParams = strategy.normalizeParams(params);
  if (bars.length < strategy.minBars(normalizedParams)) {
    throw new Error('Not enough bars for backtest');
  }

  const signals = strategy.signals(bars, normalizedParams);
  const trades: Trade[] = [];
  const equityCurve: Array<{ timestamp: number; equity: number }> = [];

  let cash = config.initialCapital;
  let position: {
    quantity: number;
    entryPrice: number;
    entryTime: number;
    entryFee: number;
  } | null = null;
  let equity = config.initialCapital;

  const barByTime = new Map(bars.map((b) => [b.timestamp, b]));

  for (const { timestamp, signal } of signals) {
    const bar = barByTime.get(timestamp);
    if (!bar) continue;

    if (signal === 'buy' && !position) {
      const entryPrice = applySlippage(bar.close, config.slippageRate, 'buy');
      const entryFee = cash * config.feeRate;
      const investable = cash - entryFee;
      const quantity = investable / entryPrice;
      position = { quantity, entryPrice, entryTime: timestamp, entryFee };
      cash = 0;
      equity = quantity * bar.close;
    } else if (signal === 'sell' && position) {
      const exitPrice = applySlippage(bar.close, config.slippageRate, 'sell');
      const gross = position.quantity * exitPrice;
      const exitFee = gross * config.feeRate;
      const net = gross - exitFee;
      const entryCost = position.quantity * position.entryPrice;
      const entryCash = entryCost + position.entryFee;
      const pnl = net - entryCost - position.entryFee;

      trades.push({
        entryTime: position.entryTime,
        exitTime: timestamp,
        entryPrice: position.entryPrice,
        exitPrice,
        side: 'long',
        quantity: position.quantity,
        pnl,
        pnlPercent: (pnl / entryCash) * 100,
        fees: position.entryFee + exitFee,
      });

      cash = net;
      position = null;
      equity = cash;
    } else if (position) {
      equity = position.quantity * bar.close;
    } else {
      equity = cash;
    }

    equityCurve.push({ timestamp, equity });
  }

  if (position) {
    const lastBar = bars.at(-1)!;
    const exitPrice = applySlippage(lastBar.close, config.slippageRate, 'sell');
    const gross = position.quantity * exitPrice;
    const exitFee = gross * config.feeRate;
    const net = gross - exitFee;
    const entryCost = position.quantity * position.entryPrice;
    const entryCash = entryCost + position.entryFee;
    const pnl = net - entryCost - position.entryFee;

    trades.push({
      entryTime: position.entryTime,
      exitTime: lastBar.timestamp,
      entryPrice: position.entryPrice,
      exitPrice,
      side: 'long',
      quantity: position.quantity,
      pnl,
      pnlPercent: (pnl / entryCash) * 100,
      fees: position.entryFee + exitFee,
    });

    equity = net;
    equityCurve.push({ timestamp: lastBar.timestamp, equity });
  }

  return {
    trades,
    equityCurve,
    metrics: computeMetrics(trades, equityCurve, config.initialCapital),
  };
}

export const DEFAULT_BACKTEST_CONFIG: BacktestConfig = {
  initialCapital: 10_000,
  feeRate: 0.001,
  slippageRate: 0.0005,
};
