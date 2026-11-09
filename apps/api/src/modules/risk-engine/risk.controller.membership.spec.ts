import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../identity/role';
import { InMemoryWorkspaceRepository } from '../workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../workspace/workspace-access.service';
import { WorkspaceDomainService } from '../workspace/workspace-domain.service';
import { RiskController } from './risk.controller';
import type { RiskService } from './risk.service';

function request(userId: string, role: Role = Role.Trader): { user: AuthUser } {
  return { user: { userId, email: `${userId}@trp.local`, displayName: userId, role } };
}

const ORDER = {
  orderId: 'o1',
  symbol: 'BTCUSDT',
  side: 'buy',
  type: 'market',
  quantity: '1',
};

describe('Risk engine workspace membership', () => {
  let controller: RiskController;
  let workspaceId: string;
  const spies = {
    evaluate: vi.fn(async () => ({ decision: 'allow' })),
    listHistory: vi.fn(async () => []),
    listDecisions: vi.fn(async () => []),
    listPolicies: vi.fn(async () => []),
    getSummary: vi.fn(async () => ({ policies: 0 })),
    updatePolicy: vi.fn(async () => ({ id: 'policy-1' })),
  };

  beforeEach(async () => {
    for (const spy of Object.values(spies)) spy.mockClear();
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    workspaceId = (await workspaces.create({ name: 'One', ownerUserId: 'owner' })).id;
    controller = new RiskController(
      spies as unknown as RiskService,
      workspaces,
      new WorkspaceAccessService(workspaces),
    );
  });

  const owner = () => request('owner');

  it.each([
    [
      'evaluate',
      (actor: { user: AuthUser }, id?: string) => controller.evaluate(actor, ORDER, id),
      spies.evaluate,
    ],
    [
      'history',
      (actor: { user: AuthUser }, id?: string) => controller.history(actor, id),
      spies.listHistory,
    ],
    [
      'decisions',
      (actor: { user: AuthUser }, id?: string) => controller.decisions(actor, id),
      spies.listDecisions,
    ],
    [
      'policies',
      (actor: { user: AuthUser }, id?: string) => controller.policies(actor, id),
      spies.listPolicies,
    ],
    [
      'summary',
      (actor: { user: AuthUser }, id?: string) => controller.summary(actor, id),
      spies.getSummary,
    ],
    [
      'updatePolicy',
      (actor: { user: AuthUser }, id?: string) =>
        controller.updatePolicy(actor, 'policy-1', { enabled: false }, id),
      spies.updatePolicy,
    ],
  ] as const)('%s rejects non-owners before risk services', async (_name, call, spy) => {
    await expect(call(owner(), undefined)).rejects.toBeInstanceOf(BadRequestException);
    await expect(call(owner(), 'missing-workspace')).rejects.toBeInstanceOf(NotFoundException);
    await expect(call(request('stranger', Role.Admin), workspaceId)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(call(request('stranger'), workspaceId)).rejects.toBeInstanceOf(ForbiddenException);
    expect(spy).not.toHaveBeenCalled();

    await call(owner(), workspaceId);
    expect(spy).toHaveBeenCalledOnce();
  });
});
