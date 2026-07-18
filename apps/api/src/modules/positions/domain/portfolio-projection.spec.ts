import { describe, expect, it } from 'vitest';
import type { LedgerAccountSummary } from '../../ledger';
import { projectPortfolio } from './portfolio-projection';
import type { PositionValuation } from './position-valuation';

const ledger: LedgerAccountSummary = Object.freeze({
  workspaceId: 'workspace-1',
  paperAccountId: 'account-1',
  currency: 'USDT',
  availableCash: '799.8',
  reservedCash: '0',
  cash: '799.8',
  positionCost: '200',
  fees: '0.2',
  realizedPnl: '0',
  openingCapital: '1000',
  version: 3,
  checkpoint: 'ledger-checkpoint',
  lastRecordedAt: '2026-07-18T12:00:00.000Z',
});

const valuation: PositionValuation = Object.freeze({
  id: 'valuation:position-1',
  workspaceId: 'workspace-1',
  paperAccountId: 'account-1',
  positionId: 'position-1',
  instrument: 'BTCUSDT',
  positionVersion: 1,
  version: 1,
  marketStreamId: 'mark-stream',
  marketEventId: 'mark-1',
  marketSequence: 1,
  markPrice: '125',
  quantity: '2',
  costBasis: '200',
  realizedPnl: '0',
  marketValue: '250',
  unrealizedPnl: '50',
  occurredAt: '2026-07-18T12:01:00.000Z',
  recordedAt: '2026-07-18T12:01:01.000Z',
});

describe('US176 — Portfolio projection', () => {
  it('derives equity, net realized PnL, total PnL, fees, and exposure from Ledger and valuations', () => {
    const portfolio = projectPortfolio(ledger, [valuation], null, '2026-07-18T12:02:00.000Z');

    expect(portfolio).toMatchObject({
      cash: '799.8',
      marketValue: '250',
      equity: '1049.8',
      realizedPnl: '-0.2',
      unrealizedPnl: '50',
      totalPnl: '49.8',
      fees: '0.2',
      exposure: '250',
      complete: true,
      ledgerVersion: 3,
    });
    expect(portfolio.sourceHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('marks a valuation checkpoint incomplete when it does not match Ledger cost', () => {
    const portfolio = projectPortfolio(ledger, [], null, '2026-07-18T12:02:00.000Z');
    expect(portfolio.complete).toBe(false);
    expect(portfolio).not.toHaveProperty('authoritative');
  });
});
