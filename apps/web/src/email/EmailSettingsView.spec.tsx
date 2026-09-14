import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { EmailConnectionProductView, EmailDiagnosticsView } from '../shared/api';
import { EmailSettingsView } from './EmailSettingsView';

const connection: EmailConnectionProductView = {
  status: 'pending',
  connected: false,
  recipientBound: true,
  recipient: 'ops@example.com',
  pending: true,
  verified: false,
  connectedAt: null,
  updatedAt: '2026-09-14T18:00:00.000Z',
  bindAvailable: true,
  testAvailable: true,
  disconnectAvailable: true,
  controlPlane: false,
  transport: 'in-memory',
  smtpUsed: false,
  userEnteredBind: true,
  authorityClass: 'notification-projection',
};

const diagnostics: EmailDiagnosticsView = {
  connection,
  verification: {
    status: 'pending',
    verified: false,
    recipientBound: true,
    pending: true,
  },
  lastEmailDelivery: null,
  emailTransport: 'in-memory',
  smtpUsed: false,
  controlPlane: false,
  deferredChannelsActivated: false,
  scheduler: false,
  retries: false,
  authorityClass: 'notification-projection',
};

describe('Email settings UI', () => {
  it('renders API truth and never shows SMTP passwords', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <EmailSettingsView
          connection={connection}
          diagnostics={diagnostics}
          history={[]}
          lastTest={null}
          recipientDraft="ops@example.com"
          loading={false}
          acting={false}
          error={null}
          onRecipientDraft={() => undefined}
          onBind={() => undefined}
          onTest={() => undefined}
          onDisconnect={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(html).toContain('data-testid="email-settings"');
    expect(html).toContain('Pending');
    expect(html).toContain('ops@example.com');
    expect(html).toContain('Send test notification');
    expect(html).toContain('/connections');
    expect(html).not.toContain('password');
    expect(html).not.toContain('smtp-secret');
  });
});
