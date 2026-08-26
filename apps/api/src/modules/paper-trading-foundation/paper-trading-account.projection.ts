import type { PaperAccountStatus, PaperTradingAccount } from './paper-trading-account';

/**
 * Operator projection for Paper Account (W2-S04-a).
 * Approved fields only. No orders, positions, portfolio, or PnL.
 */
export type PaperTradingAccountProjection = Readonly<{
  status: PaperAccountStatus;
  account: PaperTradingAccountView | null;
}>;

export type PaperTradingAccountView = Readonly<{
  id: string;
  workspaceId: string;
  status: 'ACTIVE' | 'DISABLED';
  baseCurrency: string;
  startingBalance: string;
  currentBalance: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}>;

export function toNotCreatedProjection(): PaperTradingAccountProjection {
  return Object.freeze({
    status: 'NOT_CREATED',
    account: null,
  });
}

export function toPaperTradingAccountProjection(
  account: PaperTradingAccount,
): PaperTradingAccountProjection {
  return Object.freeze({
    status: account.status,
    account: toPaperTradingAccountView(account),
  });
}

export function toPaperTradingAccountView(account: PaperTradingAccount): PaperTradingAccountView {
  return Object.freeze({
    id: account.id,
    workspaceId: account.workspaceId,
    status: account.status,
    baseCurrency: account.baseCurrency,
    startingBalance: account.startingBalance,
    currentBalance: account.currentBalance,
    ownerId: account.ownerId,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  });
}
