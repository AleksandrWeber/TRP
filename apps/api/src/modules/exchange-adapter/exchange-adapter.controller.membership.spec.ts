import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../identity/role';
import { InMemoryWorkspaceRepository } from '../workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../workspace/workspace-access.service';
import { WorkspaceDomainService } from '../workspace/workspace-domain.service';
import { ExchangeAdapterController } from './exchange-adapter.controller';
import type { ExchangeAdapterService } from './exchange-adapter.service';

function request(userId: string, role: Role = Role.Trader): { user: AuthUser } {
  return { user: { userId, email: `${userId}@trp.local`, displayName: userId, role } };
}

describe('Exchange adapter workspace membership', () => {
  let controller: ExchangeAdapterController;
  let workspaceId: string;
  const spies = {
    listExchanges: vi.fn(async () => []),
    getStatus: vi.fn(async () => ({ connected: false })),
    getCapabilities: vi.fn(async () => []),
    getExchange: vi.fn(async () => ({ id: 'binance' })),
    connect: vi.fn(async () => ({ id: 'binance', connected: true })),
    disconnect: vi.fn(async () => ({ id: 'binance', connected: false })),
  };

  beforeEach(async () => {
    for (const spy of Object.values(spies)) spy.mockClear();
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    workspaceId = (await workspaces.create({ name: 'One', ownerUserId: 'owner' })).id;
    controller = new ExchangeAdapterController(
      spies as unknown as ExchangeAdapterService,
      workspaces,
      new WorkspaceAccessService(workspaces),
    );
  });

  const owner = () => request('owner');

  it.each([
    [
      'list',
      (actor: { user: AuthUser }, id?: string) => controller.list(actor, id),
      spies.listExchanges,
    ],
    [
      'status',
      (actor: { user: AuthUser }, id?: string) => controller.status(actor, id),
      spies.getStatus,
    ],
    [
      'capabilities',
      (actor: { user: AuthUser }, id?: string) => controller.capabilities(actor, 'binance', id),
      spies.getCapabilities,
    ],
    [
      'get',
      (actor: { user: AuthUser }, id?: string) => controller.get(actor, 'binance', id),
      spies.getExchange,
    ],
    [
      'connect',
      (actor: { user: AuthUser }, id?: string) =>
        controller.connect(actor, { exchangeId: 'binance' }, id),
      spies.connect,
    ],
    [
      'disconnect',
      (actor: { user: AuthUser }, id?: string) =>
        controller.disconnect(actor, { exchangeId: 'binance' }, id),
      spies.disconnect,
    ],
  ] as const)(
    '%s rejects non-owners before the adapter and still serves the owner',
    async (_name, call, spy) => {
      await expect(call(owner(), undefined)).rejects.toBeInstanceOf(BadRequestException);
      await expect(call(owner(), 'missing-workspace')).rejects.toBeInstanceOf(NotFoundException);
      await expect(call(request('stranger', Role.Admin), workspaceId)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      await expect(call(request('stranger'), workspaceId)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(spy).not.toHaveBeenCalled();

      await call(owner(), workspaceId);
      expect(spy).toHaveBeenCalledOnce();
    },
  );
});
