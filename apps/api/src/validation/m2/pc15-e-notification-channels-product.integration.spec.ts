import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { OutboxDispatcher } from '../../modules/event-processing';
import type { AnalyticalFactAdmission } from '../../modules/knowledge-lake/domain/analytical-fact-admission';
import { InMemoryKnowledgeLakeIngestionAdapter } from '../../modules/knowledge-lake/ingestion/in-memory-knowledge-lake-ingestion.adapter';
import { InMemoryTelegramAdapter } from '../../modules/notification-delivery/adapters/in-memory-telegram.adapter';
import { NotificationDeliveryModule } from '../../modules/notification-delivery/notification-delivery.module';
import {
  NOTIFICATION_SERVICE_PORT,
  type NotificationServicePort,
} from '../../modules/notification-delivery/ports/notification.port';
import { ReportingModule } from '../../modules/reporting/reporting.module';
import { createHistoricalWindow } from '../../modules/reporting/domain/historical-window';
import { createReportDefinition } from '../../modules/reporting/domain/report-definition';
import {
  REPORTING_QUERY_PORT,
  REPORTING_SERVICE_PORT,
  type ReportingQueryPort,
  type ReportingServicePort,
} from '../../modules/reporting/ports/reporting.port';
import {
  NotificationChannelDispatchService,
  ReportNotificationConsumerService,
} from '../../modules/product-flow';

const at = '2026-08-15T17:00:00.000Z';

function admit(
  lake: InMemoryKnowledgeLakeIngestionAdapter,
  overrides: Partial<AnalyticalFactAdmission> & Pick<AnalyticalFactAdmission, 'eventId'>,
): void {
  const result = lake.admit({
    occurredAt: '2026-08-15T10:00:00.000Z',
    producer: 'trading-session',
    category: 'Trading',
    mode: 'paper',
    workspaceId: 'ws-1',
    payload: { kind: 'marker', displayPnl: 4 },
    schemaVersion: '1',
    ...overrides,
  });
  expect(result.outcome).toBe('admitted');
}

async function compileFlow() {
  return Test.createTestingModule({
    imports: [ReportingModule, NotificationDeliveryModule],
    providers: [ReportNotificationConsumerService, NotificationChannelDispatchService],
  })
    .overrideProvider(OutboxDispatcher)
    .useValue({
      register: () => undefined,
      stop: async () => undefined,
      start: () => undefined,
    })
    .compile();
}

