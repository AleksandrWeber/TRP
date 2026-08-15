import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../identity/role';
import { InMemoryWorkspaceRepository } from '../workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../workspace/workspace-access.service';
import { WorkspaceDomainService } from '../workspace/workspace-domain.service';
import { ReportingDefinitionController, ReportingRunController } from './reporting.controller';
import type { ReportingProductService } from './reporting-product.service';
import type { ReportRunDetailView, ReportRunPageView } from './reporting.view';

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

describe('Reporting controllers (PC-05)', () => {
  let runs: ReportingRunController;
  let definitions: ReportingDefinitionController;
  let workspaceId: string;
  let foreignWorkspaceId: string;
  let product: {
    listRuns: ReturnType<typeof vi.fn>;
    getRun: ReturnType<typeof vi.fn>;
    listDefinitions: ReturnType<typeof vi.fn>;
    getDefinition: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    const access = new WorkspaceAccessService(workspaces);
    workspaceId = (await workspaces.create({ name: 'Lab', ownerUserId: owner.userId })).id;
    foreignWorkspaceId = (await workspaces.create({ name: 'Other', ownerUserId: other.userId })).id;
    product = {
      listRuns: vi.fn((): ReportRunPageView => ({
        items: [],
        authorityClass: 'projection',
        ledgerSoT: false,
      })),
      getRun: vi.fn((): ReportRunDetailView | null => null),
      listDefinitions: vi.fn(() => ({
        items: [],
        authorityClass: 'projection' as const,
        ledgerSoT: false as const,
      })),
      getDefinition: vi.fn(() => null),
    };
    runs = new ReportingRunController(product as unknown as ReportingProductService, access);
    definitions = new ReportingDefinitionController(
      product as unknown as ReportingProductService,
      access,
    );
  });

  it('requires a workspace header', () => {
    expect(() => runs.list({ user: owner }, undefined, {})).toThrow(BadRequestException);
    expect(() => definitions.list({ user: owner }, undefined, {})).toThrow(BadRequestException);
  });

  it('rejects a foreign workspace', () => {
    expect(() => runs.list({ user: owner }, foreignWorkspaceId, {})).toThrow(ForbiddenException);
  });

  it('lists runs for the workspace and 404s unknown ids', () => {
    const page = runs.list({ user: owner }, workspaceId, { q: 'ops' });
    expect(page.authorityClass).toBe('projection');
    expect(product.listRuns).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId, q: 'ops' }),
    );
    expect(() => runs.get({ user: owner }, workspaceId, { reportRunId: 'missing' })).toThrow(
      NotFoundException,
    );
  });
});
