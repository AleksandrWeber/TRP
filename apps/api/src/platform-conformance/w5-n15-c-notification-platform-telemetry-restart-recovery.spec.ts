import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildNotificationPlatformTelemetryAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-telemetry-anchor';
import {
  prepareNotificationPlatformTelemetryAnchorsForRecovery,
  NotificationPlatformTelemetryRestartRecoveryError,
} from '../modules/notification-delivery/domain/notification-platform-telemetry-restart-recovery';
import { NotificationPlatformTelemetryRestartRecoveryService } from '../modules/notification-delivery/domain/notification-platform-telemetry-restart-recovery.service';
import { NotificationPlatformTelemetryRecoveryStore } from '../modules/notification-delivery/domain/notification-platform-telemetry-recovery-store';
import { PrismaNotificationPlatformTelemetryAnchorRepository } from '../modules/notification-delivery/persistence/prisma-notification-platform-telemetry-anchor.repository';
import {
  W5_N15_C_ARCHITECTURE_CLAIMS,
  W5_N15_C_EXPLICIT_OUT,
  W5_N15_C_NOTIFICATION_OWNER,
  W5_N15_C_RECOVERED_ARTIFACT_IDS,
  W5_N15_C_SLICE_ID,
  W5_N15_C_TECHNICAL_DEBT_DELTA,
  W5_N15_C_TRANSITION_MATRIX,
} from './w5-n15-c-notification-platform-telemetry-restart-recovery';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-09-02T17:00:00.000Z';

