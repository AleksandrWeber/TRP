/**
 * US181 — deterministic Order, Fill, Position, Ledger, valuation, and Portfolio replay.
 */
import { describe, expect, it } from 'vitest';
import { M2_PAPER_FILL_CONFIGURATION } from '../../modules/execution-adapter';
import type { PaperFill } from '../../modules/execution-engine';
import { FinancialDecimal } from '../../modules/financial';
import {
  createLedgerTransaction,
  LedgerAccount,
  LedgerCauseType,
  LedgerDirection,
  summarizeLedger,
  type LedgerTransaction,
} from '../../modules/ledger';
import { createOrderIntent, OrderSide, OrderType } from '../../modules/orders/domain/order-intent';
import {
  applyFillToPosition,
  projectPortfolio,
  rebuildPositions,
  valuePosition,
  type Position,
} from '../../modules/positions';

const WS = 'ws-us181';
const ACCOUNT = 'account-us181';
const t0 = '2026-07-18T20:50:00.000Z';

describe('US181 — deterministic replay and accounting invariants', () => {
  it('produces identical semantic outputs across replay runs with different operational clocks', () => {
    const first = replay(0);
    const second = replay(60_000);

    expect(first).toEqual(second);
    expect(first.position).toMatchObject({
      quantity: '1',
      costBasis: '100',
      realizedPnl: '20',
    });
    expect(first.portfolio).toMatchObject({
      cash: '919.68',
      marketValue: '110',
      equity: '1029.68',
      realizedPnl: '19.68',
      unrealizedPnl: '10',
      totalPnl: '29.68',
      fees: '0.32',
      complete: true,
    });
  });

  it('holds quantity, cost, PnL, and balance properties over decimal fixture ranges', () => {
    for (let index = 1; index <= 25; index += 1) {
      const quantity = `${index}.25`;
      const price = `${100 + index}.5`;
      const notional = FinancialDecimal.from(quantity).times(price).toString();
      const fill = paperFill('property', 'buy', price, quantity, notional, '0', 0);
      const transition = applyFillToPosition(null, fill, M2_PAPER_FILL_CONFIGURATION.precision, t0);

      expect(transition.position.quantity).toBe(quantity);
      expect(transition.position.costBasis).toBe(notional);
      expect(FinancialDecimal.from(transition.position.averageEntryPrice).equals(price)).toBe(true);
      expect(transition.realizedPnlDelta).toBe('0');
    }
  });
});

function replay(operationalOffsetMs: number) {
  const recordedAt = new Date(Date.parse(t0) + operationalOffsetMs).toISOString();
  const intent = createOrderIntent({
    clientOrderId: 'client-us181',
    idempotencyKey: 'order-us181',
    workspaceId: WS,
    paperAccountId: ACCOUNT,
    tradingSessionId: 'session-us181',
    sessionFencingToken: 1,
    mode: 'paper',
    origin: 'manual',
    instrument: 'BTCUSDT',
    side: OrderSide.BUY,
    type: OrderType.MARKET,
    quantity: '2',
    marketCheckpoint: { streamId: 'mark-us181', sequence: 7, eventId: 'market-7' },
    actorId: 'trader-us181',
    occurredAt: t0,
    recordedAt,
  });
  const buy = paperFill('buy', 'buy', '100', '2', '200', '0.2', operationalOffsetMs);
  const sell = paperFill('sell', 'sell', '120', '1', '120', '0.12', operationalOffsetMs);
  const fills = [buy, sell] as const;

  let position: Position | null = null;
  for (const fill of fills) {
    position = applyFillToPosition(
      position,
      fill,
      M2_PAPER_FILL_CONFIGURATION.precision,
      recordedAt,
    ).position;
  }
  if (!position) throw new Error('deterministic replay produced no Position');
  const rebuilt = rebuildPositions(fills, M2_PAPER_FILL_CONFIGURATION, recordedAt)[0]!;
  expect(positionSemantic(rebuilt)).toEqual(positionSemantic(position));

  const ledgerTransactions = ledgerFacts(recordedAt);
  const ledger = summarizeLedger(WS, ACCOUNT, ledgerTransactions);
  for (const transaction of ledgerTransactions) {
    const debit = sumDirection(transaction, LedgerDirection.DEBIT);
    const credit = sumDirection(transaction, LedgerDirection.CREDIT);
    expect(debit.equals(credit)).toBe(true);
  }
  const valuation = valuePosition(
    position,
    {
      workspaceId: WS,
      instrument: 'BTCUSDT',
      marketStreamId: 'mark-us181',
      marketEventId: 'market-8',
      marketSequence: 8,
      markPrice: '110',
      occurredAt: '2026-07-18T20:55:00.000Z',
      recordedAt,
    },
    null,
    M2_PAPER_FILL_CONFIGURATION.precision,
  );
  const portfolio = projectPortfolio(ledger, [valuation], null, recordedAt);
  expect(
    FinancialDecimal.from(portfolio.realizedPnl).plus(portfolio.unrealizedPnl).toString(),
  ).toBe(portfolio.totalPnl);
  expect(FinancialDecimal.from(ledger.openingCapital).plus(portfolio.totalPnl).toString()).toBe(
    portfolio.equity,
  );
  expect(FinancialDecimal.from(portfolio.cash).plus(portfolio.marketValue).toString()).toBe(
    portfolio.equity,
  );

  return Object.freeze({
    orderId: intent.orderId,
    intentHash: intent.intentHash,
    fillIds: fills.map((fill) => fill.id),
    position: positionSemantic(position),
    rebuiltPosition: positionSemantic(rebuilt),
    ledgerCheckpoint: ledger.checkpoint,
    valuation: {
      markPrice: valuation.markPrice,
      marketValue: valuation.marketValue,
      unrealizedPnl: valuation.unrealizedPnl,
      positionVersion: valuation.positionVersion,
    },
    portfolio: {
      cash: portfolio.cash,
      marketValue: portfolio.marketValue,
      equity: portfolio.equity,
      realizedPnl: portfolio.realizedPnl,
      unrealizedPnl: portfolio.unrealizedPnl,
      totalPnl: portfolio.totalPnl,
      fees: portfolio.fees,
      complete: portfolio.complete,
      sourceHash: portfolio.sourceHash,
    },
  });
}

