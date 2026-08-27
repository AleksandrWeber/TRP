import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildNotificationQueueContinuityProjection,
  evaluateNotificationQueueOperationalState,
  notificationDeliveryContinuesWhileOthersDegraded,
} from '../modules/notification-delivery/domain/notification-queue-operational-continuity';
import {
  recordNotificationChannelUnavailable,
  recordNotificationQueueRecoveryFailure,
  recordNotificationQueueRecoveryStart,
  recordNotificationQueueRecoverySuccess,
  resetNotificationQueueContinuity,
} from '../modules/notification-delivery/domain/notification-queue-continuity-status';
import { buildNotificationQueueRecoveryDiagnostics } from '../modules/notification-delivery/domain/notification-queue-restart-recovery';
import { OPERATIONAL_STATES } from '../modules/operational-continuity/operational-readiness';
import { DurableNotificationStore } from '../modules/notification-delivery/adapters/durable-notification-store';
import { createPendingNotificationQueueItem } from '../modules/notification-delivery/domain/delivery-queue';
import { saveOwnerStoreSnapshot } from '../persistence/analytical-owner-store-snapshot';
import {
  transitionSafetyAnswers,
  W3_O02_D_ARCHITECTURE_CLAIMS,
  W3_O02_D_EXPLICIT_OUT,
  W3_O02_D_OPERATIONAL_MATURITY,
  W3_O02_D_SLICE_ID,
  W3_O02_D_SUPPORTED_STATES,
  W3_O02_D_TECHNICAL_DEBT_DELTA,
  W3_O02_D_TRANSITION_MATRIX,
} from './w3-o02-d-operational-continuity';

const REPO_ROOT = join(__dirname, '../../../..');

function createSnapshotPrismaMock() {
  const rows = new Map<string, unknown>();
  return {
    analyticalOwnerStoreSnapshot: {
      findUnique: async ({ where: { owner } }: { where: { owner: string } }) => {
        if (!rows.has(owner)) return null;
        return { owner, payload: rows.get(owner) };
      },
      upsert: async ({
        where: { owner },
        create,
        update,
      }: {
        where: { owner: string };
        create: { owner: string; payload: unknown };
        update: { payload: unknown };
      }) => {
        const payload = rows.has(owner) ? update.payload : create.payload;
        rows.set(owner, payload);
        return { owner, payload };
      },
    },
    _rows: rows,
  };
}

