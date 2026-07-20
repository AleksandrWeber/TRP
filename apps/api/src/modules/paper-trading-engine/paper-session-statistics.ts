import { FinancialDecimal } from '../financial';
import type { PortfolioView } from '../portfolio-engine';
import type { PositionView } from '../position-engine';
import type { PaperExecution } from './domain/paper-execution';
import type { PaperSession } from './domain/paper-session';

/**
 * Session statistics derived from portfolio, positions, and executions (US208).
 */
export type PaperSessionStatistics = Readonly<{
  netPnL: string;
  grossPnL: string;
  winRate: string;
  profitFactor: string;
  maxDrawdown: string;
  averageTrade: string;
  sharpeRatio: string;
  currentEquity: string;
  tradeCount: number;
  winningTrades: number;
  losingTrades: number;
}>;

export function generatePaperSessionStatistics(input: {
  session: PaperSession;
  portfolio: PortfolioView;
  positions: readonly PositionView[];
  executions: readonly PaperExecution[];
  equityCurve?: readonly string[];
}): PaperSessionStatistics {
  const currentEquity = input.portfolio.equity.equity;
  const realized = FinancialDecimal.from(input.portfolio.equity.realizedPnL);
  const unrealized = FinancialDecimal.from(input.portfolio.equity.unrealizedPnL);
  const netPnL = realized.plus(unrealized);
  const commissions = input.executions.reduce(
    (sum, e) => sum.plus(FinancialDecimal.from(e.commission)),
    FinancialDecimal.zero(),
  );
  const grossPnL = netPnL.plus(commissions);

  const closedPnLs = input.positions
    .filter((p) => p.status === 'CLOSED')
    .map((p) => FinancialDecimal.from(p.realizedPnL));

  const winning = closedPnLs.filter((p) => p.isPositive());
  const losing = closedPnLs.filter((p) => p.isNegative());
  const tradeCount = closedPnLs.length;
  const winRate =
    tradeCount === 0
      ? '0'
      : FinancialDecimal.from(String(winning.length))
          .dividedBy(FinancialDecimal.from(String(tradeCount)))
          .toString();

  const grossWins = winning.reduce((s, p) => s.plus(p), FinancialDecimal.zero());
  const grossLossesAbs = losing.reduce((s, p) => s.plus(p.abs()), FinancialDecimal.zero());
  const profitFactor = grossLossesAbs.isZero()
    ? grossWins.isZero()
      ? '0'
      : grossWins.toString()
    : grossWins.dividedBy(grossLossesAbs).toString();

  const averageTrade =
    tradeCount === 0
      ? '0'
      : closedPnLs
          .reduce((s, p) => s.plus(p), FinancialDecimal.zero())
          .dividedBy(FinancialDecimal.from(String(tradeCount)))
          .toString();

  const curve =
    input.equityCurve && input.equityCurve.length > 0
      ? input.equityCurve
      : [input.session.initialBalance, currentEquity];
  const maxDrawdown = calculateMaxDrawdown(curve);
  const sharpeRatio = calculateSharpe(curve);

  return Object.freeze({
    netPnL: netPnL.toString(),
    grossPnL: grossPnL.toString(),
    winRate,
    profitFactor,
    maxDrawdown,
    averageTrade,
    sharpeRatio,
    currentEquity,
    tradeCount,
    winningTrades: winning.length,
    losingTrades: losing.length,
  });
}

function calculateMaxDrawdown(equityCurve: readonly string[]): string {
  if (equityCurve.length === 0) return '0';
  let peak = FinancialDecimal.from(equityCurve[0]!);
  let maxDd = FinancialDecimal.zero();
  for (const point of equityCurve) {
    const equity = FinancialDecimal.from(point);
    if (equity.compare(peak) > 0) peak = equity;
    if (peak.isZero()) continue;
    const dd = peak.minus(equity).dividedBy(peak);
    if (dd.compare(maxDd) > 0) maxDd = dd;
  }
  return maxDd.toString();
}

function calculateSharpe(equityCurve: readonly string[]): string {
  if (equityCurve.length < 2) return '0';
  const returns: FinancialDecimal[] = [];
  for (let i = 1; i < equityCurve.length; i += 1) {
    const prev = FinancialDecimal.from(equityCurve[i - 1]!);
    if (prev.isZero()) continue;
    const curr = FinancialDecimal.from(equityCurve[i]!);
    returns.push(curr.minus(prev).dividedBy(prev));
  }
  if (returns.length === 0) return '0';
  const mean = returns
    .reduce((s, r) => s.plus(r), FinancialDecimal.zero())
    .dividedBy(FinancialDecimal.from(String(returns.length)));
  const variance = returns
    .reduce((s, r) => {
      const diff = r.minus(mean);
      return s.plus(diff.times(diff));
    }, FinancialDecimal.zero())
    .dividedBy(FinancialDecimal.from(String(returns.length)));
  const std = financialSqrt(variance);
  if (std.isZero()) return '0';
  return mean.dividedBy(std).toString();
}

/** Newton–Raphson square root for financial decimals (display metrics only). */
function financialSqrt(value: FinancialDecimal): FinancialDecimal {
  if (value.isZero()) return FinancialDecimal.zero();
  if (value.isNegative()) return FinancialDecimal.zero();
  let guess = value;
  const two = FinancialDecimal.from('2');
  for (let i = 0; i < 24; i += 1) {
    guess = guess.plus(value.dividedBy(guess)).dividedBy(two);
  }
  return guess;
}
