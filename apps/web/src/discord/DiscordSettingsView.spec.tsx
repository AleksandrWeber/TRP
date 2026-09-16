import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { DiscordConnectionProductView, DiscordDiagnosticsView } from '../shared/api';
import { DiscordSettingsView } from './DiscordSettingsView';

const connection: DiscordConnectionProductView = {
  status: 'pending',
  connected: false,
  bound: true,
  pending: true,
  verified: false,
  failed: false,
  lastErrorCode: null,
  connectedAt: null,
  boundAt: '2026-09-15T18:00:00.000Z',
  updatedAt: '2026-09-15T18:00:00.000Z',
  bindAvailable: true,
  testAvailable: true,
  disconnectAvailable: true,
  controlPlane: false,
  transport: 'in-memory',
  webhookUsed: false,
  userEnteredBind: false,
  authorityClass: 'notification-projection',
};

const diagnostics: DiscordDiagnosticsView = {
  connection,
  verification: {
    status: 'pending',
    verified: false,
    bound: true,
    pending: true,
    failed: false,
    lastErrorCode: null,
  },
  lastDiscordDelivery: null,
  discordTransport: 'in-memory',
  webhookUsed: false,
  controlPlane: false,
  deferredChannelsActivated: false,
  scheduler: false,
  retries: false,
  authorityClass: 'notification-projection',
};

describe('Discord settings UI', () => {
  it('renders API truth and never shows webhook URLs', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <DiscordSettingsView
          connection={connection}
          diagnostics={diagnostics}
          history={[]}
          lastTest={null}
          loading={false}
          acting={false}
          error={null}
          onBind={() => undefined}
          onTest={() => undefined}
          onDisconnect={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(html).toContain('data-testid="discord-settings"');
    expect(html).toContain('Pending');
    expect(html).toContain('Send test');
    expect(html).toContain('/connections');
    expect(html).not.toContain('discord.com/api/webhooks');
    expect(html).not.toContain('webhookUrl');
  });
});
