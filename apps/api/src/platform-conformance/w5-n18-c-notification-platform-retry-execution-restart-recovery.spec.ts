import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildNotificationPlatformRetryExecutionAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-retry-execution-anchor';
import {
  prepareNotificationPlatformRetryExecutionAnchorsForRecovery,
  NotificationPlatformRetryExecutionRestartRecoveryError,
} from '../modules/notification-delivery/domain/notification-platform-retry-execution-restart-recovery';
import { NotificationPlatformRetryExecutionRestartRecoveryService } from '../modules/notification-delivery/domain/notification-platform-retry-execution-restart-recovery.service';
import { NotificationPlatformRetryExecutionRecoveryStore } from '../modules/notification-delivery/domain/notification-platform-retry-execution-recovery-store';
import { PrismaNotificationPlatformRetryExecutionAnchorRepository } from '../modules/notification-delivery/persistence/prisma-notification-platform-retry-execution-anchor.repository';
import {
  W5_N18_C_ARCHITECTURE_CLAIMS,
  W5_N18_C_EXPLICIT_OUT,
  W5_N18_C_NOTIFICATION_OWNER,
  W5_N18_C_RECOVERED_ARTIFACT_IDS,
  W5_N18_C_SLICE_ID,
  W5_N18_C_TECHNICAL_DEBT_DELTA,
  W5_N18_C_TRANSITION_MATRIX,
} from './w5-n18-c-notification-platform-retry-execution-restart-recovery';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-09-10T19:00:00.000Z';

function canonicalAnchor(workspaceId: string, retryExecutionAnchorId: string) {
  const outcome = buildNotificationPlatformRetryExecutionAnchorState({
    workspaceId,
    retryExecutionAnchorId,
    platformRetryExecutionType: 'unified-platform-retry-execution',
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
    rows.map((row) => [
      `${row.workspaceId as string}:${row.retryExecutionAnchorId as string}`,
      row,
    ]),
  );
  return {
    workspaceNotificationPlatformRetryExecutionAnchor: {
      findMany: async () =>
        [...store.values()].sort((a, b) => {
          const byWorkspace = String(a.workspaceId).localeCompare(String(b.workspaceId));
          if (byWorkspace !== 0) return byWorkspace;
          return String(a.retryExecutionAnchorId).localeCompare(String(b.retryExecutionAnchorId));
        }),
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
      }) => store.get(`${workspaceId}:${retryExecutionAnchorId}`) ?? null,
      upsert: async () => ({}),
    },
  };
}