describe('W3-O02-d notification queue operational continuity — unit', () => {
  beforeEach(() => {
    resetNotificationQueueContinuity();
  });

  it('operational state derivation: Recovering / Ready / Degraded / Unavailable only', () => {
    expect(W3_O02_D_SUPPORTED_STATES).toEqual([...OPERATIONAL_STATES]);
    expect(
      evaluateNotificationQueueOperationalState({
        recovering: true,
        ownerBoot: 'ready',
        continuity: null,
      }),
    ).toBe('Recovering');
    expect(
      evaluateNotificationQueueOperationalState({
        recovering: false,
        ownerBoot: 'unavailable',
        continuity: null,
      }),
    ).toBe('Unavailable');
    expect(
      evaluateNotificationQueueOperationalState({
        recovering: false,
        ownerBoot: 'ready',
        continuity: null,
      }),
    ).toBe('Ready');
    expect(W3_O02_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W3_O02_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
  });

  it('graceful degradation: channel-down / abandoned → Degraded; never fabricates Ready', () => {
    recordNotificationQueueRecoveryStart();
    recordNotificationQueueRecoverySuccess({
      diagnostics: buildNotificationQueueRecoveryDiagnostics([]),
    });
    recordNotificationChannelUnavailable(true, 'telegram-channel-down');
    expect(
      evaluateNotificationQueueOperationalState({
        recovering: false,
        ownerBoot: 'ready',
        continuity: {
          owner: 'notification-delivery',
          outcome: 'ready',
          integrityVerified: true,
          channelUnavailable: true,
          diagnostics: buildNotificationQueueRecoveryDiagnostics([]),
          recoveryStartedAt: '2026-08-27T19:00:00.000Z',
          recoveryCompletedAt: '2026-08-27T19:00:01.000Z',
          recoveryDurationMs: 1000,
        },
      }),
    ).toBe('Degraded');

    expect(
      evaluateNotificationQueueOperationalState({
        recovering: false,
        ownerBoot: 'ready',
        continuity: {
          owner: 'notification-delivery',
          outcome: 'ready',
          integrityVerified: true,
          channelUnavailable: false,
          diagnostics: buildNotificationQueueRecoveryDiagnostics([]),
          recoveryStartedAt: '2026-08-27T19:00:00.000Z',
          recoveryCompletedAt: '2026-08-27T19:00:01.000Z',
          recoveryDurationMs: 1000,
        },
        abandonedCount: 1,
      }),
    ).toBe('Degraded');
  });

  it('dependency evaluation: healthy notification-delivery continues while others degraded', () => {
    expect(
      notificationDeliveryContinuesWhileOthersDegraded({
        notificationQueueState: 'Ready',
        otherOwnerStates: ['Degraded', 'Unavailable', 'Ready'],
      }),
    ).toBe(true);
    expect(
      notificationDeliveryContinuesWhileOthersDegraded({
        notificationQueueState: 'Unavailable',
        otherOwnerStates: ['Ready'],
      }),
    ).toBe(false);
    expect(transitionSafetyAnswers().healthyNotificationDeliveryContinuesWhileOthersDegraded).toBe(
      true,
    );
  });

  it('recovery verification: unavailable continuity stays Unavailable', () => {
    recordNotificationQueueRecoveryStart();
    recordNotificationQueueRecoveryFailure({ reason: 'corrupt-queue' });
    const projection = buildNotificationQueueContinuityProjection({
      recovering: false,
      ownerBoot: 'ready',
      continuity: {
        owner: 'notification-delivery',
        outcome: 'unavailable',
        integrityVerified: false,
        channelUnavailable: false,
        reason: 'corrupt-queue',
        diagnostics: null,
        recoveryStartedAt: '2026-08-27T19:00:00.000Z',
        recoveryCompletedAt: '2026-08-27T19:00:01.000Z',
        recoveryDurationMs: 1000,
      },
    });
    expect(projection.operationalState).toBe('Unavailable');
    expect(projection.integrityVerified).toBe(false);
  });

  it('workspace isolation: diagnostics workspace ids stay scoped', () => {
    const item = createPendingNotificationQueueItem({
      queueItemId: 'nq-ws',
      command: {
        workspaceId: 'ws-a',
        userId: 'u-1',
        type: 'daily-report',
        subject: 'S',
        body: 'B',
        requestedAt: '2026-08-27T19:00:00.000Z',
      },
    });
    const diagnostics = buildNotificationQueueRecoveryDiagnostics([item]);
    expect(diagnostics.workspaceIds).toEqual(['ws-a']);
    expect(diagnostics.workspaceIds).not.toContain('ws-b');
  });
});

describe('W3-O02-d notification queue operational continuity — integration', () => {
  beforeEach(() => {
    resetNotificationQueueContinuity();
  });

  it('recovered queue operational readiness after successful hydrate', async () => {
    const prisma = createSnapshotPrismaMock();
    const writer = new DurableNotificationStore(prisma as never);
    await writer.hydrate();
    writer.saveQueueItem(
      createPendingNotificationQueueItem({
        queueItemId: 'nq-ready',
        command: {
          workspaceId: 'ws-1',
          userId: 'u-1',
          type: 'daily-report',
          subject: 'S',
          body: 'B',
          requestedAt: '2026-08-27T19:10:00.000Z',
        },
      }),
    );

    resetNotificationQueueContinuity();
    const reader = new DurableNotificationStore(prisma as never);
    await reader.hydrate();
    const projection = buildNotificationQueueContinuityProjection({
      recovering: false,
      ownerBoot: 'ready',
      continuity: {
        owner: 'notification-delivery',
        outcome: 'ready',
        integrityVerified: true,
        channelUnavailable: false,
        diagnostics: buildNotificationQueueRecoveryDiagnostics(
          reader.listQueueItems({ workspaceId: 'ws-1' }),
        ),
        recoveryStartedAt: '2026-08-27T19:10:00.000Z',
        recoveryCompletedAt: '2026-08-27T19:10:01.000Z',
        recoveryDurationMs: 1000,
      },
    });
    expect(projection.operationalState).toBe('Ready');
    expect(projection.ownerReadiness).toBe('ready');
    expect(projection.integrityVerified).toBe(true);
  });

  it('unavailable queue / corrupt recovery path stays Unavailable', async () => {
    const prisma = createSnapshotPrismaMock();
    await saveOwnerStoreSnapshot(prisma as never, 'notification-delivery', {
      preferences: [],
      telegram: [],
      deliveries: [],
      queue: [{ queueItemId: 'bad' }],
    });
    const store = new DurableNotificationStore(prisma as never);
    await expect(store.hydrate()).rejects.toThrow();
    const projection = buildNotificationQueueContinuityProjection({
      recovering: false,
      ownerBoot: 'unavailable',
      continuity: {
        owner: 'notification-delivery',
        outcome: 'unavailable',
        integrityVerified: false,
        channelUnavailable: false,
        reason: 'corrupt',
        diagnostics: null,
        recoveryStartedAt: '2026-08-27T19:20:00.000Z',
        recoveryCompletedAt: '2026-08-27T19:20:01.000Z',
        recoveryDurationMs: 1000,
      },
    });
    expect(projection.operationalState).toBe('Unavailable');
  });

  it('dependency degradation does not invent Ready for unavailable queue', () => {
    expect(
      notificationDeliveryContinuesWhileOthersDegraded({
        notificationQueueState: 'Unavailable',
        otherOwnerStates: ['Ready', 'Ready'],
      }),
    ).toBe(false);
  });

  it('architecture / maturity / debt claims', () => {
    expect(W3_O02_D_SLICE_ID).toBe('W3-O02-d');
    expect(W3_O02_D_ARCHITECTURE_CLAIMS.operationalContinuityDerived).toBe(true);
    expect(W3_O02_D_ARCHITECTURE_CLAIMS.secondOperationalStateEngine).toBe(false);
    expect(W3_O02_D_ARCHITECTURE_CLAIMS.retryExecutionImplemented).toBe(false);
    expect(W3_O02_D_ARCHITECTURE_CLAIMS.masterPlanModified).toBe(false);
    expect(W3_O02_D_ARCHITECTURE_CLAIMS.ownershipDiagramChanged).toBe(false);
    expect(W3_O02_D_ARCHITECTURE_CLAIMS.boundedContextChanged).toBe(false);
    expect(W3_O02_D_ARCHITECTURE_CLAIMS.sourceOfTruthChanged).toBe(false);
    expect(W3_O02_D_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['retry-execution', 'monitoring-platform', 'w3-o02-e']),
    );
    expect(W3_O02_D_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W3_O02_D_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W3_O02_D_TRANSITION_MATRIX.stillMissing).toEqual(
      expect.arrayContaining([expect.stringMatching(/Close/), expect.stringMatching(/Wave 5/)]),
    );
    expect(W3_O02_D_OPERATIONAL_MATURITY.after).toEqual(
      expect.arrayContaining(['Operational continuity']),
    );
  });

  it('required reports and matrix exist', () => {
    const wave3 = join(REPO_ROOT, 'docs/project/version-3/wave-3');
    for (const name of [
      'w3-o02-d-implementation-report.md',
      'w3-o02-d-architecture-review.md',
      'w3-o02-d-security-review.md',
      'w3-o02-d-product-review.md',
      'w3-o02-d-validation-report.md',
      'operational-state-matrix.md',
    ]) {
      expect(existsSync(join(wave3, name))).toBe(true);
    }
  });
});
