import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaperAccountStatus } from './domain/paper-account';
import { PaperAccountController } from './paper-account.controller';
import type { PaperAccountService } from './paper-account.service';
import type { CommandAuthorizationService } from '../auth/command-authorization.service';
import { Role } from '../identity/role';

const at = '2026-08-15T12:00:00.000Z';

describe('PC-13 — Paper Account create controller', () => {
  let accounts: PaperAccountService;
  let authz: CommandAuthorizationService;
  let controller: PaperAccountController;

  beforeEach(() => {
    accounts = {
      create: vi.fn(async () =>
        Object.freeze({
          id: 'acct-1',
          workspaceId: 'ws-1',
          exchangeScopeId: 'exchange-scope:binance',
          currency: 'USDT',
          mode: 'paper' as const,
          status: PaperAccountStatus.PENDING_OPENING_LEDGER,
          openingCapital: '100000',
          openingLedgerTransactionId: null,
          version: 1,
          openedAt: at,
          recordedAt: at,
        }),
      ),
    } as unknown as PaperAccountService;
    authz = {
      authorizeTradingCommand: vi.fn(() =>
        Object.freeze({
          actorId: 'user-1',
          workspaceId: 'ws-1',
          role: Role.Trader,
          correlationId: null,
          idempotencyKey: null,
        }),
      ),
    } as unknown as CommandAuthorizationService;
    controller = new PaperAccountController(accounts, authz);
  });

  it('creates a paper account through the existing owner', async () => {
    const view = await controller.create(
      { user: { userId: 'user-1', role: Role.Trader } } as never,
      'ws-1',
      undefined,
      undefined,
      { currency: 'USDT', openingCapital: '100000', mode: 'paper' },
    );
    expect(accounts.create).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'ws-1',
        currency: 'USDT',
        mode: 'paper',
        openingCapital: '100000',
        actorId: 'user-1',
      }),
    );
    expect(view.mode).toBe('paper');
    expect(view.id).toBe('acct-1');
  });

  it('rejects missing workspace header', async () => {
    await expect(
      controller.create(
        { user: { userId: 'user-1', role: Role.Trader } } as never,
        undefined,
        undefined,
        undefined,
        { currency: 'USDT', openingCapital: '100000', mode: 'paper' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('maps authorization failure to forbidden', async () => {
    vi.mocked(authz.authorizeTradingCommand).mockImplementation(() => {
      throw new Error('trading command requires Trader or Administrator role');
    });
    await expect(
      controller.create(
        { user: { userId: 'user-1', role: Role.Reader } } as never,
        'ws-1',
        undefined,
        undefined,
        { currency: 'USDT', openingCapital: '100000', mode: 'paper' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
