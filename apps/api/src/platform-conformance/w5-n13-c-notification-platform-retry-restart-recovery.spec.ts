import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildNotificationPlatformRetryAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-retry-anchor';
import {
  prepareNotificationPlatformRetryAnchorsForRecovery,
  NotificationPlatformRetryRestartRecoveryError,
} from '../modules/notification-delivery/domain/notification-platform-retry-restart-recovery';
import { NotificationPlatformRetryRestartRecoveryService } from '../modules/notification-delivery/domain/notification-platform-retry-restart-recovery.service';
import { NotificationPlatformRetryRecoveryStore } from '../modules/notification-delivery/domain/notification-platform-retry-recovery-store';
import { PrismaNotificationPlatformRetryAnchorRepository } from '../modules/notification-delivery/persistence/prisma-notification-platform-retry-anchor.repository';
import {
  W5_N13_C_ARCHITECTURE_CLAIMS,
  W5_N13_C_EXPLICIT_OUT,
  W5_N13_C_NOTIFICATION_OWNER,
  W5_N13_C_RECOVERED_ARTIFACT_IDS,
  W5_N13_C_SLICE_ID,
  W5_N13_C_TECHNICAL_DEBT_DELTA,
  W5_N13_C_TRANSITION_MATRIX,
} from './w5-n13-c-notification-platform-retry-restart-recovery';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-09-02T16:00:00.000Z';

function canonicalAnchor(workspaceId: string, retryAnchorId: string) {
  const outcome = buildNotificationPlatformRetryAnchorState({
    workspaceId,
    retryAnchorId,
    platformRetryType: 'unified-platform-retry',
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
    rows.map((row) => [`${row.workspaceId as string}:${row.retryAnchorId as string}`, row]),
  );
  return {
    workspaceNotificationPlatformRetryAnchor: {
      findMany: async () =>
        [...store.values()].sort((a, b) => {
          const byWorkspace = String(a.workspaceId).localeCompare(String(b.workspaceId));
          if (byWorkspace !== 0) return byWorkspace;
          return String(a.retryAnchorId).localeCompare(String(b.retryAnchorId));
        }),
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
      }) => store.get(`${workspaceId}:${retryAnchorId}`) ?? null,
      upsert: async () => ({}),
    },
  };
}

