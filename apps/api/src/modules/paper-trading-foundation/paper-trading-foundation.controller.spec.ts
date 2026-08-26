import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../identity/role';
import type { WorkspaceAccessService } from '../workspace';
import { PaperTradingAccountService } from './paper-trading-account.service';
import { PaperTradingFoundationController } from './paper-trading-foundation.controller';
import { InMemoryPaperTradingAccountStore } from './paper-trading-account.store';
import { PaperTradingAccountAudit } from './paper-trading-account.audit';

describe('PaperTradingFoundationController (W2-S04-a)', () => {
  let store: InMemoryPaperTradingAccountStore;
  let controller: PaperTradingFoundationController;
  let workspaceAccess: { assertMember: ReturnType<typeof vi.fn> };

  const trader: AuthUser = {
    userId: 'trader-1',
    email: 'trader@example.com',
    displayName: 'Trader',
    role: Role.Trader,
  };

  beforeEach(() => {
    store = new InMemoryPaperTradingAccountStore();
    const audit = { record: vi.fn().mockResolvedValue(undefined) };
    const service = new PaperTradingAccountService(
      store,
      audit as unknown as PaperTradingAccountAudit,
    );
    workspaceAccess = {
      assertMember: vi.fn((workspaceId: string, userId: string) => {
        if (workspaceId === 'workspace-b' && userId === trader.userId) {
          throw new Error('not a member');
        }
      }),
    };
    controller = new PaperTradingFoundationController(
      service,
      workspaceAccess as unknown as WorkspaceAccessService,
    );
  });

  it('creates and returns the workspace Paper Account projection', async () => {
    const created = await controller.createAccount({ user: trader }, 'workspace-a', {
      startingBalance: '100000',
    });
    expect(created.status).toBe('ACTIVE');
    expect(created.account?.baseCurrency).toBe('USD');
    expect(created.account?.startingBalance).toBe('100000');

    const viewed = await controller.getAccount({ user: trader }, 'workspace-a');
    expect(viewed.account?.id).toBe(created.account?.id);
  });

  it('rejects duplicate create for the same workspace', async () => {
    await controller.createAccount({ user: trader }, 'workspace-a', {});
    await expect(controller.createAccount({ user: trader }, 'workspace-a', {})).rejects.toThrow(
      /already exists/,
    );
  });

  it('denies foreign workspace access', async () => {
    await expect(controller.getAccount({ user: trader }, 'workspace-b')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('disables an account for Disabled UI state', async () => {
    await controller.createAccount({ user: trader }, 'workspace-a', {});
    const disabled = await controller.disableAccount({ user: trader }, 'workspace-a');
    expect(disabled.status).toBe('DISABLED');
    expect(disabled.account?.status).toBe('DISABLED');
  });
});
