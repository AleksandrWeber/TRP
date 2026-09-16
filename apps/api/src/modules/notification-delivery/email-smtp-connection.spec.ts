import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { Role } from '../identity/role';
import { InMemoryEmailAdapter } from './adapters/in-memory-email.adapter';
import { ProductionSmtpNotificationAdapter } from './adapters/production-smtp-notification.adapter';
import { NotificationDeliveryModule } from './notification-delivery.module';
import { NotificationDeliveryService } from './notification-delivery.service';
import {
  bindInMemoryEmailChannelForTests,
  bindInMemoryTelegramChannelForTests,
  stubSecretVaultForIsolatedNotificationDelivery,
} from './notification-delivery.test-harness';
import { EMAIL_CHANNEL_ADAPTER } from './ports/notification.port';

describe('Email SMTP connection and delivery', () => {
  async function createService() {
    const moduleRef = await stubSecretVaultForIsolatedNotificationDelivery(
      bindInMemoryEmailChannelForTests(
        bindInMemoryTelegramChannelForTests(
          Test.createTestingModule({
            imports: [NotificationDeliveryModule],
          }),
        ),
      ),
    ).compile();
    const service = moduleRef.get(NotificationDeliveryService);
    const email = moduleRef.get(InMemoryEmailAdapter);
    return { moduleRef, service, email };
  }

  it('does not become connected from recipient bind alone', async () => {
    const { moduleRef, service } = await createService();
    const bound = service.bindEmailRecipient({
      workspaceId: 'ws-mail',
      userId: 'user-mail',
      recipient: 'ops@example.com',
      requestedAt: '2026-09-14T10:00:00.000Z',
    });
    expect(bound.status).toBe('pending');
    expect(bound.recipient).toBe('ops@example.com');
    expect(service.getEmailConnection('ws-mail', 'user-mail').status).toBe('pending');
    await moduleRef.close();
  });

  it('transitions to connected only after a successful mocked SMTP send', async () => {
    const { moduleRef, service, email } = await createService();
    service.bindEmailRecipient({
      workspaceId: 'ws-mail',
      userId: 'user-mail',
      recipient: 'ops@example.com',
      requestedAt: '2026-09-14T10:00:00.000Z',
    });
    const test = await service.sendTestEmailNotification({
      workspaceId: 'ws-mail',
      userId: 'user-mail',
      requestedAt: '2026-09-14T10:01:00.000Z',
      actorUserId: 'user-mail',
      actorRole: Role.Admin,
    });
    expect(test.outcome).toBe('delivered');
    expect(test.attempts[0]?.channelId).toBe('email');
    expect(service.getEmailConnection('ws-mail', 'user-mail').status).toBe('connected');
    expect(email.listSent()[0]?.recipient).toBe('ops@example.com');
    expect(JSON.stringify(test)).not.toMatch(/password|secret/i);
    await moduleRef.close();
  });

  it('failed SMTP send does not transition Email to connected', async () => {
    const { moduleRef, service, email } = await createService();
    service.bindEmailRecipient({
      workspaceId: 'ws-mail',
      userId: 'user-mail',
      recipient: 'ops@example.com',
    });
    email.failNextSend('smtp_unauthorized');
    const test = await service.sendTestEmailNotification({
      workspaceId: 'ws-mail',
      userId: 'user-mail',
      actorUserId: 'user-mail',
      actorRole: Role.Admin,
    });
    expect(test.outcome).toBe('failed');
    expect(service.getEmailConnection('ws-mail', 'user-mail').status).toBe('pending');
    await moduleRef.close();
  });

  it('deliver() selects the Email adapter when connected and routed', async () => {
    const { moduleRef, service, email } = await createService();
    service.bindEmailRecipient({
      workspaceId: 'ws-mail',
      userId: 'user-mail',
      recipient: 'ops@example.com',
    });
    await service.sendTestEmailNotification({
      workspaceId: 'ws-mail',
      userId: 'user-mail',
      actorUserId: 'user-mail',
      actorRole: Role.Admin,
    });
    service.upsertPreferences({
      workspaceId: 'ws-mail',
      userId: 'user-mail',
      channels: { email: true, telegram: false },
      typeRouting: {
        'daily-report': { enabled: true, channels: ['email'] },
      },
    });
    email.clearSent();
    const delivered = await service.deliver({
      workspaceId: 'ws-mail',
      userId: 'user-mail',
      type: 'daily-report',
      subject: 'Daily report ready',
      body: 'Report complete',
      requestedAt: '2026-09-14T12:00:00.000Z',
      actorUserId: 'user-mail',
      actorRole: Role.Admin,
    });
    expect(delivered.attempts).toEqual([
      expect.objectContaining({ channelId: 'email', outcome: 'delivered' }),
    ]);
    expect(email.listSent()).toHaveLength(1);
    await moduleRef.close();
  });

  it('preserves workspace isolation of Email connections', async () => {
    const { moduleRef, service } = await createService();
    service.bindEmailRecipient({
      workspaceId: 'ws-a',
      userId: 'user-a',
      recipient: 'a@example.com',
    });
    expect(service.getEmailConnection('ws-b', 'user-a').status).toBe('not-connected');
    expect(service.getEmailConnection('ws-a', 'user-a').recipient).toBe('a@example.com');
    await moduleRef.close();
  });

  it('disconnect returns truthful non-connected state without sending', async () => {
    const { moduleRef, service, email } = await createService();
    service.bindEmailRecipient({
      workspaceId: 'ws-mail',
      userId: 'user-mail',
      recipient: 'ops@example.com',
    });
    await service.sendTestEmailNotification({
      workspaceId: 'ws-mail',
      userId: 'user-mail',
      actorUserId: 'user-mail',
      actorRole: Role.Admin,
    });
    email.clearSent();
    const disconnected = service.disconnectEmail({
      workspaceId: 'ws-mail',
      userId: 'user-mail',
    });
    expect(disconnected.status).toBe('not-connected');
    expect(disconnected.recipient).toBeUndefined();
    expect(email.listSent()).toHaveLength(0);
    await moduleRef.close();
  });

  it('keeps Teams/Push reserved while Slack and Discord stay active', async () => {
    const { moduleRef, service } = await createService();
    const reserved = service
      .listChannels()
      .filter((channel) => channel.status === 'reserved-inactive')
      .map((channel) => channel.channelId);
    expect(service.listChannels().find((channel) => channel.channelId === 'slack')?.status).toBe(
      'active',
    );
    expect(service.listChannels().find((channel) => channel.channelId === 'discord')?.status).toBe(
      'active',
    );
    expect(reserved).toEqual(['teams', 'push']);
    await moduleRef.close();
  });
});

describe('production Email SMTP binding', () => {
  it('binds EMAIL_CHANNEL_ADAPTER to ProductionSmtpNotificationAdapter', async () => {
    const moduleRef = await stubSecretVaultForIsolatedNotificationDelivery(
      Test.createTestingModule({
        imports: [NotificationDeliveryModule],
      }),
    ).compile();
    const adapter = moduleRef.get(EMAIL_CHANNEL_ADAPTER);
    expect(adapter).toBeInstanceOf(ProductionSmtpNotificationAdapter);
    await moduleRef.close();
  });
});
