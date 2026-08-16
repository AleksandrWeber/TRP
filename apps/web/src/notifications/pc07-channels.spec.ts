import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), 'utf8');
}

describe('PC-07 Notification Channels product path', () => {
  it('registers channel workspace, detail, and history before delivery detail', () => {
    const app = readSrc('../app/App.tsx');
    const channelsIdx = app.indexOf('path="notifications/channels"');
    const detailIdx = app.indexOf('path="notifications/:deliveryId"');
    expect(channelsIdx).toBeGreaterThan(-1);
    expect(app).toContain('path="notifications/channels/:channelId"');
    expect(app).toContain('path="notifications/channels/:channelId/history"');
    expect(app).toContain('NotificationChannelsPage');
    expect(app).toContain('NotificationChannelDetailPage');
    expect(app).toContain('NotificationChannelHistoryPage');
    expect(channelsIdx).toBeLessThan(detailIdx);
    expect(app).toContain('Navigate to="/notifications/channels/telegram"');
  });

  it('exposes channel workspace REST without duplicating Telegram connect', () => {
    const api = readSrc('../shared/api.ts');
    expect(api).toContain('/notification-channels/workspace');
    expect(api).toContain('getNotificationChannelsWorkspace');
    expect(api).toContain('getNotificationChannel');
    expect(api).toContain('getNotificationChannelDiagnostics');
    expect(api).toContain('listNotificationChannelDeliveries');
    expect(api).toContain('/telegram/connect');
    expect(api).not.toContain('api.telegram.org');
    expect(api).not.toContain('smtp.gmail.com');
  });

  it('adds Channels to the paper-first shell without Coming Soon or reserved Send Test', () => {
    const layout = readSrc('../layout/AppLayout.tsx');
    const catalog = readSrc('../shared/product-ui/catalog.ts');
    const home = readSrc('./NotificationChannelsView.tsx');
    const reserved = readSrc('./NotificationChannelDetailView.tsx');
    expect(catalog).toContain("label: 'Notification Channels'");
    expect(catalog).toContain("to: '/notifications/channels'");
    expect(layout).not.toContain("to: '/telegram'");
    expect(layout).not.toContain('Coming Soon');
    expect(home).toContain('Channel-agnostic product');
    expect(home).toContain('Reserved — not offered');
    expect(home).not.toContain('Coming Soon');
    expect(reserved).toContain('Send test is not offered');
    expect(reserved).not.toContain('Coming Soon');
    expect(reserved).not.toContain('data-testid="channel-send-test"');
  });
});
