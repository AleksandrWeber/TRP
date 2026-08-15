import type { PaperAccount } from './domain/paper-account';

export type PaperAccountView = Readonly<{
  id: string;
  workspaceId: string;
  exchangeScopeId: string;
  currency: string;
  mode: 'paper';
  status: string;
  openingCapital: string;
  version: number;
  openedAt: string;
  recordedAt: string;
}>;

export function toPaperAccountView(account: PaperAccount): PaperAccountView {
  return Object.freeze({
    id: account.id,
    workspaceId: account.workspaceId,
    exchangeScopeId: account.exchangeScopeId,
    currency: account.currency,
    mode: 'paper',
    status: account.status,
    openingCapital: account.openingCapital,
    version: account.version,
    openedAt: account.openedAt,
    recordedAt: account.recordedAt,
  });
}
