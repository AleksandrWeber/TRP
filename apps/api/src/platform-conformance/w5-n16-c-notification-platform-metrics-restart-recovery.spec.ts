import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildNotificationPlatformMetricsAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-metrics-anchor';
import {
  prepareNotificationPlatformMetricsAnchorsForRecovery,
  NotificationPlatformMetricsRestartRecoveryError,
} from '../modules/notification-delivery/domain/notification-platform-metrics-restart-recovery';
import { NotificationPlatformMetricsRestartRecoveryService } from '../modules/notification-delivery/domain/notification-platform-metrics-restart-recovery.service';
import { NotificationPlatformMetricsRecoveryStore } from '../modules/notification-delivery/domain/notification-platform-metrics-recovery-store';
import { PrismaNotificationPlatformMetricsAnchorRepository } from '../modules/notification-delivery/persistence/prisma-notification-platform-metrics-anchor.repository';
import {
  W5_N16_C_ARCHITECTURE_CLAIMS,
  W5_N16_C_EXPLICIT_OUT,
  W5_N16_C_NOTIFICATION_OWNER,
  W5_N16_C_RECOVERED_ARTIFACT_IDS,
  W5_N16_C_SLICE_ID,
  W5_N16_C_TECHNICAL_DEBT_DELTA,
  W5_N16_C_TRANSITION_MATRIX,
} from './w5-n16-c-notification-platform-metrics-restart-recovery';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-09-02T17:00:00.000Z';

