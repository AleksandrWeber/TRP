import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type {
  NotificationDeliveryDetailView,
  NotificationDeliveryListItemView,
  NotificationSettingsView as SettingsPayload,
} from '../shared/api';
import { NotificationDetailView } from './NotificationDetailView';
import { NotificationHistoryView } from './NotificationHistoryView';
import { NotificationSettingsView, draftFromSettings } from './NotificationSettingsView';
import { buildDeliveryListQuery } from './notifications';

const settings: SettingsPayload = {
  preferences: {
    workspaceId: 'ws-1',
    userId: 'user-1',
    enabled: true,
    channels: {
      telegram: true,
      email: false,
      slack: false,
      discord: false,
      teams: false,
      push: false,
    },
    typeRouting: [
      {
        type: 'daily-report',
        enabled: true,
        channels: ['telegram'],
        critical: false,
        currentRoutes: [{ channelId: 'telegram', skipReason: 'channel-not-connected' }],
      },
    ],
    schedule: {
      dailyDeliveryTime: '09:00',
      timezone: 'UTC',
      quietHours: { start: '22:00', end: '07:00' },
      criticalBypassQuietHours: true,
    },
    updatedAt: '2026-08-15T18:00:00.000Z',
    authorityClass: 'notification-projection',
    generatesReports: false,
    controlPlane: false,
  },
  channels: [
    {
      channelId: 'telegram',
      status: 'active',
      label: 'Telegram',
      offered: true,
      authorityClass: 'notification-projection',
    },
    {
      channelId: 'email',
      status: 'reserved-inactive',
      label: 'Email',
      offered: false,
      authorityClass: 'notification-projection',
    },
  ],
  telegram: {
    status: 'not-connected',
    connected: false,
    chatBound: false,
    connectedAt: null,
    updatedAt: '2026-08-15T18:00:00.000Z',
    connectAvailable: false,
    testAvailable: false,
    controlPlane: false,
    transport: 'in-memory',
  },
  routing: {
    workspaceId: 'ws-1',
    userId: 'user-1',
    masterEnabled: true,
    typeRouting: [],
    channels: [],
    telegram: {
      status: 'not-connected',
      connected: false,
      chatBound: false,
      connectedAt: null,
      updatedAt: '2026-08-15T18:00:00.000Z',
      connectAvailable: false,
      testAvailable: false,
      controlPlane: false,
      transport: 'in-memory',
    },
    scheduleClock: {
      timezone: 'UTC',
      dailyDeliveryTime: '09:00',
      localTimeHHmm: '18:00',
      quietHoursActive: false,
      dailyDeliveryReached: true,
      evaluatedAt: '2026-08-15T18:00:00.000Z',
      scheduler: false,
      clockKind: 'preference-clock',
    },
    deferredChannelsActivated: false,
    controlPlane: false,
    authorityClass: 'notification-projection',
  },
  scheduleClock: {
    timezone: 'UTC',
    dailyDeliveryTime: '09:00',
    localTimeHHmm: '18:00',
    quietHoursActive: false,
    dailyDeliveryReached: true,
    evaluatedAt: '2026-08-15T18:00:00.000Z',
    scheduler: false,
    clockKind: 'preference-clock',
  },
  deferredChannelsActivated: false,
  generatesReports: false,
  controlPlane: false,
  authorityClass: 'notification-projection',
};

const item: NotificationDeliveryListItemView = {
  deliveryId: 'del-1',
  workspaceId: 'ws-1',
  userId: 'user-1',
  type: 'daily-report',
  reportRunId: 'run-1',
  outcome: 'skipped',
  skipReasons: ['channel-not-connected'],
  createdAt: '2026-08-15T18:00:00.000Z',
  authorityClass: 'notification-projection',
  generatesReports: false,
};

const detail: NotificationDeliveryDetailView = {
  ...item,
  attempts: [
    {
      channelId: 'telegram',
      outcome: 'skipped',
      skipReason: 'channel-not-connected',
      detail: null,
    },
  ],
  channelDelivery: {
    outcome: 'skipped',
    telegramOutcome: 'skipped',
    telegramSkipReason: 'channel-not-connected',
    telegramAdapterReached: false,
    botApiUsed: false,
    controlPlane: false,
    deferredChannelsActivated: false,
  },
  telegram: settings.telegram,
};

describe('Notification UI (PC-06)', () => {
  it('renders settings, channel status, routing, quiet hours, and does not offer a Telegram wizard', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <NotificationSettingsView
          settings={settings}
          draft={draftFromSettings(settings)}
          loading={false}
          saving={false}
          error={null}
          saved={false}
          onDraft={() => undefined}
          onSave={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(html).toContain('Notification settings');
    expect(html).toContain('Enable notifications');
    expect(html).toContain('Quiet hours');
    expect(html).toContain('Daily delivery time');
    expect(html).toContain('Timezone');
    expect(html).toContain('Reserved — not offered');
    expect(html).toContain('Channel not connected');
    expect(html).toContain('Not connected');
    expect(html).not.toContain('Coming Soon');
    expect(html).not.toContain('Connect Telegram');
    expect(html).not.toContain('Send test');
    expect(html).not.toContain('data-testid="notification-connect"');
  });

  it('renders history, empty, loading, and delivery details with skip reasons', () => {
    const history = renderToStaticMarkup(
      <MemoryRouter>
        <NotificationHistoryView
          items={[item]}
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
    expect(history).toContain('Delivery history');
    expect(history).toContain('data-testid="notification-history-link"');
    expect(history).toContain('Channel not connected');

    const empty = renderToStaticMarkup(
      <MemoryRouter>
        <NotificationHistoryView
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
    expect(empty).toContain('No recorded deliveries in this workspace');

    const loading = renderToStaticMarkup(
      <MemoryRouter>
        <NotificationDetailView record={null} loading error={null} />
      </MemoryRouter>,
    );
    expect(loading).toContain('Loading delivery');

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <NotificationDetailView record={detail} loading={false} error={null} />
      </MemoryRouter>,
    );
    expect(html).toContain('Recorded delivery result');
    expect(html).toContain('does not send, retry');
    expect(html).toContain('Bot API was not used');
    expect(html).not.toContain('Coming Soon');
    expect(buildDeliveryListQuery({ search: 'tg', outcome: 'skipped', type: 'all' })).toEqual({
      q: 'tg',
      outcome: 'skipped',
    });
  });
});
