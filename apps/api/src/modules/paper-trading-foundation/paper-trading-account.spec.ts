import { describe, expect, it } from 'vitest';
import {
  activatePaperTradingAccount,
  createPaperTradingAccount,
  disablePaperTradingAccount,
  isPaperAccountCurrency,
  isPaperAccountStatus,
} from './paper-trading-account';

const now = '2026-08-26T12:00:00.000Z';

describe('Paper Trading Account model (W2-S04-a)', () => {
  it('creates an Active account with USD starting balance as current balance', () => {
    const account = createPaperTradingAccount({
      id: 'pa-1',
      workspaceId: 'workspace-a',
      ownerId: 'user-1',
      startingBalance: '25000',
      createdAt: now,
    });

    expect(account.status).toBe('ACTIVE');
    expect(account.baseCurrency).toBe('USD');
    expect(account.startingBalance).toBe('25000');
    expect(account.currentBalance).toBe('25000');
    expect(account.ownerId).toBe('user-1');
    expect(account.workspaceId).toBe('workspace-a');
    expect(account).not.toHaveProperty('exchangeScopeId');
    expect(account).not.toHaveProperty('provider');
  });

  it('rejects unsupported statuses and currencies', () => {
    expect(isPaperAccountStatus('ACTIVE')).toBe(true);
    expect(isPaperAccountStatus('DISABLED')).toBe(true);
    expect(isPaperAccountStatus('NOT_CREATED')).toBe(true);
    expect(isPaperAccountStatus('suspended')).toBe(false);
    expect(isPaperAccountStatus('pending_opening_ledger')).toBe(false);

    expect(isPaperAccountCurrency('USD')).toBe(true);
    expect(isPaperAccountCurrency('EUR')).toBe(false);

    expect(() =>
      createPaperTradingAccount({
        id: 'pa-1',
        workspaceId: 'workspace-a',
        ownerId: 'user-1',
        baseCurrency: 'EUR',
        createdAt: now,
      }),
    ).toThrow(/unsupported paper account currency/);
  });

  it('disables Active and activates Disabled only', () => {
    const active = createPaperTradingAccount({
      id: 'pa-1',
      workspaceId: 'workspace-a',
      ownerId: 'user-1',
      createdAt: now,
    });
    const later = '2026-08-26T13:00:00.000Z';
    const disabled = disablePaperTradingAccount(active, later);
    expect(disabled.status).toBe('DISABLED');
    expect(disabled.updatedAt).toBe(later);

    const reactivated = activatePaperTradingAccount(disabled, '2026-08-26T14:00:00.000Z');
    expect(reactivated.status).toBe('ACTIVE');

    expect(() => disablePaperTradingAccount(disabled, later)).toThrow(/cannot disable/);
    expect(() => activatePaperTradingAccount(active, later)).toThrow(/cannot activate/);
  });

  it('rejects negative or malformed balances', () => {
    expect(() =>
      createPaperTradingAccount({
        id: 'pa-1',
        workspaceId: 'workspace-a',
        ownerId: 'user-1',
        startingBalance: '-1',
        createdAt: now,
      }),
    ).toThrow(/starting balance/);
  });
});