function canonicalAnchor(workspaceId: string, metricsAnchorId: string) {
  const outcome = buildNotificationPlatformMetricsAnchorState({
    workspaceId,
    metricsAnchorId,
    platformMetricsType: 'unified-platform-metrics',
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
    rows.map((row) => [`${row.workspaceId as string}:${row.metricsAnchorId as string}`, row]),
  );
  return {
    workspaceNotificationPlatformMetricsAnchor: {
      findMany: async () =>
        [...store.values()].sort((a, b) => {
          const byWorkspace = String(a.workspaceId).localeCompare(String(b.workspaceId));
          if (byWorkspace !== 0) return byWorkspace;
          return String(a.metricsAnchorId).localeCompare(String(b.metricsAnchorId));
        }),
      findUnique: async ({
        where: {
          workspaceId_metricsAnchorId: { workspaceId, metricsAnchorId },
        },
      }: {
        where: {
          workspaceId_metricsAnchorId: {
            workspaceId: string;
            metricsAnchorId: string;
          };
        };
      }) => store.get(`${workspaceId}:${metricsAnchorId}`) ?? null,
      upsert: async () => ({}),
    },
  };
}

function toRow(anchor: ReturnType<typeof canonicalAnchor>) {
  return {
    workspaceId: anchor.workspaceId,
    metricsAnchorId: anchor.metricsAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformMetricsType: anchor.platformMetricsType,
    metricsState: anchor.metricsState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

describe('W5-N16-c notification platform metrics restart recovery — unit', () => {
  it('ownership remains notification-delivery only', () => {
    expect(W5_N16_C_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('corrupt anchor fails honestly', () => {
    const bad = Object.freeze({
      ...canonicalAnchor('ws-1', 'telemetry-1'),
      integrityMetadata: '{"workspaceId":"ws-1","metricsAnchorId":"wrong"}',
    });
    expect(() => prepareNotificationPlatformMetricsAnchorsForRecovery([bad])).toThrow(
      NotificationPlatformMetricsRestartRecoveryError,
    );
  });

  it('missing persisted state recovers empty without fabrication', async () => {
    const repository = new PrismaNotificationPlatformMetricsAnchorRepository(
      createPrismaMock([]) as never,
    );
    const service = new NotificationPlatformMetricsRestartRecoveryService(
      repository,
      new NotificationPlatformMetricsRecoveryStore(),
    );
    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(0);
    expect(service.getRecoveredAnchor('ws-1', 'telemetry-1')).toBeNull();
  });
});

describe('W5-N16-c notification platform metrics restart recovery — integration', () => {
  it('recover persisted notification platform metrics anchors after normal restart', async () => {
    const anchor = canonicalAnchor('ws-1', 'telemetry-1');
    const repository = new PrismaNotificationPlatformMetricsAnchorRepository(
      createPrismaMock([toRow(anchor)]) as never,
    );
    const recoveryStore = new NotificationPlatformMetricsRecoveryStore();
    const service = new NotificationPlatformMetricsRestartRecoveryService(
      repository,
      recoveryStore,
    );

    const diagnostics = await service.hydrate();
    expect(diagnostics.canonicalAnchorCount).toBe(1);
    expect(service.getRecoveredAnchor('ws-1', 'telemetry-1')?.platformMetricsType).toBe(
      'unified-platform-metrics',
    );
    expect(W5_N16_C_ARCHITECTURE_CLAIMS.normalProcessRestartRecovery).toBe(true);
    expect(
      W5_N16_C_ARCHITECTURE_CLAIMS.notificationPlatformMetricsAnchorStateRestoredAfterRestart,
    ).toBe(true);
  });

  it('recovery idempotency: hydrate twice yields same diagnostics', async () => {
    const anchor = canonicalAnchor('ws-1', 'telemetry-2');
    const service = new NotificationPlatformMetricsRestartRecoveryService(
      new PrismaNotificationPlatformMetricsAnchorRepository(
        createPrismaMock([toRow(anchor)]) as never,
      ),
      new NotificationPlatformMetricsRecoveryStore(),
    );
    const first = await service.hydrate();
    const second = await service.hydrate();
    expect(first).toEqual(second);
  });

  it('architecture claims: no operational continuity or customer-visible feature', () => {
    expect(W5_N16_C_ARCHITECTURE_CLAIMS.operationalContinuity).toBe(false);
    expect(W5_N16_C_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N16_C_ARCHITECTURE_CLAIMS.recoveryCanFabricateMissingState).toBe(false);
    expect(W5_N16_C_ARCHITECTURE_CLAIMS.recoveryCanRecoverCorruptedState).toBe(false);
    expect(W5_N16_C_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N16_C_ARCHITECTURE_CLAIMS.metricsCollectionImplemented).toBe(false);
    expect(W5_N16_C_ARCHITECTURE_CLAIMS.exportersImplemented).toBe(false);
    expect(W5_N16_C_ARCHITECTURE_CLAIMS.dashboardsImplemented).toBe(false);
    expect(W5_N16_C_ARCHITECTURE_CLAIMS.runtimeAggregationImplemented).toBe(false);
  });

  it('recovered artifact ids reference W5-N16-b persistence foundation', () => {
    expect(W5_N16_C_RECOVERED_ARTIFACT_IDS).toEqual([
      'persist-notification-platform-metrics-anchor',
    ]);
  });

  it('transition matrix: persistence + recovery; package close still missing', () => {
    expect(W5_N16_C_TRANSITION_MATRIX.before).toContain('Durable persistence (W5-N16-b)');
    expect(W5_N16_C_TRANSITION_MATRIX.after).toContain('Restart recovery (W5-N16-c)');
    expect(
      W5_N16_C_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
    expect(
      W5_N16_C_TRANSITION_MATRIX.stillMissing.some((item) =>
        item.includes('Operational Continuity'),
      ),
    ).toBe(false);
  });

  it('technical debt delta: restart recovery resolved; no operational continuity deferred from slice c', () => {
    expect(W5_N16_C_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W5_N16_C_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N16_C_TECHNICAL_DEBT_DELTA.deferred).toEqual([
      'W5-N16-d — Notification Platform Metrics Operational Continuity Foundation',
      'W5-N16-e — Package Close Evidence',
    ]);
  });

  it('explicit OUT covers metrics collection runtime only (not operational continuity)', () => {
    expect(W5_N16_C_EXPLICIT_OUT).toEqual(expect.arrayContaining(['platform-metrics-runtime']));
    expect(W5_N16_C_EXPLICIT_OUT).not.toContain('w5-n15-d');
  });

  it('required reports and recovery files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n15-c-implementation-report.md',
      'w5-n15-c-architecture-review.md',
      'w5-n15-c-security-review.md',
      'w5-n15-c-product-review.md',
      'w5-n15-c-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-metrics-restart-recovery.service.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-metrics-restart-recovery.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-metrics-continuity-status.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-metrics-recovery-store.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N16-c', () => {
    expect(W5_N16_C_SLICE_ID).toBe('W5-N16-c');
  });
});
