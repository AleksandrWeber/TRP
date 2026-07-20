import { describe, expect, it } from 'vitest';
import {
  archivePortfolio,
  createPortfolio,
  pausePortfolio,
  resumePortfolio,
  resetPortfolio,
  applyPortfolioFinancials,
} from './portfolio';

const NOW = '2026-07-20T12:00:00.000Z';
const LATER = '2026-07-20T13:00:00.000Z';

function portfolio() {
  return createPortfolio({
    id: 'pf-1',
    workspaceId: 'ws-1',
    ownerId: 'owner-1',
    currency: 'USD',
    initialCash: '100000',
    createdAt: NOW,
    updatedAt: NOW,
  });
}

describe('US204 Portfolio business rules and status transitions', () => {
  it('creates an ACTIVE portfolio with non-negative cash and zero margins/pnl', () => {
    const created = portfolio();
    expect(created.status).toBe('ACTIVE');
    expect(created.cash).toBe('100000');
    expect(created.realizedPnL).toBe('0');
    expect(created.unrealizedPnL).toBe('0');
    expect(created.usedMargin).toBe('0');
  });

  it('rejects negative cash on create', () => {
    expect(() =>
      createPortfolio({
        id: 'pf-1',
        workspaceId: 'ws-1',
        ownerId: 'owner-1',
        currency: 'USD',
        initialCash: '-1',
        createdAt: NOW,
        updatedAt: NOW,
      }),
    ).toThrow(/non-negative/);
  });

  it('supports ACTIVE → PAUSED → ACTIVE and ACTIVE → ARCHIVED', () => {
    const paused = pausePortfolio(portfolio(), LATER);
    expect(paused.status).toBe('PAUSED');
    expect(resumePortfolio(paused, LATER).status).toBe('ACTIVE');
    expect(archivePortfolio(portfolio(), LATER).status).toBe('ARCHIVED');
  });

  it('rejects resume from ACTIVE and pause from ARCHIVED', () => {
    expect(() => resumePortfolio(portfolio(), LATER)).toThrow(/cannot resume/);
    expect(() => pausePortfolio(archivePortfolio(portfolio(), LATER), LATER)).toThrow(
      /cannot transition from ARCHIVED/,
    );
  });

  it('resets financial state to initial cash', () => {
    const dirty = applyPortfolioFinancials(
      portfolio(),
      {
        cash: '90000',
        realizedPnL: '1000',
        unrealizedPnL: '-500',
        usedMargin: '2000',
      },
      LATER,
    );
    const reset = resetPortfolio(dirty, LATER);
    expect(reset).toMatchObject({
      cash: '100000',
      realizedPnL: '0',
      unrealizedPnL: '0',
      usedMargin: '0',
      status: 'ACTIVE',
    });
  });

  it('rejects reset and financial updates on archived portfolios', () => {
    const archived = archivePortfolio(portfolio(), LATER);
    expect(() => resetPortfolio(archived, LATER)).toThrow(/cannot be reset/);
    expect(() =>
      applyPortfolioFinancials(
        archived,
        { cash: '1', realizedPnL: '0', unrealizedPnL: '0', usedMargin: '0' },
        LATER,
      ),
    ).toThrow(/cannot be updated/);
  });
});
