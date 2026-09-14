import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PrismaNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorRepository } from '../modules/notification-delivery/persistence/prisma-notification-platform-retry-scheduling-decision-projection-publication-consumption-anchor.repository';
import { NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryStore } from '../modules/notification-delivery/domain/notification-platform-retry-scheduling-decision-projection-publication-consumption-recovery-store';
import { NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionPersistenceService } from '../modules/notification-delivery/notification-platform-retry-scheduling-decision-projection-publication-consumption-persistence.service';
import {
  W5_N29_A_BINDING_FINDINGS,
  rowsEphemeral,
} from './w5-n29-a-retry-scheduling-decision-projection-publication-consumption-inventory';
import {
  W5_N29_B_ARCHITECTURE_CLAIMS,
  W5_N29_B_CANONICAL_ANCHOR_FIELDS,
  W5_N29_B_DURABLE_COVERAGE,
  W5_N29_B_EXPLICIT_OUT,
  W5_N29_B_NEW_PERSISTED_ARTIFACT_IDS,
  W5_N29_B_NOTIFICATION_OWNER,
  W5_N29_B_PREEXISTING_RECOVERABLE_ARTIFACT_IDS,
  W5_N29_B_SLICE_ID,
  W5_N29_B_TECHNICAL_DEBT_DELTA,
  W5_N29_B_TRANSITION_MATRIX,
  newPersistedInventoryRows,
  persistedArtifactIds,
  preexistingRecoverableInventoryRows,
  verifyInventorySynchronization,
} from './w5-n29-b-durable-notification-platform-retry-scheduling-decision-projection-publication-consumption';

const REPO_ROOT = join(__dirname, '../../../..');

function createPrismaMock() {
  const rows = new Map<string, unknown>();
  return {
    workspaceNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor: {
      upsert: async ({
        where: {
          workspaceId_consumptionAnchorId: { workspaceId, consumptionAnchorId },
        },
        create,
        update,
      }: {
        where: {
          workspaceId_consumptionAnchorId: {
            workspaceId: string;
            consumptionAnchorId: string;
          };
        };
        create: unknown;
        update: unknown;
      }) => {
        const key = `${workspaceId}:${consumptionAnchorId}`;
        const data = rows.has(key) ? update : create;
        rows.set(key, data);
        return data;
      },
      findUnique: async ({
        where: {
          workspaceId_consumptionAnchorId: { workspaceId, consumptionAnchorId },
        },
      }: {
        where: {
          workspaceId_consumptionAnchorId: {
            workspaceId: string;
            consumptionAnchorId: string;
          };
        };
      }) => rows.get(`${workspaceId}:${consumptionAnchorId}`) ?? null,
    },
    _rows: rows,
  };
}

