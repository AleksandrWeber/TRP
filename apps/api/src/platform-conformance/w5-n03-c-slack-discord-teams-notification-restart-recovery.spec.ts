import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildSlackDiscordTeamsNotificationAnchorState } from '../modules/notification-delivery/domain/durable-slack-discord-teams-notification-anchor';
import {
  prepareSlackDiscordTeamsNotificationAnchorsForRecovery,
  SlackDiscordTeamsNotificationRestartRecoveryError,
} from '../modules/notification-delivery/domain/slack-discord-teams-notification-restart-recovery';
import { PrismaSlackDiscordTeamsNotificationAnchorRepository } from '../modules/notification-delivery/persistence/prisma-slack-discord-teams-notification-anchor.repository';
import { SlackDiscordTeamsNotificationRecoveryStore } from '../modules/notification-delivery/slack-discord-teams-notification-recovery-store';
import { SlackDiscordTeamsNotificationRestartRecoveryService } from '../modules/notification-delivery/slack-discord-teams-notification-restart-recovery.service';
import {
  W5_N03_C_ARCHITECTURE_CLAIMS,
  W5_N03_C_EXPLICIT_OUT,
  W5_N03_C_NOTIFICATION_OWNER,
  W5_N03_C_RECOVERED_ARTIFACT_IDS,
  W5_N03_C_SLICE_ID,
  W5_N03_C_TECHNICAL_DEBT_DELTA,
  W5_N03_C_TRANSITION_MATRIX,
} from './w5-n03-c-slack-discord-teams-notification-restart-recovery';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-08-29T17:00:00.000Z';

function canonicalAnchor(workspaceId: string, notificationId: string, channel = 'slack') {
  const outcome = buildSlackDiscordTeamsNotificationAnchorState({
    workspaceId,
    notificationId,
    notificationChannel: channel,
    notificationType: 'report-complete',
    recipientIdentifier: '#alerts',
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
    workspaceSlackDiscordTeamsNotificationAnchor: {
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

describe('W5-N03-c slack/discord/teams notification restart recovery — unit', () => {
  it('ownership remains notification-delivery only', () => {
    expect(W5_N03_C_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('corrupt anchor fails honestly', () => {
    const bad = Object.freeze({
      ...canonicalAnchor('ws-1', 'ntf-1'),
      integrityMetadata: '{"workspaceId":"ws-1","notificationId":"wrong"}',
    });
    expect(() => prepareSlackDiscordTeamsNotificationAnchorsForRecovery([bad])).toThrow(
      SlackDiscordTeamsNotificationRestartRecoveryError,
    );
  });

  it('missing persisted state recovers empty without fabrication', async () => {
    const repository = new PrismaSlackDiscordTeamsNotificationAnchorRepository(
      createPrismaMock([]) as never,
    );
    const service = new SlackDiscordTeamsNotificationRestartRecoveryService(
      repository,
      new SlackDiscordTeamsNotificationRecoveryStore(),
    );
    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(0);
    expect(service.getRecoveredAnchor('ws-1', 'ntf-1')).toBeNull();
  });
});

describe('W5-N03-c slack/discord/teams notification restart recovery — integration', () => {
  it('recover persisted slack/discord/teams notification anchors after normal restart', async () => {
    const anchor = canonicalAnchor('ws-1', 'ntf-1', 'discord');
    const repository = new PrismaSlackDiscordTeamsNotificationAnchorRepository(
      createPrismaMock([toRow(anchor)]) as never,
    );
    const recoveryStore = new SlackDiscordTeamsNotificationRecoveryStore();
    const service = new SlackDiscordTeamsNotificationRestartRecoveryService(
      repository,
      recoveryStore,
    );

    const diagnostics = await service.hydrate();
    expect(diagnostics.canonicalAnchorCount).toBe(1);
    expect(service.getRecoveredAnchor('ws-1', 'ntf-1')?.notificationType).toBe('report-complete');
    expect(W5_N03_C_ARCHITECTURE_CLAIMS.normalProcessRestartRecovery).toBe(true);
    expect(
      W5_N03_C_ARCHITECTURE_CLAIMS.slackDiscordTeamsNotificationAnchorStateRestoredAfterRestart,
    ).toBe(true);
  });

  it('recovery idempotency: hydrate twice yields same diagnostics', async () => {
    const anchor = canonicalAnchor('ws-1', 'ntf-2', 'teams');
    const service = new SlackDiscordTeamsNotificationRestartRecoveryService(
      new PrismaSlackDiscordTeamsNotificationAnchorRepository(
        createPrismaMock([toRow(anchor)]) as never,
      ),
      new SlackDiscordTeamsNotificationRecoveryStore(),
    );
    const first = await service.hydrate();
    const second = await service.hydrate();
    expect(first).toEqual(second);
  });

  it('architecture claims: no operational continuity or customer-visible feature', () => {
    expect(W5_N03_C_ARCHITECTURE_CLAIMS.operationalContinuity).toBe(false);
    expect(W5_N03_C_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W5_N03_C_ARCHITECTURE_CLAIMS.recoveryCanFabricateMissingState).toBe(false);
    expect(W5_N03_C_ARCHITECTURE_CLAIMS.recoveryCanRecoverCorruptedState).toBe(false);
    expect(W5_N03_C_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
  });

  it('recovered artifact ids reference W5-N03-b persistence foundation', () => {
    expect(W5_N03_C_RECOVERED_ARTIFACT_IDS).toEqual([
      'persist-slack-discord-teams-notification-anchor',
    ]);
  });

  it('transition matrix: persistence + recovery; operational continuity still missing', () => {
    expect(W5_N03_C_TRANSITION_MATRIX.before).toContain('Durable persistence (W5-N03-b)');
    expect(W5_N03_C_TRANSITION_MATRIX.after).toContain('Restart recovery (W5-N03-c)');
    expect(
      W5_N03_C_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Operational')),
    ).toBe(true);
  });

  it('technical debt delta: restart recovery resolved; continuity deferred', () => {
    expect(W5_N03_C_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W5_N03_C_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N03_C_TECHNICAL_DEBT_DELTA.deferred.some((item) => item.includes('continuity'))).toBe(
      true,
    );
  });

  it('explicit OUT covers operational continuity and W5-N03-d', () => {
    expect(W5_N03_C_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['operational-continuity', 'w5-n03-d']),
    );
  });

  it('required reports and recovery files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n03-c-implementation-report.md',
      'w5-n03-c-architecture-review.md',
      'w5-n03-c-security-review.md',
      'w5-n03-c-product-review.md',
      'w5-n03-c-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/slack-discord-teams-notification-restart-recovery.service.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/slack-discord-teams-notification-restart-recovery.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/slack-discord-teams-notification-continuity-status.ts',
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/slack-discord-teams-notification-recovery-store.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N03-c', () => {
    expect(W5_N03_C_SLICE_ID).toBe('W5-N03-c');
  });
});