function toRow(anchor: ReturnType<typeof canonicalAnchor>) {
  return {
    workspaceId: anchor.workspaceId,
    retryExecutionAnchorId: anchor.retryExecutionAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformRetryExecutionType: anchor.platformRetryExecutionType,
    retryExecutionState: anchor.retryExecutionState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

describe('W5-N18-c notification platform retry execution restart recovery — unit', () => {
  it('ownership remains notification-delivery only', () => {
    expect(W5_N18_C_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('corrupt anchor fails honestly', () => {
    const bad = Object.freeze({
      ...canonicalAnchor('ws-1', 'retry-execution-1'),
      integrityMetadata: '{"workspaceId":"ws-1","retryExecutionAnchorId":"wrong"}',
    });
    expect(() => prepareNotificationPlatformRetryExecutionAnchorsForRecovery([bad])).toThrow(
      NotificationPlatformRetryExecutionRestartRecoveryError,
    );
  });

  it('missing persisted state recovers empty without fabrication', async () => {
    const repository = new PrismaNotificationPlatformRetryExecutionAnchorRepository(
      createPrismaMock([]) as never,
    );
    const service = new NotificationPlatformRetryExecutionRestartRecoveryService(
      repository,
      new NotificationPlatformRetryExecutionRecoveryStore(),
    );
    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(0);
    expect(service.getRecoveredAnchor('ws-1', 'retry-execution-1')).toBeNull();
  });
});

describe('W5-N18-c notification platform retry execution restart recovery — integration', () => {
  it('recover persisted notification platform retry execution anchors after normal restart', async () => {
    const anchor = canonicalAnchor('ws-1', 'retry-execution-1');
    const repository = new PrismaNotificationPlatformRetryExecutionAnchorRepository(
      createPrismaMock([toRow(anchor)]) as never,
    );
    const recoveryStore = new NotificationPlatformRetryExecutionRecoveryStore();
    const service = new NotificationPlatformRetryExecutionRestartRecoveryService(
      repository,
      recoveryStore,
    );

    const diagnostics = await service.hydrate();
    expect(diagnostics.canonicalAnchorCount).toBe(1);
    expect(
      service.getRecoveredAnchor('ws-1', 'retry-execution-1')?.platformRetryExecutionType,
    ).toBe('unified-platform-retry-execution');
    expect(W5_N18_C_ARCHITECTURE_CLAIMS.normalProcessRestartRecovery).toBe(true);
    expect(
      W5_N18_C_ARCHITECTURE_CLAIMS.notificationPlatformRetryExecutionAnchorStateRestoredAfterRestart,
    ).toBe(true);
  });

  it('recovery idempotency: hydrate twice yields same diagnostics', async () => {
    const anchor = canonicalAnchor('ws-1', 'retry-execution-2');
    const service = new NotificationPlatformRetryExecutionRestartRecoveryService(
      new PrismaNotificationPlatformRetryExecutionAnchorRepository(
        createPrismaMock([toRow(anchor)]) as never,
      ),
      new NotificationPlatformRetryExecutionRecoveryStore(),
    );
    const first = await service.hydrate();
    const second = await service.hydrate();
    expect(first).toEqual(second);
  });

  it('architecture claims: no operational continuity or customer-visible feature', () => {
    expect(W5_N18_C_ARCHITECTURE_CLAIMS.operationalContinuity).toBe(false);
    expect(W5_N18_C_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N18_C_ARCHITECTURE_CLAIMS.recoveryCanFabricateMissingState).toBe(false);
    expect(W5_N18_C_ARCHITECTURE_CLAIMS.recoveryCanRecoverCorruptedState).toBe(false);
    expect(W5_N18_C_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N18_C_ARCHITECTURE_CLAIMS.retryExecutionImplemented).toBe(false);
    expect(W5_N18_C_ARCHITECTURE_CLAIMS.restartRecoveryImplemented).toBe(true);
  });

  it('recovered artifact ids reference W5-N18-b persistence foundation', () => {
    expect(W5_N18_C_RECOVERED_ARTIFACT_IDS).toEqual([
      'persist-notification-platform-retry-execution-anchor',
    ]);
  });

  it('transition matrix: persistence + recovery; operational continuity and package Close still missing', () => {
    expect(W5_N18_C_TRANSITION_MATRIX.before).toContain('Durable persistence (W5-N18-b)');
    expect(W5_N18_C_TRANSITION_MATRIX.after).toContain('Restart recovery (W5-N18-c)');
    expect(
      W5_N18_C_TRANSITION_MATRIX.stillMissing.some((item) =>
        item.includes('Operational continuity'),
      ),
    ).toBe(true);
    expect(
      W5_N18_C_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
  });

  it('technical debt delta: restart recovery resolved; nothing introduced or deferred on this slice', () => {
    expect(W5_N18_C_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W5_N18_C_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N18_C_TECHNICAL_DEBT_DELTA.deferred).toEqual([]);
  });

  it('explicit OUT covers retry-execution-runtime and operational continuity', () => {
    expect(W5_N18_C_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['retry-execution-runtime', 'operational-continuity']),
    );
    expect(W5_N18_C_EXPLICIT_OUT).not.toContain('w5-n18-d');
  });

  it('required reports and recovery files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n18-c-implementation-report.md',
      'w5-n18-c-architecture-review.md',
      'w5-n18-c-security-review.md',
      'w5-n18-c-product-review.md',
      'w5-n18-c-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-execution-restart-recovery.service.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-execution-restart-recovery.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-execution-continuity-status.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-execution-recovery-store.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N18-c', () => {
    expect(W5_N18_C_SLICE_ID).toBe('W5-N18-c');
  });
});
