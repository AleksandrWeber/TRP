import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../identity/role';
import { InMemoryWorkspaceRepository } from '../workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../workspace/workspace-access.service';
import { WorkspaceDomainService } from '../workspace/workspace-domain.service';
import { KnowledgeLakeProductController } from './knowledge-lake.controller';
import type { KnowledgeLakeProductService } from './knowledge-lake-product.service';
import type {
  KnowledgeLakeDetailView,
  KnowledgeLakeHistoryPageView,
  KnowledgeLakePageView,
  KnowledgeLakeProvenanceView,
  KnowledgeLakeRelationshipPageView,
} from './knowledge-lake.view';

const owner: AuthUser = {
  userId: 'user-1',
  email: 'user@example.com',
  displayName: 'User',
  role: Role.Researcher,
};

const other: AuthUser = {
  userId: 'user-2',
  email: 'other@example.com',
  displayName: 'Other',
  role: Role.Researcher,
};

describe('Knowledge Lake controller (PC-16)', () => {
  let controller: KnowledgeLakeProductController;
  let workspaceId: string;
  let foreignWorkspaceId: string;
  let product: {
    list: ReturnType<typeof vi.fn>;
    search: ReturnType<typeof vi.fn>;
    history: ReturnType<typeof vi.fn>;
    relationships: ReturnType<typeof vi.fn>;
    provenance: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    const access = new WorkspaceAccessService(workspaces);
    workspaceId = (await workspaces.create({ name: 'Lab', ownerUserId: owner.userId })).id;
    foreignWorkspaceId = (await workspaces.create({ name: 'Other', ownerUserId: other.userId })).id;
    const emptyPage: KnowledgeLakePageView = {
      items: [],
      nextCursor: null,
      authorityClass: 'projection',
      ledgerSoT: false,
      analyticalCopy: true,
    };
    const emptyHistory: KnowledgeLakeHistoryPageView = {
      items: [],
      nextCursor: null,
      authorityClass: 'projection',
      ledgerSoT: false,
      analyticalCopy: true,
    };
    product = {
      list: vi.fn((): KnowledgeLakePageView => emptyPage),
      search: vi.fn((): KnowledgeLakePageView => emptyPage),
      history: vi.fn((): KnowledgeLakeHistoryPageView => emptyHistory),
      relationships: vi.fn((): KnowledgeLakeRelationshipPageView | null => null),
      provenance: vi.fn((): KnowledgeLakeProvenanceView | null => null),
      get: vi.fn((): KnowledgeLakeDetailView | null => null),
    };
    controller = new KnowledgeLakeProductController(
      product as unknown as KnowledgeLakeProductService,
      access,
    );
  });

  it('requires a workspace header', () => {
    expect(() => controller.list({ user: owner }, undefined, {})).toThrow(BadRequestException);
    expect(() => controller.search({ user: owner }, undefined, {})).toThrow(BadRequestException);
  });

  it('rejects a foreign workspace', () => {
    expect(() => controller.list({ user: owner }, foreignWorkspaceId, {})).toThrow(
      ForbiddenException,
    );
  });

  it('lists, searches, and 404s unknown entries without write methods', () => {
    const page = controller.list({ user: owner }, workspaceId, {
      q: 'risk',
      producer: 'risk-engine',
    });
    expect(page.authorityClass).toBe('projection');
    expect(product.list).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId, q: 'risk', producer: 'risk-engine' }),
    );
    controller.search({ user: owner }, workspaceId, { q: 'session' });
    expect(product.search).toHaveBeenCalled();
    controller.history({ user: owner }, workspaceId, {});
    expect(product.history).toHaveBeenCalled();
    expect(() => controller.get({ user: owner }, workspaceId, { entryId: 'missing' })).toThrow(
      NotFoundException,
    );
    expect(() => controller.relationships({ user: owner }, workspaceId, {})).toThrow(
      BadRequestException,
    );
  });
});
