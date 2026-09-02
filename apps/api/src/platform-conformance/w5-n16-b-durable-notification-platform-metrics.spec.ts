import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PrismaNotificationPlatformMetricsAnchorRepository } from '../modules/notification-delivery/persistence/prisma-notification-platform-metrics-anchor.repository';
import { NotificationPlatformMetricsPersistenceService } from '../modules/notification-delivery/notification-platform-metrics-persistence.service';
import { rowsEphemeral } from './w5-n16-a-notification-platform-metrics-inventory';
import {
  W5_N16_B_ARCHITECTURE_CLAIMS,
  W5_N16_B_CANONICAL_ANCHOR_FIELDS,
  W5_N16_B_DURABLE_COVERAGE,
  W5_N16_B_EXPLICIT_OUT,
  W5_N16_B_NEW_PERSISTED_ARTIFACT_IDS,
  W5_N16_B_NOTIFICATION_OWNER,
  W5_N16_B_PREEXISTING_SURVIVE_ARTIFACT_IDS,
  W5_N16_B_SLICE_ID,
  W5_N16_B_TECHNICAL_DEBT_DELTA,
  W5_N16_B_TRANSITION_MATRIX,
  newPersistedInventoryRows,
  persistedArtifactIds,
  preexistingSurviveInventoryRows,
  verifyInventorySynchronization,
} from './w5-n16-b-durable-notification-platform-metrics';

const REPO_ROOT = join(__dirname, '../../../..');

function createPrismaMock() {
  const rows = new Map<string, unknown>();
  return {
    workspaceNotificationPlatformMetricsAnchor: {
      upsert: async ({
        where: {
          workspaceId_metricsAnchorId: { workspaceId, metricsAnchorId },
        },
        create,
        update,
      }: {
        where: {
          workspaceId_metricsAnchorId: {
            workspaceId: string;
            metricsAnchorId: string;
          };
        };
        create: unknown;
        update: unknown;
      }) => {
        const key = `${workspaceId}:${metricsAnchorId}`;
        const data = rows.has(key) ? update : create;
        rows.set(key, data);
        return data;
      },
      findUnique: async ({
        where: {
          workspaceId_metricsAnchorId: { workspaceId, metricsAnchorId },
        },
      }: {
        where: {
          workspaceId_metricsAnchorId: {
            workspaceId: string;
            metricsAnchorId: string;
          };
        };
      }) => rows.get(`${workspaceId}:${metricsAnchorId}`) ?? null,
    },
    _rows: rows,
  };
}

