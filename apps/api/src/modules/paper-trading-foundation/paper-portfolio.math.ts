/**
 * Paper portfolio math (W2-S04-d).
 *
 * Positions, cash, and PnL are derived from Paper Fills + Market Data marks.
 * Product projections only — not a Ledger and not exchange inventory.
 */

import type { PaperFill } from './paper-fill';

export type PaperPositionSide = 'LONG' | 'SHORT';

export type PaperPositionState = Readonly<{
  exchange: string;
  symbol: string;
  side: PaperPositionSide;
  quantity: string;
  averageEntryPrice: string;
  realizedPnL: string;
}>;

export type PaperPortfolioCashState = Readonly<{
  cashBalance: string;
  realizedPnL: string;
  positions: readonly PaperPositionState[];
}>;

export type MarkPriceLookup = (exchange: string, symbol: string) => string | null;

export type PaperPositionMark = Readonly<{
  exchange: string;
  symbol: string;
  side: PaperPositionSide;
  quantity: string;
  averageEntryPrice: string;
  markPrice: string | null;
  realizedPnL: string;
  unrealizedPnL: string | null;
}>;

export type PaperPortfolioTotals = Readonly<{
  cashBalance: string;
  equity: string | null;
  realizedPnL: string;
  unrealizedPnL: string | null;
  totalPnL: string | null;
  positions: readonly PaperPositionMark[];
}>;

/**
 * Apply fills chronologically to cash and open positions (average-cost netting).
 */
export function derivePortfolioFromFills(
  startingBalance: string,
  fills: readonly PaperFill[],
): PaperPortfolioCashState {
  let cash = asNumber(startingBalance);
  if (cash === null) throw new Error('starting balance is invalid');

  const buckets = new Map<string, MutablePosition>();
  let realizedTotal = 0;

  const ordered = [...fills].sort((a, b) => {
    const byTime = a.executionTime.localeCompare(b.executionTime);
    return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
  });

  for (const fill of ordered) {
    const qty = asNumber(fill.quantity);
    const price = asNumber(fill.executionPrice);
    if (qty === null || price === null) {
      throw new Error('paper fill quantities/prices are invalid');
    }
    const notional = qty * price;
    if (fill.side === 'BUY') cash -= notional;
    else cash += notional;

    const key = `${fill.exchange}::${fill.symbol}`;
    const current = buckets.get(key) ?? {
      exchange: fill.exchange,
      symbol: fill.symbol,
      quantity: 0,
      averageEntryPrice: 0,
      realizedPnL: 0,
    };

    const signedDelta = fill.side === 'BUY' ? qty : -qty;
    const before = current.quantity;
    const after = before + signedDelta;

    if (before === 0 || Math.sign(before) === Math.sign(signedDelta)) {
      // Increase or open in same direction — weighted average entry.
      const absBefore = Math.abs(before);
      const absAfter = Math.abs(after);
      current.averageEntryPrice =
        absAfter === 0 ? 0 : (absBefore * current.averageEntryPrice + qty * price) / absAfter;
      current.quantity = after;
    } else if (Math.abs(signedDelta) <= Math.abs(before) + 1e-12) {
      // Reduce / close — realize against average entry.
      const closed = Math.abs(signedDelta);
      const pnlPerUnit =
        before > 0 ? price - current.averageEntryPrice : current.averageEntryPrice - price;
      const realized = closed * pnlPerUnit;
      current.realizedPnL += realized;
      realizedTotal += realized;
      current.quantity = after;
      if (Math.abs(after) < 1e-12) {
        current.quantity = 0;
        current.averageEntryPrice = 0;
      }
    } else {
      // Flip through zero — close remaining then open opposite.
      const closed = Math.abs(before);
      const pnlPerUnit =
        before > 0 ? price - current.averageEntryPrice : current.averageEntryPrice - price;
      const realized = closed * pnlPerUnit;
      current.realizedPnL += realized;
      realizedTotal += realized;
      const remainder = Math.abs(signedDelta) - closed;
      current.quantity = Math.sign(signedDelta) * remainder;
      current.averageEntryPrice = price;
    }

    buckets.set(key, current);
  }

  const positions: PaperPositionState[] = [];
  for (const bucket of buckets.values()) {
    if (Math.abs(bucket.quantity) < 1e-12) continue;
    positions.push(
      Object.freeze({
        exchange: bucket.exchange,
        symbol: bucket.symbol,
        side: bucket.quantity > 0 ? 'LONG' : 'SHORT',
        quantity: formatDecimal(Math.abs(bucket.quantity)),
        averageEntryPrice: formatDecimal(bucket.averageEntryPrice),
        realizedPnL: formatDecimal(bucket.realizedPnL),
      }),
    );
  }
  positions.sort((a, b) =>
    a.exchange === b.exchange
      ? a.symbol.localeCompare(b.symbol)
      : a.exchange.localeCompare(b.exchange),
  );

  return Object.freeze({
    cashBalance: formatDecimal(cash),
    realizedPnL: formatDecimal(realizedTotal),
    positions: Object.freeze(positions),
  });
}

export function markPortfolio(
  state: PaperPortfolioCashState,
  lookupMark: MarkPriceLookup,
): PaperPortfolioTotals {
  let unrealizedSum = 0;
  let marksComplete = true;
  const positions: PaperPositionMark[] = state.positions.map((position) => {
    const mark = lookupMark(position.exchange, position.symbol);
    const qty = asNumber(position.quantity);
    const entry = asNumber(position.averageEntryPrice);
    const markNum = mark === null ? null : asNumber(mark);
    let unrealized: string | null = null;
    if (qty !== null && entry !== null && markNum !== null) {
      const unit = position.side === 'LONG' ? markNum - entry : entry - markNum;
      const value = unit * qty;
      unrealizedSum += value;
      unrealized = formatDecimal(value);
    } else {
      marksComplete = false;
    }
    return Object.freeze({
      ...position,
      markPrice: markNum === null ? null : formatDecimal(markNum),
      unrealizedPnL: unrealized,
    });
  });

  const cash = asNumber(state.cashBalance) ?? 0;
  const realized = asNumber(state.realizedPnL) ?? 0;
  let marketValue = 0;
  let equityComplete = marksComplete;
  for (const position of positions) {
    const qty = asNumber(position.quantity);
    const mark = position.markPrice === null ? null : asNumber(position.markPrice);
    if (qty === null || mark === null) {
      equityComplete = false;
      continue;
    }
    marketValue += position.side === 'LONG' ? qty * mark : -qty * mark;
  }

  return Object.freeze({
    cashBalance: state.cashBalance,
    equity: equityComplete ? formatDecimal(cash + marketValue) : null,
    realizedPnL: formatDecimal(realized),
    unrealizedPnL: marksComplete ? formatDecimal(unrealizedSum) : null,
    totalPnL: marksComplete ? formatDecimal(realized + unrealizedSum) : null,
    positions: Object.freeze(positions),
  });
}

export function projectCashAfterFill(
  startingBalance: string,
  existingFills: readonly PaperFill[],
  nextFill: PaperFill,
): string {
  return derivePortfolioFromFills(startingBalance, [...existingFills, nextFill]).cashBalance;
}

type MutablePosition = {
  exchange: string;
  symbol: string;
  quantity: number;
  averageEntryPrice: number;
  realizedPnL: number;
};

function asNumber(value: string): number | null {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  return amount;
}

function formatDecimal(value: number): string {
  if (Object.is(value, -0)) return '0';
  const text = value.toFixed(8).replace(/\.?0+$/, '');
  return text === '-0' ? '0' : text;
}
