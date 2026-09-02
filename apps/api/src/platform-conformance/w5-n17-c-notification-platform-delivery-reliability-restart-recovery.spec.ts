import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildNotificationPlatformReliabilityAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-reliability-anchor';
import {
  prepareNotificationPlatformReliabilityAnchorsForRecovery,
  NotificationPlatformReliabilityRestartRecoveryError,
} from '../modules/notification-delivery/domain/notification-platform-reliability-restart-recovery';
import { NotificationPlatformReliabilityRestartRecoveryService } from '../modules/notification-delivery/domain/notification-platform-reliability-restart-recovery.service';
import { NotificationPlatformReliabilityRecoveryStore } from '../modules/notification-delivery/domain/notification-platform-reliability-recovery-store';
import { PrismaNotificationPlatformReliabilityAnchorRepository } from '../modules/notification-delivery/persistence/prisma-notification-platform-reliability-anchor.repository';
import {
  W5_N17_C_ARCHITECTURE_CLAIMS,
  W5_N17_C_EXPLICIT_OUT,
  W5_N17_C_NOTIFICATION_OWNER,
  W5_N17_C_RECOVERED_ARTIFACT_IDS,
  W5_N17_C_SLICE_ID,
  W5_N17_C_TECHNICAL_DEBT_DELTA,
  W5_N17_C_TRANSITION_MATRIX,
} from './w5-n17-c-notification-platform-delivery-reliability-restart-recovery';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-09-02T20:00:00.000Z';

function canonicalAnchor(workspaceId: string, reliabilityAnchorId: string) {
  const outcome = buildNotificationPlatformReliabilityAnchorState({
    workspaceId,
    reliabilityAnchorId,
    platformReliabilityType: 'unified-platform-reliability',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical anchor');
  return outcome.anchor;
}

function createPrismaMock(rows: Record<string, unknown>[]) {
  const store = new Map(
    rows.map((row) => [`${row.workspaceId as string}:${row.reliabilityAnchorId as string}`, row]),
  );
  return {
    workspaceNotificationPlatformReliabilityAnchor: {
      findMany: async () =>
        [...store.values()].sort((a, b) => {
          const byWorkspace = String(a.workspaceId).localeCompare(String(b.workspaceId));
          if (byWorkspace !== 0) return byWorkspace;
          return String(a.reliabilityAnchorId).localeCompare(String(b.reliabilityAnchorId));
        }),
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
      }) => store.get(`${workspaceId}:${reliabilityAnchorId}`) ?? null,
      upsert: async () => ({}),
    },
  };
}

