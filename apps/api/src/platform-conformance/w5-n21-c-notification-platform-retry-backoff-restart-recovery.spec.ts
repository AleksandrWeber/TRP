import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildNotificationPlatformRetryBackoffAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-retry-backoff-anchor';
import {
  prepareNotificationPlatformRetryBackoffAnchorsForRecovery,
  NotificationPlatformRetryBackoffRestartRecoveryError,
} from '../modules/notification-delivery/domain/notification-platform-retry-backoff-restart-recovery';
import { NotificationPlatformRetryBackoffRestartRecoveryService } from '../modules/notification-delivery/domain/notification-platform-retry-backoff-restart-recovery.service';
import { NotificationPlatformRetryBackoffRecoveryStore } from '../modules/notification-delivery/domain/notification-platform-retry-backoff-recovery-store';
import { PrismaNotificationPlatformRetryBackoffAnchorRepository } from '../modules/notification-delivery/persistence/prisma-notification-platform-retry-backoff-anchor.repository';
import {
  W5_N21_C_ARCHITECTURE_CLAIMS,
  W5_N21_C_EXPLICIT_OUT,
  W5_N21_C_NOTIFICATION_OWNER,
  W5_N21_C_RECOVERED_ARTIFACT_IDS,
  W5_N21_C_SLICE_ID,
  W5_N21_C_TECHNICAL_DEBT_DELTA,
  W5_N21_C_TRANSITION_MATRIX,
} from './w5-n21-c-notification-platform-retry-backoff-restart-recovery';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-09-12T21:30:00.000Z';