describe('W5-N16-b durable notification platform metrics — unit', () => {
  it('persistence correctness: anchor upserts workspace metrics row', async () => {
    const prisma = createPrismaMock();
    const repository = new PrismaNotificationPlatformMetricsAnchorRepository(prisma as never);
    const service = new NotificationPlatformMetricsPersistenceService(repository);

    const outcome = await service.persistNotificationPlatformMetricsAnchor({
      workspaceId: 'ws-a',
      metricsAnchorId: 'metrics-1',
      platformMetricsType: 'cross-channel-foundation',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt: '2026-09-02T19:00:00.000Z',
    });
    expect(outcome.ok).toBe(true);

    const loaded = await service.loadNotificationPlatformMetricsAnchor('ws-a', 'metrics-1');
    expect(loaded).toMatchObject({
      workspaceId: 'ws-a',
      metricsAnchorId: 'metrics-1',
      metricsState: 'anchor-recorded',
    });
    expect(loaded).not.toHaveProperty('metricsCollectionState');
    expect(loaded).not.toHaveProperty('exporterState');
  });

  it('artifact coverage: only approved new SURVIVE row is persisted by this slice', () => {
    expect([...persistedArtifactIds()].sort()).toEqual(
      [...W5_N16_B_NEW_PERSISTED_ARTIFACT_IDS].sort(),
    );
    const rows = newPersistedInventoryRows();
    expect(rows.length).toBe(W5_N16_B_NEW_PERSISTED_ARTIFACT_IDS.length);
    for (const row of rows) {
      expect(row.artifactId).toBe('persist-notification-platform-metrics-anchor');
      expect(row.durabilityClass).toBe('SURVIVE');
    }
  });

  it('pre-existing SURVIVE rows remain on notification-delivery owner', () => {
    const preexisting = preexistingSurviveInventoryRows();
    expect(preexisting.length).toBe(W5_N16_B_PREEXISTING_SURVIVE_ARTIFACT_IDS.length);
    expect(
      preexisting.every(
        (row) =>
          row.owner === 'notification-delivery' ||
          row.owner === 'w5-n15-reference' ||
          row.owner === 'w5-n14-reference' ||
          row.owner === 'w5-n12-reference',
      ),
    ).toBe(true);
  });

  it('ownership: platform metrics persistence remains on notification-delivery owner only', () => {
    expect(W5_N16_B_NOTIFICATION_OWNER).toBe('notification-delivery');
    for (const row of W5_N16_B_DURABLE_COVERAGE) {
      expect(row.owner).toBe('notification-delivery');
    }
  });

  it('canonical anchor fields are frozen for W5-N16-b', () => {
    expect(W5_N16_B_CANONICAL_ANCHOR_FIELDS).toEqual(
      expect.arrayContaining([
        'workspaceId',
        'metricsAnchorId',
        'platformMetricsType',
        'metricsState',
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
    expect(sync.noPlatformMetricsAuthorization).toBe(true);
  });

  it('transition matrix: inventory → durable persistence; operational continuity complete', () => {
    expect(W5_N16_B_TRANSITION_MATRIX.before).toContain('Inventory');
    expect(W5_N16_B_TRANSITION_MATRIX.after).toContain('Durable Persistence');
    expect(
      W5_N16_B_TRANSITION_MATRIX.stillMissing.some((item) =>
        item.includes('Operational Continuity'),
      ),
    ).toBe(false);
  });
});

describe('W5-N16-b durable notification platform metrics — integration', () => {
  it('persistence lifecycle: no recovery / metrics runtime / functional claims from this slice', () => {
    expect(W5_N16_B_SLICE_ID).toBe('W5-N16-b');
    expect(W5_N16_B_ARCHITECTURE_CLAIMS.automaticRestartRecovery).toBe(false);
    expect(W5_N16_B_ARCHITECTURE_CLAIMS.operationalContinuityGuaranteed).toBe(false);
    expect(W5_N16_B_ARCHITECTURE_CLAIMS.platformMetricsImplementation).toBe(false);
    expect(W5_N16_B_ARCHITECTURE_CLAIMS.productionTransportIo).toBe(false);
    expect(W5_N16_B_ARCHITECTURE_CLAIMS.platformMetricsFunctional).toBe(false);
    expect(W5_N16_B_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N16_B_ARCHITECTURE_CLAIMS.platformMetricsRestartSurvivalClaimed).toBe(false);
    expect(W5_N16_B_ARCHITECTURE_CLAIMS.metricsCollectionImplemented).toBe(false);
    expect(W5_N16_B_ARCHITECTURE_CLAIMS.exportersImplemented).toBe(false);
    expect(W5_N16_B_ARCHITECTURE_CLAIMS.dashboardsImplemented).toBe(false);
    expect(W5_N16_B_ARCHITECTURE_CLAIMS.runtimeAggregationImplemented).toBe(false);
    expect(W5_N16_B_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched).toBe(true);
  });

  it('technical debt delta: durable foundation resolved; later slices deferred', () => {
    expect(W5_N16_B_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Notification Platform Metrics Durable Foundation',
    );
    expect(W5_N16_B_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N16_B_TECHNICAL_DEBT_DELTA.deferred).toEqual([
      'W5-N16-c — Notification Platform Metrics Restart Recovery Foundation',
      'W5-N16-d — Notification Platform Metrics Operational Continuity Foundation',
      'W5-N16-e — Package Close Evidence',
    ]);
  });

  it('explicit OUT covers metrics runtime only (not operational continuity)', () => {
    expect(W5_N16_B_EXPLICIT_OUT).toEqual(
      expect.arrayContaining([
        'platform-metrics-runtime',
        'metrics-collection-implementation',
        'production-transport-i/o',
      ]),
    );
    expect(W5_N16_B_EXPLICIT_OUT).not.toContain('w5-n16-d');
  });

  it('owner consistency: each coverage row maps to existing repository and service files', () => {
    for (const row of W5_N16_B_DURABLE_COVERAGE) {
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
          'apps/api/src/modules/notification-delivery/domain/durable-notification-platform-metrics-anchor.ts',
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

  it('required reports exist for W5-N16-b', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n16-b-implementation-report.md',
      'w5-n16-b-architecture-review.md',
      'w5-n16-b-security-review.md',
      'w5-n16-b-product-review.md',
      'w5-n16-b-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
  });
});