function toRow(anchor: ReturnType<typeof canonicalAnchor>) {
  return {
    workspaceId: anchor.workspaceId,
    reliabilityAnchorId: anchor.reliabilityAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformReliabilityType: anchor.platformReliabilityType,
    reliabilityState: anchor.reliabilityState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

describe('W5-N17-c notification platform delivery reliability restart recovery — unit', () => {
  it('ownership remains notification-delivery only', () => {
    expect(W5_N17_C_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('corrupt anchor fails honestly', () => {
    const bad = Object.freeze({
      ...canonicalAnchor('ws-1', 'reliability-1'),
      integrityMetadata: '{"workspaceId":"ws-1","reliabilityAnchorId":"wrong"}',
    });
    expect(() => prepareNotificationPlatformReliabilityAnchorsForRecovery([bad])).toThrow(
      NotificationPlatformReliabilityRestartRecoveryError,
    );
  });

  it('missing persisted state recovers empty without fabrication', async () => {
    const repository = new PrismaNotificationPlatformReliabilityAnchorRepository(
      createPrismaMock([]) as never,
    );
    const service = new NotificationPlatformReliabilityRestartRecoveryService(
      repository,
      new NotificationPlatformReliabilityRecoveryStore(),
    );
    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(0);
    expect(service.getRecoveredAnchor('ws-1', 'reliability-1')).toBeNull();
  });
});

describe('W5-N17-c notification platform delivery reliability restart recovery — integration', () => {
  it('recover persisted notification platform delivery reliability anchors after normal restart', async () => {
    const anchor = canonicalAnchor('ws-1', 'reliability-1');
    const repository = new PrismaNotificationPlatformReliabilityAnchorRepository(
      createPrismaMock([toRow(anchor)]) as never,
    );
    const recoveryStore = new NotificationPlatformReliabilityRecoveryStore();
    const service = new NotificationPlatformReliabilityRestartRecoveryService(
      repository,
      recoveryStore,
    );

    const diagnostics = await service.hydrate();
    expect(diagnostics.canonicalAnchorCount).toBe(1);
    expect(service.getRecoveredAnchor('ws-1', 'reliability-1')?.platformReliabilityType).toBe(
      'unified-platform-reliability',
    );
    expect(W5_N17_C_ARCHITECTURE_CLAIMS.normalProcessRestartRecovery).toBe(true);
    expect(
      W5_N17_C_ARCHITECTURE_CLAIMS.notificationPlatformReliabilityAnchorStateRestoredAfterRestart,
    ).toBe(true);
  });

  it('recovery idempotency: hydrate twice yields same diagnostics', async () => {
    const anchor = canonicalAnchor('ws-1', 'reliability-2');
    const service = new NotificationPlatformReliabilityRestartRecoveryService(
      new PrismaNotificationPlatformReliabilityAnchorRepository(
        createPrismaMock([toRow(anchor)]) as never,
      ),
      new NotificationPlatformReliabilityRecoveryStore(),
    );
    const first = await service.hydrate();
    const second = await service.hydrate();
    expect(first).toEqual(second);
  });

  it('architecture claims: no operational continuity or customer-visible feature', () => {
    expect(W5_N17_C_ARCHITECTURE_CLAIMS.operationalContinuity).toBe(false);
    expect(W5_N17_C_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N17_C_ARCHITECTURE_CLAIMS.recoveryCanFabricateMissingState).toBe(false);
    expect(W5_N17_C_ARCHITECTURE_CLAIMS.recoveryCanRecoverCorruptedState).toBe(false);
    expect(W5_N17_C_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N17_C_ARCHITECTURE_CLAIMS.deliveryExecutionImplemented).toBe(false);
    expect(W5_N17_C_ARCHITECTURE_CLAIMS.retryExecutionImplemented).toBe(false);
    expect(W5_N17_C_ARCHITECTURE_CLAIMS.restartRecoveryImplemented).toBe(true);
  });

  it('recovered artifact ids reference W5-N17-b persistence foundation', () => {
    expect(W5_N17_C_RECOVERED_ARTIFACT_IDS).toEqual([
      'persist-notification-platform-reliability-anchor',
    ]);
  });

  it('transition matrix: persistence + recovery; operational continuity still missing', () => {
    expect(W5_N17_C_TRANSITION_MATRIX.before).toContain('Durable persistence (W5-N17-b)');
    expect(W5_N17_C_TRANSITION_MATRIX.after).toContain('Restart recovery (W5-N17-c)');
    expect(
      W5_N17_C_TRANSITION_MATRIX.stillMissing.some((item) =>
        item.includes('Operational continuity'),
      ),
    ).toBe(true);
    expect(
      W5_N17_C_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
  });

  it('technical debt delta: restart recovery resolved; operational continuity deferred', () => {
    expect(W5_N17_C_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W5_N17_C_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N17_C_TECHNICAL_DEBT_DELTA.deferred).toEqual([
      'W5-N17-d operational continuity',
      'W5-N17-e Close',
    ]);
  });

  it('explicit OUT covers delivery runtime and operational continuity', () => {
    expect(W5_N17_C_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['delivery-reliability-runtime', 'operational-continuity']),
    );
    expect(W5_N17_C_EXPLICIT_OUT).not.toContain('w5-n17-d');
  });

  it('required reports and recovery files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n17-c-implementation-report.md',
      'w5-n17-c-architecture-review.md',
      'w5-n17-c-security-review.md',
      'w5-n17-c-product-review.md',
      'w5-n17-c-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-reliability-restart-recovery.service.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-reliability-restart-recovery.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-reliability-continuity-status.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-reliability-recovery-store.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N17-c', () => {
    expect(W5_N17_C_SLICE_ID).toBe('W5-N17-c');
  });
});
