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
import { QualificationProductController } from './qualification.controller';
import type { QualificationProductService } from './qualification-product.service';
import { QUALIFICATION_PRODUCT_FLAGS, type QualificationCommandView } from './qualification.view';

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

function command(partial: Partial<QualificationCommandView> = {}): QualificationCommandView {
  return {
    outcome: 'accepted',
    qualificationRunId: 'qual-run:1',
    rejectionReasons: [],
    publishedProfileId: null,
    target: null,
    run: null,
    ...QUALIFICATION_PRODUCT_FLAGS,
    ...partial,
  };
}

describe('Qualification product controller (PC-08)', () => {
  let controller: QualificationProductController;
  let workspaceId: string;
  let foreignWorkspaceId: string;
  let product: {
    getWorkspace: ReturnType<typeof vi.fn>;
    listTargets: ReturnType<typeof vi.fn>;
    getTarget: ReturnType<typeof vi.fn>;
    listRuns: ReturnType<typeof vi.fn>;
    getRun: ReturnType<typeof vi.fn>;
    request: ReturnType<typeof vi.fn>;
    confirm: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
    complete: ReturnType<typeof vi.fn>;
    fail: ReturnType<typeof vi.fn>;
    requalify: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    const access = new WorkspaceAccessService(workspaces);
    workspaceId = (await workspaces.create({ name: 'Lab', ownerUserId: owner.userId })).id;
    foreignWorkspaceId = (await workspaces.create({ name: 'Other', ownerUserId: other.userId })).id;
    product = {
      getWorkspace: vi.fn(() => ({ workspaceId, targets: [], ...QUALIFICATION_PRODUCT_FLAGS })),
      listTargets: vi.fn(() => ({ items: [], ...QUALIFICATION_PRODUCT_FLAGS })),
      getTarget: vi.fn(() => null),
      listRuns: vi.fn(() => ({ items: [], ...QUALIFICATION_PRODUCT_FLAGS })),
      getRun: vi.fn(() => null),
      request: vi.fn(() => command()),
      confirm: vi.fn(() => command({ outcome: 'running' })),
      cancel: vi.fn(() => command({ outcome: 'cancelled' })),
      complete: vi.fn(() => command({ outcome: 'completed' })),
      fail: vi.fn(() => command({ outcome: 'failed' })),
      requalify: vi.fn(() => command()),
    };
    controller = new QualificationProductController(
      product as unknown as QualificationProductService,
      access,
    );
  });

  it('requires a workspace header', () => {
    expect(() => controller.workspace({ user: owner }, undefined)).toThrow(BadRequestException);
    expect(() => controller.listTargets({ user: owner }, undefined)).toThrow(BadRequestException);
    expect(() => controller.listRuns({ user: owner }, undefined, {})).toThrow(BadRequestException);
  });

  it('rejects a foreign workspace', () => {
    expect(() => controller.workspace({ user: owner }, foreignWorkspaceId)).toThrow(
      ForbiddenException,
    );
  });

  it('404s unknown targets and runs', () => {
    expect(() =>
      controller.getTarget({ user: owner }, workspaceId, { targetId: 'missing' }),
    ).toThrow(NotFoundException);
    expect(() =>
      controller.getRun({ user: owner }, workspaceId, { qualificationRunId: 'missing' }),
    ).toThrow(NotFoundException);
  });

  it('maps open-run conflicts', () => {
    product.request.mockReturnValueOnce(
      command({ outcome: 'rejected', rejectionReasons: ['open_run_exists'] }),
    );
    expect(() =>
      controller.request({ user: owner }, workspaceId, {
        exchangeScopeId: 'scope-binance',
        marketSymbol: 'BTCUSDT',
        modeContext: 'paper',
      }),
    ).toThrow(ConflictException);
  });
});
