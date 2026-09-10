import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PrismaNotificationPlatformRetrySchedulingAnchorRepository } from '../modules/notification-delivery/persistence/prisma-notification-platform-retry-scheduling-anchor.repository';
import { NotificationPlatformRetrySchedulingRecoveryStore } from '../modules/notification-delivery/domain/notification-platform-retry-scheduling-recovery-store';
import { NotificationPlatformRetrySchedulingPersistenceService } from '../modules/notification-delivery/notification-platform-retry-scheduling-persistence.service';
import { rowsEphemeral } from './w5-n19-a-retry-scheduling-inventory';
import {
  W5_N19_B_ARCHITECTURE_CLAIMS,
  W5_N19_B_CANONICAL_ANCHOR_FIELDS,
  W5_N19_B_DURABLE_COVERAGE,
  W5_N19_B_EXPLICIT_OUT,
  W5_N19_B_NEW_PERSISTED_ARTIFACT_IDS,
  W5_N19_B_NOTIFICATION_OWNER,
  W5_N19_B_PREEXISTING_SURVIVE_ARTIFACT_IDS,
  W5_N19_B_SLICE_ID,
  W5_N19_B_TECHNICAL_DEBT_DELTA,
  W5_N19_B_TRANSITION_MATRIX,
  newPersistedInventoryRows,
  persistedArtifactIds,
  preexistingSurviveInventoryRows,
  verifyInventorySynchronization,
} from './w5-n19-b-durable-notification-platform-retry-scheduling';

const REPO_ROOT = join(__dirname, '../../../..');

function createPrismaMock() {
  const rows = new Map<string, unknown>();
  return {
    workspaceNotificationPlatformRetrySchedulingAnchor: {
      upsert: async ({
        where: {
          workspaceId_retrySchedulingAnchorId: { workspaceId, retrySchedulingAnchorId },
        },
        create,
        update,
      }: {
        where: {
          workspaceId_retrySchedulingAnchorId: {
            workspaceId: string;
            retrySchedulingAnchorId: string;
          };
        };
        create: unknown;
        update: unknown;
      }) => {
        const key = `${workspaceId}:${retrySchedulingAnchorId}`;
        const data = rows.has(key) ? update : create;
        rows.set(key, data);
        return data;
      },
      findUnique: async ({
        where: {
          workspaceId_retrySchedulingAnchorId: { workspaceId, retrySchedulingAnchorId },
        },
      }: {
        where: {
          workspaceId_retrySchedulingAnchorId: {
            workspaceId: string;
            retrySchedulingAnchorId: string;
          };
        };
      }) => rows.get(`${workspaceId}:${retrySchedulingAnchorId}`) ?? null,
    },
    _rows: rows,
  };
}

