import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../identity/role';
import { InMemoryWorkspaceRepository } from '../workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../workspace/workspace-access.service';
import { WorkspaceDomainService } from '../workspace/workspace-domain.service';
import { PaperTradingController } from './paper-trading.controller';
import type { PaperTradingService } from './paper-trading.service';

function request(userId: string, role: Role = Role.Trader): { user: AuthUser } {
  return { user: { userId, email: `${userId}@trp.local`, displayName: userId, role } };
}

describe('Paper trading engine workspace membership', () => {
  let controller: PaperTradingController;
  let workspaceId: string;
  const spies = {
    listSessions: vi.fn(async () => []),
    getSession: vi.fn(async () => ({ id: 's1' })),
    listOrders: vi.fn(async () => []),
    listPositions: vi.fn(async () => []),
    getPortfolio: vi.fn(async () => ({ id: 'p1' })),
    listExecutions: vi.fn(async () => []),
    listEvents: vi.fn(async () => []),
    getStatistics: vi.fn(async () => ({ trades: 0 })),
    createSession: vi.fn(async () => ({ id: 's1' })),
    startSession: vi.fn(async () => ({ id: 's1' })),
    pauseSession: vi.fn(async () => ({ id: 's1' })),
    stopSession: vi.fn(async () => ({ id: 's1' })),
    completeSession: vi.fn(async () => ({ id: 's1' })),
    deleteSession: vi.fn(async () => ({ id: 's1', deleted: true })),
  };

  beforeEach(async () => {
    for (const spy of Object.values(spies)) spy.mockClear();
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    workspaceId = (await workspaces.create({ name: 'One', ownerUserId: 'owner' })).id;
    controller = new PaperTradingController(
      spies as unknown as PaperTradingService,
      workspaces,
      new WorkspaceAccessService(workspaces),
    );
  });

  const owner = () => request('owner');
  const stranger = () => request('stranger', Role.Admin);

  it('allows the owner to create and drive a session', async () => {
    await expect(
      controller.createSession(owner(), { name: 'Paper' }, workspaceId),
    ).resolves.toEqual({
      id: 's1',
    });
    await expect(controller.startSession(owner(), 's1', workspaceId)).resolves.toEqual({
      id: 's1',
    });
    expect(spies.createSession).toHaveBeenCalledOnce();
    expect(spies.startSession).toHaveBeenCalledWith(workspaceId, 's1');
  });

  it.each([
    [
      'listSessions',
      (actor: { user: AuthUser }, id?: string) => controller.listSessions(actor, id),
      spies.listSessions,
    ],
    [
      'getSession',
      (actor: { user: AuthUser }, id?: string) => controller.getSession(actor, 's1', id),
      spies.getSession,
    ],
    [
      'listOrders',
      (actor: { user: AuthUser }, id?: string) => controller.listOrders(actor, 's1', id),
      spies.listOrders,
    ],
    [
      'listPositions',
      (actor: { user: AuthUser }, id?: string) => controller.listPositions(actor, 's1', id),
      spies.listPositions,
    ],
    [
      'getPortfolio',
      (actor: { user: AuthUser }, id?: string) => controller.getPortfolio(actor, 's1', id),
      spies.getPortfolio,
    ],
    [
      'listExecutions',
      (actor: { user: AuthUser }, id?: string) => controller.listExecutions(actor, 's1', id),
      spies.listExecutions,
    ],
    [
      'listEvents',
      (actor: { user: AuthUser }, id?: string) => controller.listEvents(actor, 's1', id),
      spies.listEvents,
    ],
    [
      'getStatistics',
      (actor: { user: AuthUser }, id?: string) => controller.getStatistics(actor, 's1', id),
      spies.getStatistics,
    ],
    [
      'createSession',
      (actor: { user: AuthUser }, id?: string) =>
        controller.createSession(actor, { name: 'Paper' }, id),
      spies.createSession,
    ],
    [
      'startSession',
      (actor: { user: AuthUser }, id?: string) => controller.startSession(actor, 's1', id),
      spies.startSession,
    ],
    [
      'pauseSession',
      (actor: { user: AuthUser }, id?: string) => controller.pauseSession(actor, 's1', id),
      spies.pauseSession,
    ],
    [
      'stopSession',
      (actor: { user: AuthUser }, id?: string) => controller.stopSession(actor, 's1', id),
      spies.stopSession,
    ],
    [
      'completeSession',
      (actor: { user: AuthUser }, id?: string) => controller.completeSession(actor, 's1', id),
      spies.completeSession,
    ],
    [
      'deleteSession',
      (actor: { user: AuthUser }, id?: string) => controller.deleteSession(actor, 's1', id),
      spies.deleteSession,
    ],
  ] as const)(
    '%s rejects non-owners before the service and still serves the owner',
    async (_name, call, spy) => {
      await expect(call(owner(), undefined)).rejects.toBeInstanceOf(BadRequestException);
      await expect(call(owner(), 'missing-workspace')).rejects.toBeInstanceOf(NotFoundException);
      await expect(call(stranger(), workspaceId)).rejects.toBeInstanceOf(ForbiddenException);
      await expect(call(request('stranger', Role.Trader), workspaceId)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(spy).not.toHaveBeenCalled();

      await call(owner(), workspaceId);
      expect(spy).toHaveBeenCalledOnce();
    },
  );
});
