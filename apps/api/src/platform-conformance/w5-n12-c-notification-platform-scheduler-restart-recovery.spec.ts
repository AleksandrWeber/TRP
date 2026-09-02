import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildNotificationPlatformSchedulerAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-scheduler-anchor';
import {
  prepareNotificationPlatformSchedulerAnchorsForRecovery,
  NotificationPlatformSchedulerRestartRecoveryError,
} from '../modules/notification-delivery/domain/notification-platform-scheduler-restart-recovery';
import { NotificationPlatformSchedulerRestartRecoveryService } from '../modules/notification-delivery/domain/notification-platform-scheduler-restart-recovery.service';
import { NotificationPlatformSchedulerRecoveryStore } from '../modules/notification-delivery/domain/notification-platform-scheduler-recovery-store';
import { PrismaNotificationPlatformSchedulerAnchorRepository } from '../modules/notification-delivery/persistence/prisma-notification-platform-scheduler-anchor.repository';
import {
  W5_N12_C_ARCHITECTURE_CLAIMS,
  W5_N12_C_EXPLICIT_OUT,
  W5_N12_C_NOTIFICATION_OWNER,
  W5_N12_C_RECOVERED_ARTIFACT_IDS,
  W5_N12_C_SLICE_ID,
  W5_N12_C_TECHNICAL_DEBT_DELTA,
  W5_N12_C_TRANSITION_MATRIX,
} from './w5-n12-c-notification-platform-scheduler-restart-recovery';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-09-02T14:00:00.000Z';