function toRow(anchor: ReturnType<typeof canonicalAnchor>) {
  return {
    workspaceId: anchor.workspaceId,
    retryAnchorId: anchor.retryAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformRetryType: anchor.platformRetryType,
    retryState: anchor.retryState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

describe('W5-N13-c notification platform retry restart recovery — unit', () => {
  it('ownership remains notification-delivery only', () => {
    expect(W5_N13_C_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('corrupt anchor fails honestly', () => {
    const bad = Object.freeze({
      ...canonicalAnchor('ws-1', 'retry-1'),
      integrityMetadata: '{"workspaceId":"ws-1","retryAnchorId":"wrong"}',
    });
    expect(() => prepareNotificationPlatformRetryAnchorsForRecovery([bad])).toThrow(
      NotificationPlatformRetryRestartRecoveryError,
    );
  });

  it('missing persisted state recovers empty without fabrication', async () => {
    const repository = new PrismaNotificationPlatformRetryAnchorRepository(
      createPrismaMock([]) as never,
    );
    const service = new NotificationPlatformRetryRestartRecoveryService(
      repository,
      new NotificationPlatformRetryRecoveryStore(),
    );
    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(0);
    expect(service.getRecoveredAnchor('ws-1', 'retry-1')).toBeNull();
  });
});

describe('W5-N13-c notification platform retry restart recovery — integration', () => {
  it('recover persisted notification platform retry anchors after normal restart', async () => {
    const anchor = canonicalAnchor('ws-1', 'retry-1');
    const repository = new PrismaNotificationPlatformRetryAnchorRepository(
      createPrismaMock([toRow(anchor)]) as never,
    );
    const recoveryStore = new NotificationPlatformRetryRecoveryStore();
    const service = new NotificationPlatformRetryRestartRecoveryService(repository, recoveryStore);

    const diagnostics = await service.hydrate();
    expect(diagnostics.canonicalAnchorCount).toBe(1);
    expect(service.getRecoveredAnchor('ws-1', 'retry-1')?.platformRetryType).toBe(
      'unified-platform-retry',
    );
    expect(W5_N13_C_ARCHITECTURE_CLAIMS.normalProcessRestartRecovery).toBe(true);
    expect(
      W5_N13_C_ARCHITECTURE_CLAIMS.notificationPlatformRetryAnchorStateRestoredAfterRestart,
    ).toBe(true);
  });

  it('recovery idempotency: hydrate twice yields same diagnostics', async () => {
    const anchor = canonicalAnchor('ws-1', 'retry-2');
    const service = new NotificationPlatformRetryRestartRecoveryService(
      new PrismaNotificationPlatformRetryAnchorRepository(
        createPrismaMock([toRow(anchor)]) as never,
      ),
      new NotificationPlatformRetryRecoveryStore(),
    );
    const first = await service.hydrate();
    const second = await service.hydrate();
    expect(first).toEqual(second);
  });

  it('architecture claims: no operational continuity or customer-visible feature', () => {
    expect(W5_N13_C_ARCHITECTURE_CLAIMS.operationalContinuity).toBe(false);
    expect(W5_N13_C_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N13_C_ARCHITECTURE_CLAIMS.recoveryCanFabricateMissingState).toBe(false);
    expect(W5_N13_C_ARCHITECTURE_CLAIMS.recoveryCanRecoverCorruptedState).toBe(false);
    expect(W5_N13_C_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N13_C_ARCHITECTURE_CLAIMS.retryRuntimeImplemented).toBe(false);
    expect(W5_N13_C_ARCHITECTURE_CLAIMS.retryExecutionImplemented).toBe(false);
    expect(W5_N13_C_ARCHITECTURE_CLAIMS.retrySchedulingImplemented).toBe(false);
    expect(W5_N13_C_ARCHITECTURE_CLAIMS.retryQueueProcessingImplemented).toBe(false);
    expect(W5_N13_C_ARCHITECTURE_CLAIMS.deadLetterProcessingImplemented).toBe(false);
  });

  it('recovered artifact ids reference W5-N13-b persistence foundation', () => {
    expect(W5_N13_C_RECOVERED_ARTIFACT_IDS).toEqual(['persist-notification-platform-retry-anchor']);
  });

  it('transition matrix: persistence + recovery; package close still missing', () => {
    expect(W5_N13_C_TRANSITION_MATRIX.before).toContain('Durable persistence (W5-N13-b)');
    expect(W5_N13_C_TRANSITION_MATRIX.after).toContain('Restart recovery (W5-N13-c)');
    expect(
      W5_N13_C_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
  });

  it('technical debt delta: restart recovery resolved; package close deferred', () => {
    expect(W5_N13_C_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W5_N13_C_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N13_C_TECHNICAL_DEBT_DELTA.deferred.some((item) => item.includes('W5-N13-e'))).toBe(
      true,
    );
  });

  it('explicit OUT covers retry runtime only (not operational continuity)', () => {
    expect(W5_N13_C_EXPLICIT_OUT).toEqual(expect.arrayContaining(['platform-retry-runtime']));
    expect(W5_N13_C_EXPLICIT_OUT).not.toContain('w5-n13-d');
  });

  it('required reports and recovery files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n13-c-implementation-report.md',
      'w5-n13-c-architecture-review.md',
      'w5-n13-c-security-review.md',
      'w5-n13-c-product-review.md',
      'w5-n13-c-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-restart-recovery.service.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-restart-recovery.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-continuity-status.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-recovery-store.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N13-c', () => {
    expect(W5_N13_C_SLICE_ID).toBe('W5-N13-c');
  });
});
