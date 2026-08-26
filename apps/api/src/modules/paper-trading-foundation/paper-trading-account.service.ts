import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PaperTradingAccountAudit } from './paper-trading-account.audit';
import {
  activatePaperTradingAccount,
  createPaperTradingAccount,
  disablePaperTradingAccount,
  type PaperTradingAccount,
} from './paper-trading-account';
import {
  toNotCreatedProjection,
  toPaperTradingAccountProjection,
  type PaperTradingAccountProjection,
} from './paper-trading-account.projection';
import {
  PAPER_TRADING_ACCOUNT_STORE,
  PaperTradingAccountDuplicateError,
  type PaperTradingAccountStore,
} from './paper-trading-account.store';

export type CreatePaperTradingAccountCommand = Readonly<{
  workspaceId: string;
  ownerId: string;
  baseCurrency?: string;
  startingBalance?: string;
}>;

/**
 * Paper Account application boundary (W2-S04-a).
 * One Paper Account per workspace. Independent of Exchange Connections.
 * Does not place orders, compute PnL, or call Market Data.
 */
@Injectable()
export class PaperTradingAccountService {
  constructor(
    @Inject(PAPER_TRADING_ACCOUNT_STORE)
    private readonly store: PaperTradingAccountStore,
    private readonly audit: PaperTradingAccountAudit,
  ) {}

  async getProjection(workspaceId: string): Promise<PaperTradingAccountProjection> {
    const account = await this.store.findByWorkspace(workspaceId);
    if (!account) return toNotCreatedProjection();
    return toPaperTradingAccountProjection(account);
  }

  async create(command: CreatePaperTradingAccountCommand): Promise<PaperTradingAccount> {
    const existing = await this.store.findByWorkspace(command.workspaceId);
    if (existing) {
      throw new PaperTradingAccountDuplicateError(command.workspaceId);
    }

    const now = new Date().toISOString();
    const account = createPaperTradingAccount({
      id: randomUUID(),
      workspaceId: command.workspaceId,
      ownerId: command.ownerId,
      baseCurrency: command.baseCurrency,
      startingBalance: command.startingBalance,
      createdAt: now,
    });

    try {
      const created = await this.store.create(account);
      await this.audit.record({
        outcome: 'paper_account_created',
        workspaceId: created.workspaceId,
        actorUserId: command.ownerId,
        paperAccountId: created.id,
        status: created.status,
        baseCurrency: created.baseCurrency,
      });
      await this.audit.record({
        outcome: 'paper_account_activated',
        workspaceId: created.workspaceId,
        actorUserId: command.ownerId,
        paperAccountId: created.id,
        status: created.status,
        baseCurrency: created.baseCurrency,
      });
      return created;
    } catch (error) {
      if (error instanceof PaperTradingAccountDuplicateError) throw error;
      throw error;
    }
  }

  async disable(workspaceId: string, actorUserId: string): Promise<PaperTradingAccount> {
    const existing = await this.requireAccount(workspaceId);
    const updated = disablePaperTradingAccount(existing, new Date().toISOString());
    const saved = await this.store.save(updated);
    await this.audit.record({
      outcome: 'paper_account_disabled',
      workspaceId: saved.workspaceId,
      actorUserId,
      paperAccountId: saved.id,
      status: saved.status,
      baseCurrency: saved.baseCurrency,
    });
    return saved;
  }

  async activate(workspaceId: string, actorUserId: string): Promise<PaperTradingAccount> {
    const existing = await this.requireAccount(workspaceId);
    const updated = activatePaperTradingAccount(existing, new Date().toISOString());
    const saved = await this.store.save(updated);
    await this.audit.record({
      outcome: 'paper_account_activated',
      workspaceId: saved.workspaceId,
      actorUserId,
      paperAccountId: saved.id,
      status: saved.status,
      baseCurrency: saved.baseCurrency,
    });
    return saved;
  }

  private async requireAccount(workspaceId: string): Promise<PaperTradingAccount> {
    const account = await this.store.findByWorkspace(workspaceId);
    if (!account) {
      throw new PaperTradingAccountNotFoundError(workspaceId);
    }
    return account;
  }
}

export class PaperTradingAccountNotFoundError extends Error {
  constructor(readonly workspaceId: string) {
    super(`Paper Account not found for workspace ${workspaceId}`);
    this.name = 'PaperTradingAccountNotFoundError';
  }
}
