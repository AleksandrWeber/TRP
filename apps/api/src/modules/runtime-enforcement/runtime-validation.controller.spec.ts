import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../identity/role';
import { InMemoryWorkspaceRepository } from '../workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../workspace/workspace-access.service';
import { WorkspaceDomainService } from '../workspace/workspace-domain.service';
import { InMemoryStrategyLibraryReadAdapter } from '../strategy-library/adapters/in-memory-strategy-library-read.adapter';
import { createStrategy } from '../strategy-library/domain/strategy';
import { createStrategyCertification } from '../strategy-library/domain/strategy-certification';
import { createStrategyEligibility } from '../strategy-library/domain/strategy-eligibility';
import { createStrategyVersion } from '../strategy-library/domain/strategy-version';
import { InMemoryRuntimeValidationStore } from './in-memory-runtime-validation.store';
import { validateDeployment } from './domain/validate-deployment';
import { RuntimeEnforcementLibraryReadService } from './runtime-enforcement-library-read.service';
import { RuntimeValidationController } from './runtime-validation.controller';
import { RuntimeValidationService } from './runtime-validation.service';
import type { RuntimeEnforcementPort } from './ports/runtime-enforcement.port';

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

const createdAt = '2026-08-15T12:00:00.000Z';

function seedEligible(adapter: InMemoryStrategyLibraryReadAdapter, workspaceId: string) {
  const strategy = createStrategy({
    strategyFamilyId: 'fam-momentum',
    name: 'Momentum',
    workspaceId,
    createdAt,
  });
  const version = createStrategyVersion({
    libraryEntryId: 'lib-entry-1',
    strategyFamilyId: 'fam-momentum',
    version: '1.0.0',
    contentHash: 'sha256:abc',
    market: 'crypto-spot',
    supportedExchangeScopeIds: ['binance-spot'],
    supportedTimeframes: ['1h'],
    supportedSymbols: ['BTCUSDT'],
    workspaceId,
    createdAt,
  });
  const certification = createStrategyCertification({
    certificationId: 'cert-1',
    strategyVersion: version,
    certifiedBy: 'operator-alice',
    certifiedAt: createdAt,
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
  });
  const eligibility = createStrategyEligibility({
    eligibilityId: 'elig-1',
    certification,
    rulesVersion: 'rules-v1',
    evaluatedAt: createdAt,
  });
  adapter.seedEntry({ strategy, version, certification, eligibility });
}

describe('RuntimeValidationController (PC-04)', () => {
  let controller: RuntimeValidationController;
  let library: InMemoryStrategyLibraryReadAdapter;
  let workspaceId: string;
  let foreignWorkspaceId: string;

  beforeEach(async () => {
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    const access = new WorkspaceAccessService(workspaces);
    library = new InMemoryStrategyLibraryReadAdapter();
    const reads = new RuntimeEnforcementLibraryReadService(library, library);
    const gate: RuntimeEnforcementPort = {
      validateDeployment: (cmd) =>
        validateDeployment(cmd, {
          getByLibraryEntryId: (id) => reads.getByLibraryEntryId(id),
          getByFamilyVersion: (familyId, version) => reads.getByFamilyVersion(familyId, version),
          familyExistsInWorkspace: (workspaceId, strategyFamilyId) =>
            reads.familyExistsInWorkspace(workspaceId, strategyFamilyId),
        }),
    };
    const service = new RuntimeValidationService(gate, reads, new InMemoryRuntimeValidationStore());
    controller = new RuntimeValidationController(service, access);
    workspaceId = (await workspaces.create({ name: 'Lab', ownerUserId: owner.userId })).id;
    foreignWorkspaceId = (await workspaces.create({ name: 'Other', ownerUserId: other.userId })).id;
    seedEligible(library, workspaceId);
  });

  it('runs the Gate and returns PASS with version and timestamp', () => {
    const result = controller.run({ user: owner }, workspaceId, {
      libraryEntryId: 'lib-entry-1',
    });
    expect(result.outcome).toBe('pass');
    expect(result.validation).toBe('VALID');
    expect(result.strategyVersion).toBe('1.0.0');
    expect(result.checkedAt).toBeTruthy();
    expect(result.reasons).toEqual([]);
  });

  it('returns FAIL reasons without a force-pass path', () => {
    const result = controller.run({ user: owner }, workspaceId, {
      strategyFamilyId: 'fam-missing',
      strategyVersion: '9.9.9',
    });
    expect(result.outcome).toBe('fail');
    expect(result.reasons).toEqual(['strategy_not_found']);
  });

  it('lists history and loads a read-only result', () => {
    const first = controller.run({ user: owner }, workspaceId, { libraryEntryId: 'lib-entry-1' });
    const history = controller.listHistory({ user: owner }, workspaceId, {});
    expect(history.items[0]?.validationId).toBe(first.validationId);
    const loaded = controller.get({ user: owner }, workspaceId, {
      validationId: first.validationId,
    });
    expect(loaded.libraryEntryId).toBe('lib-entry-1');
  });

  it('requires a workspace header and isolates foreign workspaces', () => {
    expect(() =>
      controller.run({ user: owner }, undefined, { libraryEntryId: 'lib-entry-1' }),
    ).toThrow(BadRequestException);
    expect(() =>
      controller.run({ user: owner }, foreignWorkspaceId, { libraryEntryId: 'lib-entry-1' }),
    ).toThrow(ForbiddenException);
    const created = controller.run({ user: owner }, workspaceId, { libraryEntryId: 'lib-entry-1' });
    expect(() =>
      controller.get({ user: other }, foreignWorkspaceId, { validationId: created.validationId }),
    ).toThrow(NotFoundException);
  });
});
