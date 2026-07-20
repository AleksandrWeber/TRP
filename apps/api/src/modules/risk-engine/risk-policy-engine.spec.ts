import { describe, expect, it } from 'vitest';
import { MarginValidator } from './margin-validator';
import { PositionLimitValidator } from './position-limit-validator';
import { RiskPolicyEngine } from './risk-policy-engine';
import { RiskEvaluator } from './risk-evaluator';
import { createRiskPolicy } from './domain/risk-policy';
import type {
  RiskActiveOrder,
  RiskOpenPosition,
  RiskOrderRequest,
  RiskPortfolioSnapshot,
} from './domain/risk-evaluation-context';

const order: RiskOrderRequest = Object.freeze({
  id: 'ord-1',
  portfolioId: 'pf-1',
  symbol: 'BTC-USD',
  side: 'BUY',
  type: 'LIMIT',
  quantity: '2',
  requestedPrice: '100',
});

const healthyPortfolio: RiskPortfolioSnapshot = Object.freeze({
  cash: '100000',
  equity: '100000',
  availableMargin: '100000',
  usedMargin: '0',
  realizedPnL: '0',
});

describe('US207 MarginValidator', () => {
  it('rejects insufficient balance', () => {
    const violation = MarginValidator.validateBalance({ ...healthyPortfolio, cash: '50' }, order);
    expect(violation?.code).toBe('INSUFFICIENT_BALANCE');
  });

  it('rejects insufficient margin', () => {
    const violation = MarginValidator.validateMargin(
      { ...healthyPortfolio, availableMargin: '10' },
      order,
      '1',
    );
    expect(violation?.code).toBe('INSUFFICIENT_MARGIN');
  });

  it('approves when capital and margin are sufficient', () => {
    expect(MarginValidator.validateBalance(healthyPortfolio, order)).toBeNull();
    expect(MarginValidator.validateMargin(healthyPortfolio, order)).toBeNull();
  });
});

describe('US207 PositionLimitValidator', () => {
  it('rejects position size over max quantity', () => {
    const violations = PositionLimitValidator.validatePositionSize(order, '1', null);
    expect(violations[0]?.code).toBe('POSITION_SIZE_EXCEEDED');
  });

  it('rejects when open position count exceeds limit', () => {
    const open: RiskOpenPosition[] = [
      { id: '1', symbol: 'A', side: 'LONG', quantity: '1', exposure: '1' },
      { id: '2', symbol: 'B', side: 'LONG', quantity: '1', exposure: '1' },
    ];
    expect(PositionLimitValidator.validateMaxOpenPositions(open, 2)?.code).toBe(
      'MAX_OPEN_POSITIONS',
    );
  });

  it('rejects duplicate active orders', () => {
    const active: RiskActiveOrder[] = [
      {
        id: 'other',
        symbol: 'BTC-USD',
        side: 'BUY',
        type: 'LIMIT',
        quantity: '2',
        requestedPrice: '100',
        status: 'PENDING',
      },
    ];
    expect(PositionLimitValidator.validateDuplicateOrders(order, active)?.code).toBe(
      'DUPLICATE_ORDER',
    );
  });

  it('rejects daily loss above threshold', () => {
    expect(
      PositionLimitValidator.validateDailyLoss({ ...healthyPortfolio, realizedPnL: '-500' }, '100')
        ?.code,
    ).toBe('DAILY_LOSS_EXCEEDED');
  });

  it('rejects exposure above configured percent', () => {
    expect(PositionLimitValidator.validateExposure([], order, '100', '50')?.code).toBe(
      'EXPOSURE_EXCEEDED',
    );
  });
});

describe('US207 RiskPolicyEngine + RiskEvaluator', () => {
  const policies = [
    createRiskPolicy({
      id: 'p-balance',
      name: 'portfolio_balance',
      priority: 10,
      configuration: {},
    }),
    createRiskPolicy({
      id: 'p-dup',
      name: 'duplicate_orders',
      priority: 20,
      configuration: {},
    }),
  ];

  it('approves when all policies pass', () => {
    const engine = new RiskPolicyEngine();
    const result = engine.evaluate({
      policies,
      order,
      portfolio: healthyPortfolio,
      openPositions: [],
      activeOrders: [],
    });
    expect(result.approved).toBe(true);
    expect(result.score).toBe('100');
  });

  it('rejects deterministically for insufficient balance', () => {
    const evaluator = new RiskEvaluator();
    const first = evaluator.evaluate({
      decisionId: 'd1',
      order,
      portfolio: { ...healthyPortfolio, cash: '1' },
      openPositions: [],
      activeOrders: [],
      policies,
      timestamp: '2026-07-20T15:00:00.000Z',
    });
    const second = evaluator.evaluate({
      decisionId: 'd2',
      order,
      portfolio: { ...healthyPortfolio, cash: '1' },
      openPositions: [],
      activeOrders: [],
      policies,
      timestamp: '2026-07-20T15:00:00.000Z',
    });
    expect(first.decision.decision).toBe('REJECTED');
    expect(second.decision.decision).toBe('REJECTED');
    expect(first.decision.reason).toBe(second.decision.reason);
    expect(first.result.score).toBe(second.result.score);
  });

  it('does not mutate input portfolio snapshot', () => {
    const snapshot = { ...healthyPortfolio };
    const cashBefore = snapshot.cash;
    new RiskPolicyEngine().evaluate({
      policies,
      order,
      portfolio: snapshot,
      openPositions: [],
      activeOrders: [],
    });
    expect(snapshot.cash).toBe(cashBefore);
  });
});
