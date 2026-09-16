import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { Role } from '../identity/role';
import { InMemoryTeamsAdapter } from './adapters/in-memory-teams.adapter';
import { ProductionTeamsWebhookNotificationAdapter } from './adapters/production-teams-webhook-notification.adapter';
import { TeamsWebhookCredentialResolver } from './adapters/teams-webhook-credential.resolver';
import { NotificationDeliveryModule } from './notification-delivery.module';
import { NotificationDeliveryService } from './notification-delivery.service';
import {
  bindInMemoryTeamsChannelForTests,
  bindInMemoryEmailChannelForTests,
  bindInMemorySlackChannelForTests,
  bindInMemoryTelegramChannelForTests,
  stubSecretVaultForIsolatedNotificationDelivery,
} from './notification-delivery.test-harness';
import { TEAMS_CHANNEL_ADAPTER } from './ports/notification.port';

describe('Teams webhook connection and delivery', () => {
  async function createService() {
    const moduleRef = await stubSecretVaultForIsolatedNotificationDelivery(
      bindInMemoryTeamsChannelForTests(
        bindInMemorySlackChannelForTests(
          bindInMemoryEmailChannelForTests(
            bindInMemoryTelegramChannelForTests(
              Test.createTestingModule({
                imports: [NotificationDeliveryModule],
              }),
            ),
          ),
        ),
      )
        .overrideProvider(TeamsWebhookCredentialResolver)
        .useValue({
          isConfigured: async () => true,
          resolve: async () =>
            Object.freeze({
              ok: true as const,
              credential: Object.freeze({
                webhookUrl:
                  'https://defaultenv.e1.environment.api.powerplatform.com/powerautomate/automations/direct/workflows/wfid123/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=TESTSIG_NOT_A_REAL_SECRET',
              }),
            }),
        }),
    ).compile();
    const service = moduleRef.get(NotificationDeliveryService);
    const teams = moduleRef.get(InMemoryTeamsAdapter);
    return { moduleRef, service, teams };
  }

  it('does not become connected from bind alone', async () => {
    const { moduleRef, service } = await createService();
    const bound = await service.bindTeamsChannel({
      workspaceId: 'ws-teams',
      userId: 'user-teams',
      requestedAt: '2026-09-16T10:00:00.000Z',
      actorUserId: 'user-teams',
      actorRole: Role.Admin,
    });
    expect(bound.status).toBe('pending');
    expect(service.getTeamsConnection('ws-teams', 'user-teams').status).toBe('pending');
    await moduleRef.close();
  });

  it('transitions to connected only after a successful mocked webhook send', async () => {
    const { moduleRef, service, teams } = await createService();
    await service.bindTeamsChannel({
      workspaceId: 'ws-teams',
      userId: 'user-teams',
      requestedAt: '2026-09-16T10:00:00.000Z',
      actorUserId: 'user-teams',
      actorRole: Role.Admin,
    });
    const test = await service.sendTestTeamsNotification({
      workspaceId: 'ws-teams',
      userId: 'user-teams',
      requestedAt: '2026-09-16T10:01:00.000Z',
      actorUserId: 'user-teams',
      actorRole: Role.Admin,
    });
    expect(test.outcome).toBe('delivered');
    expect(test.attempts[0]?.channelId).toBe('teams');
    expect(service.getTeamsConnection('ws-teams', 'user-teams').status).toBe('connected');
    expect(teams.listSent()).toHaveLength(1);
    expect(JSON.stringify(test)).not.toMatch(/powerplatform\.com|TESTSIG_NOT_A_REAL_SECRET/i);
    await moduleRef.close();
  });

  it('failed webhook send does not transition Teams to connected', async () => {
    const { moduleRef, service, teams } = await createService();
    await service.bindTeamsChannel({
      workspaceId: 'ws-teams',
      userId: 'user-teams',
      actorUserId: 'user-teams',
      actorRole: Role.Admin,
    });
    teams.failNextSend('teams_webhook_server_error');
    const test = await service.sendTestTeamsNotification({
      workspaceId: 'ws-teams',
      userId: 'user-teams',
      actorUserId: 'user-teams',
      actorRole: Role.Admin,
    });
    expect(test.outcome).toBe('failed');
    expect(service.getTeamsConnection('ws-teams', 'user-teams').status).toBe('pending');
    await moduleRef.close();
  });

  it('deliver() selects the Teams adapter when connected and explicitly routed', async () => {
    const { moduleRef, service, teams } = await createService();
    await service.bindTeamsChannel({
      workspaceId: 'ws-teams',
      userId: 'user-teams',
      actorUserId: 'user-teams',
      actorRole: Role.Admin,
    });
    await service.sendTestTeamsNotification({
      workspaceId: 'ws-teams',
      userId: 'user-teams',
      actorUserId: 'user-teams',
      actorRole: Role.Admin,
    });
    service.upsertPreferences({
      workspaceId: 'ws-teams',
      userId: 'user-teams',
      channels: { teams: true, telegram: false },
      typeRouting: {
        'daily-report': { enabled: true, channels: ['teams'] },
      },
    });
    teams.clearSent();
    const delivered = await service.deliver({
      workspaceId: 'ws-teams',
      userId: 'user-teams',
      type: 'daily-report',
      subject: 'Daily report ready',
      body: 'Report complete',
      requestedAt: '2026-09-16T12:00:00.000Z',
      actorUserId: 'user-teams',
      actorRole: Role.Admin,
    });
    expect(delivered.attempts).toEqual([
      expect.objectContaining({ channelId: 'teams', outcome: 'delivered' }),
    ]);
    expect(teams.listSent()).toHaveLength(1);
    await moduleRef.close();
  });

  it('does not default-route Teams for types that only list telegram', async () => {
    const { moduleRef, service, teams } = await createService();
    await service.bindTeamsChannel({
      workspaceId: 'ws-teams',
      userId: 'user-teams',
      actorUserId: 'user-teams',
      actorRole: Role.Admin,
    });
    await service.sendTestTeamsNotification({
      workspaceId: 'ws-teams',
      userId: 'user-teams',
      actorUserId: 'user-teams',
      actorRole: Role.Admin,
    });
    teams.clearSent();
    const delivered = await service.deliver({
      workspaceId: 'ws-teams',
      userId: 'user-teams',
      type: 'daily-report',
      subject: 'Daily report ready',
      body: 'Report complete',
      requestedAt: '2026-09-16T12:00:00.000Z',
    });
    expect(delivered.attempts.some((attempt) => attempt.channelId === 'teams')).toBe(false);
    expect(teams.listSent()).toHaveLength(0);
    await moduleRef.close();
  });

  it('preserves workspace isolation of Teams connections', async () => {
    const { moduleRef, service } = await createService();
    await service.bindTeamsChannel({
      workspaceId: 'ws-a',
      userId: 'user-a',
      actorUserId: 'user-a',
      actorRole: Role.Admin,
    });
    expect(service.getTeamsConnection('ws-b', 'user-a').status).toBe('not-connected');
    expect(service.getTeamsConnection('ws-a', 'user-a').status).toBe('pending');
    await moduleRef.close();
  });

  it('disconnect returns truthful non-connected state without sending', async () => {
    const { moduleRef, service, teams } = await createService();
    await service.bindTeamsChannel({
      workspaceId: 'ws-teams',
      userId: 'user-teams',
      actorUserId: 'user-teams',
      actorRole: Role.Admin,
    });
    await service.sendTestTeamsNotification({
      workspaceId: 'ws-teams',
      userId: 'user-teams',
      actorUserId: 'user-teams',
      actorRole: Role.Admin,
    });
    teams.clearSent();
    const disconnected = service.disconnectTeams({
      workspaceId: 'ws-teams',
      userId: 'user-teams',
    });
    expect(disconnected.status).toBe('not-connected');
    expect(teams.listSent()).toHaveLength(0);
    await moduleRef.close();
  });

  it('keeps Push reserved and Teams active', async () => {
    const { moduleRef, service } = await createService();
    const reserved = service
      .listChannels()
      .filter((channel) => channel.status === 'reserved-inactive')
      .map((channel) => channel.channelId);
    expect(reserved).toEqual(['push']);
    expect(service.listChannels().find((channel) => channel.channelId === 'teams')?.status).toBe(
      'active',
    );
    await moduleRef.close();
  });
});

describe('production Teams webhook binding', () => {
  it('binds TEAMS_CHANNEL_ADAPTER to ProductionTeamsWebhookNotificationAdapter', async () => {
    const moduleRef = await stubSecretVaultForIsolatedNotificationDelivery(
      Test.createTestingModule({
        imports: [NotificationDeliveryModule],
      }),
    ).compile();
    const adapter = moduleRef.get(TEAMS_CHANNEL_ADAPTER);
    expect(adapter).toBeInstanceOf(ProductionTeamsWebhookNotificationAdapter);
    await moduleRef.close();
  });
});
