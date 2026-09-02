import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PrismaNotificationPlatformReliabilityAnchorRepository } from '../modules/notification-delivery/persistence/prisma-notification-platform-reliability-anchor.repository';
import { NotificationPlatformReliabilityRecoveryStore } from '../modules/notification-delivery/domain/notification-platform-reliability-recovery-store';
import { NotificationPlatformReliabilityPersistenceService } from '../modules/notification-delivery/notification-platform-reliability-persistence.service';
import { rowsEphemeral } from './w5-n17-a-delivery-reliability-inventory';
import {
  W5_N17_B_ARCHITECTURE_CLAIMS,
  W5_N17_B_CANONICAL_ANCHOR_FIELDS,
  W5_N17_B_DURABLE_COVERAGE,
  W5_N17_B_EXPLICIT_OUT,
  W5_N17_B_NEW_PERSISTED_ARTIFACT_IDS,
  W5_N17_B_NOTIFICATION_OWNER,
  W5_N17_B_PREEXISTING_SURVIVE_ARTIFACT_IDS,
  W5_N17_B_SLICE_ID,
  W5_N17_B_TECHNICAL_DEBT_DELTA,
  W5_N17_B_TRANSITION_MATRIX,
  newPersistedInventoryRows,
  persistedArtifactIds,
  preexistingSurviveInventoryRows,
  verifyInventorySynchronization,
} from './w5-n17-b-durable-notification-platform-delivery-reliability';

const REPO_ROOT = join(__dirname, '../../../..');

function createPrismaMock() {
  const rows = new Map<string, unknown>();
  return {
    workspaceNotificationPlatformReliabilityAnchor: {
      upsert: async ({
        where: {
          workspaceId_reliabilityAnchorId: { workspaceId, reliabilityAnchorId },
        },
        create,
        update,
      }: {
        where: {
          workspaceId_reliabilityAnchorId: {
            workspaceId: string;
            reliabilityAnchorId: string;
          };
        };
        create: unknown;
        update: unknown;
      }) => {
        const key = `${workspaceId}:${reliabilityAnchorId}`;
        const data = rows.has(key) ? update : create;
        rows.set(key, data);
        return data;
      },
      findUnique: async ({
        where: {
          workspaceId_reliabilityAnchorId: { workspaceId, reliabilityAnchorId },
        },
      }: {
        where: {
          workspaceId_reliabilityAnchorId: {
            workspaceId: string;
            reliabilityAnchorId: string;
          };
        };
      }) => rows.get(`${workspaceId}:${reliabilityAnchorId}`) ?? null,
    },
    _rows: rows,
  };
}

