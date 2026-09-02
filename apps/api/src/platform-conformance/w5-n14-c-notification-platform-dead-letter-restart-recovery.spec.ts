import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildNotificationPlatformDeadLetterAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-dead-letter-anchor';
import {
  prepareNotificationPlatformDeadLetterAnchorsForRecovery,
  NotificationPlatformDeadLetterRestartRecoveryError,
} from '../modules/notification-delivery/domain/notification-platform-dead-letter-restart-recovery';
import { NotificationPlatformDeadLetterRestartRecoveryService } from '../modules/notification-delivery/domain/notification-platform-dead-letter-restart-recovery.service';
import { NotificationPlatformDeadLetterRecoveryStore } from '../modules/notification-delivery/domain/notification-platform-dead-letter-recovery-store';
import { PrismaNotificationPlatformDeadLetterAnchorRepository } from '../modules/notification-delivery/persistence/prisma-notification-platform-dead-letter-anchor.repository';
import {
  W5_N14_C_ARCHITECTURE_CLAIMS,
  W5_N14_C_EXPLICIT_OUT,
  W5_N14_C_NOTIFICATION_OWNER,
  W5_N14_C_RECOVERED_ARTIFACT_IDS,
  W5_N14_C_SLICE_ID,
  W5_N14_C_TECHNICAL_DEBT_DELTA,
  W5_N14_C_TRANSITION_MATRIX,
} from './w5-n14-c-notification-platform-dead-letter-restart-recovery';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-09-02T17:00:00.000Z';

