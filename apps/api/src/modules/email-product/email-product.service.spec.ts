import { describe, expect, it, vi } from 'vitest';
import { Role } from '../identity/role';
import { InMemoryEmailAdapter } from '../notification-delivery/adapters/in-memory-email.adapter';
import { ProductionSmtpNotificationAdapter } from '../notification-delivery/adapters/production-smtp-notification.adapter';
import { notConnectedEmail } from '../notification-delivery/domain/email-connection';
import { NOTIFICATION_CHANNEL_CATALOG } from '../notification-delivery/domain/notification-channel';
import { EmailProductService } from './email-product.service';

const evaluatedAt = '2026-09-14T18:00:00.000Z';
const PASSWORD = 'must-never-appear-in-email-product';

function harness(adapter = new InMemoryEmailAdapter()) {
  let email = notConnectedEmail('ws-1', 'user-1', evaluatedAt);
  const notifications = {
    listChannels: vi.fn(() => NOTIFICATION_CHANNEL_CATALOG),
    getEmailConnection: vi.fn(() => email),
    bindEmailRecipient: vi.fn((cmd: { recipient: string }) => {
      email = {
        workspaceId: 'ws-1',
        userId: 'user-1',
        status: 'pending' as const,
        recipient: cmd.recipient,
        updatedAt: evaluatedAt,
      };
      return email;
    }),
    disconnectEmail: vi.fn(() => {
      email = notConnectedEmail('ws-1', 'user-1', evaluatedAt);
      return email;
    }),
    sendTestEmailNotification: vi.fn(async () => ({
      deliveryId: 'del-email-1',
      workspaceId: 'ws-1',
      userId: 'user-1',
      type: 'daily-report',
      attempts: [{ channelId: 'email', outcome: 'delivered' }],
      outcome: 'delivered',
      createdAt: evaluatedAt,
    })),
    listDeliveries: vi.fn(() => []),
  };
  const service = new EmailProductService(notifications as never, adapter);
  return { service, notifications };
}

describe('EmailProductService', () => {
  it('bind leaves Email pending and never Connected', () => {
    const { service } = harness();
    const view = service.bind('ws-1', 'user-1', 'ops@example.com');
    expect(view.status).toBe('pending');
    expect(view.connected).toBe(false);
    expect(view.recipient).toBe('ops@example.com');
    expect(JSON.stringify(view)).not.toContain(PASSWORD);
  });

  it('successful test reports Connected without exposing secrets', async () => {
    const { service, notifications } = harness();
    service.bind('ws-1', 'user-1', 'ops@example.com');
    notifications.getEmailConnection.mockReturnValue({
      workspaceId: 'ws-1',
      userId: 'user-1',
      status: 'connected',
      recipient: 'ops@example.com',
      verifiedAt: evaluatedAt,
      connectedAt: evaluatedAt,
      updatedAt: evaluatedAt,
    });
    const test = await service.sendTest('ws-1', 'user-1', {
      userId: 'user-1',
      role: Role.Admin,
    });
    expect(test.connection.connected).toBe(true);
    expect(test.smtpUsed).toBe(false);
    expect(JSON.stringify(test)).not.toContain(PASSWORD);
    expect(JSON.stringify(test)).not.toContain('botToken');
  });

  it('projects smtp honesty when the production adapter is bound', () => {
    const { notifications } = harness();
    const service = new EmailProductService(
      notifications as never,
      new ProductionSmtpNotificationAdapter(),
    );
    const view = service.getConnection('ws-1', 'user-1');
    expect(view.transport).toBe('smtp');
    expect(view.smtpUsed).toBe(true);
    expect(view.connected).toBe(false);
  });

  it('disconnect returns not-connected', () => {
    const { service } = harness();
    service.bind('ws-1', 'user-1', 'ops@example.com');
    const view = service.disconnect('ws-1', 'user-1');
    expect(view.status).toBe('not-connected');
    expect(view.connected).toBe(false);
    expect(view.recipient).toBeNull();
  });
});
