import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildEmailNotificationAnchorState } from '../modules/notification-delivery/domain/durable-email-notification-anchor';
import {
  EmailNotificationRestartRecoveryError,
  prepareEmailNotificationAnchorsForRecovery,
} from '../modules/notification-delivery/domain/email-notification-restart-recovery';
import { PrismaEmailNotificationAnchorRepository } from '../modules/notification-delivery/persistence/prisma-email-notification-anchor.repository';
import { EmailNotificationRecoveryStore } from '../modules/notification-delivery/email-notification-recovery-store';
import { EmailNotificationRestartRecoveryService } from '../modules/notification-delivery/email-notification-restart-recovery.service';
import {
  W5_N02_C_ARCHITECTURE_CLAIMS,
  W5_N02_C_EXPLICIT_OUT,
  W5_N02_C_NOTIFICATION_OWNER,
  W5_N02_C_RECOVERED_ARTIFACT_IDS,
  W5_N02_C_SLICE_ID,
  W5_N02_C_TECHNICAL_DEBT_DELTA,
  W5_N02_C_TRANSITION_MATRIX,
} from './w5-n02-c-email-notification-restart-recovery';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-08-28T17:00:00.000Z';

function canonicalAnchor(workspaceId: string, notificationId: string) {
  const outcome = buildEmailNotificationAnchorState({
    workspaceId,
    notificationId,
    notificationChannel: 'email',
    notificationType: 'report-complete',
    recipientIdentifier: 'user@example.com',
    templateIdentifier: 'inline:report-complete',
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
    rows.map((row) => [`${row.workspaceId as string}:${row.notificationId as string}`, row]),
  );
  return {
    workspaceEmailNotificationAnchor: {
      findMany: async () =>
        [...store.values()].sort((a, b) => {
          const byWorkspace = String(a.workspaceId).localeCompare(String(b.workspaceId));
          if (byWorkspace !== 0) return byWorkspace;
          return String(a.notificationId).localeCompare(String(b.notificationId));
        }),
      findUnique: async ({
        where: {
          workspaceId_notificationId: { workspaceId, notificationId },
        },
      }: {
        where: {
          workspaceId_notificationId: { workspaceId: string; notificationId: string };
        };
      }) => store.get(`${workspaceId}:${notificationId}`) ?? null,
      upsert: async () => ({}),
    },
  };
}

function toRow(anchor: ReturnType<typeof canonicalAnchor>) {
  return {
    workspaceId: anchor.workspaceId,
    notificationId: anchor.notificationId,
    schemaVersion: anchor.schemaVersion,
    notificationChannel: anchor.notificationChannel,
    notificationType: anchor.notificationType,
    recipientIdentifier: anchor.recipientIdentifier,
    templateIdentifier: anchor.templateIdentifier,
    deliveryState: anchor.deliveryState,
    integrityMetadata: anchor.integrityMetadata,
    correlationId: anchor.correlationId,
    recordedAt: new Date(anchor.recordedAt),
    recordedByActorId: anchor.recordedByActorId,
    updatedAt: new Date(anchor.updatedAt),
  };
}

describe('W5-N02-c email notification restart recovery — unit', () => {
  it('ownership remains notification-delivery only', () => {
    expect(W5_N02_C_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('corrupt anchor fails honestly', () => {
    const bad = Object.freeze({
      ...canonicalAnchor('ws-1', 'ntf-1'),
      integrityMetadata: '{"workspaceId":"ws-1","notificationId":"wrong"}',
    });
    expect(() => prepareEmailNotificationAnchorsForRecovery([bad])).toThrow(
      EmailNotificationRestartRecoveryError,
    );
  });

  it('missing persisted state recovers empty without fabrication', async () => {
    const repository = new PrismaEmailNotificationAnchorRepository(createPrismaMock([]) as never);
    const service = new EmailNotificationRestartRecoveryService(
      repository,
      new EmailNotificationRecoveryStore(),
    );
    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(0);
    expect(service.getRecoveredAnchor('ws-1', 'ntf-1')).toBeNull();
  });
});

describe('W5-N02-c email notification restart recovery — integration', () => {
  it('recover persisted email notification anchors after normal restart', async () => {
    const anchor = canonicalAnchor('ws-1', 'ntf-1');
    const repository = new PrismaEmailNotificationAnchorRepository(
      createPrismaMock([toRow(anchor)]) as never,
    );
    const recoveryStore = new EmailNotificationRecoveryStore();
    const service = new EmailNotificationRestartRecoveryService(repository, recoveryStore);

    const diagnostics = await service.hydrate();
    expect(diagnostics.canonicalAnchorCount).toBe(1);
    expect(service.getRecoveredAnchor('ws-1', 'ntf-1')?.notificationType).toBe('report-complete');
    expect(W5_N02_C_ARCHITECTURE_CLAIMS.normalProcessRestartRecovery).toBe(true);
    expect(W5_N02_C_ARCHITECTURE_CLAIMS.emailNotificationAnchorStateRestoredAfterRestart).toBe(
      true,
    );
  });

  it('recovery idempotency: hydrate twice yields same diagnostics', async () => {
    const anchor = canonicalAnchor('ws-1', 'ntf-2');
    const service = new EmailNotificationRestartRecoveryService(
      new PrismaEmailNotificationAnchorRepository(createPrismaMock([toRow(anchor)]) as never),
      new EmailNotificationRecoveryStore(),
    );
    const first = await service.hydrate();
    const second = await service.hydrate();
    expect(first).toEqual(second);
  });

  it('architecture claims: no operational continuity or customer-visible feature', () => {
    expect(W5_N02_C_ARCHITECTURE_CLAIMS.operationalContinuity).toBe(false);
    expect(W5_N02_C_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N02_C_ARCHITECTURE_CLAIMS.recoveryCanFabricateMissingState).toBe(false);
    expect(W5_N02_C_ARCHITECTURE_CLAIMS.recoveryCanRecoverCorruptedState).toBe(false);
    expect(W5_N02_C_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
  });

  it('recovered artifact ids reference W5-N02-b persistence foundation', () => {
    expect(W5_N02_C_RECOVERED_ARTIFACT_IDS).toEqual(['persist-email-notification-anchor']);
  });

  it('transition matrix: persistence + recovery; operational continuity still missing', () => {
    expect(W5_N02_C_TRANSITION_MATRIX.before).toContain('Durable persistence (W5-N02-b)');
    expect(W5_N02_C_TRANSITION_MATRIX.after).toContain('Restart recovery (W5-N02-c)');
    expect(
      W5_N02_C_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Operational')),
    ).toBe(true);
  });

  it('technical debt delta: restart recovery resolved; continuity deferred', () => {
    expect(W5_N02_C_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W5_N02_C_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N02_C_TECHNICAL_DEBT_DELTA.deferred.some((item) => item.includes('continuity'))).toBe(
      true,
    );
  });

  it('explicit OUT covers operational continuity and W5-N02-d', () => {
    expect(W5_N02_C_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['operational-continuity', 'w5-n02-d']),
    );
  });

  it('required reports and recovery files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n02-c-implementation-report.md',
      'w5-n02-c-architecture-review.md',
      'w5-n02-c-security-review.md',
      'w5-n02-c-product-review.md',
      'w5-n02-c-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/email-notification-restart-recovery.service.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/email-notification-restart-recovery.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/email-notification-continuity-status.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/email-notification-recovery-store.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N02-c', () => {
    expect(W5_N02_C_SLICE_ID).toBe('W5-N02-c');
  });
});
