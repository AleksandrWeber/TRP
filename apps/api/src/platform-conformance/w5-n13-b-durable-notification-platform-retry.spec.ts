import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PrismaNotificationPlatformRetryAnchorRepository } from '../modules/notification-delivery/persistence/prisma-notification-platform-retry-anchor.repository';
import { NotificationPlatformRetryRecoveryStore } from '../modules/notification-delivery/domain/notification-platform-retry-recovery-store';
import { NotificationPlatformRetryPersistenceService } from '../modules/notification-delivery/notification-platform-retry-persistence.service';
import { rowsEphemeral } from './w5-n13-a-notification-platform-retry-inventory';
import {
  W5_N13_B_ARCHITECTURE_CLAIMS,
  W5_N13_B_CANONICAL_ANCHOR_FIELDS,
  W5_N13_B_DURABLE_COVERAGE,
  W5_N13_B_EXPLICIT_OUT,
  W5_N13_B_NEW_PERSISTED_ARTIFACT_IDS,
  W5_N13_B_NOTIFICATION_OWNER,
  W5_N13_B_PREEXISTING_SURVIVE_ARTIFACT_IDS,
  W5_N13_B_SLICE_ID,
  W5_N13_B_TECHNICAL_DEBT_DELTA,
  W5_N13_B_TRANSITION_MATRIX,
  newPersistedInventoryRows,
  persistedArtifactIds,
  preexistingSurviveInventoryRows,
  verifyInventorySynchronization,
} from './w5-n13-b-durable-notification-platform-retry';

const REPO_ROOT = join(__dirname, '../../../..');

function createPrismaMock() {
  const rows = new Map<string, unknown>();
  return {
    workspaceNotificationPlatformRetryAnchor: {
      upsert: async ({
        where: {
          workspaceId_retryAnchorId: { workspaceId, retryAnchorId },
        },
        create,
        update,
      }: {
        where: {
          workspaceId_retryAnchorId: {
            workspaceId: string;
            retryAnchorId: string;
          };
        };
        create: unknown;
        update: unknown;
      }) => {
        const key = `${workspaceId}:${retryAnchorId}`;
        const data = rows.has(key) ? update : create;
        rows.set(key, data);
        return data;
      },
      findUnique: async ({
        where: {
          workspaceId_retryAnchorId: { workspaceId, retryAnchorId },
        },
      }: {
        where: {
          workspaceId_retryAnchorId: {
            workspaceId: string;
            retryAnchorId: string;
          };
        };
      }) => rows.get(`${workspaceId}:${retryAnchorId}`) ?? null,
    },
    _rows: rows,
  };
}