describe('W5-N29-b durable notification platform retry scheduling decision projection publication consumption — unit', () => {
  it('persistence correctness: anchor upserts workspace consumption row', async () => {
    const prisma = createPrismaMock();
    const repository =
      new PrismaNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorRepository(
        prisma as never,
      );
    const service =
      new NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionPersistenceService(
        repository,
        new NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryStore(),
      );

    const outcome =
      await service.persistNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor(
        {
          workspaceId: 'ws-a',
          consumptionAnchorId: 'consumption-anchor-1',
          platformRetrySchedulingDecisionProjectionPublicationConsumptionType:
            'decision-projection-publication-consumption-description-foundation',
          channelScope: 'telegram,email,slack-discord-teams,push',
          correlationId: 'corr-1',
          actorId: 'actor-1',
          recordedAt: '2026-09-14T08:00:00.000Z',
        },
      );
    expect(outcome.ok).toBe(true);

    const loaded =
      await service.loadNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchor(
        'ws-a',
        'consumption-anchor-1',
      );
    expect(loaded).toMatchObject({
      workspaceId: 'ws-a',
      consumptionAnchorId: 'consumption-anchor-1',
      consumptionAnchorState: 'anchor-recorded',
    });
    expect(loaded).not.toHaveProperty('runtimeDecisionProjection');
    expect(loaded).not.toHaveProperty('runtimeConsumption');
    expect(loaded).not.toHaveProperty('nextRetryAt');
    expect(loaded).not.toHaveProperty('scheduledAt');
    expect(loaded).not.toHaveProperty('executionState');
  });

  it('artifact coverage: only approved new RECOVERABLE persist row is persisted by this slice', () => {
    expect([...persistedArtifactIds()].sort()).toEqual(
      [...W5_N29_B_NEW_PERSISTED_ARTIFACT_IDS].sort(),
    );
    const rows = newPersistedInventoryRows();
    expect(rows.length).toBe(W5_N29_B_NEW_PERSISTED_ARTIFACT_IDS.length);
    for (const row of rows) {
      expect(row.artifactId).toBe('persist-candidate-consumption-anchor');
      expect(row.classification).toBe('RECOVERABLE');
      expect(row.existsToday).toBe(true);
    }
  });

  it('pre-existing RECOVERABLE rows remain on notification-delivery owner or consumed references', () => {
    const preexisting = preexistingRecoverableInventoryRows();
    expect(preexisting.length).toBe(W5_N29_B_PREEXISTING_RECOVERABLE_ARTIFACT_IDS.length);
    expect(
      preexisting.every(
        (row) =>
          row.owner === 'notification-delivery' ||
          row.owner === 'notification-product' ||
          row.owner.startsWith('w5-n'),
      ),
    ).toBe(true);
  });

  it('ownership: platform consumption persistence remains on notification-delivery owner only', () => {
    expect(W5_N29_B_NOTIFICATION_OWNER).toBe('notification-delivery');
    for (const row of W5_N29_B_DURABLE_COVERAGE) {
      expect(row.owner).toBe('notification-delivery');
    }
  });

  it('canonical anchor fields are frozen for W5-N29-b', () => {
    expect(W5_N29_B_CANONICAL_ANCHOR_FIELDS).toEqual(
      expect.arrayContaining([
        'workspaceId',
        'consumptionAnchorId',
        'platformRetrySchedulingDecisionProjectionPublicationConsumptionType',
        'consumptionAnchorState',
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

  it('inventory synchronization: consumption persistence gap resolved', () => {
    const sync = verifyInventorySynchronization();
    expect(sync.ok).toBe(true);
    expect(sync.persistedRowRecoverable).toBe(true);
    expect(sync.ownershipRowRecoverable).toBe(true);
    expect(sync.noDecisionAuthorization).toBe(true);
    expect(sync.consumptionPersistenceMissingResolved).toBe(true);
    expect(W5_N29_A_BINDING_FINDINGS.consumptionPersistenceMissing).toBe(false);
  });

  it('transition matrix: inventory → durable persistence; recovery/continuity/Close still missing', () => {
    expect(W5_N29_B_TRANSITION_MATRIX.before).toContain('Inventory');
    expect(W5_N29_B_TRANSITION_MATRIX.after).toContain('Durable Persistence');
    expect(
      W5_N29_B_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Restart recovery')),
    ).toBe(true);
    expect(
      W5_N29_B_TRANSITION_MATRIX.stillMissing.some((item) =>
        item.includes('Operational continuity'),
      ),
    ).toBe(true);
    expect(
      W5_N29_B_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
  });
});

describe('W5-N29-b durable notification platform retry scheduling decision projection publication consumption — integration', () => {
  it('persistence lifecycle: survive yes / auto-recover no; no consumption runtime claims', () => {
    expect(W5_N29_B_SLICE_ID).toBe('W5-N29-b');
    expect(W5_N29_B_ARCHITECTURE_CLAIMS.survivesProcessTermination).toBe(true);
    expect(W5_N29_B_ARCHITECTURE_CLAIMS.automaticRestartRecovery).toBe(false);
    expect(W5_N29_B_ARCHITECTURE_CLAIMS.operationalContinuityGuaranteed).toBe(false);
    expect(W5_N29_B_ARCHITECTURE_CLAIMS.runtimeDecisionProjectionIntroduced).toBe(false);
    expect(W5_N29_B_ARCHITECTURE_CLAIMS.runtimePublicationIntroduced).toBe(false);
    expect(W5_N29_B_ARCHITECTURE_CLAIMS.runtimeConsumptionIntroduced).toBe(false);
    expect(W5_N29_B_ARCHITECTURE_CLAIMS.runtimeSchedulingImplemented).toBe(false);
    expect(W5_N29_B_ARCHITECTURE_CLAIMS.backoffCalculationImplemented).toBe(false);
    expect(W5_N29_B_ARCHITECTURE_CLAIMS.eligibilityDeterminationImplemented).toBe(false);
    expect(W5_N29_B_ARCHITECTURE_CLAIMS.executionImplemented).toBe(false);
    expect(W5_N29_B_ARCHITECTURE_CLAIMS.productionTransportIo).toBe(false);
    expect(W5_N29_B_ARCHITECTURE_CLAIMS.consumptionFunctional).toBe(false);
    expect(W5_N29_B_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N29_B_ARCHITECTURE_CLAIMS.consumptionRestartSurvivalClaimed).toBe(false);
    expect(W5_N29_B_ARCHITECTURE_CLAIMS.restartRecoveryImplemented).toBe(false);
    expect(W5_N29_B_ARCHITECTURE_CLAIMS.runtimeDecisionEngineIntroduced).toBe(false);
    expect(W5_N29_B_ARCHITECTURE_CLAIMS.runtimeSchedulerIntroduced).toBe(false);
    expect(W5_N29_B_ARCHITECTURE_CLAIMS.workerIntroduced).toBe(false);
    expect(W5_N29_B_ARCHITECTURE_CLAIMS.newConsumptionPersistenceStackIntroduced).toBe(true);
    expect(W5_N29_B_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched).toBe(true);
  });

  it('technical debt delta: durable foundation resolved; later slices deferred', () => {
    expect(W5_N29_B_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Durable persistence foundation for Notification Retry Scheduling Decision Projection Publication Consumption artifacts',
    );
    expect(W5_N29_B_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N29_B_TECHNICAL_DEBT_DELTA.deferred).toEqual([
      'W5-N29-c — Restart Recovery Foundation',
      'W5-N29-d — Operational Continuity Foundation',
      'W5-N29-e — Package Validation, Operational Verification & Close Evidence',
      'All runtime consumption behavior',
    ]);
  });

  it('explicit OUT covers consumption runtime, scheduling, eligibility, backoff, execution, and restart recovery', () => {
    expect(W5_N29_B_EXPLICIT_OUT).toEqual(
      expect.arrayContaining([
        'runtime-decision-logic',
        'runtime-publication',
        'runtime-consumption',
        'runtime-consumption-engine',
        'scheduling-decisions',
        'runtime-scheduling',
        'eligibility-determination',
        'backoff-calculation',
        'retry-execution',
        'retry-lifecycle',
        'timers',
        'workers',
        'orchestration',
        'restart-recovery-implementation',
        'production-transport-i/o',
        'runtime-decision-engine',
        'runtime-scheduler',
        'retry-engine',
        'workflow-engine',
        'event-bus',
      ]),
    );
  });

  it('owner consistency: each coverage row maps to existing repository and service files', () => {
    for (const row of W5_N29_B_DURABLE_COVERAGE) {
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
          'apps/api/src/modules/notification-delivery/domain/durable-notification-platform-retry-scheduling-decision-projection-publication-consumption-anchor.ts',
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

  it('W5-N29-b architecture claims remain persistence-only (restart recovery is W5-N29-c)', () => {
    expect(W5_N29_B_ARCHITECTURE_CLAIMS.restartRecoveryImplemented).toBe(false);
    expect(W5_N29_B_ARCHITECTURE_CLAIMS.automaticRestartRecovery).toBe(false);
    expect(W5_N29_B_ARCHITECTURE_CLAIMS.survivesProcessTermination).toBe(true);
    expect(W5_N29_B_ARCHITECTURE_CLAIMS.runtimeConsumptionIntroduced).toBe(false);
    expect(W5_N29_B_ARCHITECTURE_CLAIMS.runtimeDecisionProjectionIntroduced).toBe(false);
    expect(W5_N29_B_ARCHITECTURE_CLAIMS.runtimeSchedulingImplemented).toBe(false);
    expect(W5_N29_B_ARCHITECTURE_CLAIMS.executionImplemented).toBe(false);
    expect(W5_N29_B_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['restart-recovery-implementation']),
    );
  });
});
