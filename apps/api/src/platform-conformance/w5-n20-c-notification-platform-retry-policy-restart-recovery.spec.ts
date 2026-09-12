import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildNotificationPlatformRetryPolicyAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-retry-policy-anchor';
import {
  prepareNotificationPlatformRetryPolicyAnchorsForRecovery,
  NotificationPlatformRetryPolicyRestartRecoveryError,
} from '../modules/notification-delivery/domain/notification-platform-retry-policy-restart-recovery';
import { NotificationPlatformRetryPolicyRestartRecoveryService } from '../modules/notification-delivery/domain/notification-platform-retry-policy-restart-recovery.service';
import { NotificationPlatformRetryPolicyRecoveryStore } from '../modules/notification-delivery/domain/notification-platform-retry-policy-recovery-store';
import { PrismaNotificationPlatformRetryPolicyAnchorRepository } from '../modules/notification-delivery/persistence/prisma-notification-platform-retry-policy-anchor.repository';
import {
  W5_N20_C_ARCHITECTURE_CLAIMS,
  W5_N20_C_EXPLICIT_OUT,
  W5_N20_C_NOTIFICATION_OWNER,
  W5_N20_C_RECOVERED_ARTIFACT_IDS,
  W5_N20_C_SLICE_ID,
  W5_N20_C_TECHNICAL_DEBT_DELTA,
  W5_N20_C_TRANSITION_MATRIX,
} from './w5-n20-c-notification-platform-retry-policy-restart-recovery';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-09-12T21:30:00.000Z';

