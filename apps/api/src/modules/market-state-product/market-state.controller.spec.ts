import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../identity/role';
import { InMemoryWorkspaceRepository } from '../workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../workspace/workspace-access.service';
import { WorkspaceDomainService } from '../workspace/workspace-domain.service';
import { MarketStateProductController } from './market-state.controller';
import type { MarketStateProductService } from './market-state-product.service';
import { MARKET_STATE_PRODUCT_FLAGS } from './market-state.view';

const owner: AuthUser = {
  userId: 'user-1',
  email: 'user@example.com',
  displayName: 'User',
  role: Role.Trader,
};

const other: AuthUser = {
  userId: 'user-2',
  email: 'other@example.com',
  displayName: 'Other',
  role: Role.Trader,
};

describe('Market State product controller (PC-10)', () => {
  let controller: MarketStateProductController;
  let workspaceId: string;
  let foreignWorkspaceId: string;
  let product: {
    getWorkspace: ReturnType<typeof vi.fn>;
    listCurrent: ReturnType<typeof vi.fn>;
    listHistory: ReturnType<typeof vi.fn>;
    getTarget: ReturnType<typeof vi.fn>;
    getCurrent: ReturnType<typeof vi.fn>;
    getVersion: ReturnType<typeof vi.fn>;
    getLifecycle: ReturnType<typeof vi.fn>;
    getMetadata: ReturnType<typeof vi.fn>;
    listTransitions: ReturnType<typeof vi.fn>;
    getQualification: ReturnType<typeof vi.fn>;
    getProfile: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    const access = new WorkspaceAccessService(workspaces);
    workspaceId = (await workspaces.create({ name: 'Lab', ownerUserId: owner.userId })).id;
    foreignWorkspaceId = (await workspaces.create({ name: 'Other', ownerUserId: other.userId })).id;
    product = {
      getWorkspace: vi.fn(() => ({ workspaceId, current: [], ...MARKET_STATE_PRODUCT_FLAGS })),
      listCurrent: vi.fn(() => ({ items: [], ...MARKET_STATE_PRODUCT_FLAGS })),
      listHistory: vi.fn(() => ({ items: [], ...MARKET_STATE_PRODUCT_FLAGS })),
      getTarget: vi.fn(() => null),
      getCurrent: vi.fn(() => null),
      getVersion: vi.fn(() => null),
      getLifecycle: vi.fn(() => null),
      getMetadata: vi.fn(() => null),
      listTransitions: vi.fn(() => null),
      getQualification: vi.fn(() => null),
      getProfile: vi.fn(() => null),
      refresh: vi.fn(() => null),
    };
    controller = new MarketStateProductController(
      product as unknown as MarketStateProductService,
      access,
    );
  });

  it('requires a workspace header', () => {
    expect(() => controller.workspace({ user: owner }, undefined)).toThrow(BadRequestException);
    expect(() => controller.listCurrent({ user: owner }, undefined)).toThrow(BadRequestException);
    expect(() => controller.history({ user: owner }, undefined, {})).toThrow(BadRequestException);
  });

  it('rejects a foreign workspace', () => {
    expect(() => controller.workspace({ user: owner }, foreignWorkspaceId)).toThrow(
      ForbiddenException,
    );
  });

  it('404s unknown targets, versions, and refresh', () => {
    expect(() =>
      controller.getTarget({ user: owner }, workspaceId, { targetId: 'missing' }),
    ).toThrow(NotFoundException);
    expect(() =>
      controller.getVersion({ user: owner }, workspaceId, { targetId: 'missing', version: 1 }),
    ).toThrow(NotFoundException);
    expect(() =>
      controller.refresh({ user: owner }, workspaceId, { targetId: 'missing' }, {}),
    ).toThrow(NotFoundException);
  });
});
