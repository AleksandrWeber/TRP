import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PrismaNotificationPlatformRetryExecutionAnchorRepository } from '../modules/notification-delivery/persistence/prisma-notification-platform-retry-execution-anchor.repository';
import { NotificationPlatformRetryExecutionRecoveryStore } from '../modules/notification-delivery/domain/notification-platform-retry-execution-recovery-store';
import { NotificationPlatformRetryExecutionPersistenceService } from '../modules/notification-delivery/notification-platform-retry-execution-persistence.service';
import { rowsEphemeral } from './w5-n18-a-retry-execution-inventory';
import {
  W5_N18_B_ARCHITECTURE_CLAIMS,
  W5_N18_B_CANONICAL_ANCHOR_FIELDS,
  W5_N18_B_DURABLE_COVERAGE,
  W5_N18_B_EXPLICIT_OUT,
  W5_N18_B_NEW_PERSISTED_ARTIFACT_IDS,
  W5_N18_B_NOTIFICATION_OWNER,
  W5_N18_B_PREEXISTING_SURVIVE_ARTIFACT_IDS,
  W5_N18_B_SLICE_ID,
  W5_N18_B_TECHNICAL_DEBT_DELTA,
  W5_N18_B_TRANSITION_MATRIX,
  newPersistedInventoryRows,
  persistedArtifactIds,
  preexistingSurviveInventoryRows,
  verifyInventorySynchronization,
} from './w5-n18-b-durable-notification-platform-retry-execution';

const REPO_ROOT = join(__dirname, '../../../..');

function createPrismaMock() {
  const rows = new Map<string, unknown>();
  return {
    workspaceNotificationPlatformRetryExecutionAnchor: {
      upsert: async ({
        where: {
          workspaceId_retryExecutionAnchorId: { workspaceId, retryExecutionAnchorId },
        },
        create,
        update,
      }: {
        where: {
          workspaceId_retryExecutionAnchorId: {
            workspaceId: string;
            retryExecutionAnchorId: string;
          };
        };
        create: unknown;
        update: unknown;
      }) => {
        const key = `${workspaceId}:${retryExecutionAnchorId}`;
        const data = rows.has(key) ? update : create;
        rows.set(key, data);
        return data;
      },
      findUnique: async ({
        where: {
          workspaceId_retryExecutionAnchorId: { workspaceId, retryExecutionAnchorId },
        },
      }: {
        where: {
          workspaceId_retryExecutionAnchorId: {
            workspaceId: string;
            retryExecutionAnchorId: string;
          };
        };
      }) => rows.get(`${workspaceId}:${retryExecutionAnchorId}`) ?? null,
    },
    _rows: rows,
  };
}