function canonicalAnchor(workspaceId: string, schedulerAnchorId: string) {
  const outcome = buildNotificationPlatformSchedulerAnchorState({
    workspaceId,
    schedulerAnchorId,
    platformSchedulerType: 'unified-platform-scheduler',
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
    rows.map((row) => [`${row.workspaceId as string}:${row.schedulerAnchorId as string}`, row]),
  );
  return {
    workspaceNotificationPlatformSchedulerAnchor: {
      findMany: async () =>
        [...store.values()].sort((a, b) => {
          const byWorkspace = String(a.workspaceId).localeCompare(String(b.workspaceId));
          if (byWorkspace !== 0) return byWorkspace;
          return String(a.schedulerAnchorId).localeCompare(String(b.schedulerAnchorId));
        }),
      findUnique: async ({
        where: {
          workspaceId_schedulerAnchorId: { workspaceId, schedulerAnchorId },
        },
      }: {
        where: {
          workspaceId_schedulerAnchorId: {
            workspaceId: string;
            schedulerAnchorId: string;
          };
        };
      }) => store.get(`${workspaceId}:${schedulerAnchorId}`) ?? null,
      upsert: async () => ({}),
    },
  };
}

function toRow(anchor: ReturnType<typeof canonicalAnchor>) {
  return {
    workspaceId: anchor.workspaceId,
    schedulerAnchorId: anchor.schedulerAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformSchedulerType: anchor.platformSchedulerType,
    schedulerState: anchor.schedulerState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

describe('W5-N12-c notification platform scheduler restart recovery — unit', () => {
  it('ownership remains notification-delivery only', () => {
    expect(W5_N12_C_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('corrupt anchor fails honestly', () => {
    const bad = Object.freeze({
      ...canonicalAnchor('ws-1', 'scheduler-1'),
      integrityMetadata: '{"workspaceId":"ws-1","schedulerAnchorId":"wrong"}',
    });
    expect(() => prepareNotificationPlatformSchedulerAnchorsForRecovery([bad])).toThrow(
      NotificationPlatformSchedulerRestartRecoveryError,
    );
  });

  it('missing persisted state recovers empty without fabrication', async () => {
    const repository = new PrismaNotificationPlatformSchedulerAnchorRepository(
      createPrismaMock([]) as never,
    );
    const service = new NotificationPlatformSchedulerRestartRecoveryService(
      repository,
      new NotificationPlatformSchedulerRecoveryStore(),
    );
    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(0);
    expect(service.getRecoveredAnchor('ws-1', 'scheduler-1')).toBeNull();
  });
});

describe('W5-N12-c notification platform scheduler restart recovery — integration', () => {
  it('recover persisted notification platform scheduler anchors after normal restart', async () => {
    const anchor = canonicalAnchor('ws-1', 'scheduler-1');
    const repository = new PrismaNotificationPlatformSchedulerAnchorRepository(
      createPrismaMock([toRow(anchor)]) as never,
    );
    const recoveryStore = new NotificationPlatformSchedulerRecoveryStore();
    const service = new NotificationPlatformSchedulerRestartRecoveryService(
      repository,
      recoveryStore,
    );

    const diagnostics = await service.hydrate();
    expect(diagnostics.canonicalAnchorCount).toBe(1);
    expect(service.getRecoveredAnchor('ws-1', 'scheduler-1')?.platformSchedulerType).toBe(
      'unified-platform-scheduler',
    );
    expect(W5_N12_C_ARCHITECTURE_CLAIMS.normalProcessRestartRecovery).toBe(true);
    expect(
      W5_N12_C_ARCHITECTURE_CLAIMS.notificationPlatformSchedulerAnchorStateRestoredAfterRestart,
    ).toBe(true);
  });

  it('recovery idempotency: hydrate twice yields same diagnostics', async () => {
    const anchor = canonicalAnchor('ws-1', 'scheduler-2');
    const service = new NotificationPlatformSchedulerRestartRecoveryService(
      new PrismaNotificationPlatformSchedulerAnchorRepository(
        createPrismaMock([toRow(anchor)]) as never,
      ),
      new NotificationPlatformSchedulerRecoveryStore(),
    );
    const first = await service.hydrate();
    const second = await service.hydrate();
    expect(first).toEqual(second);
  });

  it('architecture claims: no operational continuity or customer-visible feature', () => {
    expect(W5_N12_C_ARCHITECTURE_CLAIMS.operationalContinuity).toBe(false);
    expect(W5_N12_C_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N12_C_ARCHITECTURE_CLAIMS.recoveryCanFabricateMissingState).toBe(false);
    expect(W5_N12_C_ARCHITECTURE_CLAIMS.recoveryCanRecoverCorruptedState).toBe(false);
    expect(W5_N12_C_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N12_C_ARCHITECTURE_CLAIMS.schedulerRuntimeImplemented).toBe(false);
    expect(W5_N12_C_ARCHITECTURE_CLAIMS.schedulingEngineImplemented).toBe(false);
    expect(W5_N12_C_ARCHITECTURE_CLAIMS.schedulerExecutionImplemented).toBe(false);
    expect(W5_N12_C_ARCHITECTURE_CLAIMS.retryOrchestrationImplemented).toBe(false);
    expect(W5_N12_C_ARCHITECTURE_CLAIMS.deadLetterProcessingImplemented).toBe(false);
  });

  it('recovered artifact ids reference W5-N12-b persistence foundation', () => {
    expect(W5_N12_C_RECOVERED_ARTIFACT_IDS).toEqual([
      'persist-notification-platform-scheduler-anchor',
    ]);
  });

  it('transition matrix: persistence + recovery; package close still missing', () => {
    expect(W5_N12_C_TRANSITION_MATRIX.before).toContain('Durable persistence (W5-N12-b)');
    expect(W5_N12_C_TRANSITION_MATRIX.after).toContain('Restart recovery (W5-N12-c)');
    expect(
      W5_N12_C_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
  });

  it('technical debt delta: restart recovery resolved; package close deferred', () => {
    expect(W5_N12_C_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W5_N12_C_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(
      W5_N12_C_TECHNICAL_DEBT_DELTA.deferred.some((item) => item.toLowerCase().includes('close')),
    ).toBe(true);
  });

  it('explicit OUT covers scheduler runtime only (not operational continuity)', () => {
    expect(W5_N12_C_EXPLICIT_OUT).toEqual(expect.arrayContaining(['platform-scheduler-runtime']));
    expect(W5_N12_C_EXPLICIT_OUT).not.toContain('w5-n12-d');
  });

  it('required reports and recovery files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n12-c-implementation-report.md',
      'w5-n12-c-architecture-review.md',
      'w5-n12-c-security-review.md',
      'w5-n12-c-product-review.md',
      'w5-n12-c-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-scheduler-restart-recovery.service.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-scheduler-restart-recovery.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-scheduler-continuity-status.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-scheduler-recovery-store.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N12-c', () => {
    expect(W5_N12_C_SLICE_ID).toBe('W5-N12-c');
  });
});
