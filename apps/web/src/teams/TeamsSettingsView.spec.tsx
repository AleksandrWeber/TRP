import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { TeamsConnectionProductView, TeamsDiagnosticsView } from '../shared/api';
import { TeamsSettingsView } from './TeamsSettingsView';

const connection: TeamsConnectionProductView = {
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

const diagnostics: TeamsDiagnosticsView = {
  connection,
  verification: {
    status: 'pending',
    verified: false,
    bound: true,
    pending: true,
    failed: false,
    lastErrorCode: null,
  },
  lastTeamsDelivery: null,
  teamsTransport: 'in-memory',
  webhookUsed: false,
  controlPlane: false,
  deferredChannelsActivated: false,
  scheduler: false,
  retries: false,
  authorityClass: 'notification-projection',
};

describe('Teams settings UI', () => {
  it('renders API truth and never shows webhook URLs', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <TeamsSettingsView
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
    expect(html).toContain('data-testid="teams-settings"');
    expect(html).toContain('Pending');
    expect(html).toContain('Send test');
    expect(html).toContain('/connections');
    expect(html).not.toContain('teams.com/api/webhooks');
    expect(html).not.toContain('webhookUrl');
  });
});