describe('PC-15 15-e — Notification Delivery → Channels product flow', () => {
  let reporting: ReportingServicePort;
  let query: ReportingQueryPort;
  let notifications: NotificationServicePort;
  let telegram: InMemoryTelegramAdapter;
  let reports: ReportNotificationConsumerService;
  let channels: NotificationChannelDispatchService;
  let lake: InMemoryKnowledgeLakeIngestionAdapter;

  beforeEach(async () => {
    const app = await compileFlow();
    reporting = app.get(REPORTING_SERVICE_PORT);
    query = app.get(REPORTING_QUERY_PORT);
    notifications = app.get(NOTIFICATION_SERVICE_PORT);
    telegram = app.get(InMemoryTelegramAdapter);
    reports = app.get(ReportNotificationConsumerService);
    channels = app.get(NotificationChannelDispatchService);
    lake = app.get(InMemoryKnowledgeLakeIngestionAdapter);
    telegram.clearSent();
    reporting.registerDefinition(
      createReportDefinition({
        reportDefinitionId: 'def-15e',
        workspaceId: 'ws-1',
        name: 'Ops Daily',
        kind: 'ops_daily',
        defaultModes: ['paper'],
        metricKeys: ['fact_count', 'display_pnl_projection'],
        createdAt: at,
      }),
    );
  });

  it('reaches the in-memory Telegram adapter after existing connect/complete and records delivery', () => {
    const result = channels.bindAndDispatch(
      {
        workspaceId: 'ws-1',
        userId: 'user-1',
        platformChatId: 'chat-15e',
        requestedAt: at,
      },
      {
        workspaceId: 'ws-1',
        userId: 'user-1',
        type: 'daily-report',
        subject: 'Report run-15e completed',
        body: 'Delivery only — Notification Delivery does not generate reports.',
        reportRunId: 'run-15e',
        requestedAt: at,
      },
    );

    expect(result.connection.status).toBe('connected');
    expect(result.connection.chatId).toBe('chat-15e');
    expect(result.delivery?.outcome).toBe('delivered');
    expect(
      result.delivery?.attempts.some(
        (attempt) => attempt.channelId === 'telegram' && attempt.outcome === 'delivered',
      ),
    ).toBe(true);
    expect(result.projection.telegramAdapterReached).toBe(true);
    expect(result.projection.telegramTransport).toBe('in-memory');
    expect(result.projection.botApiUsed).toBe(false);
    expect(result.projection.controlPlane).toBe(false);
    expect(telegram.listSent()).toHaveLength(1);
    expect(telegram.listSent()[0]?.chatId).toBe('chat-15e');
    expect(telegram.listSent()[0]?.subject).toContain('run-15e');
  });

  it('keeps reserved channels reserved-inactive with the documented skip', () => {
    notifications.upsertPreferences({
      workspaceId: 'ws-1',
      userId: 'user-1',
      typeRouting: {
        'daily-report': { enabled: true, channels: ['telegram', 'email', 'slack'] },
      },
      updatedAt: at,
    });

    const result = channels.bindAndDispatch(
      {
        workspaceId: 'ws-1',
        userId: 'user-1',
        platformChatId: 'chat-15e-reserved',
        requestedAt: at,
      },
      {
        workspaceId: 'ws-1',
        userId: 'user-1',
        type: 'daily-report',
        subject: 'Report reserved skip',
        body: 'Delivery only.',
        requestedAt: at,
      },
    );

    expect(result.delivery?.outcome).toBe('delivered');
    expect(
      result.delivery?.attempts
        .filter((attempt) => attempt.skipReason === 'channel-reserved')
        .map((attempt) => attempt.channelId),
    ).toEqual(['email', 'slack']);
    expect(result.projection.deferredChannelsActivated).toBe(false);
    expect(result.projection.channelActivated).toBe(false);
    expect(
      notifications.listChannels().find((channel) => channel.channelId === 'email')?.status,
    ).toBe('reserved-inactive');
    expect(
      notifications.listChannels().find((channel) => channel.channelId === 'discord')?.status,
    ).toBe('reserved-inactive');
    expect(
      notifications.listChannels().find((channel) => channel.channelId === 'teams')?.status,
    ).toBe('reserved-inactive');
    expect(
      notifications.listChannels().find((channel) => channel.channelId === 'push')?.status,
    ).toBe('reserved-inactive');
  });

  it('does not reach the Telegram adapter when the channel is not connected', () => {
    const result = channels.dispatch({
      workspaceId: 'ws-1',
      userId: 'user-1',
      type: 'daily-report',
      subject: 'Unconnected',
      body: 'Delivery only.',
      requestedAt: at,
    });
    expect(result.delivery?.outcome).toBe('skipped');
    expect(result.projection.telegramAdapterReached).toBe(false);
    expect(result.projection.telegramSkipReason).toBe('channel-not-connected');
    expect(telegram.listSent()).toHaveLength(0);
  });

  it('lets a completed ReportRun reach the in-memory Telegram adapter without mutating the run', () => {
    admit(lake, { eventId: 'evt-15e-1' });
    channels.bindInMemoryTelegram({
      workspaceId: 'ws-1',
      userId: 'user-1',
      platformChatId: 'chat-15e-report',
      requestedAt: at,
    });

    const result = reports.requestAndDeliver({
      workspaceId: 'ws-1',
      userId: 'user-1',
      reportDefinitionId: 'def-15e',
      window: createHistoricalWindow({
        from: '2026-08-15T00:00:00.000Z',
        to: '2026-08-16T00:00:00.000Z',
      }),
      modes: ['paper'],
      requestedAt: at,
      reportRunId: 'run-15e-report',
    });

    expect(result.report.outcome).toBe('completed');
    expect(result.delivery?.outcome).toBe('delivered');
    expect(result.projection.telegramAdapterReached).toBe(true);
    expect(result.projection.reportMutated).toBe(false);
    expect(result.projection.channelActivated).toBe(false);
    expect(query.getRun('run-15e-report')).not.toHaveProperty('deliveryId');
    expect(telegram.listSent().some((message) => message.chatId === 'chat-15e-report')).toBe(true);
  });
});