function canonicalAnchor(workspaceId: string, retryPolicyAnchorId: string) {
  const outcome = buildNotificationPlatformRetryPolicyAnchorState({
    workspaceId,
    retryPolicyAnchorId,
    platformRetryPolicyType: 'policy-description-foundation',
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
    rows.map((row) => [`${row.workspaceId as string}:${row.retryPolicyAnchorId as string}`, row]),
  );
  return {
    workspaceNotificationPlatformRetryPolicyAnchor: {
      findMany: async () =>
        [...store.values()].sort((a, b) => {
          const byWorkspace = String(a.workspaceId).localeCompare(String(b.workspaceId));
          if (byWorkspace !== 0) return byWorkspace;
          return String(a.retryPolicyAnchorId).localeCompare(String(b.retryPolicyAnchorId));
        }),
      findUnique: async ({
        where: {
          workspaceId_retryPolicyAnchorId: { workspaceId, retryPolicyAnchorId },
        },
      }: {
        where: {
          workspaceId_retryPolicyAnchorId: {
            workspaceId: string;
            retryPolicyAnchorId: string;
          };
        };
      }) => store.get(`${workspaceId}:${retryPolicyAnchorId}`) ?? null,
      upsert: async () => ({}),
    },
  };
}

function toRow(anchor: ReturnType<typeof canonicalAnchor>) {
  return {
    workspaceId: anchor.workspaceId,
    retryPolicyAnchorId: anchor.retryPolicyAnchorId,
    schemaVersion: anchor.schemaVersion,
    platformRetryPolicyType: anchor.platformRetryPolicyType,
    retryPolicyState: anchor.retryPolicyState,
    channelScope: anchor.channelScope,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

describe('W5-N20-c notification platform retry policy restart recovery — unit', () => {
  it('ownership remains notification-delivery only', () => {
    expect(W5_N20_C_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('corrupt anchor fails honestly', () => {
    const bad = Object.freeze({
      ...canonicalAnchor('ws-1', 'retry-policy-1'),
      integrityMetadata: '{"workspaceId":"ws-1","retryPolicyAnchorId":"wrong"}',
    });
    expect(() => prepareNotificationPlatformRetryPolicyAnchorsForRecovery([bad])).toThrow(
      NotificationPlatformRetryPolicyRestartRecoveryError,
    );
  });

  it('missing persisted state recovers empty without fabrication', async () => {
    const repository = new PrismaNotificationPlatformRetryPolicyAnchorRepository(
      createPrismaMock([]) as never,
    );
    const service = new NotificationPlatformRetryPolicyRestartRecoveryService(
      repository,
      new NotificationPlatformRetryPolicyRecoveryStore(),
    );
    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(0);
    expect(service.getRecoveredAnchor('ws-1', 'retry-policy-1')).toBeNull();
  });
});

describe('W5-N20-c notification platform retry policy restart recovery — integration', () => {
  it('recover persisted notification platform retry policy anchors after normal restart', async () => {
    const anchor = canonicalAnchor('ws-1', 'retry-policy-1');
    const repository = new PrismaNotificationPlatformRetryPolicyAnchorRepository(
      createPrismaMock([toRow(anchor)]) as never,
    );
    const recoveryStore = new NotificationPlatformRetryPolicyRecoveryStore();
    const service = new NotificationPlatformRetryPolicyRestartRecoveryService(
      repository,
      recoveryStore,
    );

    const diagnostics = await service.hydrate();
    expect(diagnostics.canonicalAnchorCount).toBe(1);
    expect(service.getRecoveredAnchor('ws-1', 'retry-policy-1')?.platformRetryPolicyType).toBe(
      'policy-description-foundation',
    );
    expect(W5_N20_C_ARCHITECTURE_CLAIMS.normalProcessRestartRecovery).toBe(true);
    expect(
      W5_N20_C_ARCHITECTURE_CLAIMS.notificationPlatformRetryPolicyAnchorStateRestoredAfterRestart,
    ).toBe(true);
  });

  it('recovery idempotency: hydrate twice yields same diagnostics', async () => {
    const anchor = canonicalAnchor('ws-1', 'retry-policy-2');
    const service = new NotificationPlatformRetryPolicyRestartRecoveryService(
      new PrismaNotificationPlatformRetryPolicyAnchorRepository(
        createPrismaMock([toRow(anchor)]) as never,
      ),
      new NotificationPlatformRetryPolicyRecoveryStore(),
    );
    const first = await service.hydrate();
    const second = await service.hydrate();
    expect(first).toEqual(second);
  });

  it('architecture claims: no operational continuity or customer-visible feature', () => {
    expect(W5_N20_C_ARCHITECTURE_CLAIMS.operationalContinuity).toBe(false);
    expect(W5_N20_C_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N20_C_ARCHITECTURE_CLAIMS.recoveryCanFabricateMissingState).toBe(false);
    expect(W5_N20_C_ARCHITECTURE_CLAIMS.recoveryCanRecoverCorruptedState).toBe(false);
    expect(W5_N20_C_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N20_C_ARCHITECTURE_CLAIMS.retryPolicyImplemented).toBe(false);
    expect(W5_N20_C_ARCHITECTURE_CLAIMS.restartRecoveryImplemented).toBe(true);
    expect(W5_N20_C_ARCHITECTURE_CLAIMS.policyEngineIntroduced).toBe(false);
  });

  it('recovered artifact ids reference W5-N20-b persistence foundation', () => {
    expect(W5_N20_C_RECOVERED_ARTIFACT_IDS).toEqual([
      'persist-notification-platform-retry-policy-anchor',
    ]);
  });

  it('transition matrix: persistence + recovery; operational continuity and package Close still missing', () => {
    expect(W5_N20_C_TRANSITION_MATRIX.before).toContain('Durable persistence (W5-N20-b)');
    expect(W5_N20_C_TRANSITION_MATRIX.after).toContain('Restart recovery (W5-N20-c)');
    expect(
      W5_N20_C_TRANSITION_MATRIX.stillMissing.some((item) =>
        item.includes('Operational continuity'),
      ),
    ).toBe(true);
    expect(
      W5_N20_C_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
  });

  it('technical debt delta: restart recovery resolved; d–e deferred; nothing introduced', () => {
    expect(W5_N20_C_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Retry Policy Restart Recovery Foundation',
    );
    expect(W5_N20_C_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N20_C_TECHNICAL_DEBT_DELTA.deferred).toEqual([
      'W5-N20-d — Operational Continuity Foundation',
      'W5-N20-e — Package Validation, Operational Verification & Close Evidence',
    ]);
  });

  it('explicit OUT covers retry-policy-runtime and operational continuity', () => {
    expect(W5_N20_C_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['policy-evaluation-runtime', 'operational-continuity']),
    );
    expect(W5_N20_C_EXPLICIT_OUT).not.toContain('w5-n20-d');
  });

  it('required reports and recovery files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n20-c-implementation-report.md',
      'w5-n20-c-architecture-review.md',
      'w5-n20-c-security-review.md',
      'w5-n20-c-product-review.md',
      'w5-n20-c-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-policy-restart-recovery.service.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-policy-restart-recovery.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-policy-continuity-status.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-policy-recovery-store.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N20-c', () => {
    expect(W5_N20_C_SLICE_ID).toBe('W5-N20-c');
  });
});
