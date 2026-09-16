import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { PushConnectionProductView, PushDiagnosticsView } from '../shared/api';
import { PushSettingsView } from './PushSettingsView';

const connection: PushConnectionProductView = {
  status: 'pending',
  connected: false,
  bound: true,
  pending: true,
  verified: false,
  failed: false,
  lastErrorCode: null,
  connectedAt: null,
  boundAt: '2026-09-16T12:00:00.000Z',
  updatedAt: '2026-09-16T12:00:00.000Z',
  bindAvailable: true,
  testAvailable: true,
  disconnectAvailable: true,
  controlPlane: false,
  transport: 'in-memory',
  pushUsed: false,
  adapterReached: false,
  userEnteredBind: false,
  authorityClass: 'notification-projection',
};

const diagnostics: PushDiagnosticsView = {
  connection,
  verification: {
    status: 'pending',
    verified: false,
    bound: true,
    pending: true,
    failed: false,
    lastErrorCode: null,
  },
  lastPushDelivery: null,
  pushTransport: 'in-memory',
  pushUsed: false,
  controlPlane: false,
  deferredChannelsActivated: false,
  scheduler: false,
  retries: false,
  authorityClass: 'notification-projection',
};

describe('Push settings UI', () => {
  it('renders API truth and never claims FIV or shows VAPID secrets', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <PushSettingsView
          connection={connection}
          diagnostics={diagnostics}
          history={[]}
          lastTest={null}
          loading={false}
          acting={false}
          error={null}
          onBind={() => undefined}
          onRegister={() => undefined}
          onTest={() => undefined}
          onDisconnect={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(html).toContain('data-testid="push-settings"');
    expect(html).toContain('Pending');
    expect(html).toContain('Register browser subscription');
    expect(html).toContain('Send test');
    expect(html).toContain('/connections');
    expect(html).toContain('FIV');
    expect(html).not.toContain('privateKey');
    expect(html).not.toContain('vapidPrivate');
  });
});
