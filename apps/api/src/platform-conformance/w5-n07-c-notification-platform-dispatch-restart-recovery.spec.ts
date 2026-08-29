import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildNotificationPlatformDispatchAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-dispatch-anchor';
import {
  prepareNotificationPlatformDispatchAnchorsForRecovery,
  NotificationPlatformDispatchRestartRecoveryError,
} from '../modules/notification-delivery/domain/notification-platform-dispatch-restart-recovery';
import { PrismaNotificationPlatformDispatchAnchorRepository } from '../modules/notification-delivery/persistence/prisma-notification-platform-dispatch-anchor.repository';
import { NotificationPlatformDispatchRecoveryStore } from '../modules/notification-delivery/notification-platform-dispatch-recovery-store';
import { NotificationPlatformDispatchRestartRecoveryService } from '../modules/notification-delivery/notification-platform-dispatch-restart-recovery.service';
import {
  W5_N07_C_ARCHITECTURE_CLAIMS,
  W5_N07_C_EXPLICIT_OUT,
  W5_N07_C_NOTIFICATION_OWNER,
  W5_N07_C_RECOVERED_ARTIFACT_IDS,
  W5_N07_C_SLICE_ID,
  W5_N07_C_TECHNICAL_DEBT_DELTA,
  W5_N07_C_TRANSITION_MATRIX,
} from './w5-n07-c-notification-platform-dispatch-restart-recovery';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-08-29T19:30:00.000Z';

