import { describe, expect, it } from 'vitest';
import {
  activatePaperAccount,
  closePaperAccount,
  createPaperAccount,
  PaperAccountStatus,
  suspendPaperAccount,
} from './paper-account';

const openedAt = '2026-07-18T12:00:00.000Z';

describe('US154 — paper account domain', () => {
  it('creates a paper-only account with an immutable decimal funding instruction', () => {
    const account = createPaperAccount({
      id: 'account-1',
      workspaceId: 'workspace-1',
      currency: 'usdt',
      mode: 'paper',
      openingCapital: '10000.5000',
      openedAt,
      recordedAt: openedAt,
    });

    expect(account).toMatchObject({
      currency: 'USDT',
      mode: 'paper',
      status: PaperAccountStatus.PENDING_OPENING_LEDGER,
      openingCapital: '10000.5',
      openingLedgerTransactionId: null,
      version: 1,
    });
    expect(Object.isFrozen(account)).toBe(true);
    expect(account).not.toHaveProperty('cashBalance');
    expect(account).not.toHaveProperty('equity');
  });

  it('rejects float input, non-positive capital, and non-paper mode', () => {
    const base = {
      id: 'account-1',
      workspaceId: 'workspace-1',
      currency: 'USDT',
      mode: 'paper' as const,
      openingCapital: '100',
      openedAt,
      recordedAt: openedAt,
    };
    expect(() => createPaperAccount({ ...base, openingCapital: 100.1 as never })).toThrow(
      /canonical decimal string/,
    );
    expect(() => createPaperAccount({ ...base, openingCapital: '0' })).toThrow(/greater than zero/);
    expect(() => createPaperAccount({ ...base, openingCapital: '0.0000000000000000001' })).toThrow(
      /DECIMAL\(38,18\)/,
    );
    expect(() => createPaperAccount({ ...base, mode: 'live' as never })).toThrow(
      /mode must be paper/,
    );
  });

  it('requires a Ledger transaction reference before activation', () => {
    const pending = createPaperAccount({
      id: 'account-1',
      workspaceId: 'workspace-1',
      currency: 'USDT',
      mode: 'paper',
      openingCapital: '100',
      openedAt,
      recordedAt: openedAt,
    });
    expect(() => activatePaperAccount(pending, '', openedAt)).toThrow(
      /opening ledger transaction id is required/,
    );
    const active = activatePaperAccount(
      pending,
      'ledger-transaction-1',
      '2026-07-18T12:00:01.000Z',
    );
    expect(active.status).toBe(PaperAccountStatus.ACTIVE);
    expect(active.version).toBe(2);
    expect(suspendPaperAccount(active, '2026-07-18T12:00:02.000Z').status).toBe(
      PaperAccountStatus.SUSPENDED,
    );
    expect(closePaperAccount(active, '2026-07-18T12:00:03.000Z').status).toBe(
      PaperAccountStatus.CLOSED,
    );
  });
});
