import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../identity/role';
import { InMemoryWorkspaceRepository } from '../workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../workspace/workspace-access.service';
import { WorkspaceDomainService } from '../workspace/workspace-domain.service';
import { InMemoryStrategyLibraryReadAdapter } from './adapters/in-memory-strategy-library-read.adapter';
import { createStrategy } from './domain/strategy';
import { createStrategyCertification } from './domain/strategy-certification';
import { createStrategyEligibility } from './domain/strategy-eligibility';
import {
  archiveStrategyCertification,
  deprecateStrategyCertification,
} from './domain/strategy-lifecycle';
import { createStrategyVersion } from './domain/strategy-version';
import { StrategyLibraryController } from './strategy-library.controller';

const createdAt = '2026-08-10T12:00:00.000Z';
const certifiedAt = '2026-08-10T13:00:00.000Z';
const evaluatedAt = '2026-08-10T14:00:00.000Z';

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

function evidence() {
  return [
    {
      evidenceId: 'ev-bt-1',
      type: 'backtesting' as const,
      sourceRef: { owner: 'backtesting', id: 'bt-1' },
    },
    {
      evidenceId: 'ev-wf-1',
      type: 'walk-forward' as const,
      sourceRef: { owner: 'walk-forward', id: 'wf-1' },
    },
  ];
}

function envelope() {
  return {
    envelopeVersion: 'env-1',
    allowedMarkets: ['crypto-spot'],
    allowedExchangeScopeIds: ['binance-spot'],
    allowedSymbols: ['BTCUSDT', 'ETHUSDT'],
    allowedTimeframes: ['1h', '4h'],
    riskPerTrade: { min: 0.25, max: 1, step: 0.25 },
    maxPositions: { min: 1, max: 3 },
  };
}

