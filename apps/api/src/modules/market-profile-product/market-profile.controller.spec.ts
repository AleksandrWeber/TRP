import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../identity/role';
import { InMemoryWorkspaceRepository } from '../workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../workspace/workspace-access.service';
import { WorkspaceDomainService } from '../workspace/workspace-domain.service';
import { MarketProfileProductController } from './market-profile.controller';
import type { MarketProfileProductService } from './market-profile-product.service';
import { MARKET_PROFILE_PRODUCT_FLAGS } from './market-profile.view';

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

describe('Market Profile product controller (PC-09)', () => {
  let controller: MarketProfileProductController;
  let workspaceId: string;
  let foreignWorkspaceId: string;
  let product: {
    getWorkspace: ReturnType<typeof vi.fn>;
    listLatest: ReturnType<typeof vi.fn>;
    listHistory: ReturnType<typeof vi.fn>;
    getTarget: ReturnType<typeof vi.fn>;
    getLatest: ReturnType<typeof vi.fn>;
    getVersion: ReturnType<typeof vi.fn>;
    getMetadata: ReturnType<typeof vi.fn>;
    getDimensions: ReturnType<typeof vi.fn>;
    getPublishedSource: ReturnType<typeof vi.fn>;
    compare: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    const access = new WorkspaceAccessService(workspaces);
    workspaceId = (await workspaces.create({ name: 'Lab', ownerUserId: owner.userId })).id;
    foreignWorkspaceId = (await workspaces.create({ name: 'Other', ownerUserId: other.userId })).id;
    product = {
      getWorkspace: vi.fn(() => ({ workspaceId, latest: [], ...MARKET_PROFILE_PRODUCT_FLAGS })),
      listLatest: vi.fn(() => ({ items: [], ...MARKET_PROFILE_PRODUCT_FLAGS })),
      listHistory: vi.fn(() => ({ items: [], ...MARKET_PROFILE_PRODUCT_FLAGS })),
      getTarget: vi.fn(() => null),
      getLatest: vi.fn(() => null),
      getVersion: vi.fn(() => null),
      getMetadata: vi.fn(() => null),
      getDimensions: vi.fn(() => null),
      getPublishedSource: vi.fn(() => null),
      compare: vi.fn(() => null),
    };
    controller = new MarketProfileProductController(
      product as unknown as MarketProfileProductService,
      access,
    );
  });

  it('requires a workspace header', () => {
    expect(() => controller.workspace({ user: owner }, undefined)).toThrow(BadRequestException);
    expect(() => controller.listLatest({ user: owner }, undefined)).toThrow(BadRequestException);
    expect(() => controller.history({ user: owner }, undefined, {})).toThrow(BadRequestException);
  });

  it('rejects a foreign workspace', () => {
    expect(() => controller.workspace({ user: owner }, foreignWorkspaceId)).toThrow(
      ForbiddenException,
    );
  });

  it('404s unknown targets and versions', () => {
    expect(() =>
      controller.getTarget({ user: owner }, workspaceId, { targetId: 'missing' }),
    ).toThrow(NotFoundException);
    expect(() =>
      controller.getVersion({ user: owner }, workspaceId, { targetId: 'missing', version: 1 }),
    ).toThrow(NotFoundException);
    expect(() =>
      controller.compare(
        { user: owner },
        workspaceId,
        { targetId: 'missing' },
        {
          fromVersion: 1,
          toVersion: 2,
        },
      ),
    ).toThrow(NotFoundException);
  });
});
