import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), 'utf8');
}

describe('PC-06 Notification product path', () => {
  it('registers notification settings, history, and detail routes', () => {
    const app = readSrc('../app/App.tsx');
    expect(app).toContain('path="notifications"');
    expect(app).toContain('path="notifications/history"');
    expect(app).toContain('path="notifications/:deliveryId"');
    expect(app).toContain('NotificationSettingsPage');
    expect(app).toContain('NotificationHistoryPage');
    expect(app).toContain('NotificationDetailPage');
  });

  it('exposes NotificationServicePort over notification REST, not Telegram connect', () => {
    const api = readSrc('../shared/api.ts');
    expect(api).toContain('/notification-settings');
    expect(api).toContain('/notification-preferences');
    expect(api).toContain('/notification-deliveries');
    expect(api).toContain('/notification-channels');
    expect(api).toContain('/notification-routing');
    expect(api).toContain('getNotificationSettings');
    expect(api).toContain('upsertNotificationPreferences');
  });

  it('adds Notifications to the paper-first shell without Coming Soon or a wizard', () => {
    const layout = readSrc('../layout/AppLayout.tsx');
    const catalog = readSrc('../shared/product-ui/catalog.ts');
    const home = readSrc('./NotificationSettingsView.tsx');
    const detail = readSrc('./NotificationDetailView.tsx');
    expect(catalog).toContain("label: 'Notifications'");
    expect(catalog).toContain("to: '/notifications'");
    expect(layout).not.toContain('Coming Soon');
    expect(home).toContain('Delivery Layer only');
    expect(home).not.toContain('Coming Soon');
    expect(home).not.toContain('Connect Telegram');
    expect(detail).toContain('does not send, retry');
    expect(detail).not.toContain('Coming Soon');
  });
});