describe('StrategyLibraryController (PC-01)', () => {
  let controller: StrategyLibraryController;
  let library: InMemoryStrategyLibraryReadAdapter;
  let workspaceId: string;
  let foreignWorkspaceId: string;

  beforeEach(async () => {
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    const access = new WorkspaceAccessService(workspaces);
    library = new InMemoryStrategyLibraryReadAdapter();
    controller = new StrategyLibraryController(library, library, access);
    workspaceId = (await workspaces.create({ name: 'Lab', ownerUserId: owner.userId })).id;
    foreignWorkspaceId = (await workspaces.create({ name: 'Other', ownerUserId: other.userId })).id;
  });

  function seedCertified(overrides?: { version?: string; libraryEntryId?: string; name?: string }) {
    const versionLabel = overrides?.version ?? '1.0.0';
    const libraryEntryId = overrides?.libraryEntryId ?? 'lib-entry-1';
    const strategy = createStrategy({
      strategyFamilyId: 'fam-momentum',
      name: overrides?.name ?? 'Momentum',
      workspaceId,
      createdAt,
    });
    const version = createStrategyVersion({
      libraryEntryId,
      strategyFamilyId: 'fam-momentum',
      version: versionLabel,
      contentHash: `sha256:${libraryEntryId}`,
      market: 'crypto-spot',
      supportedExchangeScopeIds: ['binance-spot'],
      supportedTimeframes: ['1h', '4h'],
      supportedSymbols: ['BTCUSDT', 'ETHUSDT'],
      workspaceId,
      createdAt,
    });
    const certification = createStrategyCertification({
      certificationId: `cert-${libraryEntryId}`,
      strategyVersion: version,
      certifiedBy: 'operator-alice',
      certifiedAt,
      evidence: evidence(),
      tacticalEnvelope: envelope(),
    });
    const eligibility = createStrategyEligibility({
      eligibilityId: `elig-${libraryEntryId}`,
      certification,
      rulesVersion: 'rules-v1',
      evaluatedAt,
    });
    return library.seedEntry({ strategy, version, certification, eligibility });
  }

  it('lists certified membership for the caller workspace and not /strategies CRUD', async () => {
    seedCertified();
    seedCertified({ version: '1.1.0', libraryEntryId: 'lib-entry-2' });

    const page = controller.list({ user: owner }, workspaceId, {});

    expect(page.authorityClass).toBe('source_of_truth');
    expect(page.items).toHaveLength(2);
    expect(page.items.map((item) => item.version.version).sort()).toEqual(['1.0.0', '1.1.0']);
    expect(page.items[0]?.membershipStatus).toBe('certified');
    expect(page.items[0]?.version.immutable).toBe(true);
    expect(page.items[0]?.envelopeState).toBe('present');
  });

  it('empty library is a valid product state', () => {
    const page = controller.list({ user: owner }, workspaceId, {});
    expect(page.items).toEqual([]);
    expect(page.nextCursor).toBeNull();
  });

  it('filters by membership status including deprecated and archived', () => {
    const certified = seedCertified();
    const deprecatedVersion = createStrategyVersion({
      libraryEntryId: 'lib-deprecated',
      strategyFamilyId: 'fam-momentum',
      version: '0.9.0',
      contentHash: 'sha256:dep',
      market: 'crypto-spot',
      supportedExchangeScopeIds: ['binance-spot'],
      supportedTimeframes: ['1h', '4h'],
      supportedSymbols: ['BTCUSDT', 'ETHUSDT'],
      workspaceId,
      createdAt,
    });
    const deprecatedCert = deprecateStrategyCertification({
      lifecycleRecordId: 'life-dep',
      certification: createStrategyCertification({
        certificationId: 'cert-dep',
        strategyVersion: deprecatedVersion,
        certifiedBy: 'operator-alice',
        certifiedAt,
        evidence: evidence(),
        tacticalEnvelope: envelope(),
      }),
      reason: 'replaced by 1.0.0',
      deprecatedBy: 'operator-alice',
      deprecatedAt: '2026-08-11T12:00:00.000Z',
    });
    library.seedEntry({
      strategy: certified.strategy,
      version: deprecatedVersion,
      certification: deprecatedCert.certification,
    });

    const archivedVersion = createStrategyVersion({
      libraryEntryId: 'lib-archived',
      strategyFamilyId: 'fam-momentum',
      version: '0.8.0',
      contentHash: 'sha256:arch',
      market: 'crypto-spot',
      supportedExchangeScopeIds: ['binance-spot'],
      supportedTimeframes: ['1h', '4h'],
      supportedSymbols: ['BTCUSDT', 'ETHUSDT'],
      workspaceId,
      createdAt,
    });
    const archivedCert = archiveStrategyCertification({
      lifecycleRecordId: 'life-arch',
      certification: createStrategyCertification({
        certificationId: 'cert-arch',
        strategyVersion: archivedVersion,
        certifiedBy: 'operator-alice',
        certifiedAt,
        evidence: evidence(),
        tacticalEnvelope: envelope(),
      }),
      reason: 'retired',
      archivedBy: 'operator-alice',
      archivedAt: '2026-08-12T12:00:00.000Z',
    });
    library.seedEntry({
      strategy: certified.strategy,
      version: archivedVersion,
      certification: archivedCert.certification,
    });

    const deprecated = controller.list({ user: owner }, workspaceId, { statuses: 'deprecated' });
    expect(deprecated.items.map((item) => item.membershipStatus)).toEqual(['deprecated']);

    const archived = controller.list({ user: owner }, workspaceId, {
      statuses: 'archived',
      includeArchived: 'true',
    });
    expect(archived.items.map((item) => item.version.libraryEntryId)).toEqual(['lib-archived']);
  });

  it('searches listed records without a new Library query port', () => {
    seedCertified({ name: 'Momentum' });
    seedCertified({ version: '2.0.0', libraryEntryId: 'lib-mean', name: 'Mean Reversion' });

    const page = controller.list({ user: owner }, workspaceId, { q: 'mean' });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.strategy.name).toBe('Mean Reversion');
  });

  it('returns a version by library entry id and by family+version', () => {
    seedCertified();
    const byId = controller.getByLibraryEntryId({ user: owner }, workspaceId, {
      libraryEntryId: 'lib-entry-1',
    });
    const byFamily = controller.getByFamilyVersion({ user: owner }, workspaceId, {
      strategyFamilyId: 'fam-momentum',
      version: '1.0.0',
    });

    expect(byId.version.libraryEntryId).toBe('lib-entry-1');
    expect(byId.certification?.status).toBe('active');
    expect(byFamily.version.version).toBe('1.0.0');
    expect(byId.tacticalEnvelope?.envelopeVersion).toBe('env-1');
  });

  it('checks eligibility through the existing Eligibility port', () => {
    seedCertified();
    const decision = controller.checkEligibility(
      { user: owner },
      workspaceId,
      { libraryEntryId: 'lib-entry-1' },
      {},
    );
    expect(decision.outcome).toBe('eligible');
    expect(decision.status).toBe('certified');
  });

  it('does not leak a foreign workspace entry', () => {
    const strategy = createStrategy({
      strategyFamilyId: 'fam-secret',
      name: 'Secret',
      workspaceId: foreignWorkspaceId,
      createdAt,
    });
    const version = createStrategyVersion({
      libraryEntryId: 'lib-secret',
      strategyFamilyId: 'fam-secret',
      version: '1.0.0',
      contentHash: 'sha256:secret',
      market: 'crypto-spot',
      supportedExchangeScopeIds: ['binance-spot'],
      supportedTimeframes: ['1h'],
      supportedSymbols: ['BTCUSDT'],
      workspaceId: foreignWorkspaceId,
      createdAt,
    });
    library.seedEntry({ strategy, version });

    expect(() =>
      controller.getByLibraryEntryId({ user: owner }, workspaceId, {
        libraryEntryId: 'lib-secret',
      }),
    ).toThrow(NotFoundException);
    expect(controller.list({ user: owner }, workspaceId, {}).items).toEqual([]);
  });

  it('rejects missing workspace header and foreign workspace access', () => {
    expect(() => controller.list({ user: owner }, undefined, {})).toThrow(BadRequestException);
    expect(() => controller.list({ user: owner }, foreignWorkspaceId, {})).toThrow(
      ForbiddenException,
    );
  });

  it('rejects unknown membership statuses', () => {
    expect(() => controller.list({ user: owner }, workspaceId, { statuses: 'live' })).toThrow(
      BadRequestException,
    );
  });
});
