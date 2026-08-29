import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PrismaNotificationPlatformIntegrationAnchorRepository } from '../modules/notification-delivery/persistence/prisma-notification-platform-integration-anchor.repository';
import { NotificationPlatformIntegrationPersistenceService } from '../modules/notification-delivery/notification-platform-integration-persistence.service';
import { rowsEphemeral } from './w5-n05-a-notification-platform-integration-inventory';
import {
  W5_N05_B_ARCHITECTURE_CLAIMS,
  W5_N05_B_CANONICAL_ANCHOR_FIELDS,
  W5_N05_B_DURABLE_COVERAGE,
  W5_N05_B_EXPLICIT_OUT,
  W5_N05_B_NEW_PERSISTED_ARTIFACT_IDS,
  W5_N05_B_NOTIFICATION_OWNER,
  W5_N05_B_PREEXISTING_SURVIVE_ARTIFACT_IDS,
  W5_N05_B_SLICE_ID,
  W5_N05_B_TECHNICAL_DEBT_DELTA,
  W5_N05_B_TRANSITION_MATRIX,
  newPersistedInventoryRows,
  persistedArtifactIds,
  preexistingSurviveInventoryRows,
  verifyInventorySynchronization,
} from './w5-n05-b-durable-notification-platform-integration';

const REPO_ROOT = join(__dirname, '../../../..');

function createPrismaMock() {
  const rows = new Map<string, unknown>();
  return {
    workspaceNotificationPlatformIntegrationAnchor: {
      upsert: async ({
        where: {
          workspaceId_integrationAnchorId: { workspaceId, integrationAnchorId },
        },
        create,
        update,
      }: {
        where: {
          workspaceId_integrationAnchorId: { workspaceId: string; integrationAnchorId: string };
        };
        create: unknown;
        update: unknown;
      }) => {
        const key = `${workspaceId}:${integrationAnchorId}`;
        const data = rows.has(key) ? update : create;
        rows.set(key, data);
        return data;
      },
      findUnique: async ({
        where: {
          workspaceId_integrationAnchorId: { workspaceId, integrationAnchorId },
        },
      }: {
        where: {
          workspaceId_integrationAnchorId: { workspaceId: string; integrationAnchorId: string };
        };
      }) => rows.get(`${workspaceId}:${integrationAnchorId}`) ?? null,
      findMany: async () => [...rows.values()],
    },
    _rows: rows,
  };
}

describe('W5-N05-b durable notification platform integration — unit', () => {
  it('persistence correctness: anchor write-through upserts workspace integration row', async () => {
    const prisma = createPrismaMock();
    const repository = new PrismaNotificationPlatformIntegrationAnchorRepository(prisma as never);
    const service = new NotificationPlatformIntegrationPersistenceService(repository);

    const outcome = await service.persistIntegrationAnchor({
      workspaceId: 'ws-a',
      integrationAnchorId: 'plat-1',
      platformIntegrationType: 'cross-channel-foundation',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt: '2026-08-29T18:00:00.000Z',
    });
    expect(outcome.ok).toBe(true);

    const loaded = await service.loadAnchor('ws-a', 'plat-1');
    expect(loaded).toMatchObject({
      workspaceId: 'ws-a',
      integrationAnchorId: 'plat-1',
      integrationState: 'anchor-recorded',
    });
    expect(loaded).not.toHaveProperty('deliveryState');
  });

  it('artifact coverage: only approved new SURVIVE row is persisted by this slice', () => {
    expect([...persistedArtifactIds()].sort()).toEqual(
      [...W5_N05_B_NEW_PERSISTED_ARTIFACT_IDS].sort(),
    );
    const rows = newPersistedInventoryRows();
    expect(rows.length).toBe(W5_N05_B_NEW_PERSISTED_ARTIFACT_IDS.length);
    for (const row of rows) {
      expect(row.artifactId).toBe('persist-notification-platform-integration-anchor');
      expect(row.durabilityClass).toBe('SURVIVE');
    }
  });

  it('pre-existing SURVIVE rows remain on notification-delivery owner', () => {
    const preexisting = preexistingSurviveInventoryRows();
    expect(preexisting.length).toBe(W5_N05_B_PREEXISTING_SURVIVE_ARTIFACT_IDS.length);
    expect(preexisting.every((row) => row.owner === 'notification-delivery')).toBe(true);
  });

  it('ownership: platform integration persistence remains on notification-delivery owner only', () => {
    expect(W5_N05_B_NOTIFICATION_OWNER).toBe('notification-delivery');
    for (const row of W5_N05_B_DURABLE_COVERAGE) {
      expect(row.owner).toBe('notification-delivery');
    }
  });

  it('canonical anchor fields are frozen for W5-N05-b', () => {
    expect(W5_N05_B_CANONICAL_ANCHOR_FIELDS).toEqual(
      expect.arrayContaining([
        'workspaceId',
        'integrationAnchorId',
        'platformIntegrationType',
        'integrationState',
        'channelScope',
        'integrityMetadata',
        'correlationId',
      ]),
    );
  });

  it('EPHEMERAL inventory rows are not in new durable coverage', () => {
    const covered = new Set(persistedArtifactIds());
    for (const row of rowsEphemeral()) {
      expect(covered.has(row.artifactId)).toBe(false);
    }
  });

  it('inventory synchronization: canonical anchor moved EPHEMERAL → SURVIVE', () => {
    const sync = verifyInventorySynchronization();
    expect(sync.ok).toBe(true);
    expect(sync.persistedRowSurvives).toBe(true);
    expect(sync.ownershipRowSurvives).toBe(true);
    expect(sync.noPlatformIntegrationAuthorization).toBe(true);
  });

  it('transition matrix: inventory → durable persistence → restart recovery still missing', () => {
    expect(W5_N05_B_TRANSITION_MATRIX.before).toContain('Inventory');
    expect(W5_N05_B_TRANSITION_MATRIX.after).toContain('Durable Persistence');
    expect(W5_N05_B_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Restart'))).toBe(
      true,
    );
  });
});

