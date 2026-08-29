import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PrismaSlackDiscordTeamsNotificationAnchorRepository } from '../modules/notification-delivery/persistence/prisma-slack-discord-teams-notification-anchor.repository';
import { SlackDiscordTeamsNotificationPersistenceService } from '../modules/notification-delivery/slack-discord-teams-notification-persistence.service';
import { SlackDiscordTeamsNotificationRecoveryStore } from '../modules/notification-delivery/slack-discord-teams-notification-recovery-store';
import { rowsEphemeral } from './w5-n03-a-slack-discord-teams-notification-inventory';
import {
  W5_N03_B_ARCHITECTURE_CLAIMS,
  W5_N03_B_CANONICAL_ANCHOR_FIELDS,
  W5_N03_B_DURABLE_COVERAGE,
  W5_N03_B_EXPLICIT_OUT,
  W5_N03_B_NEW_PERSISTED_ARTIFACT_IDS,
  W5_N03_B_NOTIFICATION_OWNER,
  W5_N03_B_PREEXISTING_SURVIVE_ARTIFACT_IDS,
  W5_N03_B_SLICE_ID,
  W5_N03_B_TECHNICAL_DEBT_DELTA,
  W5_N03_B_TRANSITION_MATRIX,
  newPersistedInventoryRows,
  persistedArtifactIds,
  preexistingSurviveInventoryRows,
} from './w5-n03-b-durable-slack-discord-teams-notification';

const REPO_ROOT = join(__dirname, '../../../..');

function createPrismaMock() {
  const rows = new Map<string, unknown>();
  return {
    workspaceSlackDiscordTeamsNotificationAnchor: {
      upsert: async ({
        where: {
          workspaceId_notificationId: { workspaceId, notificationId },
        },
        create,
        update,
      }: {
        where: {
          workspaceId_notificationId: { workspaceId: string; notificationId: string };
        };
        create: unknown;
        update: unknown;
      }) => {
        const key = `${workspaceId}:${notificationId}`;
        const data = rows.has(key) ? update : create;
        rows.set(key, data);
        return data;
      },
      findUnique: async ({
        where: {
          workspaceId_notificationId: { workspaceId, notificationId },
        },
      }: {
        where: {
          workspaceId_notificationId: { workspaceId: string; notificationId: string };
        };
      }) => rows.get(`${workspaceId}:${notificationId}`) ?? null,
      findMany: async () => [...rows.values()],
    },
    _rows: rows,
  };
}

