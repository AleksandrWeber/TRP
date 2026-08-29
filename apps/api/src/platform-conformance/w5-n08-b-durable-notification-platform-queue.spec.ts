import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PrismaNotificationPlatformQueueAnchorRepository } from '../modules/notification-delivery/persistence/prisma-notification-platform-queue-anchor.repository';
import { NotificationPlatformQueuePersistenceService } from '../modules/notification-delivery/notification-platform-queue-persistence.service';
import { rowsEphemeral } from './w5-n08-a-notification-platform-queue-inventory';
import {
  W5_N08_B_ARCHITECTURE_CLAIMS,
  W5_N08_B_CANONICAL_ANCHOR_FIELDS,
  W5_N08_B_DURABLE_COVERAGE,
  W5_N08_B_EXPLICIT_OUT,
  W5_N08_B_NEW_PERSISTED_ARTIFACT_IDS,
  W5_N08_B_NOTIFICATION_OWNER,
  W5_N08_B_PREEXISTING_SURVIVE_ARTIFACT_IDS,
  W5_N08_B_SLICE_ID,
  W5_N08_B_TECHNICAL_DEBT_DELTA,
  W5_N08_B_TRANSITION_MATRIX,
  newPersistedInventoryRows,
  persistedArtifactIds,
  preexistingSurviveInventoryRows,
  verifyInventorySynchronization,
} from './w5-n08-b-durable-notification-platform-queue';

const REPO_ROOT = join(__dirname, '../../../..');

function createPrismaMock() {
  const rows = new Map<string, unknown>();
  return {
    workspaceNotificationPlatformQueueAnchor: {
      upsert: async ({
        where: {
          workspaceId_queueAnchorId: { workspaceId, queueAnchorId },
        },
        create,
        update,
      }: {
        where: {
          workspaceId_queueAnchorId: { workspaceId: string; queueAnchorId: string };
        };
        create: unknown;
        update: unknown;
      }) => {
        const key = `${workspaceId}:${queueAnchorId}`;
        const data = rows.has(key) ? update : create;
        rows.set(key, data);
        return data;
      },
      findUnique: async ({
        where: {
          workspaceId_queueAnchorId: { workspaceId, queueAnchorId },
        },
      }: {
        where: {
          workspaceId_queueAnchorId: { workspaceId: string; queueAnchorId: string };
        };
      }) => rows.get(`${workspaceId}:${queueAnchorId}`) ?? null,
      findMany: async () => [...rows.values()],
    },
    _rows: rows,
  };
}