function paperFill(
  suffix: string,
  side: 'buy' | 'sell',
  price: string,
  quantity: string,
  grossNotional: string,
  fee: string,
  operationalOffsetMs: number,
): PaperFill {
  return Object.freeze({
    id: `fill-us181-${suffix}`,
    workspaceId: WS,
    orderId: `order-us181-${suffix}`,
    paperAccountId: ACCOUNT,
    tradingSessionId: 'session-us181',
    adapterOrderId: `adapter-order-${suffix}`,
    adapterFillId: `adapter-fill-${suffix}`,
    sequence: 1,
    instrument: 'BTCUSDT',
    side,
    price,
    quantity,
    grossNotional,
    fee,
    executionContextHash: `context-${suffix}`,
    configurationId: M2_PAPER_FILL_CONFIGURATION.configurationId,
    configurationVersion: M2_PAPER_FILL_CONFIGURATION.version,
    configurationHash: M2_PAPER_FILL_CONFIGURATION.hash,
    occurredAt: side === 'buy' ? '2026-07-18T20:51:00.000Z' : '2026-07-18T20:52:00.000Z',
    recordedAt: new Date(Date.parse(t0) + operationalOffsetMs + 1_000).toISOString(),
  });
}

function ledgerFacts(recordedAt: string): LedgerTransaction[] {
  return [
    transaction('opening', LedgerCauseType.OPENING_CAPITAL, 'account-us181', recordedAt, [
      debit(LedgerAccount.AVAILABLE_CASH, '1000'),
      credit(LedgerAccount.ADJUSTMENT_COMPENSATION, '1000'),
    ]),
    transaction('reserve', LedgerCauseType.RESERVATION, 'reservation-us181', recordedAt, [
      debit(LedgerAccount.RESERVED_CASH, '200.2'),
      credit(LedgerAccount.AVAILABLE_CASH, '200.2'),
    ]),
    transaction('buy', LedgerCauseType.FILL, 'fill-us181-buy', recordedAt, [
      debit(LedgerAccount.POSITION_COST, '200'),
      debit(LedgerAccount.FEES, '0.2'),
      credit(LedgerAccount.RESERVED_CASH, '200.2'),
    ]),
    transaction('sell', LedgerCauseType.FILL, 'fill-us181-sell', recordedAt, [
      debit(LedgerAccount.AVAILABLE_CASH, '119.88'),
      debit(LedgerAccount.FEES, '0.12'),
      credit(LedgerAccount.POSITION_COST, '100'),
      credit(LedgerAccount.REALIZED_PNL, '20'),
    ]),
  ];
}

function transaction(
  suffix: string,
  causeType: LedgerCauseType,
  causeId: string,
  recordedAt: string,
  entries: ReadonlyArray<{
    account: LedgerAccount;
    direction: LedgerDirection;
    amount: string;
  }>,
) {
  return createLedgerTransaction({
    workspaceId: WS,
    paperAccountId: ACCOUNT,
    idempotencyKey: `ledger-us181-${suffix}`,
    causeType,
    causeId,
    currency: 'USDT',
    occurredAt: `2026-07-18T20:${suffix === 'opening' ? '50' : suffix === 'reserve' ? '51' : suffix === 'buy' ? '52' : '53'}:00.000Z`,
    recordedAt,
    actorId: 'ledger-us181',
    entries,
  });
}

function debit(account: LedgerAccount, amount: string) {
  return { account, direction: LedgerDirection.DEBIT, amount } as const;
}

function credit(account: LedgerAccount, amount: string) {
  return { account, direction: LedgerDirection.CREDIT, amount } as const;
}

function sumDirection(transaction: LedgerTransaction, direction: LedgerDirection) {
  return transaction.entries
    .filter((entry) => entry.direction === direction)
    .reduce((total, entry) => total.plus(entry.amount), FinancialDecimal.zero());
}

function positionSemantic(position: Position) {
  return {
    id: position.id,
    side: position.side,
    quantity: position.quantity,
    averageEntryPrice: position.averageEntryPrice,
    costBasis: position.costBasis,
    realizedPnl: position.realizedPnl,
    version: position.version,
    lastAppliedFillId: position.lastAppliedFillId,
    lastAppliedFillSequence: position.lastAppliedFillSequence,
  };
}