describe('W5-N05-b durable notification platform integration — integration', () => {
  it('persistence lifecycle: no recovery / platform I/O / integration functional claims from this slice', () => {
    expect(W5_N05_B_SLICE_ID).toBe('W5-N05-b');
    expect(W5_N05_B_ARCHITECTURE_CLAIMS.automaticRestartRecovery).toBe(false);
    expect(W5_N05_B_ARCHITECTURE_CLAIMS.operationalContinuityGuaranteed).toBe(false);
    expect(W5_N05_B_ARCHITECTURE_CLAIMS.platformIntegrationImplementation).toBe(false);
    expect(W5_N05_B_ARCHITECTURE_CLAIMS.productionTransportIo).toBe(false);
    expect(W5_N05_B_ARCHITECTURE_CLAIMS.platformIntegrationFunctional).toBe(false);
    expect(W5_N05_B_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N05_B_ARCHITECTURE_CLAIMS.platformIntegrationRestartSurvivalClaimed).toBe(false);
    expect(W5_N05_B_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched).toBe(true);
  });

  it('technical debt delta: durable foundation resolved; recovery deferred', () => {
    expect(W5_N05_B_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Durable Notification Platform Integration Foundation',
    );
    expect(W5_N05_B_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(
      W5_N05_B_TECHNICAL_DEBT_DELTA.deferred.some((item) => item.toLowerCase().includes('restart')),
    ).toBe(true);
  });

  it('explicit OUT covers restart recovery and W5-N05-c', () => {
    expect(W5_N05_B_EXPLICIT_OUT).toEqual(
      expect.arrayContaining([
        'restart-recovery',
        'w5-n05-c',
        'platform-integration-i/o',
        'production-transport-i/o',
      ]),
    );
  });

  it('owner consistency: each coverage row maps to existing repository and service files', () => {
    for (const row of W5_N05_B_DURABLE_COVERAGE) {
      expect(existsSync(join(REPO_ROOT, row.prismaAdapter))).toBe(true);
      expect(existsSync(join(REPO_ROOT, row.persistenceService))).toBe(true);
      expect(existsSync(join(REPO_ROOT, row.repositoryPort))).toBe(true);
      expect(existsSync(join(REPO_ROOT, row.migration))).toBe(true);
    }
  });

  it('schema and module wiring evidence exist', () => {
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/durable-notification-platform-integration-anchor.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/notification-delivery.module.ts',
        ),
      ),
    ).toBe(true);
    expect(existsSync(join(REPO_ROOT, 'apps/api/prisma/schema.prisma'))).toBe(true);
  });

  it('required reports exist for W5-N05-b', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n05-b-implementation-report.md',
      'w5-n05-b-architecture-review.md',
      'w5-n05-b-security-review.md',
      'w5-n05-b-product-review.md',
      'w5-n05-b-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
  });
});