describe('W5-N13-b durable notification platform retry — unit', () => {
  it('persistence correctness: anchor upserts workspace retry row', async () => {
    const prisma = createPrismaMock();
    const repository = new PrismaNotificationPlatformRetryAnchorRepository(prisma as never);
    const service = new NotificationPlatformRetryPersistenceService(
      repository,
      new NotificationPlatformRetryRecoveryStore(),
    );

    const outcome = await service.persistRetryAnchor({
      workspaceId: 'ws-a',
      retryAnchorId: 'retry-1',
      platformRetryType: 'cross-channel-foundation',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt: '2026-09-02T16:00:00.000Z',
    });
    expect(outcome.ok).toBe(true);

    const loaded = await service.loadAnchor('ws-a', 'retry-1');
    expect(loaded).toMatchObject({
      workspaceId: 'ws-a',
      retryAnchorId: 'retry-1',
      retryState: 'anchor-recorded',
    });
    expect(loaded).not.toHaveProperty('retryRuntimeState');
    expect(loaded).not.toHaveProperty('retryExecutionState');
  });

  it('artifact coverage: only approved new SURVIVE row is persisted by this slice', () => {
    expect([...persistedArtifactIds()].sort()).toEqual(
      [...W5_N13_B_NEW_PERSISTED_ARTIFACT_IDS].sort(),
    );
    const rows = newPersistedInventoryRows();
    expect(rows.length).toBe(W5_N13_B_NEW_PERSISTED_ARTIFACT_IDS.length);
    for (const row of rows) {
      expect(row.artifactId).toBe('persist-notification-platform-retry-anchor');
      expect(row.durabilityClass).toBe('SURVIVE');
    }
  });

  it('pre-existing SURVIVE rows remain on notification-delivery owner', () => {
    const preexisting = preexistingSurviveInventoryRows();
    expect(preexisting.length).toBe(W5_N13_B_PREEXISTING_SURVIVE_ARTIFACT_IDS.length);
    expect(
      preexisting.every(
        (row) =>
          row.owner === 'notification-delivery' ||
          row.owner === 'w5-n12-reference' ||
          row.owner === 'w5-n11-reference',
      ),
    ).toBe(true);
  });

  it('ownership: platform retry persistence remains on notification-delivery owner only', () => {
    expect(W5_N13_B_NOTIFICATION_OWNER).toBe('notification-delivery');
    for (const row of W5_N13_B_DURABLE_COVERAGE) {
      expect(row.owner).toBe('notification-delivery');
    }
  });

  it('canonical anchor fields are frozen for W5-N13-b', () => {
    expect(W5_N13_B_CANONICAL_ANCHOR_FIELDS).toEqual(
      expect.arrayContaining([
        'workspaceId',
        'retryAnchorId',
        'platformRetryType',
        'retryState',
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
    expect(sync.noPlatformRetryAuthorization).toBe(true);
  });

  it('transition matrix: inventory → durable persistence; operational continuity still missing', () => {
    expect(W5_N13_B_TRANSITION_MATRIX.before).toContain('Inventory');
    expect(W5_N13_B_TRANSITION_MATRIX.after).toContain('Durable Persistence');
    expect(
      W5_N13_B_TRANSITION_MATRIX.stillMissing.some((item) =>
        item.includes('Operational Continuity'),
      ),
    ).toBe(true);
  });
});

describe('W5-N13-b durable notification platform retry — integration', () => {
  it('persistence lifecycle: no recovery / retry runtime / functional claims from this slice', () => {
    expect(W5_N13_B_SLICE_ID).toBe('W5-N13-b');
    expect(W5_N13_B_ARCHITECTURE_CLAIMS.automaticRestartRecovery).toBe(false);
    expect(W5_N13_B_ARCHITECTURE_CLAIMS.operationalContinuityGuaranteed).toBe(false);
    expect(W5_N13_B_ARCHITECTURE_CLAIMS.platformRetryImplementation).toBe(false);
    expect(W5_N13_B_ARCHITECTURE_CLAIMS.productionTransportIo).toBe(false);
    expect(W5_N13_B_ARCHITECTURE_CLAIMS.platformRetryFunctional).toBe(false);
    expect(W5_N13_B_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N13_B_ARCHITECTURE_CLAIMS.platformRetryRestartSurvivalClaimed).toBe(false);
    expect(W5_N13_B_ARCHITECTURE_CLAIMS.retryRuntimeImplemented).toBe(false);
    expect(W5_N13_B_ARCHITECTURE_CLAIMS.retryExecutionImplemented).toBe(false);
    expect(W5_N13_B_ARCHITECTURE_CLAIMS.retrySchedulingImplemented).toBe(false);
    expect(W5_N13_B_ARCHITECTURE_CLAIMS.retryQueueProcessingImplemented).toBe(false);
    expect(W5_N13_B_ARCHITECTURE_CLAIMS.deadLetterProcessingImplemented).toBe(false);
    expect(W5_N13_B_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched).toBe(true);
  });

  it('technical debt delta: durable foundation resolved; operational continuity deferred', () => {
    expect(W5_N13_B_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Notification Platform Retry Durable Foundation',
    );
    expect(W5_N13_B_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(
      W5_N13_B_TECHNICAL_DEBT_DELTA.deferred.some((item) =>
        item.toLowerCase().includes('operational continuity'),
      ),
    ).toBe(true);
  });

  it('explicit OUT covers restart recovery (W5-N13-b scope)', () => {
    expect(W5_N13_B_EXPLICIT_OUT).toEqual(
      expect.arrayContaining([
        'restart-recovery',
        'platform-retry-runtime',
        'retry-runtime-implementation',
        'production-transport-i/o',
      ]),
    );
  });

  it('owner consistency: each coverage row maps to existing repository and service files', () => {
    for (const row of W5_N13_B_DURABLE_COVERAGE) {
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
          'apps/api/src/modules/notification-delivery/domain/durable-notification-platform-retry-anchor.ts',
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

  it('required reports exist for W5-N13-b', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n13-b-implementation-report.md',
      'w5-n13-b-architecture-review.md',
      'w5-n13-b-security-review.md',
      'w5-n13-b-product-review.md',
      'w5-n13-b-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
  });
});
