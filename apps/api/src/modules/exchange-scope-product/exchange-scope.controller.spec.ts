import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../identity/role';
import { InMemoryWorkspaceRepository } from '../workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../workspace/workspace-access.service';
import { WorkspaceDomainService } from '../workspace/workspace-domain.service';
import { ExchangeScopeProductController } from './exchange-scope.controller';
import type { ExchangeScopeProductService } from './exchange-scope-product.service';
import { EXCHANGE_SCOPE_PRODUCT_FLAGS, type ExchangeScopeCommandView } from './exchange-scope.view';

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

function command(partial: Partial<ExchangeScopeCommandView> = {}): ExchangeScopeCommandView {
  return {
    outcome: 'accepted',
    exchangeScopeId: 'exchange-scope:binance',
    rejectionReasons: [],
    scope: null,
    ...EXCHANGE_SCOPE_PRODUCT_FLAGS,
    ...partial,
  };
}

describe('Exchange Scope product controller (PC-12)', () => {
  let controller: ExchangeScopeProductController;
  let workspaceId: string;
  let foreignWorkspaceId: string;
  let product: {
    listVenues: ReturnType<typeof vi.fn>;
    getWorkspace: ReturnType<typeof vi.fn>;
    listScopes: ReturnType<typeof vi.fn>;
    getScope: ReturnType<typeof vi.fn>;
    register: ReturnType<typeof vi.fn>;
    activate: ReturnType<typeof vi.fn>;
    suspend: ReturnType<typeof vi.fn>;
    archive: ReturnType<typeof vi.fn>;
    rename: ReturnType<typeof vi.fn>;
    updateConfig: ReturnType<typeof vi.fn>;
    publishPolicy: ReturnType<typeof vi.fn>;
    bindAccount: ReturnType<typeof vi.fn>;
    unbindAccount: ReturnType<typeof vi.fn>;
    setAdapterContext: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    const access = new WorkspaceAccessService(workspaces);
    workspaceId = (await workspaces.create({ name: 'Lab', ownerUserId: owner.userId })).id;
    foreignWorkspaceId = (await workspaces.create({ name: 'Other', ownerUserId: other.userId })).id;
    product = {
      listVenues: vi.fn(() => ({ items: [], ...EXCHANGE_SCOPE_PRODUCT_FLAGS })),
      getWorkspace: vi.fn(() => ({
        workspaceId,
        scopeCount: 0,
        currentActive: [],
        scopes: [],
        venues: [],
        ...EXCHANGE_SCOPE_PRODUCT_FLAGS,
      })),
      listScopes: vi.fn(() => ({ items: [], ...EXCHANGE_SCOPE_PRODUCT_FLAGS })),
      getScope: vi.fn(() => null),
      register: vi.fn(() => command()),
      activate: vi.fn(() => command()),
      suspend: vi.fn(() => command({ outcome: 'suspended' })),
      archive: vi.fn(() => command({ outcome: 'archived' })),
      rename: vi.fn(() => command()),
      updateConfig: vi.fn(() => command()),
      publishPolicy: vi.fn(() => command()),
      bindAccount: vi.fn(() => command()),
      unbindAccount: vi.fn(() => command()),
      setAdapterContext: vi.fn(() => command()),
    };
    controller = new ExchangeScopeProductController(
      product as unknown as ExchangeScopeProductService,
      access,
    );
  });

  it('requires a workspace header', () => {
    expect(() => controller.listVenues({ user: owner }, undefined)).toThrow(BadRequestException);
    expect(() => controller.workspace({ user: owner }, undefined)).toThrow(BadRequestException);
    expect(() => controller.list({ user: owner }, undefined, {})).toThrow(BadRequestException);
  });

  it('rejects a foreign workspace', () => {
    expect(() => controller.workspace({ user: owner }, foreignWorkspaceId)).toThrow(
      ForbiddenException,
    );
  });

  it('404s unknown scopes', () => {
    expect(() =>
      controller.get({ user: owner }, workspaceId, { exchangeScopeId: 'exchange-scope:missing' }),
    ).toThrow(NotFoundException);
  });

  it('maps existing-venue conflicts', () => {
    product.register.mockReturnValueOnce(
      command({ outcome: 'rejected', rejectionReasons: ['active_venue_exists'] }),
    );
    expect(() =>
      controller.create({ user: owner }, workspaceId, { venueCode: 'binance', displayName: 'Dup' }),
    ).toThrow(ConflictException);
  });

  it('creates through the existing register command', () => {
    const result = controller.create({ user: owner }, workspaceId, {
      venueCode: 'binance',
      displayName: 'Binance paper',
      modeContext: 'paper',
    });
    expect(result.outcome).toBe('accepted');
    expect(product.register).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId,
        venueCode: 'binance',
        displayName: 'Binance paper',
        requestedBy: owner.userId,
        modeContext: 'paper',
      }),
    );
  });
});
