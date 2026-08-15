import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type {
  NotificationDeliveryListItemView,
  TelegramConnectionProductView,
  TelegramDiagnosticsView,
  TelegramTestProductView,
} from '../shared/api';
import { TelegramHistoryView } from './TelegramHistoryView';
import { TelegramSettingsView } from './TelegramSettingsView';

const notConnected: TelegramConnectionProductView = {
  status: 'not-connected',
  connected: false,
  chatBound: false,
  pending: false,
  verified: false,
  connectedAt: null,
  updatedAt: '2026-08-15T19:00:00.000Z',
  deepLink: null,
  connectAvailable: true,
  completeAvailable: false,
  verifyAvailable: false,
  testAvailable: false,
  disconnectAvailable: false,
  controlPlane: false,
  transport: 'in-memory',
  botApiUsed: false,
  userEnteredBind: false,
  authorityClass: 'notification-projection',
};

const pending: TelegramConnectionProductView = {
  ...notConnected,
  status: 'pending',
  pending: true,
  connectAvailable: false,
  completeAvailable: true,
  verifyAvailable: true,
  disconnectAvailable: true,
  deepLink: 'tg://connect/tg-token',
};

const connected: TelegramConnectionProductView = {
  ...notConnected,
  status: 'connected',
  connected: true,
  chatBound: true,
  verified: true,
  connectedAt: '2026-08-15T19:01:00.000Z',
  connectAvailable: false,
  testAvailable: true,
  verifyAvailable: true,
  disconnectAvailable: true,
};

const diagnostics: TelegramDiagnosticsView = {
  connection: connected,
  verification: {
    status: 'connected',
    verified: true,
    chatBound: true,
    pending: false,
  },
  lastTelegramDelivery: {
    deliveryId: 'del-1',
    outcome: 'delivered',
    skipReason: null,
    adapterReached: true,
    createdAt: '2026-08-15T19:02:00.000Z',
  },
  telegramTransport: 'in-memory',
  botApiUsed: false,
  controlPlane: false,
  deferredChannelsActivated: false,
  scheduler: false,
  retries: false,
  authorityClass: 'notification-projection',
};

const item: NotificationDeliveryListItemView = {
  deliveryId: 'del-1',
  workspaceId: 'ws-1',
  userId: 'user-1',
  type: 'daily-report',
  reportRunId: null,
  outcome: 'delivered',
  skipReasons: [],
  createdAt: '2026-08-15T19:02:00.000Z',
  authorityClass: 'notification-projection',
  generatesReports: false,
};

const lastTest: TelegramTestProductView = {
  connection: connected,
  delivery: {
    ...item,
    attempts: [{ channelId: 'telegram', outcome: 'delivered', skipReason: null, detail: null }],
    channelDelivery: {
      outcome: 'delivered',
      telegramOutcome: 'delivered',
      telegramAdapterReached: true,
      botApiUsed: false,
      controlPlane: false,
      deferredChannelsActivated: false,
    },
    telegram: {
      status: 'connected',
      connected: true,
      chatBound: true,
      connectedAt: '2026-08-15T19:01:00.000Z',
      updatedAt: '2026-08-15T19:01:00.000Z',
      connectAvailable: false,
      testAvailable: false,
      controlPlane: false,
      transport: 'in-memory',
    },
  },
  controlPlane: false,
  botApiUsed: false,
  authorityClass: 'notification-projection',
};

describe('Telegram UI (PC-07)', () => {
  it('renders connect, pending, connected, test, disconnect, and diagnostics without chat id input', () => {
    const idle = renderToStaticMarkup(
      <MemoryRouter>
        <TelegramSettingsView
          connection={notConnected}
          diagnostics={null}
          history={[]}
          lastTest={null}
          loading={false}
          acting={false}
          error={null}
          onConnect={() => undefined}
          onComplete={() => undefined}
          onVerify={() => undefined}
          onTest={() => undefined}
          onDisconnect={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(idle).toContain('Connect Telegram');
    expect(idle).toContain('cannot trade, pause, or kill');
    expect(idle).toContain('Chat id is never entered');
    expect(idle).not.toContain('Coming Soon');
    expect(idle).not.toContain('name="chatId"');
    expect(idle).not.toContain('Bot API was used');

    const waiting = renderToStaticMarkup(
      <MemoryRouter>
        <TelegramSettingsView
          connection={pending}
          diagnostics={null}
          history={[]}
          lastTest={null}
          loading={false}
          acting={false}
          error={null}
          onConnect={() => undefined}
          onComplete={() => undefined}
          onVerify={() => undefined}
          onTest={() => undefined}
          onDisconnect={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(waiting).toContain('tg://connect/tg-token');
    expect(waiting).toContain('Complete bind');
    expect(waiting).toContain('Pending');

    const ready = renderToStaticMarkup(
      <MemoryRouter>
        <TelegramSettingsView
          connection={connected}
          diagnostics={diagnostics}
          history={[item]}
          lastTest={lastTest}
          loading={false}
          acting={false}
          error={null}
          onConnect={() => undefined}
          onComplete={() => undefined}
          onVerify={() => undefined}
          onTest={() => undefined}
          onDisconnect={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(ready).toContain('Send test notification');
    expect(ready).toContain('Disconnect');
    expect(ready).toContain('Verified');
    expect(ready).toContain('Bot API');
    expect(ready).toContain('Not used');
    expect(ready).not.toContain('Coming Soon');
  });

  it('renders telegram history empty and loading states', () => {
    const empty = renderToStaticMarkup(
      <MemoryRouter>
        <TelegramHistoryView
          items={[]}
          search=""
          outcome="all"
          type="all"
          loading={false}
          error={null}
          onSearch={() => undefined}
          onOutcome={() => undefined}
          onType={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(empty).toContain('No recorded Telegram deliveries');
    expect(empty).not.toContain('Coming Soon');

    const loading = renderToStaticMarkup(
      <MemoryRouter>
        <TelegramSettingsView
          connection={null}
          diagnostics={null}
          history={[]}
          lastTest={null}
          loading
          acting={false}
          error={null}
          onConnect={() => undefined}
          onComplete={() => undefined}
          onVerify={() => undefined}
          onTest={() => undefined}
          onDisconnect={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(loading).toContain('Loading Telegram connection');
  });
});
