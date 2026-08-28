import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { VenuePermissionVerificationPersistenceService } from '../modules/exchange-adapter/venue-permission-verification-persistence.service';
import { VenuePermissionRecoveryStore } from '../modules/exchange-adapter/venue-permission-recovery-store';
import { PrismaVenuePermissionVerificationStateRepository } from '../modules/exchange-adapter/persistence/prisma-venue-permission-verification-state.repository';
import { rowsEphemeral, rowsVenuePermissionSurvive } from './w4-e05-a-venue-permission-inventory';
import {
  W4_E05_B_ARCHITECTURE_CLAIMS,
  W4_E05_B_CANONICAL_ANCHORS,
  W4_E05_B_DURABLE_COVERAGE,
  W4_E05_B_EXPLICIT_OUT,
  W4_E05_B_NEW_PERSISTED_ARTIFACT_IDS,
  W4_E05_B_PREEXISTING_SURVIVE_ARTIFACT_IDS,
  W4_E05_B_SLICE_ID,
  W4_E05_B_TECHNICAL_DEBT_DELTA,
  W4_E05_B_TRANSITION_MATRIX,
  W4_E05_B_VENUE_PERMISSION_OWNER,
  newPersistedInventoryRows,
  persistedArtifactIds,
  preexistingSurviveInventoryRows,
} from './w4-e05-b-durable-venue-permission';

const REPO_ROOT = join(__dirname, '../../../..');

function createPrismaMock() {
  const rows = new Map<string, unknown>();
  const key = (workspaceId: string, exchangeIdentifier: string) =>
    `${workspaceId}:${exchangeIdentifier}`;

  return {
    workspaceVenuePermissionVerificationState: {
      upsert: async ({
        where: {
          workspaceId_exchangeIdentifier: { workspaceId, exchangeIdentifier },
        },
        create,
        update,
      }: {
        where: {
          workspaceId_exchangeIdentifier: { workspaceId: string; exchangeIdentifier: string };
        };
        create: unknown;
        update: unknown;
      }) => {
        const compositeKey = key(workspaceId, exchangeIdentifier);
        const data = rows.has(compositeKey) ? update : create;
        rows.set(compositeKey, data);
        return data;
      },
      findUnique: async ({
        where: {
          workspaceId_exchangeIdentifier: { workspaceId, exchangeIdentifier },
        },
      }: {
        where: {
          workspaceId_exchangeIdentifier: { workspaceId: string; exchangeIdentifier: string };
        };
      }) => rows.get(key(workspaceId, exchangeIdentifier)) ?? null,
      findMany: async () => [...rows.values()],
    },
    _rows: rows,
  };
}

describe('W4-E05-b durable venue permission verification — unit', () => {
  it('persistence correctness: verification anchor write-through upserts workspace+exchange row', async () => {
    const prisma = createPrismaMock();
    const repository = new PrismaVenuePermissionVerificationStateRepository(prisma as never);
    const service = new VenuePermissionVerificationPersistenceService(
      repository,
      new VenuePermissionRecoveryStore(),
    );

    const outcome = await service.persistVerificationAnchors({
      workspaceId: 'ws-a',
      exchangeIdentifier: 'BINANCE',
      connectionId: 'conn-binance-1',
      adapterExchangeConnectionId: 'ex-conn-binance-1',
      permissionVerificationId: 'pv-binance-1',
      vendorPermissionHash: 'vendor-hash',
      integrityMetadataHash: 'integrity-hash',
      correlationId: 'corr-binance',
      recordedAt: '2026-08-29T10:00:00.000Z',
    });
    expect(outcome.ok).toBe(true);

    const loaded = await service.loadState('ws-a', 'BINANCE');
    expect(loaded).toMatchObject({
      workspaceId: 'ws-a',
      exchangeIdentifier: 'BINANCE',
      connectionId: 'conn-binance-1',
      permissionVerificationId: 'pv-binance-1',
    });
    expect(loaded).not.toHaveProperty('apiPermissions');
  });

  it('artifact coverage: only approved new SURVIVE row is persisted by this slice', () => {
    expect([...persistedArtifactIds()].sort()).toEqual(
      [...W4_E05_B_NEW_PERSISTED_ARTIFACT_IDS].sort(),
    );
    const rows = newPersistedInventoryRows();
    expect(rows.length).toBe(W4_E05_B_NEW_PERSISTED_ARTIFACT_IDS.length);
    for (const row of rows) {
      expect(row.artifactId).toBe('persist-vendor-permission-verification');
      expect(row.durabilityClass).toBe('SURVIVE');
    }
  });

  it('pre-existing SURVIVE rows remain on vault / exchange-adapter owners', () => {
    const preexisting = preexistingSurviveInventoryRows();
    expect(preexisting.length).toBe(W4_E05_B_PREEXISTING_SURVIVE_ARTIFACT_IDS.length);
    const owners = new Set(preexisting.map((row) => row.owner));
    expect(owners.has('secret-vault')).toBe(true);
    expect(owners.has('exchange-adapter')).toBe(true);
  });

  it('ownership: venue permission verification persistence remains on exchange-adapter owner only', () => {
    expect(W4_E05_B_VENUE_PERMISSION_OWNER).toBe('exchange-adapter');
    for (const row of W4_E05_B_DURABLE_COVERAGE) {
      expect(row.owner).toBe('exchange-adapter');
    }
  });

  it('EPHEMERAL inventory rows are not in new durable coverage', () => {
    const covered = new Set(persistedArtifactIds());
    for (const row of rowsEphemeral()) {
      expect(covered.has(row.artifactId)).toBe(false);
    }
  });

  it('canonical anchors match W4-E05-b persisted fields only', () => {
    expect(W4_E05_B_CANONICAL_ANCHORS).toEqual([
      'workspaceId',
      'exchangeIdentifier',
      'connectionId',
      'adapterExchangeConnectionId',
      'permissionVerificationId',
      'vendorPermissionHash',
      'integrityMetadataHash',
      'correlationId',
    ]);
  });

  it('transition matrix: inventory → durable persistence → restart recovery still missing', () => {
    expect(W4_E05_B_TRANSITION_MATRIX.before).toContain('Inventory');
    expect(W4_E05_B_TRANSITION_MATRIX.after).toContain('Durable Persistence');
    expect(W4_E05_B_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Restart'))).toBe(
      true,
    );
  });
});