describe('W5-N08-b durable notification platform queue — unit', () => {
  it('persistence correctness: anchor write-through upserts workspace queue row', async () => {
    const prisma = createPrismaMock();
    const repository = new PrismaNotificationPlatformQueueAnchorRepository(prisma as never);
    const service = new NotificationPlatformQueuePersistenceService(repository);

    const outcome = await service.persistQueueAnchor({
      workspaceId: 'ws-a',
      queueAnchorId: 'queue-1',
      platformQueueType: 'cross-channel-foundation',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt: '2026-08-29T20:00:00.000Z',
    });
    expect(outcome.ok).toBe(true);

    const loaded = await service.loadAnchor('ws-a', 'queue-1');
    expect(loaded).toMatchObject({
      workspaceId: 'ws-a',
      queueAnchorId: 'queue-1',
      queueState: 'anchor-recorded',
    });
    expect(loaded).not.toHaveProperty('queueWorkerState');
    expect(loaded).not.toHaveProperty('retryState');
  });

  it('artifact coverage: only approved new SURVIVE row is persisted by this slice', () => {
    expect([...persistedArtifactIds()].sort()).toEqual(
      [...W5_N08_B_NEW_PERSISTED_ARTIFACT_IDS].sort(),
    );
    const rows = newPersistedInventoryRows();
    expect(rows.length).toBe(W5_N08_B_NEW_PERSISTED_ARTIFACT_IDS.length);
    for (const row of rows) {
      expect(row.artifactId).toBe('persist-notification-platform-queue-anchor');
      expect(row.durabilityClass).toBe('SURVIVE');
    }
  });

  it('pre-existing SURVIVE rows remain on notification-delivery owner', () => {
    const preexisting = preexistingSurviveInventoryRows();
    expect(preexisting.length).toBe(W5_N08_B_PREEXISTING_SURVIVE_ARTIFACT_IDS.length);
    expect(
      preexisting.every(
        (row) => row.owner === 'notification-delivery' || row.owner === 'w5-n07-reference',
      ),
    ).toBe(true);
  });

  it('ownership: platform queue persistence remains on notification-delivery owner only', () => {
    expect(W5_N08_B_NOTIFICATION_OWNER).toBe('notification-delivery');
    for (const row of W5_N08_B_DURABLE_COVERAGE) {
      expect(row.owner).toBe('notification-delivery');
    }
  });

  it('canonical anchor fields are frozen for W5-N08-b', () => {
    expect(W5_N08_B_CANONICAL_ANCHOR_FIELDS).toEqual(
      expect.arrayContaining([
        'workspaceId',
        'queueAnchorId',
        'platformQueueType',
        'queueState',
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
    expect(sync.noPlatformQueueAuthorization).toBe(true);
  });

  it('transition matrix: inventory → durable persistence → restart recovery still missing', () => {
    expect(W5_N08_B_TRANSITION_MATRIX.before).toContain('Inventory');
    expect(W5_N08_B_TRANSITION_MATRIX.after).toContain('Durable Persistence');
    expect(W5_N08_B_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Restart'))).toBe(
      true,
    );
  });
});

describe('W5-N08-b durable notification platform queue — integration', () => {
  it('persistence lifecycle: no recovery / queue execution / functional claims from this slice', () => {
    expect(W5_N08_B_SLICE_ID).toBe('W5-N08-b');
    expect(W5_N08_B_ARCHITECTURE_CLAIMS.automaticRestartRecovery).toBe(false);
    expect(W5_N08_B_ARCHITECTURE_CLAIMS.operationalContinuityGuaranteed).toBe(false);
    expect(W5_N08_B_ARCHITECTURE_CLAIMS.platformQueueImplementation).toBe(false);
    expect(W5_N08_B_ARCHITECTURE_CLAIMS.productionTransportIo).toBe(false);
    expect(W5_N08_B_ARCHITECTURE_CLAIMS.platformQueueFunctional).toBe(false);
    expect(W5_N08_B_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N08_B_ARCHITECTURE_CLAIMS.platformQueueRestartSurvivalClaimed).toBe(false);
    expect(W5_N08_B_ARCHITECTURE_CLAIMS.queueWorkersImplemented).toBe(false);
    expect(W5_N08_B_ARCHITECTURE_CLAIMS.schedulerImplemented).toBe(false);
    expect(W5_N08_B_ARCHITECTURE_CLAIMS.retryOrchestrationImplemented).toBe(false);
    expect(W5_N08_B_ARCHITECTURE_CLAIMS.dispatcherImplemented).toBe(false);
    expect(W5_N08_B_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched).toBe(true);
  });

  it('technical debt delta: durable foundation resolved; recovery deferred', () => {
    expect(W5_N08_B_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Notification Platform Queue Durable Foundation',
    );
    expect(W5_N08_B_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(
      W5_N08_B_TECHNICAL_DEBT_DELTA.deferred.some((item) => item.toLowerCase().includes('restart')),
    ).toBe(true);
  });

  it('explicit OUT covers restart recovery and W5-N08-c', () => {
    expect(W5_N08_B_EXPLICIT_OUT).toEqual(
      expect.arrayContaining([
        'restart-recovery',
        'w5-n08-c',
        'platform-queue-execution',
        'queue-workers-implementation',
        'production-transport-i/o',
      ]),
    );
  });

  it('owner consistency: each coverage row maps to existing repository and service files', () => {
    for (const row of W5_N08_B_DURABLE_COVERAGE) {
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
          'apps/api/src/modules/notification-delivery/domain/durable-notification-platform-queue-anchor.ts',
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

  it('required reports exist for W5-N08-b', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n08-b-implementation-report.md',
      'w5-n08-b-architecture-review.md',
      'w5-n08-b-security-review.md',
      'w5-n08-b-product-review.md',
      'w5-n08-b-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
  });
});