function canonicalAnchor(workspaceId: string, dispatchAnchorId: string) {
  const outcome = buildNotificationPlatformDispatchAnchorState({
    workspaceId,
    dispatchAnchorId,
    platformDispatchType: 'unified-platform-dispatch',
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
    rows.map((row) => [`${row.workspaceId as string}:${row.dispatchAnchorId as string}`, row]),
  );
  return {
    workspaceNotificationPlatformDispatchAnchor: {
      findMany: async () =>
        [...store.values()].sort((a, b) => {
          const byWorkspace = String(a.workspaceId).localeCompare(String(b.workspaceId));
          if (byWorkspace !== 0) return byWorkspace;
          return String(a.dispatchAnchorId).localeCompare(String(b.dispatchAnchorId));
        }),
      findUnique: async ({
        where: {
          workspaceId_dispatchAnchorId: { workspaceId, dispatchAnchorId },
        },
      }: {
        where: {
          workspaceId_dispatchAnchorId: {
            workspaceId: string;
            dispatchAnchorId: string;
          };
        };
      }) => store.get(`${workspaceId}:${dispatchAnchorId}`) ?? null,
      upsert: async () => ({}),
    },
  };
}

function toRow(anchor: ReturnType<typeof canonicalAnchor>) {
  return {
    workspaceId: anchor.workspaceId,
    dispatchAnchorId: anchor.dispatchAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformDispatchType: anchor.platformDispatchType,
    dispatchState: anchor.dispatchState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

describe('W5-N07-c notification platform dispatch restart recovery — unit', () => {
  it('ownership remains notification-delivery only', () => {
    expect(W5_N07_C_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('corrupt anchor fails honestly', () => {
    const bad = Object.freeze({
      ...canonicalAnchor('ws-1', 'disp-1'),
      integrityMetadata: '{"workspaceId":"ws-1","dispatchAnchorId":"wrong"}',
    });
    expect(() => prepareNotificationPlatformDispatchAnchorsForRecovery([bad])).toThrow(
      NotificationPlatformDispatchRestartRecoveryError,
    );
  });

  it('missing persisted state recovers empty without fabrication', async () => {
    const repository = new PrismaNotificationPlatformDispatchAnchorRepository(
      createPrismaMock([]) as never,
    );
    const service = new NotificationPlatformDispatchRestartRecoveryService(
      repository,
      new NotificationPlatformDispatchRecoveryStore(),
    );
    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(0);
    expect(service.getRecoveredAnchor('ws-1', 'disp-1')).toBeNull();
  });
});

describe('W5-N07-c notification platform dispatch restart recovery — integration', () => {
  it('recover persisted notification platform dispatch anchors after normal restart', async () => {
    const anchor = canonicalAnchor('ws-1', 'disp-1');
    const repository = new PrismaNotificationPlatformDispatchAnchorRepository(
      createPrismaMock([toRow(anchor)]) as never,
    );
    const recoveryStore = new NotificationPlatformDispatchRecoveryStore();
    const service = new NotificationPlatformDispatchRestartRecoveryService(
      repository,
      recoveryStore,
    );

    const diagnostics = await service.hydrate();
    expect(diagnostics.canonicalAnchorCount).toBe(1);
    expect(service.getRecoveredAnchor('ws-1', 'disp-1')?.platformDispatchType).toBe(
      'unified-platform-dispatch',
    );
    expect(W5_N07_C_ARCHITECTURE_CLAIMS.normalProcessRestartRecovery).toBe(true);
    expect(
      W5_N07_C_ARCHITECTURE_CLAIMS.notificationPlatformDispatchAnchorStateRestoredAfterRestart,
    ).toBe(true);
  });

  it('recovery idempotency: hydrate twice yields same diagnostics', async () => {
    const anchor = canonicalAnchor('ws-1', 'disp-2');
    const service = new NotificationPlatformDispatchRestartRecoveryService(
      new PrismaNotificationPlatformDispatchAnchorRepository(
        createPrismaMock([toRow(anchor)]) as never,
      ),
      new NotificationPlatformDispatchRecoveryStore(),
    );
    const first = await service.hydrate();
    const second = await service.hydrate();
    expect(first).toEqual(second);
  });

  it('architecture claims: no operational continuity or customer-visible feature', () => {
    expect(W5_N07_C_ARCHITECTURE_CLAIMS.operationalContinuity).toBe(false);
    expect(W5_N07_C_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N07_C_ARCHITECTURE_CLAIMS.recoveryCanFabricateMissingState).toBe(false);
    expect(W5_N07_C_ARCHITECTURE_CLAIMS.recoveryCanRecoverCorruptedState).toBe(false);
    expect(W5_N07_C_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N07_C_ARCHITECTURE_CLAIMS.dispatcherImplemented).toBe(false);
    expect(W5_N07_C_ARCHITECTURE_CLAIMS.schedulerImplemented).toBe(false);
    expect(W5_N07_C_ARCHITECTURE_CLAIMS.retryOrchestrationImplemented).toBe(false);
  });

  it('recovered artifact ids reference W5-N07-b persistence foundation', () => {
    expect(W5_N07_C_RECOVERED_ARTIFACT_IDS).toEqual([
      'persist-notification-platform-dispatch-anchor',
    ]);
  });

  it('transition matrix: persistence + recovery; operational continuity still missing', () => {
    expect(W5_N07_C_TRANSITION_MATRIX.before).toContain('Durable persistence (W5-N07-b)');
    expect(W5_N07_C_TRANSITION_MATRIX.after).toContain('Restart recovery (W5-N07-c)');
    expect(
      W5_N07_C_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Operational')),
    ).toBe(true);
  });

  it('technical debt delta: restart recovery resolved; continuity deferred', () => {
    expect(W5_N07_C_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W5_N07_C_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(
      W5_N07_C_TECHNICAL_DEBT_DELTA.deferred.some((item) =>
        item.toLowerCase().includes('continuity'),
      ),
    ).toBe(true);
  });

  it('explicit OUT covers operational continuity and W5-N07-d', () => {
    expect(W5_N07_C_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['operational-continuity', 'w5-n07-d']),
    );
  });

  it('required reports and recovery files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n07-c-implementation-report.md',
      'w5-n07-c-architecture-review.md',
      'w5-n07-c-security-review.md',
      'w5-n07-c-product-review.md',
      'w5-n07-c-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/notification-platform-dispatch-restart-recovery.service.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-dispatch-restart-recovery.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-dispatch-continuity-status.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/notification-platform-dispatch-recovery-store.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N07-c', () => {
    expect(W5_N07_C_SLICE_ID).toBe('W5-N07-c');
  });
});
