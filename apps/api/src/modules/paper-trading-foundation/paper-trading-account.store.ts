import type { PaperTradingAccount } from './paper-trading-account';

/**
 * Workspace-scoped Paper Account store (W2-S04-a).
 * At most one account per workspace.
 */
export const PAPER_TRADING_ACCOUNT_STORE = Symbol('PAPER_TRADING_ACCOUNT_STORE');

export interface PaperTradingAccountStore {
  findByWorkspace(workspaceId: string): Promise<PaperTradingAccount | null>;
  create(account: PaperTradingAccount): Promise<PaperTradingAccount>;
  save(account: PaperTradingAccount): Promise<PaperTradingAccount>;
}

export class InMemoryPaperTradingAccountStore implements PaperTradingAccountStore {
  private readonly byWorkspace = new Map<string, PaperTradingAccount>();

  async findByWorkspace(workspaceId: string): Promise<PaperTradingAccount | null> {
    return this.byWorkspace.get(workspaceId) ?? null;
  }

  async create(account: PaperTradingAccount): Promise<PaperTradingAccount> {
    if (this.byWorkspace.has(account.workspaceId)) {
      throw new PaperTradingAccountDuplicateError(account.workspaceId);
    }
    this.byWorkspace.set(account.workspaceId, account);
    return account;
  }

  async save(account: PaperTradingAccount): Promise<PaperTradingAccount> {
    const existing = this.byWorkspace.get(account.workspaceId);
    if (!existing || existing.id !== account.id) {
      throw new Error('paper account not found for workspace');
    }
    this.byWorkspace.set(account.workspaceId, account);
    return account;
  }

  /** Test helper — clear all accounts. */
  clear(): void {
    this.byWorkspace.clear();
  }
}

export class PaperTradingAccountDuplicateError extends Error {
  constructor(readonly workspaceId: string) {
    super(`Paper Account already exists for workspace ${workspaceId}`);
    this.name = 'PaperTradingAccountDuplicateError';
  }
}
