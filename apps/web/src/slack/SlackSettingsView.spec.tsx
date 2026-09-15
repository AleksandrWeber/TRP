import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { SlackConnectionProductView, SlackDiagnosticsView } from '../shared/api';
import { SlackSettingsView } from './SlackSettingsView';

const connection: SlackConnectionProductView = {
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

const diagnostics: SlackDiagnosticsView = {
  connection,
  verification: {
    status: 'pending',
    verified: false,
    bound: true,
    pending: true,
    failed: false,
    lastErrorCode: null,
  },
  lastSlackDelivery: null,
  slackTransport: 'in-memory',
  webhookUsed: false,
  controlPlane: false,
  deferredChannelsActivated: false,
  scheduler: false,
  retries: false,
  authorityClass: 'notification-projection',
};

describe('Slack settings UI', () => {
  it('renders API truth and never shows webhook URLs', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <SlackSettingsView
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
    expect(html).toContain('data-testid="slack-settings"');
    expect(html).toContain('Pending');
    expect(html).toContain('Send test');
    expect(html).toContain('/connections');
    expect(html).not.toContain('hooks.slack.com');
    expect(html).not.toContain('webhookUrl');
    expect(html).not.toContain('TEAM/HOOK/TOKEN');
  });
});