describe('W5-N18-b durable notification platform retry execution — unit', () => {
  it('persistence correctness: anchor upserts workspace retry execution row', async () => {
    const prisma = createPrismaMock();
    const repository = new PrismaNotificationPlatformRetryExecutionAnchorRepository(
      prisma as never,
    );
    const service = new NotificationPlatformRetryExecutionPersistenceService(
      repository,
      new NotificationPlatformRetryExecutionRecoveryStore(),
    );

    const outcome = await service.persistNotificationPlatformRetryExecutionAnchor({
      workspaceId: 'ws-a',
      retryExecutionAnchorId: 'retry-execution-1',
      platformRetryExecutionType: 'eligibility-sequencing-foundation',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt: '2026-09-10T19:00:00.000Z',
    });
    expect(outcome.ok).toBe(true);

    const loaded = await service.loadNotificationPlatformRetryExecutionAnchor(
      'ws-a',
      'retry-execution-1',
    );
    expect(loaded).toMatchObject({
      workspaceId: 'ws-a',
      retryExecutionAnchorId: 'retry-execution-1',
      retryExecutionState: 'anchor-recorded',
    });
    expect(loaded).not.toHaveProperty('deliveryExecutionState');
    expect(loaded).not.toHaveProperty('reliabilityState');
  });

  it('artifact coverage: only approved new SURVIVE row is persisted by this slice', () => {
    expect([...persistedArtifactIds()].sort()).toEqual(
      [...W5_N18_B_NEW_PERSISTED_ARTIFACT_IDS].sort(),
    );
    const rows = newPersistedInventoryRows();
    expect(rows.length).toBe(W5_N18_B_NEW_PERSISTED_ARTIFACT_IDS.length);
    for (const row of rows) {
      expect(row.artifactId).toBe('persist-notification-platform-retry-execution-anchor');
      expect(row.durabilityClass).toBe('SURVIVE');
    }
  });

  it('pre-existing SURVIVE rows remain on notification-delivery owner or consumed references', () => {
    const preexisting = preexistingSurviveInventoryRows();
    expect(preexisting.length).toBe(W5_N18_B_PREEXISTING_SURVIVE_ARTIFACT_IDS.length);
    expect(
      preexisting.every(
        (row) =>
          row.owner === 'notification-delivery' ||
          row.owner === 'notification-product' ||
          row.owner === 'w5-n16-reference' ||
          row.owner === 'w5-n15-reference' ||
          row.owner === 'w5-n14-reference',
      ),
    ).toBe(true);
  });

  it('ownership: platform retry execution persistence remains on notification-delivery owner only', () => {
    expect(W5_N18_B_NOTIFICATION_OWNER).toBe('notification-delivery');
    for (const row of W5_N18_B_DURABLE_COVERAGE) {
      expect(row.owner).toBe('notification-delivery');
    }
  });

  it('canonical anchor fields are frozen for W5-N18-b', () => {
    expect(W5_N18_B_CANONICAL_ANCHOR_FIELDS).toEqual(
      expect.arrayContaining([
        'workspaceId',
        'retryExecutionAnchorId',
        'platformRetryExecutionType',
        'retryExecutionState',
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
    expect(sync.noRetryExecutionAuthorization).toBe(true);
  });

  it('transition matrix: inventory → durable persistence; package Close still missing', () => {
    expect(W5_N18_B_TRANSITION_MATRIX.before).toContain('Inventory');
    expect(W5_N18_B_TRANSITION_MATRIX.after).toContain('Durable Persistence');
    expect(
      W5_N18_B_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
    expect(
      W5_N18_B_TRANSITION_MATRIX.stillMissing.some((item) =>
        item.includes('Operational continuity'),
      ),
    ).toBe(false);
  });
});

describe('W5-N18-b durable notification platform retry execution — integration', () => {
  it('persistence lifecycle: no recovery / retry runtime / functional claims from this slice', () => {
    expect(W5_N18_B_SLICE_ID).toBe('W5-N18-b');
    expect(W5_N18_B_ARCHITECTURE_CLAIMS.automaticRestartRecovery).toBe(false);
    expect(W5_N18_B_ARCHITECTURE_CLAIMS.operationalContinuityGuaranteed).toBe(false);
    expect(W5_N18_B_ARCHITECTURE_CLAIMS.retryExecutionImplementation).toBe(false);
    expect(W5_N18_B_ARCHITECTURE_CLAIMS.productionTransportIo).toBe(false);
    expect(W5_N18_B_ARCHITECTURE_CLAIMS.retryExecutionFunctional).toBe(false);
    expect(W5_N18_B_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N18_B_ARCHITECTURE_CLAIMS.retryExecutionRestartSurvivalClaimed).toBe(false);
    expect(W5_N18_B_ARCHITECTURE_CLAIMS.deliveryExecutionImplemented).toBe(false);
    expect(W5_N18_B_ARCHITECTURE_CLAIMS.retryExecutionImplemented).toBe(false);
    expect(W5_N18_B_ARCHITECTURE_CLAIMS.restartRecoveryImplemented).toBe(false);
    expect(W5_N18_B_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched).toBe(true);
  });

  it('technical debt delta: durable foundation resolved; later slices deferred', () => {
    expect(W5_N18_B_TECHNICAL_DEBT_DELTA.resolved).toContain('Retry Execution Durable Foundation');
    expect(W5_N18_B_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N18_B_TECHNICAL_DEBT_DELTA.deferred).toEqual([
      'Final Package Integration Verification',
    ]);
  });

  it('explicit OUT covers retry runtime and restart recovery only', () => {
    expect(W5_N18_B_EXPLICIT_OUT).toEqual(
      expect.arrayContaining([
        'retry-execution-runtime',
        'retry-execution-implementation',
        'restart-recovery-implementation',
        'production-transport-i/o',
      ]),
    );
    expect(W5_N18_B_EXPLICIT_OUT).not.toContain('w5-n18-d');
  });

  it('owner consistency: each coverage row maps to existing repository and service files', () => {
    for (const row of W5_N18_B_DURABLE_COVERAGE) {
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
          'apps/api/src/modules/notification-delivery/domain/durable-notification-platform-retry-execution-anchor.ts',
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

  it('required reports exist for W5-N18-b', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n18-b-implementation-report.md',
      'w5-n18-b-architecture-review.md',
      'w5-n18-b-security-review.md',
      'w5-n18-b-product-review.md',
      'w5-n18-b-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
  });

  it('RestartRecoveryService was not added in this slice', () => {
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-execution-restart-recovery.service.ts',
        ),
      ),
    ).toBe(false);
  });
});