describe('W5-N03-b durable slack/discord/teams notification — unit', () => {
  it('persistence correctness: anchor write-through upserts workspace notification row', async () => {
    const prisma = createPrismaMock();
    const repository = new PrismaSlackDiscordTeamsNotificationAnchorRepository(prisma as never);
    const service = new SlackDiscordTeamsNotificationPersistenceService(
      repository,
      new SlackDiscordTeamsNotificationRecoveryStore(),
    );

    const outcome = await service.persistNotificationAnchor({
      workspaceId: 'ws-a',
      notificationId: 'ntf-1',
      notificationChannel: 'slack',
      notificationType: 'report-complete',
      recipientIdentifier: '#alerts',
      templateIdentifier: 'inline:report-complete',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt: '2026-08-29T16:00:00.000Z',
    });
    expect(outcome.ok).toBe(true);

    const loaded = await service.loadAnchor('ws-a', 'ntf-1');
    expect(loaded).toMatchObject({
      workspaceId: 'ws-a',
      notificationId: 'ntf-1',
      notificationChannel: 'slack',
      deliveryState: 'anchor-recorded',
    });
    expect(loaded).not.toHaveProperty('delivered');
  });

  it('artifact coverage: only approved new SURVIVE row is persisted by this slice', () => {
    expect([...persistedArtifactIds()].sort()).toEqual(
      [...W5_N03_B_NEW_PERSISTED_ARTIFACT_IDS].sort(),
    );
    const rows = newPersistedInventoryRows();
    expect(rows.length).toBe(W5_N03_B_NEW_PERSISTED_ARTIFACT_IDS.length);
    for (const row of rows) {
      expect(row.artifactId).toBe('persist-slack-discord-teams-notification-anchor');
      expect(row.durabilityClass).toBe('SURVIVE');
    }
  });

  it('pre-existing SURVIVE rows remain on notification-delivery / secret-vault owners', () => {
    const preexisting = preexistingSurviveInventoryRows();
    expect(preexisting.length).toBe(W5_N03_B_PREEXISTING_SURVIVE_ARTIFACT_IDS.length);
    const owners = new Set(preexisting.map((row) => row.owner));
    expect(owners.has('notification-delivery')).toBe(true);
    expect(owners.has('secret-vault')).toBe(true);
  });

  it('ownership: slack/discord/teams notification persistence remains on notification-delivery owner only', () => {
    expect(W5_N03_B_NOTIFICATION_OWNER).toBe('notification-delivery');
    for (const row of W5_N03_B_DURABLE_COVERAGE) {
      expect(row.owner).toBe('notification-delivery');
    }
  });

  it('canonical anchor fields are frozen for W5-N03-b', () => {
    expect(W5_N03_B_CANONICAL_ANCHOR_FIELDS).toEqual(
      expect.arrayContaining([
        'workspaceId',
        'notificationId',
        'notificationChannel',
        'notificationType',
        'recipientIdentifier',
        'templateIdentifier',
        'deliveryState',
        'integrityMetadata',
        'correlationId',
      ]),
    );
  });

  it('EPHEMERAL inventory rows are not in new durable coverage', () => {
    const covered = new Set(persistedArtifactIds());
    for (const row of rowsEphemeral()) {
      expect(covered.has(row.artifactId)).toBe(false);
    }
  });

  it('transition matrix: inventory → durable persistence → restart recovery still missing', () => {
    expect(W5_N03_B_TRANSITION_MATRIX.before).toContain('Inventory');
    expect(W5_N03_B_TRANSITION_MATRIX.after).toContain('Durable Persistence');
    expect(W5_N03_B_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Restart'))).toBe(
      true,
    );
  });
});

describe('W5-N03-b durable slack/discord/teams notification — integration', () => {
  it('persistence lifecycle: no recovery / webhook / outbound delivery claims from this slice', () => {
    expect(W5_N03_B_SLICE_ID).toBe('W5-N03-b');
    expect(W5_N03_B_ARCHITECTURE_CLAIMS.automaticRestartRecovery).toBe(false);
    expect(W5_N03_B_ARCHITECTURE_CLAIMS.operationalContinuityGuaranteed).toBe(false);
    expect(W5_N03_B_ARCHITECTURE_CLAIMS.webhookImplementation).toBe(false);
    expect(W5_N03_B_ARCHITECTURE_CLAIMS.outboundNotificationDelivery).toBe(false);
    expect(W5_N03_B_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N03_B_ARCHITECTURE_CLAIMS.slackDiscordTeamsNotificationRestartSurvivalClaimed).toBe(
      false,
    );
    expect(W5_N03_B_ARCHITECTURE_CLAIMS.exchangeAdapterUntouched).toBe(true);
  });

  it('technical debt delta: durable foundation resolved; recovery deferred', () => {
    expect(W5_N03_B_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Durable Slack / Discord / Teams Notification Foundation',
    );
    expect(W5_N03_B_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N03_B_TECHNICAL_DEBT_DELTA.deferred.some((item) => item.includes('restart'))).toBe(
      true,
    );
  });

  it('explicit OUT covers restart recovery and W5-N03-c', () => {
    expect(W5_N03_B_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['restart-recovery', 'w5-n03-c', 'webhook-transport']),
    );
  });

  it('owner consistency: each coverage row maps to existing repository and service files', () => {
    for (const row of W5_N03_B_DURABLE_COVERAGE) {
      expect(existsSync(join(REPO_ROOT, row.prismaAdapter))).toBe(true);
      expect(existsSync(join(REPO_ROOT, row.persistenceService))).toBe(true);
      expect(existsSync(join(REPO_ROOT, row.repositoryPort))).toBe(true);
      expect(existsSync(join(REPO_ROOT, row.migration))).toBe(true);
    }
  });

  it('required reports exist for W5-N03-b', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n03-b-implementation-report.md',
      'w5-n03-b-architecture-review.md',
      'w5-n03-b-security-review.md',
      'w5-n03-b-product-review.md',
      'w5-n03-b-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
  });
});
