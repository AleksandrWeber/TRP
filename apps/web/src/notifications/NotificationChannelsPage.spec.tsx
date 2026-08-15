import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type {
  NotificationChannelDetailView,
  NotificationChannelDiagnosticsView,
  NotificationChannelsWorkspaceView,
  NotificationDeliveryListItemView,
} from '../shared/api';
import { NotificationChannelDetailView as ChannelDetailView } from './NotificationChannelDetailView';
import { NotificationChannelHistoryView } from './NotificationChannelHistoryView';
import { draftFromWorkspace, NotificationChannelsView } from './NotificationChannelsView';

const clock = {
  timezone: 'UTC',
  dailyDeliveryTime: '09:00',
  localTimeHHmm: '18:00',
  quietHoursActive: false,
  dailyDeliveryReached: true,
  evaluatedAt: '2026-08-15T18:00:00.000Z',
  scheduler: false as const,
  clockKind: 'preference-clock' as const,
};

const workspace: NotificationChannelsWorkspaceView = {
  channels: [
    {
      channelId: 'telegram',
      label: 'Telegram',
      status: 'active',
      offered: true,
      enabled: true,
      configurable: true,
      testAvailable: false,
      connectAvailable: true,
      configurationKind: 'telegram-connection',
      transport: 'in-memory',
      connectionStatus: 'not-connected',
      liveTransportActivated: false,
      botApiUsed: false,
      authorityClass: 'notification-projection',
    },
    {
      channelId: 'email',
      label: 'Email',
      status: 'reserved-inactive',
      offered: false,
      enabled: false,
      configurable: false,
      testAvailable: false,
      connectAvailable: false,
      configurationKind: 'reserved-inactive',
      transport: 'none',
      connectionStatus: 'reserved-inactive',
      liveTransportActivated: false,
      botApiUsed: false,
      authorityClass: 'notification-projection',
    },
    {
      channelId: 'slack',
      label: 'Slack',
      status: 'reserved-inactive',
      offered: false,
      enabled: false,
      configurable: false,
      testAvailable: false,
      connectAvailable: false,
      configurationKind: 'reserved-inactive',
      transport: 'none',
      connectionStatus: 'reserved-inactive',
      liveTransportActivated: false,
      botApiUsed: false,
      authorityClass: 'notification-projection',
    },
    {
      channelId: 'discord',
      label: 'Discord',
      status: 'reserved-inactive',
      offered: false,
      enabled: false,
      configurable: false,
      testAvailable: false,
      connectAvailable: false,
      configurationKind: 'reserved-inactive',
      transport: 'none',
      connectionStatus: 'reserved-inactive',
      liveTransportActivated: false,
      botApiUsed: false,
      authorityClass: 'notification-projection',
    },
    {
      channelId: 'teams',
      label: 'Microsoft Teams',
      status: 'reserved-inactive',
      offered: false,
      enabled: false,
      configurable: false,
      testAvailable: false,
      connectAvailable: false,
      configurationKind: 'reserved-inactive',
      transport: 'none',
      connectionStatus: 'reserved-inactive',
      liveTransportActivated: false,
      botApiUsed: false,
      authorityClass: 'notification-projection',
    },
    {
      channelId: 'push',
      label: 'Push',
      status: 'reserved-inactive',
      offered: false,
      enabled: false,
      configurable: false,
      testAvailable: false,
      connectAvailable: false,
      configurationKind: 'reserved-inactive',
      transport: 'none',
      connectionStatus: 'reserved-inactive',
      liveTransportActivated: false,
      botApiUsed: false,
      authorityClass: 'notification-projection',
    },
  ],
  routingMatrix: {
    rows: [
      {
        type: 'daily-report',
        enabled: true,
        critical: false,
        channels: {
          telegram: true,
          email: false,
          slack: false,
          discord: false,
          teams: false,
          push: false,
        },
        currentSkipReasons: ['channel-not-connected'],
      },
    ],
    channelIds: ['telegram', 'email', 'slack', 'discord', 'teams', 'push'],
    offeredChannelIds: ['telegram'],
    deferredChannelsActivated: false,
    controlPlane: false,
    authorityClass: 'notification-projection',
  },
  timing: {
    producerTiming: 'immediate-on-deliver',
    dailyDeliveryTime: '09:00',
    timezone: 'UTC',
    hourlyDigest: false,
    weeklyDigest: false,
    weekendSuppression: false,
    perTypeFrequency: false,
    perChannelQuietHours: false,
    scheduler: false,
    clockKind: 'preference-clock',
  },
  scheduleClock: clock,
  quietHours: { start: '22:00', end: '07:00' },
  criticalBypassQuietHours: true,
  masterEnabled: true,
  deferredChannelsActivated: false,
  generatesReports: false,
  controlPlane: false,
  authorityClass: 'notification-projection',
};