describe('W5-N17-b durable notification platform delivery reliability — unit', () => {
  it('persistence correctness: anchor upserts workspace reliability row', async () => {
    const prisma = createPrismaMock();
    const repository = new PrismaNotificationPlatformReliabilityAnchorRepository(prisma as never);
    const service = new NotificationPlatformReliabilityPersistenceService(
      repository,
      new NotificationPlatformReliabilityRecoveryStore(),
    );

    const outcome = await service.persistNotificationPlatformReliabilityAnchor({
      workspaceId: 'ws-a',
      reliabilityAnchorId: 'reliability-1',
      platformReliabilityType: 'cross-channel-foundation',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt: '2026-09-02T20:00:00.000Z',
    });
    expect(outcome.ok).toBe(true);

    const loaded = await service.loadNotificationPlatformReliabilityAnchor('ws-a', 'reliability-1');
    expect(loaded).toMatchObject({
      workspaceId: 'ws-a',
      reliabilityAnchorId: 'reliability-1',
      reliabilityState: 'anchor-recorded',
    });
    expect(loaded).not.toHaveProperty('deliveryExecutionState');
    expect(loaded).not.toHaveProperty('retryExecutionState');
  });

  it('artifact coverage: only approved new SURVIVE row is persisted by this slice', () => {
    expect([...persistedArtifactIds()].sort()).toEqual(
      [...W5_N17_B_NEW_PERSISTED_ARTIFACT_IDS].sort(),
    );
    const rows = newPersistedInventoryRows();
    expect(rows.length).toBe(W5_N17_B_NEW_PERSISTED_ARTIFACT_IDS.length);
    for (const row of rows) {
      expect(row.artifactId).toBe('persist-notification-platform-reliability-anchor');
      expect(row.durabilityClass).toBe('SURVIVE');
    }
  });

  it('pre-existing SURVIVE rows remain on notification-delivery owner or consumed references', () => {
    const preexisting = preexistingSurviveInventoryRows();
    expect(preexisting.length).toBe(W5_N17_B_PREEXISTING_SURVIVE_ARTIFACT_IDS.length);
    expect(
      preexisting.every(
        (row) =>
          row.owner === 'notification-delivery' ||
          row.owner === 'w5-n16-reference' ||
          row.owner === 'w5-n15-reference' ||
          row.owner === 'w5-n14-reference',
      ),
    ).toBe(true);
  });

  it('ownership: platform delivery reliability persistence remains on notification-delivery owner only', () => {
    expect(W5_N17_B_NOTIFICATION_OWNER).toBe('notification-delivery');
    for (const row of W5_N17_B_DURABLE_COVERAGE) {
      expect(row.owner).toBe('notification-delivery');
    }
  });

  it('canonical anchor fields are frozen for W5-N17-b', () => {
    expect(W5_N17_B_CANONICAL_ANCHOR_FIELDS).toEqual(
      expect.arrayContaining([
        'workspaceId',
        'reliabilityAnchorId',
        'platformReliabilityType',
        'reliabilityState',
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
    expect(sync.noDeliveryReliabilityAuthorization).toBe(true);
  });

  it('transition matrix: inventory → durable persistence; package Close still missing', () => {
    expect(W5_N17_B_TRANSITION_MATRIX.before).toContain('Inventory');
    expect(W5_N17_B_TRANSITION_MATRIX.after).toContain('Durable Persistence');
    expect(
      W5_N17_B_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
    expect(
      W5_N17_B_TRANSITION_MATRIX.stillMissing.some((item) =>
        item.includes('Operational continuity'),
      ),
    ).toBe(false);
  });
});

describe('W5-N17-b durable notification platform delivery reliability — integration', () => {
  it('persistence lifecycle: no recovery / delivery runtime / functional claims from this slice', () => {
    expect(W5_N17_B_SLICE_ID).toBe('W5-N17-b');
    expect(W5_N17_B_ARCHITECTURE_CLAIMS.automaticRestartRecovery).toBe(false);
    expect(W5_N17_B_ARCHITECTURE_CLAIMS.operationalContinuityGuaranteed).toBe(false);
    expect(W5_N17_B_ARCHITECTURE_CLAIMS.deliveryReliabilityImplementation).toBe(false);
    expect(W5_N17_B_ARCHITECTURE_CLAIMS.productionTransportIo).toBe(false);
    expect(W5_N17_B_ARCHITECTURE_CLAIMS.deliveryReliabilityFunctional).toBe(false);
    expect(W5_N17_B_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N17_B_ARCHITECTURE_CLAIMS.deliveryReliabilityRestartSurvivalClaimed).toBe(false);
    expect(W5_N17_B_ARCHITECTURE_CLAIMS.deliveryExecutionImplemented).toBe(false);
    expect(W5_N17_B_ARCHITECTURE_CLAIMS.retryExecutionImplemented).toBe(false);
    expect(W5_N17_B_ARCHITECTURE_CLAIMS.restartRecoveryImplemented).toBe(false);
    expect(W5_N17_B_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched).toBe(true);
  });

  it('technical debt delta: durable foundation resolved; later slices deferred', () => {
    expect(W5_N17_B_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Delivery Reliability Durable Foundation',
    );
    expect(W5_N17_B_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N17_B_TECHNICAL_DEBT_DELTA.deferred).toEqual([
      'Final Package Integration Verification',
    ]);
  });

  it('explicit OUT covers delivery runtime and restart recovery only', () => {
    expect(W5_N17_B_EXPLICIT_OUT).toEqual(
      expect.arrayContaining([
        'delivery-reliability-runtime',
        'delivery-execution-implementation',
        'restart-recovery-implementation',
        'production-transport-i/o',
      ]),
    );
    expect(W5_N17_B_EXPLICIT_OUT).not.toContain('w5-n17-d');
  });

  it('owner consistency: each coverage row maps to existing repository and service files', () => {
    for (const row of W5_N17_B_DURABLE_COVERAGE) {
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
          'apps/api/src/modules/notification-delivery/domain/durable-notification-platform-reliability-anchor.ts',
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

  it('required reports exist for W5-N17-b', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n17-b-implementation-report.md',
      'w5-n17-b-architecture-review.md',
      'w5-n17-b-security-review.md',
      'w5-n17-b-product-review.md',
      'w5-n17-b-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
  });
});
