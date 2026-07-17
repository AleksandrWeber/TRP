import { beforeEach, describe, expect, it } from 'vitest';
import { PortfolioEngine } from './portfolio-engine';
import { PortfolioStatus } from './portfolio-status';

describe('PortfolioEngine (US120)', () => {
  let engine: PortfolioEngine;

  beforeEach(() => {
    engine = new PortfolioEngine();
  });

  it('initialize creates an active portfolio with capital as cash and equity', () => {
    const portfolio = engine.initialize({
      workspaceId: ' ws-1 ',
      initialCapital: 50_000,
      id: 'pf-1',
      timestamp: '2026-07-17T10:00:00.000Z',
    });

    expect(portfolio).toEqual({
      id: 'pf-1',
      workspaceId: 'ws-1',
      initialCapital: 50_000,
      currentCapital: 50_000,
      equity: 50_000,
      cash: 50_000,
      status: PortfolioStatus.Active,
    });
    expect(Object.keys(portfolio).sort()).toEqual([
      'cash',
      'currentCapital',
      'equity',
      'id',
      'initialCapital',
      'status',
      'workspaceId',
    ]);
  });

  it('snapshot reflects cash, equity, and PnL fields', () => {
    engine.initialize({
      workspaceId: 'ws-1',
      initialCapital: 10_000,
      timestamp: '2026-07-17T10:00:00.000Z',
    });

    engine.applyExecution({
      timestamp: '2026-07-17T11:00:00.000Z',
      cashDelta: -1_000,
      realizedPnLDelta: 250,
      unrealizedPnL: 100,
    });

    expect(engine.snapshot()).toEqual({
      timestamp: '2026-07-17T11:00:00.000Z',
      cash: 9_000,
      equity: 9_100,
      unrealizedPnL: 100,
      realizedPnL: 250,
    });
    expect(engine.getPortfolio().currentCapital).toBe(9_100);
  });

  it('close marks portfolio Closed and rejects further executions', () => {
    engine.initialize({ workspaceId: 'ws-1', initialCapital: 1_000 });
    const closed = engine.close('2026-07-17T12:00:00.000Z');

    expect(closed.status).toBe(PortfolioStatus.Closed);
    expect(() =>
      engine.applyExecution({ timestamp: '2026-07-17T13:00:00.000Z', cashDelta: 1 }),
    ).toThrow(/closed/i);
  });

  it('rejects double initialize while active', () => {
    engine.initialize({ workspaceId: 'ws-1', initialCapital: 1_000 });
    expect(() => engine.initialize({ workspaceId: 'ws-1', initialCapital: 2_000 })).toThrow(
      /already initialized/i,
    );
  });

  it('rejects negative initial capital and uninitialized snapshot', () => {
    expect(() => engine.initialize({ workspaceId: 'ws-1', initialCapital: -1 })).toThrow(
      /initialCapital/,
    );
    expect(() => engine.snapshot()).toThrow(/not been initialized/i);
  });
});