function canonicalAnchor(workspaceId: string, telemetryAnchorId: string) {
  const outcome = buildNotificationPlatformTelemetryAnchorState({
    workspaceId,
    telemetryAnchorId,
    platformTelemetryType: 'unified-platform-telemetry',
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
    rows.map((row) => [`${row.workspaceId as string}:${row.telemetryAnchorId as string}`, row]),
  );
  return {
    workspaceNotificationPlatformTelemetryAnchor: {
      findMany: async () =>
        [...store.values()].sort((a, b) => {
          const byWorkspace = String(a.workspaceId).localeCompare(String(b.workspaceId));
          if (byWorkspace !== 0) return byWorkspace;
          return String(a.telemetryAnchorId).localeCompare(String(b.telemetryAnchorId));
        }),
      findUnique: async ({
        where: {
          workspaceId_telemetryAnchorId: { workspaceId, telemetryAnchorId },
        },
      }: {
        where: {
          workspaceId_telemetryAnchorId: {
            workspaceId: string;
            telemetryAnchorId: string;
          };
        };
      }) => store.get(`${workspaceId}:${telemetryAnchorId}`) ?? null,
      upsert: async () => ({}),
    },
  };
}

function toRow(anchor: ReturnType<typeof canonicalAnchor>) {
  return {
    workspaceId: anchor.workspaceId,
    telemetryAnchorId: anchor.telemetryAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformTelemetryType: anchor.platformTelemetryType,
    telemetryState: anchor.telemetryState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

describe('W5-N15-c notification platform telemetry restart recovery — unit', () => {
  it('ownership remains notification-delivery only', () => {
    expect(W5_N15_C_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('corrupt anchor fails honestly', () => {
    const bad = Object.freeze({
      ...canonicalAnchor('ws-1', 'telemetry-1'),
      integrityMetadata: '{"workspaceId":"ws-1","telemetryAnchorId":"wrong"}',
    });
    expect(() => prepareNotificationPlatformTelemetryAnchorsForRecovery([bad])).toThrow(
      NotificationPlatformTelemetryRestartRecoveryError,
    );
  });

  it('missing persisted state recovers empty without fabrication', async () => {
    const repository = new PrismaNotificationPlatformTelemetryAnchorRepository(
      createPrismaMock([]) as never,
    );
    const service = new NotificationPlatformTelemetryRestartRecoveryService(
      repository,
      new NotificationPlatformTelemetryRecoveryStore(),
    );
    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(0);
    expect(service.getRecoveredAnchor('ws-1', 'telemetry-1')).toBeNull();
  });
});

describe('W5-N15-c notification platform telemetry restart recovery — integration', () => {
  it('recover persisted notification platform telemetry anchors after normal restart', async () => {
    const anchor = canonicalAnchor('ws-1', 'telemetry-1');
    const repository = new PrismaNotificationPlatformTelemetryAnchorRepository(
      createPrismaMock([toRow(anchor)]) as never,
    );
    const recoveryStore = new NotificationPlatformTelemetryRecoveryStore();
    const service = new NotificationPlatformTelemetryRestartRecoveryService(
      repository,
      recoveryStore,
    );

    const diagnostics = await service.hydrate();
    expect(diagnostics.canonicalAnchorCount).toBe(1);
    expect(service.getRecoveredAnchor('ws-1', 'telemetry-1')?.platformTelemetryType).toBe(
      'unified-platform-telemetry',
    );
    expect(W5_N15_C_ARCHITECTURE_CLAIMS.normalProcessRestartRecovery).toBe(true);
    expect(
      W5_N15_C_ARCHITECTURE_CLAIMS.notificationPlatformTelemetryAnchorStateRestoredAfterRestart,
    ).toBe(true);
  });

  it('recovery idempotency: hydrate twice yields same diagnostics', async () => {
    const anchor = canonicalAnchor('ws-1', 'telemetry-2');
    const service = new NotificationPlatformTelemetryRestartRecoveryService(
      new PrismaNotificationPlatformTelemetryAnchorRepository(
        createPrismaMock([toRow(anchor)]) as never,
      ),
      new NotificationPlatformTelemetryRecoveryStore(),
    );
    const first = await service.hydrate();
    const second = await service.hydrate();
    expect(first).toEqual(second);
  });

  it('architecture claims: no operational continuity or customer-visible feature', () => {
    expect(W5_N15_C_ARCHITECTURE_CLAIMS.operationalContinuity).toBe(false);
    expect(W5_N15_C_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N15_C_ARCHITECTURE_CLAIMS.recoveryCanFabricateMissingState).toBe(false);
    expect(W5_N15_C_ARCHITECTURE_CLAIMS.recoveryCanRecoverCorruptedState).toBe(false);
    expect(W5_N15_C_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N15_C_ARCHITECTURE_CLAIMS.metricsCollectionImplemented).toBe(false);
    expect(W5_N15_C_ARCHITECTURE_CLAIMS.exportersImplemented).toBe(false);
    expect(W5_N15_C_ARCHITECTURE_CLAIMS.dashboardsImplemented).toBe(false);
    expect(W5_N15_C_ARCHITECTURE_CLAIMS.runtimeAggregationImplemented).toBe(false);
  });

  it('recovered artifact ids reference W5-N15-b persistence foundation', () => {
    expect(W5_N15_C_RECOVERED_ARTIFACT_IDS).toEqual([
      'persist-notification-platform-telemetry-anchor',
    ]);
  });

  it('transition matrix: persistence + recovery; package close still missing', () => {
    expect(W5_N15_C_TRANSITION_MATRIX.before).toContain('Durable persistence (W5-N15-b)');
    expect(W5_N15_C_TRANSITION_MATRIX.after).toContain('Restart recovery (W5-N15-c)');
    expect(
      W5_N15_C_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
  });

  it('technical debt delta: restart recovery resolved; operational continuity deferred', () => {
    expect(W5_N15_C_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W5_N15_C_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(
      W5_N15_C_TECHNICAL_DEBT_DELTA.deferred.some((item) =>
        item.toLowerCase().includes('operational continuity'),
      ),
    ).toBe(true);
  });

  it('explicit OUT covers telemetry runtime only (not operational continuity)', () => {
    expect(W5_N15_C_EXPLICIT_OUT).toEqual(expect.arrayContaining(['platform-telemetry-runtime']));
    expect(W5_N15_C_EXPLICIT_OUT).not.toContain('w5-n15-d');
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
          'apps/api/src/modules/notification-delivery/domain/notification-platform-telemetry-restart-recovery.service.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-telemetry-restart-recovery.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-telemetry-continuity-status.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-telemetry-recovery-store.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N15-c', () => {
    expect(W5_N15_C_SLICE_ID).toBe('W5-N15-c');
  });
});
