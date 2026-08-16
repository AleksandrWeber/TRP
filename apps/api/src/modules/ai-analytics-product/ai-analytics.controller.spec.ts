import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../identity/role';
import { InMemoryWorkspaceRepository } from '../workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../workspace/workspace-access.service';
import { WorkspaceDomainService } from '../workspace/workspace-domain.service';
import { AiAnalyticsProductController } from './ai-analytics.controller';
import type { AiAnalyticsProductService } from './ai-analytics-product.service';
import type {
  AiAnalyticsDetailView,
  AiAnalyticsHistoryPageView,
  AiAnalyticsPageView,
  AiAnalyticsProvenanceView,
} from './ai-analytics.view';

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

describe('AI Analytics controller (PC-17)', () => {
  let controller: AiAnalyticsProductController;
  let workspaceId: string;
  let foreignWorkspaceId: string;
  let product: {
    list: ReturnType<typeof vi.fn>;
    history: ReturnType<typeof vi.fn>;
    provenance: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    generate: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    const access = new WorkspaceAccessService(workspaces);
    workspaceId = (await workspaces.create({ name: 'Lab', ownerUserId: owner.userId })).id;
    foreignWorkspaceId = (await workspaces.create({ name: 'Other', ownerUserId: other.userId })).id;
    const emptyPage: AiAnalyticsPageView = {
      items: [],
      nextCursor: null,
      authorityClass: 'narrative',
      sourceOfTruth: false,
      forcesTrade: false,
    };
    const emptyHistory: AiAnalyticsHistoryPageView = {
      items: [],
      nextCursor: null,
      authorityClass: 'narrative',
      sourceOfTruth: false,
      forcesTrade: false,
    };
    product = {
      list: vi.fn((): AiAnalyticsPageView => emptyPage),
      history: vi.fn((): AiAnalyticsHistoryPageView => emptyHistory),
      provenance: vi.fn((): AiAnalyticsProvenanceView | null => null),
      get: vi.fn((): AiAnalyticsDetailView | null => null),
      generate: vi.fn(),
    };
    controller = new AiAnalyticsProductController(
      product as unknown as AiAnalyticsProductService,
      access,
    );
  });

  it('requires a workspace header', () => {
    expect(() => controller.list({ user: owner }, undefined, {})).toThrow(BadRequestException);
    expect(() => controller.history({ user: owner }, undefined, {})).toThrow(BadRequestException);
  });

  it('rejects a foreign workspace', () => {
    expect(() => controller.list({ user: owner }, foreignWorkspaceId, {})).toThrow(
      ForbiddenException,
    );
  });

  it('lists, histories, and 404s unknown analyses without write ownership', () => {
    const page = controller.list({ user: owner }, workspaceId, { kind: 'summarize' });
    expect(page.authorityClass).toBe('narrative');
    expect(product.list).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId, kind: 'summarize' }),
    );
    controller.history({ user: owner }, workspaceId, {});
    expect(product.history).toHaveBeenCalled();
    expect(() => controller.get({ user: owner }, workspaceId, { analysisId: 'missing' })).toThrow(
      NotFoundException,
    );
    expect(() => controller.provenance({ user: owner }, workspaceId, {})).toThrow(
      BadRequestException,
    );
    controller.generate({ user: owner }, workspaceId, { reportRunId: 'run-1', kind: 'explain' });
    expect(product.generate).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId, reportRunId: 'run-1', kind: 'explain' }),
    );
  });
});