describe('W4-E05-b durable venue permission verification — integration', () => {
  it('persistence lifecycle: no recovery / probe I/O / continuity claims from this slice', () => {
    expect(W4_E05_B_SLICE_ID).toBe('W4-E05-b');
    expect(W4_E05_B_ARCHITECTURE_CLAIMS.automaticRestartRecovery).toBe(false);
    expect(W4_E05_B_ARCHITECTURE_CLAIMS.operationalContinuityGuaranteed).toBe(false);
    expect(W4_E05_B_ARCHITECTURE_CLAIMS.vendorPermissionProbeIo).toBe(false);
    expect(W4_E05_B_ARCHITECTURE_CLAIMS.runtimePermissionCachePersisted).toBe(false);
    expect(W4_E05_B_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W4_E05_B_ARCHITECTURE_CLAIMS.venuePermissionVerificationRestartSurvivalClaimed).toBe(
      false,
    );
    expect(W4_E05_B_ARCHITECTURE_CLAIMS.w4E01Reopened).toBe(false);
    expect(W4_E05_B_ARCHITECTURE_CLAIMS.w4E02Reopened).toBe(false);
    expect(W4_E05_B_ARCHITECTURE_CLAIMS.w4E03Reopened).toBe(false);
    expect(W4_E05_B_ARCHITECTURE_CLAIMS.w4E04Reopened).toBe(false);
  });

  it('technical debt delta: persistence foundation resolved; recovery deferred', () => {
    expect(W4_E05_B_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W4_E05_B_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W4_E05_B_TECHNICAL_DEBT_DELTA.deferred.some((item) => item.includes('restart'))).toBe(
      true,
    );
  });

  it('explicit OUT covers restart recovery and W4-E05-c', () => {
    expect(W4_E05_B_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['restart-recovery', 'w4-e05-c', 'recovery-store']),
    );
  });

  it('owner consistency: each coverage row maps to existing adapter and service files', () => {
    for (const row of W4_E05_B_DURABLE_COVERAGE) {
      expect(existsSync(join(REPO_ROOT, row.prismaAdapter))).toBe(true);
      expect(existsSync(join(REPO_ROOT, row.persistenceService))).toBe(true);
      expect(existsSync(join(REPO_ROOT, row.repositoryPort))).toBe(true);
      expect(existsSync(join(REPO_ROOT, row.migration))).toBe(true);
    }
  });

  it('SURVIVE inventory includes rows beyond new persistence — not all are W4-E05-b targets', () => {
    expect(rowsVenuePermissionSurvive().length).toBeGreaterThan(
      W4_E05_B_NEW_PERSISTED_ARTIFACT_IDS.length,
    );
  });

  it('required reports exist for W4-E05-b', () => {
    const wave4 = join(REPO_ROOT, 'docs/project/version-3/wave-4');
    for (const name of [
      'w4-e05-b-implementation-report.md',
      'w4-e05-b-architecture-review.md',
      'w4-e05-b-security-review.md',
      'w4-e05-b-product-review.md',
      'w4-e05-b-validation-report.md',
    ]) {
      expect(existsSync(join(wave4, name))).toBe(true);
    }
  });
});
