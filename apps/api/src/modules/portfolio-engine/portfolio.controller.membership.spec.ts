import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../identity/role';
import { InMemoryWorkspaceRepository } from '../workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../workspace/workspace-access.service';
import { WorkspaceDomainService } from '../workspace/workspace-domain.service';
import { PortfolioController } from './portfolio.controller';
import type { PortfolioService } from './portfolio.service';

function request(userId: string, role: Role = Role.Trader): { user: AuthUser } {
  return { user: { userId, email: `${userId}@trp.local`, displayName: userId, role } };
}

describe('Portfolio engine workspace membership', () => {
  let controller: PortfolioController;
  let workspaceId: string;
  const spies = {
    getOrCreate: vi.fn(async () => ({ id: 'portfolio-1' })),
    getBalance: vi.fn(async () => ({ cash: '1' })),
    getEquity: vi.fn(async () => ({ equity: '1' })),
    getMargin: vi.fn(async () => ({ margin: '0' })),
    listSnapshots: vi.fn(async () => []),
    reset: vi.fn(async () => ({ id: 'portfolio-1', cash: '100000' })),
  };

  beforeEach(async () => {
    for (const spy of Object.values(spies)) spy.mockClear();
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    workspaceId = (await workspaces.create({ name: 'One', ownerUserId: 'owner' })).id;
    controller = new PortfolioController(
      spies as unknown as PortfolioService,
      workspaces,
      new WorkspaceAccessService(workspaces),
    );
  });

  const owner = () => request('owner');

  it.each([
    [
      'getPortfolio',
      (actor: { user: AuthUser }, id?: string) => controller.getPortfolio(actor, id),
      'getOrCreate',
    ],
    [
      'getBalance',
      (actor: { user: AuthUser }, id?: string) => controller.getBalance(actor, id),
      'getOrCreate',
    ],
    [
      'getEquity',
      (actor: { user: AuthUser }, id?: string) => controller.getEquity(actor, id),
      'getOrCreate',
    ],
    [
      'getMargin',
      (actor: { user: AuthUser }, id?: string) => controller.getMargin(actor, id),
      'getOrCreate',
    ],
    [
      'getSnapshots',
      (actor: { user: AuthUser }, id?: string) => controller.getSnapshots(actor, id),
      'getOrCreate',
    ],
    ['reset', (actor: { user: AuthUser }, id?: string) => controller.reset(actor, id), 'reset'],
  ] as const)(
    '%s rejects non-owners before portfolio side effects',
    async (_name, call, primary) => {
      await expect(call(owner(), undefined)).rejects.toBeInstanceOf(BadRequestException);
      await expect(call(owner(), 'missing-workspace')).rejects.toBeInstanceOf(NotFoundException);
      await expect(call(request('stranger', Role.Admin), workspaceId)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      await expect(call(request('stranger'), workspaceId)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(spies.getOrCreate).not.toHaveBeenCalled();
      expect(spies.reset).not.toHaveBeenCalled();
      expect(spies.getBalance).not.toHaveBeenCalled();
      expect(spies.getEquity).not.toHaveBeenCalled();
      expect(spies.getMargin).not.toHaveBeenCalled();
      expect(spies.listSnapshots).not.toHaveBeenCalled();

      await call(owner(), workspaceId);
      expect(spies[primary]).toHaveBeenCalled();
    },
  );
});
