import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../identity/role';
import { InMemoryWorkspaceRepository } from '../workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../workspace/workspace-access.service';
import { WorkspaceDomainService } from '../workspace/workspace-domain.service';
import { InMemoryStrategyLibraryCertificationAdapter } from './adapters/in-memory-strategy-library-certification.adapter';
import { InMemoryStrategyLibraryReadAdapter } from './adapters/in-memory-strategy-library-read.adapter';
import { StrategyLibraryCertificationController } from './strategy-library-certification.controller';
import type { CertifyStrategyVersionBodyDto } from '../../validation';

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

function body(): CertifyStrategyVersionBodyDto {
  return {
    family: { name: 'Momentum', registryRef: 'st-1' },
    version: {
      version: '1.0.0',
      contentHash: 'research:st-1:1.0.0',
      market: 'crypto-spot',
      supportedExchangeScopeIds: ['binance-spot'],
      supportedTimeframes: ['1h'],
      supportedSymbols: ['BTCUSDT'],
    },
    evidence: [
      {
        evidenceId: 'ev-bt-1',
        type: 'backtesting',
        sourceRef: { owner: 'backtesting', id: 'bt-1' },
      },
      {
        evidenceId: 'ev-wf-1',
        type: 'walk-forward',
        sourceRef: { owner: 'walk-forward', id: 'wf-1' },
      },
    ],
    tacticalEnvelope: {
      envelopeVersion: 'env-1',
      allowedMarkets: ['crypto-spot'],
      allowedExchangeScopeIds: ['binance-spot'],
      allowedSymbols: ['BTCUSDT'],
      allowedTimeframes: ['1h'],
      riskPerTrade: { min: 0.25, max: 1, step: 0.25 },
      maxPositions: { min: 1, max: 3 },
    },
    notes: 'Paper admit',
  };
}

describe('StrategyLibraryCertificationController (PC-02)', () => {
  let controller: StrategyLibraryCertificationController;
  let library: InMemoryStrategyLibraryReadAdapter;
  let workspaceId: string;
  let foreignWorkspaceId: string;

  beforeEach(async () => {
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    const access = new WorkspaceAccessService(workspaces);
    library = new InMemoryStrategyLibraryReadAdapter();
    const certification = new InMemoryStrategyLibraryCertificationAdapter(library);
    controller = new StrategyLibraryCertificationController(certification, access);
    workspaceId = (await workspaces.create({ name: 'Lab', ownerUserId: owner.userId })).id;
    foreignWorkspaceId = (await workspaces.create({ name: 'Other', ownerUserId: other.userId })).id;
  });

  it('certifies with the authenticated operator as certifiedBy', () => {
    const result = controller.certify({ user: owner }, workspaceId, body());
    expect(result.outcome).toBe('certified');
    expect(result.certifiedBy).toBe(owner.userId);
    expect(result.progress).toBe('complete');
    expect(library.list({ workspaceId }).items[0]?.membershipStatus).toBe('certified');
  });

  it('returns certification history and status for the caller workspace', () => {
    const created = controller.certify({ user: owner }, workspaceId, body());
    const history = controller.listHistory({ user: owner }, workspaceId, {});
    expect(history.items).toHaveLength(1);
    expect(history.items[0]?.attemptId).toBe(created.attemptId);

    const status = controller.getAttempt({ user: owner }, workspaceId, {
      attemptId: created.attemptId,
    });
    expect(status.outcome).toBe('certified');
    expect(status.metadata.evidenceTypes).toContain('backtesting');
  });

  it('rejects missing workspace header and foreign workspace', () => {
    expect(() => controller.certify({ user: owner }, undefined, body())).toThrow(
      BadRequestException,
    );
    expect(() => controller.certify({ user: owner }, foreignWorkspaceId, body())).toThrow(
      ForbiddenException,
    );
    expect(() =>
      controller.getAttempt({ user: owner }, workspaceId, { attemptId: 'missing' }),
    ).toThrow(NotFoundException);
  });
});