describe('W5-N19-b durable notification platform retry scheduling — unit', () => {
  it('persistence correctness: anchor upserts workspace retry scheduling row', async () => {
    const prisma = createPrismaMock();
    const repository = new PrismaNotificationPlatformRetrySchedulingAnchorRepository(
      prisma as never,
    );
    const service = new NotificationPlatformRetrySchedulingPersistenceService(
      repository,
      new NotificationPlatformRetrySchedulingRecoveryStore(),
    );

    const outcome = await service.persistNotificationPlatformRetrySchedulingAnchor({
      workspaceId: 'ws-a',
      retrySchedulingAnchorId: 'retry-scheduling-1',
      platformRetrySchedulingType: 'eligibility-timing-foundation',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt: '2026-09-10T21:00:00.000Z',
    });
    expect(outcome.ok).toBe(true);

    const loaded = await service.loadNotificationPlatformRetrySchedulingAnchor(
      'ws-a',
      'retry-scheduling-1',
    );
    expect(loaded).toMatchObject({
      workspaceId: 'ws-a',
      retrySchedulingAnchorId: 'retry-scheduling-1',
      retrySchedulingState: 'anchor-recorded',
    });
    expect(loaded).not.toHaveProperty('retrySchedulingRuntimeState');
    expect(loaded).not.toHaveProperty('nextRetryAt');
  });

  it('artifact coverage: only approved new SURVIVE row is persisted by this slice', () => {
    expect([...persistedArtifactIds()].sort()).toEqual(
      [...W5_N19_B_NEW_PERSISTED_ARTIFACT_IDS].sort(),
    );
    const rows = newPersistedInventoryRows();
    expect(rows.length).toBe(W5_N19_B_NEW_PERSISTED_ARTIFACT_IDS.length);
    for (const row of rows) {
      expect(row.artifactId).toBe('persist-notification-platform-retry-scheduling-anchor');
      expect(row.durabilityClass).toBe('SURVIVE');
    }
  });

  it('pre-existing SURVIVE / DURABLE / RECOVERABLE rows remain on notification-delivery owner or consumed references', () => {
    const preexisting = preexistingSurviveInventoryRows();
    expect(preexisting.length).toBe(W5_N19_B_PREEXISTING_SURVIVE_ARTIFACT_IDS.length);
    expect(
      preexisting.every(
        (row) =>
          row.owner === 'notification-delivery' ||
          row.owner === 'notification-product' ||
          row.owner === 'w5-n12-reference' ||
          row.owner === 'w5-n13-reference' ||
          row.owner === 'w5-n17-reference' ||
          row.owner === 'w5-n18-reference',
      ),
    ).toBe(true);
  });

  it('ownership: platform retry scheduling persistence remains on notification-delivery owner only', () => {
    expect(W5_N19_B_NOTIFICATION_OWNER).toBe('notification-delivery');
    for (const row of W5_N19_B_DURABLE_COVERAGE) {
      expect(row.owner).toBe('notification-delivery');
    }
  });

  it('canonical anchor fields are frozen for W5-N19-b', () => {
    expect(W5_N19_B_CANONICAL_ANCHOR_FIELDS).toEqual(
      expect.arrayContaining([
        'workspaceId',
        'retrySchedulingAnchorId',
        'platformRetrySchedulingType',
        'retrySchedulingState',
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
    expect(sync.noRetrySchedulingAuthorization).toBe(true);
  });

  it('transition matrix: inventory → durable persistence; recovery/continuity/Close still missing', () => {
    expect(W5_N19_B_TRANSITION_MATRIX.before).toContain('Inventory');
    expect(W5_N19_B_TRANSITION_MATRIX.after).toContain('Durable Persistence');
    expect(
      W5_N19_B_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Restart recovery')),
    ).toBe(true);
    expect(
      W5_N19_B_TRANSITION_MATRIX.stillMissing.some((item) =>
        item.includes('Operational continuity'),
      ),
    ).toBe(true);
    expect(
      W5_N19_B_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
  });
});

describe('W5-N19-b durable notification platform retry scheduling — integration', () => {
  it('persistence lifecycle: no recovery / scheduling runtime / functional claims from this slice', () => {
    expect(W5_N19_B_SLICE_ID).toBe('W5-N19-b');
    expect(W5_N19_B_ARCHITECTURE_CLAIMS.automaticRestartRecovery).toBe(false);
    expect(W5_N19_B_ARCHITECTURE_CLAIMS.operationalContinuityGuaranteed).toBe(false);
    expect(W5_N19_B_ARCHITECTURE_CLAIMS.retrySchedulingImplementation).toBe(false);
    expect(W5_N19_B_ARCHITECTURE_CLAIMS.productionTransportIo).toBe(false);
    expect(W5_N19_B_ARCHITECTURE_CLAIMS.retrySchedulingFunctional).toBe(false);
    expect(W5_N19_B_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N19_B_ARCHITECTURE_CLAIMS.retrySchedulingRestartSurvivalClaimed).toBe(false);
    expect(W5_N19_B_ARCHITECTURE_CLAIMS.retryTimingCalculationImplemented).toBe(false);
    expect(W5_N19_B_ARCHITECTURE_CLAIMS.retrySchedulingRuntimeImplemented).toBe(false);
    expect(W5_N19_B_ARCHITECTURE_CLAIMS.restartRecoveryImplemented).toBe(false);
    expect(W5_N19_B_ARCHITECTURE_CLAIMS.schedulerPlatformIntroduced).toBe(false);
    expect(W5_N19_B_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched).toBe(true);
  });

  it('technical debt delta: durable foundation resolved; later slices deferred', () => {
    expect(W5_N19_B_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Durable Retry Scheduling persistence foundation',
    );
    expect(W5_N19_B_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N19_B_TECHNICAL_DEBT_DELTA.deferred).toEqual([
      'W5-N19-c — Restart Recovery Foundation',
      'W5-N19-d — Operational Continuity Foundation',
      'W5-N19-e — Package Validation, Operational Verification & Close Evidence',
    ]);
  });

  it('explicit OUT covers scheduling runtime and restart recovery', () => {
    expect(W5_N19_B_EXPLICIT_OUT).toEqual(
      expect.arrayContaining([
        'retry-scheduling-runtime',
        'retry-scheduling-implementation',
        'restart-recovery-implementation',
        'production-transport-i/o',
        'scheduler-platform',
      ]),
    );
    expect(W5_N19_B_EXPLICIT_OUT).not.toContain('w5-n19-d');
  });

  it('owner consistency: each coverage row maps to existing repository and service files', () => {
    for (const row of W5_N19_B_DURABLE_COVERAGE) {
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
          'apps/api/src/modules/notification-delivery/domain/durable-notification-platform-retry-scheduling-anchor.ts',
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

  it('required reports exist for W5-N19-b', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n19-b-implementation-report.md',
      'w5-n19-b-architecture-review.md',
      'w5-n19-b-security-review.md',
      'w5-n19-b-product-review.md',
      'w5-n19-b-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
  });

  it('W5-N19-b architecture claims remain persistence-only (restart recovery is W5-N19-c)', () => {
    expect(W5_N19_B_ARCHITECTURE_CLAIMS.restartRecoveryImplemented).toBe(false);
    expect(W5_N19_B_ARCHITECTURE_CLAIMS.automaticRestartRecovery).toBe(false);
    expect(W5_N19_B_ARCHITECTURE_CLAIMS.retrySchedulingRuntimeImplemented).toBe(false);
    expect(W5_N19_B_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['restart-recovery-implementation']),
    );
  });
});
