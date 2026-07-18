import { describe, expect, it } from 'vitest';
import {
  LedgerAccount,
  LedgerCauseType,
  LedgerDirection,
  createLedgerTransaction,
} from './ledger-transaction';

const base = {
  workspaceId: 'ws-us173',
  paperAccountId: 'account-us173',
  idempotencyKey: 'opening-us173',
  causeType: LedgerCauseType.OPENING_CAPITAL,
  causeId: 'account-us173',
  currency: 'USDT',
  occurredAt: '2026-07-18T19:10:00.000Z',
  recordedAt: '2026-07-18T19:10:00.100Z',
  actorId: 'ledger-us173',
} as const;

describe('US173 — append-only balanced Ledger domain', () => {
  it('creates immutable balanced decimal entries with a durable cause', () => {
    const transaction = createLedgerTransaction({
      ...base,
      entries: [
        {
          account: LedgerAccount.AVAILABLE_CASH,
          direction: LedgerDirection.DEBIT,
          amount: '1000.125',
        },
        {
          account: LedgerAccount.ADJUSTMENT_COMPENSATION,
          direction: LedgerDirection.CREDIT,
          amount: '1000.125',
        },
      ],
    });

    expect(transaction).toMatchObject({
      workspaceId: base.workspaceId,
      causeType: LedgerCauseType.OPENING_CAPITAL,
      causeId: base.causeId,
      currency: 'USDT',
    });
    expect(transaction.entries).toHaveLength(2);
    expect(Object.isFrozen(transaction)).toBe(true);
    expect(Object.isFrozen(transaction.entries)).toBe(true);
  });

  it('rejects an unbalanced transaction', () => {
    expect(() =>
      createLedgerTransaction({
        ...base,
        entries: [
          {
            account: LedgerAccount.AVAILABLE_CASH,
            direction: LedgerDirection.DEBIT,
            amount: '100',
          },
          {
            account: LedgerAccount.ADJUSTMENT_COMPENSATION,
            direction: LedgerDirection.CREDIT,
            amount: '99',
          },
        ],
      }),
    ).toThrow(/not balanced/);
  });

  it('rejects floating-point inputs at the canonical boundary', () => {
    expect(() =>
      createLedgerTransaction({
        ...base,
        entries: [
          {
            account: LedgerAccount.AVAILABLE_CASH,
            direction: LedgerDirection.DEBIT,
            amount: 0.1 as never,
          },
          {
            account: LedgerAccount.ADJUSTMENT_COMPENSATION,
            direction: LedgerDirection.CREDIT,
            amount: '0.1',
          },
        ],
      }),
    ).toThrow(/canonical decimal string/);
  });

  it('requires a reason for append-only compensation corrections', () => {
    expect(() =>
      createLedgerTransaction({
        ...base,
        causeType: LedgerCauseType.COMPENSATION,
        entries: [
          {
            account: LedgerAccount.AVAILABLE_CASH,
            direction: LedgerDirection.DEBIT,
            amount: '1',
          },
          {
            account: LedgerAccount.ADJUSTMENT_COMPENSATION,
            direction: LedgerDirection.CREDIT,
            amount: '1',
          },
        ],
      }),
    ).toThrow(/compensation reason/);
  });
});
