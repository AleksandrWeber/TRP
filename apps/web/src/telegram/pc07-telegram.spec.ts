import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), 'utf8');
}

describe('PC-07 Telegram channel path', () => {
  it('keeps Telegram settings as the telegram channel page', () => {
    const app = readSrc('../app/App.tsx');
    const detail = readSrc('../notifications/NotificationChannelDetailPage.tsx');
    expect(app).toContain('path="telegram"');
    expect(app).toContain('path="telegram/history"');
    expect(app).toContain('Navigate to="/notifications/channels/telegram"');
    expect(detail).toContain('TelegramSettingsPage');
  });

  it('exposes existing Telegram operations over telegram REST', () => {
    const api = readSrc('../shared/api.ts');
    expect(api).toContain('/telegram/connection');
    expect(api).toContain('/telegram/connect');
    expect(api).toContain('/telegram/complete');
    expect(api).toContain('/telegram/verify');
    expect(api).toContain('/telegram/disconnect');
    expect(api).toContain('/telegram/test');
    expect(api).toContain('/telegram/diagnostics');
    expect(api).toContain('/telegram/deliveries');
    expect(api).toContain('connectTelegram');
    expect(api).toContain('completeTelegramConnect');
    expect(api).toContain('sendTelegramTest');
    expect(api).not.toContain('api.telegram.org');
    expect(api).not.toContain('node-telegram-bot-api');
  });

  it('keeps Telegram connect on the telegram channel without chat id input', () => {
    const layout = readSrc('../layout/AppLayout.tsx');
    const home = readSrc('./TelegramSettingsView.tsx');
    expect(layout).toContain("label: 'Channels'");
    expect(layout).not.toContain('Coming Soon');
    expect(home).toContain('Connect Telegram');
    expect(home).toContain('cannot trade, pause, or kill');
    expect(home).not.toContain('Coming Soon');
    expect(home).not.toContain('name="chatId"');
    expect(home).not.toContain('api.telegram.org');
  });
});