function canonicalAnchor(workspaceId: string, retryBackoffAnchorId: string) {
  const outcome = buildNotificationPlatformRetryBackoffAnchorState({
    workspaceId,
    retryBackoffAnchorId,
    platformRetryBackoffType: 'backoff-description-foundation',
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
    rows.map((row) => [`${row.workspaceId as string}:${row.retryBackoffAnchorId as string}`, row]),
  );
  return {
    workspaceNotificationPlatformRetryBackoffAnchor: {
      findMany: async () =>
        [...store.values()].sort((a, b) => {
          const byWorkspace = String(a.workspaceId).localeCompare(String(b.workspaceId));
          if (byWorkspace !== 0) return byWorkspace;
          return String(a.retryBackoffAnchorId).localeCompare(String(b.retryBackoffAnchorId));
        }),
      findUnique: async ({
        where: {
          workspaceId_retryBackoffAnchorId: { workspaceId, retryBackoffAnchorId },
        },
      }: {
        where: {
          workspaceId_retryBackoffAnchorId: {
            workspaceId: string;
            retryBackoffAnchorId: string;
          };
        };
      }) => store.get(`${workspaceId}:${retryBackoffAnchorId}`) ?? null,
      upsert: async () => ({}),
    },
  };
}

function toRow(anchor: ReturnType<typeof canonicalAnchor>) {
  return {
    workspaceId: anchor.workspaceId,
    retryBackoffAnchorId: anchor.retryBackoffAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformRetryBackoffType: anchor.platformRetryBackoffType,
    retryBackoffState: anchor.retryBackoffState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

describe('W5-N21-c notification platform retry backoff restart recovery — unit', () => {
  it('ownership remains notification-delivery only', () => {
    expect(W5_N21_C_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('corrupt anchor fails honestly', () => {
    const bad = Object.freeze({
      ...canonicalAnchor('ws-1', 'retry-backoff-1'),
      integrityMetadata: '{"workspaceId":"ws-1","retryBackoffAnchorId":"wrong"}',
    });
    expect(() => prepareNotificationPlatformRetryBackoffAnchorsForRecovery([bad])).toThrow(
      NotificationPlatformRetryBackoffRestartRecoveryError,
    );
  });

  it('missing persisted state recovers empty without fabrication', async () => {
    const repository = new PrismaNotificationPlatformRetryBackoffAnchorRepository(
      createPrismaMock([]) as never,
    );
    const service = new NotificationPlatformRetryBackoffRestartRecoveryService(
      repository,
      new NotificationPlatformRetryBackoffRecoveryStore(),
    );
    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(0);
    expect(service.getRecoveredAnchor('ws-1', 'retry-backoff-1')).toBeNull();
  });
});

describe('W5-N21-c notification platform retry backoff restart recovery — integration', () => {
  it('recover persisted notification platform retry backoff anchors after normal restart', async () => {
    const anchor = canonicalAnchor('ws-1', 'retry-backoff-1');
    const repository = new PrismaNotificationPlatformRetryBackoffAnchorRepository(
      createPrismaMock([toRow(anchor)]) as never,
    );
    const recoveryStore = new NotificationPlatformRetryBackoffRecoveryStore();
    const service = new NotificationPlatformRetryBackoffRestartRecoveryService(
      repository,
      recoveryStore,
    );

    const diagnostics = await service.hydrate();
    expect(diagnostics.canonicalAnchorCount).toBe(1);
    expect(service.getRecoveredAnchor('ws-1', 'retry-backoff-1')?.platformRetryBackoffType).toBe(
      'backoff-description-foundation',
    );
    expect(W5_N21_C_ARCHITECTURE_CLAIMS.normalProcessRestartRecovery).toBe(true);
    expect(
      W5_N21_C_ARCHITECTURE_CLAIMS.notificationPlatformRetryBackoffAnchorStateRestoredAfterRestart,
    ).toBe(true);
  });

  it('recovery idempotency: hydrate twice yields same diagnostics', async () => {
    const anchor = canonicalAnchor('ws-1', 'retry-backoff-2');
    const service = new NotificationPlatformRetryBackoffRestartRecoveryService(
      new PrismaNotificationPlatformRetryBackoffAnchorRepository(
        createPrismaMock([toRow(anchor)]) as never,
      ),
      new NotificationPlatformRetryBackoffRecoveryStore(),
    );
    const first = await service.hydrate();
    const second = await service.hydrate();
    expect(first).toEqual(second);
  });

  it('architecture claims: no operational continuity or customer-visible feature', () => {
    expect(W5_N21_C_ARCHITECTURE_CLAIMS.operationalContinuity).toBe(false);
    expect(W5_N21_C_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N21_C_ARCHITECTURE_CLAIMS.recoveryCanFabricateMissingState).toBe(false);
    expect(W5_N21_C_ARCHITECTURE_CLAIMS.recoveryCanRecoverCorruptedState).toBe(false);
    expect(W5_N21_C_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N21_C_ARCHITECTURE_CLAIMS.retryBackoffImplemented).toBe(false);
    expect(W5_N21_C_ARCHITECTURE_CLAIMS.restartRecoveryImplemented).toBe(true);
    expect(W5_N21_C_ARCHITECTURE_CLAIMS.backoffEngineIntroduced).toBe(false);
  });

  it('recovered artifact ids reference W5-N21-b persistence foundation', () => {
    expect(W5_N21_C_RECOVERED_ARTIFACT_IDS).toEqual([
      'persist-notification-platform-retry-backoff-anchor',
    ]);
  });

  it('transition matrix: persistence + recovery; operational continuity and package Close still missing', () => {
    expect(W5_N21_C_TRANSITION_MATRIX.before).toContain('Durable persistence (W5-N21-b)');
    expect(W5_N21_C_TRANSITION_MATRIX.after).toContain('Restart recovery (W5-N21-c)');
    expect(
      W5_N21_C_TRANSITION_MATRIX.stillMissing.some((item) =>
        item.includes('Operational continuity'),
      ),
    ).toBe(true);
    expect(
      W5_N21_C_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
  });

  it('technical debt delta: restart recovery resolved; d–e deferred; nothing introduced', () => {
    expect(W5_N21_C_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Retry Backoff Restart Recovery Foundation',
    );
    expect(W5_N21_C_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N21_C_TECHNICAL_DEBT_DELTA.deferred).toEqual([
      'W5-N21-d — Operational Continuity Foundation',
      'W5-N21-e — Package Validation, Operational Verification & Close Evidence',
    ]);
  });

  it('explicit OUT covers backoff-calculation and operational continuity', () => {
    expect(W5_N21_C_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['backoff-calculation', 'operational-continuity']),
    );
    expect(W5_N21_C_EXPLICIT_OUT).not.toContain('w5-n21-d');
  });

  it('required reports and recovery files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n21-c-implementation-report.md',
      'w5-n21-c-architecture-review.md',
      'w5-n21-c-security-review.md',
      'w5-n21-c-product-review.md',
      'w5-n21-c-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-backoff-restart-recovery.service.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-backoff-restart-recovery.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-backoff-continuity-status.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-backoff-recovery-store.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N21-c', () => {
    expect(W5_N21_C_SLICE_ID).toBe('W5-N21-c');
  });
});