function canonicalAnchor(workspaceId: string, deadLetterAnchorId: string) {
  const outcome = buildNotificationPlatformDeadLetterAnchorState({
    workspaceId,
    deadLetterAnchorId,
    platformDeadLetterType: 'unified-platform-dead-letter',
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
    rows.map((row) => [`${row.workspaceId as string}:${row.deadLetterAnchorId as string}`, row]),
  );
  return {
    workspaceNotificationPlatformDeadLetterAnchor: {
      findMany: async () =>
        [...store.values()].sort((a, b) => {
          const byWorkspace = String(a.workspaceId).localeCompare(String(b.workspaceId));
          if (byWorkspace !== 0) return byWorkspace;
          return String(a.deadLetterAnchorId).localeCompare(String(b.deadLetterAnchorId));
        }),
      findUnique: async ({
        where: {
          workspaceId_deadLetterAnchorId: { workspaceId, deadLetterAnchorId },
        },
      }: {
        where: {
          workspaceId_deadLetterAnchorId: {
            workspaceId: string;
            deadLetterAnchorId: string;
          };
        };
      }) => store.get(`${workspaceId}:${deadLetterAnchorId}`) ?? null,
      upsert: async () => ({}),
    },
  };
}

function toRow(anchor: ReturnType<typeof canonicalAnchor>) {
  return {
    workspaceId: anchor.workspaceId,
    deadLetterAnchorId: anchor.deadLetterAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformDeadLetterType: anchor.platformDeadLetterType,
    deadLetterState: anchor.deadLetterState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

describe('W5-N14-c notification platform dead-letter restart recovery — unit', () => {
  it('ownership remains notification-delivery only', () => {
    expect(W5_N14_C_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('corrupt anchor fails honestly', () => {
    const bad = Object.freeze({
      ...canonicalAnchor('ws-1', 'dead-letter-1'),
      integrityMetadata: '{"workspaceId":"ws-1","deadLetterAnchorId":"wrong"}',
    });
    expect(() => prepareNotificationPlatformDeadLetterAnchorsForRecovery([bad])).toThrow(
      NotificationPlatformDeadLetterRestartRecoveryError,
    );
  });

  it('missing persisted state recovers empty without fabrication', async () => {
    const repository = new PrismaNotificationPlatformDeadLetterAnchorRepository(
      createPrismaMock([]) as never,
    );
    const service = new NotificationPlatformDeadLetterRestartRecoveryService(
      repository,
      new NotificationPlatformDeadLetterRecoveryStore(),
    );
    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(0);
    expect(service.getRecoveredAnchor('ws-1', 'dead-letter-1')).toBeNull();
  });
});

describe('W5-N14-c notification platform dead-letter restart recovery — integration', () => {
  it('recover persisted notification platform dead-letter anchors after normal restart', async () => {
    const anchor = canonicalAnchor('ws-1', 'dead-letter-1');
    const repository = new PrismaNotificationPlatformDeadLetterAnchorRepository(
      createPrismaMock([toRow(anchor)]) as never,
    );
    const recoveryStore = new NotificationPlatformDeadLetterRecoveryStore();
    const service = new NotificationPlatformDeadLetterRestartRecoveryService(
      repository,
      recoveryStore,
    );

    const diagnostics = await service.hydrate();
    expect(diagnostics.canonicalAnchorCount).toBe(1);
    expect(service.getRecoveredAnchor('ws-1', 'dead-letter-1')?.platformDeadLetterType).toBe(
      'unified-platform-dead-letter',
    );
    expect(W5_N14_C_ARCHITECTURE_CLAIMS.normalProcessRestartRecovery).toBe(true);
    expect(
      W5_N14_C_ARCHITECTURE_CLAIMS.notificationPlatformDeadLetterAnchorStateRestoredAfterRestart,
    ).toBe(true);
  });

  it('recovery idempotency: hydrate twice yields same diagnostics', async () => {
    const anchor = canonicalAnchor('ws-1', 'dead-letter-2');
    const service = new NotificationPlatformDeadLetterRestartRecoveryService(
      new PrismaNotificationPlatformDeadLetterAnchorRepository(
        createPrismaMock([toRow(anchor)]) as never,
      ),
      new NotificationPlatformDeadLetterRecoveryStore(),
    );
    const first = await service.hydrate();
    const second = await service.hydrate();
    expect(first).toEqual(second);
  });

  it('architecture claims: no operational continuity or customer-visible feature', () => {
    expect(W5_N14_C_ARCHITECTURE_CLAIMS.operationalContinuity).toBe(false);
    expect(W5_N14_C_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N14_C_ARCHITECTURE_CLAIMS.recoveryCanFabricateMissingState).toBe(false);
    expect(W5_N14_C_ARCHITECTURE_CLAIMS.recoveryCanRecoverCorruptedState).toBe(false);
    expect(W5_N14_C_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N14_C_ARCHITECTURE_CLAIMS.deadLetterRuntimeImplemented).toBe(false);
    expect(W5_N14_C_ARCHITECTURE_CLAIMS.deadLetterReplayImplemented).toBe(false);
    expect(W5_N14_C_ARCHITECTURE_CLAIMS.deadLetterProcessingImplemented).toBe(false);
    expect(W5_N14_C_ARCHITECTURE_CLAIMS.retryIntegrationImplemented).toBe(false);
    expect(W5_N14_C_ARCHITECTURE_CLAIMS.schedulerIntegrationImplemented).toBe(false);
    expect(W5_N14_C_ARCHITECTURE_CLAIMS.workersIntegrationImplemented).toBe(false);
  });

  it('recovered artifact ids reference W5-N14-b persistence foundation', () => {
    expect(W5_N14_C_RECOVERED_ARTIFACT_IDS).toEqual([
      'persist-notification-platform-dead-letter-anchor',
    ]);
  });

  it('transition matrix: persistence + recovery; package close still missing', () => {
    expect(W5_N14_C_TRANSITION_MATRIX.before).toContain('Durable persistence (W5-N14-b)');
    expect(W5_N14_C_TRANSITION_MATRIX.after).toContain('Restart recovery (W5-N14-c)');
    expect(
      W5_N14_C_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
  });

  it('technical debt delta: restart recovery resolved; package close deferred', () => {
    expect(W5_N14_C_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W5_N14_C_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N14_C_TECHNICAL_DEBT_DELTA.deferred).toEqual(['W5-N14-e — Package Close Evidence']);
  });

  it('explicit OUT covers dead-letter runtime only (not operational continuity)', () => {
    expect(W5_N14_C_EXPLICIT_OUT).toEqual(expect.arrayContaining(['platform-dead-letter-runtime']));
    expect(W5_N14_C_EXPLICIT_OUT).not.toContain('w5-n14-d');
  });

  it('required reports and recovery files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n14-c-implementation-report.md',
      'w5-n14-c-architecture-review.md',
      'w5-n14-c-security-review.md',
      'w5-n14-c-product-review.md',
      'w5-n14-c-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-dead-letter-restart-recovery.service.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-dead-letter-restart-recovery.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-dead-letter-continuity-status.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-dead-letter-recovery-store.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N14-c', () => {
    expect(W5_N14_C_SLICE_ID).toBe('W5-N14-c');
  });
});