const emailChannel: NotificationChannelDetailView = {
  ...workspace.channels[1],
  configuration: {
    kind: 'reserved-inactive',
    requiredFields: ['Provider / SMTP', 'Sender', 'Recipient(s)'],
    configurable: false,
    testAvailable: false,
    connectAvailable: false,
    liveTransportActivated: false,
    botApiUsed: false,
    userEnteredBind: false,
  },
  routing: [],
  diagnostics: {
    channelId: 'email',
    connectionState: 'reserved-inactive',
    enabled: false,
    offered: false,
    configurationHealth: 'reserved-inactive',
    lastSuccessfulDeliveryId: null,
    lastFailureDeliveryId: null,
    lastSkipReason: 'channel-reserved',
    lastDeliveryAt: null,
    latencyAvailable: false,
    testAvailable: false,
    liveTransportActivated: false,
    botApiUsed: false,
    scheduler: false,
    authorityClass: 'notification-projection',
  },
};

const diagnostics: NotificationChannelDiagnosticsView = emailChannel.diagnostics;

const item: NotificationDeliveryListItemView = {
  deliveryId: 'del-1',
  workspaceId: 'ws-1',
  userId: 'user-1',
  type: 'daily-report',
  reportRunId: 'run-1',
  outcome: 'skipped',
  skipReasons: ['channel-reserved'],
  createdAt: '2026-08-15T18:00:00.000Z',
  authorityClass: 'notification-projection',
  generatesReports: false,
};

describe('Notification Channels UI (PC-07)', () => {
  it('renders channel cards, routing matrix, frequency, and quiet hours without live reserved transports', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <NotificationChannelsView
          workspace={workspace}
          draft={draftFromWorkspace(workspace)}
          loading={false}
          saving={false}
          error={null}
          saved={false}
          onDraft={() => undefined}
          onSave={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(html).toContain('Notification channels');
    expect(html).toContain('data-testid="channel-card-telegram"');
    expect(html).toContain('data-testid="channel-card-email"');
    expect(html).toContain('Reserved — not offered');
    expect(html).toContain('Routing matrix');
    expect(html).toContain('Immediate on deliver');
    expect(html).toContain('Hourly digest');
    expect(html).toContain('Not offered');
    expect(html).toContain('Quiet hours');
    expect(html).toContain('Global quiet hours only');
    expect(html).not.toContain('Coming Soon');
    expect(html).not.toContain('Send test notification');
    expect(html).not.toContain('name="smtp"');
    expect(html).not.toContain('name="webhook"');
  });

  it('renders reserved channel disclosure, diagnostics, and history without Send Test', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ChannelDetailView
          channel={emailChannel}
          diagnostics={diagnostics}
          history={[item]}
          loading={false}
          error={null}
        />
      </MemoryRouter>,
    );
    expect(html).toContain('Provider / SMTP');
    expect(html).toContain('Reserved — not offered');
    expect(html).toContain('Channel reserved');
    expect(html).toContain('Latency');
    expect(html).toContain('Not available');
    expect(html).not.toContain('Coming Soon');
    expect(html).not.toContain('Send test notification');
    expect(html).not.toContain('data-testid="channel-send-test"');

    const history = renderToStaticMarkup(
      <MemoryRouter>
        <NotificationChannelHistoryView
          channelId="email"
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
    expect(history).toContain('Email delivery history');
    expect(history).toContain('Channel reserved');
  });
});
