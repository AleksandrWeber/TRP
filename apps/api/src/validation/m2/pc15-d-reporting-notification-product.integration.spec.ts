import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { OutboxDispatcher } from '../../modules/event-processing';
import type { AnalyticalFactAdmission } from '../../modules/knowledge-lake/domain/analytical-fact-admission';
import { InMemoryKnowledgeLakeIngestionAdapter } from '../../modules/knowledge-lake/ingestion/in-memory-knowledge-lake-ingestion.adapter';
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
import { ReportNotificationConsumerService } from '../../modules/product-flow';

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
    providers: [ReportNotificationConsumerService],
  })
    .overrideProvider(OutboxDispatcher)
    .useValue({
      register: () => undefined,
      stop: async () => undefined,
      start: () => undefined,
    })
    .compile();
}

describe('PC-15 15-d — Reporting → Notification Delivery product flow', () => {
  let reporting: ReportingServicePort;
  let query: ReportingQueryPort;
  let notifications: NotificationServicePort;
  let consumer: ReportNotificationConsumerService;
  let lake: InMemoryKnowledgeLakeIngestionAdapter;

  beforeEach(async () => {
    const app = await compileFlow();
    reporting = app.get(REPORTING_SERVICE_PORT);
    query = app.get(REPORTING_QUERY_PORT);
    notifications = app.get(NOTIFICATION_SERVICE_PORT);
    consumer = app.get(ReportNotificationConsumerService);
    lake = app.get(InMemoryKnowledgeLakeIngestionAdapter);
    reporting.registerDefinition(
      createReportDefinition({
        reportDefinitionId: 'def-15d',
        workspaceId: 'ws-1',
        name: 'Ops Daily',
        kind: 'ops_daily',
        defaultModes: ['paper'],
        metricKeys: ['fact_count', 'display_pnl_projection'],
        createdAt: at,
      }),
    );
    reporting.registerDefinition(
      createReportDefinition({
        reportDefinitionId: 'def-15d-weekly',
        workspaceId: 'ws-1',
        name: 'Ops Weekly',
        kind: 'ops_weekly',
        defaultModes: ['paper'],
        metricKeys: ['fact_count'],
        createdAt: at,
      }),
    );
  });

  it('invokes deliver() when a ReportRun completes and records the routing result', () => {
    admit(lake, { eventId: 'evt-15d-1' });
    const beforeRuns = JSON.stringify(query.listRuns({ workspaceId: 'ws-1' }));

    const result = consumer.requestAndDeliver({
      workspaceId: 'ws-1',
      userId: 'user-1',
      reportDefinitionId: 'def-15d',
      window: createHistoricalWindow({
        from: '2026-08-15T00:00:00.000Z',
        to: '2026-08-16T00:00:00.000Z',
      }),
      modes: ['paper'],
      requestedAt: at,
      reportRunId: 'run-15d-1',
    });

    expect(result.report.outcome).toBe('completed');
    expect(result.delivery).not.toBeNull();
    expect(result.delivery?.type).toBe('daily-report');
    expect(result.delivery?.reportRunId).toBe('run-15d-1');
    expect(result.delivery?.outcome).toBe('skipped');
    expect(
      result.delivery?.attempts.some((attempt) => attempt.skipReason === 'channel-not-connected'),
    ).toBe(true);
    expect(result.projection.invoked).toBe(true);
    expect(result.projection.attached).toBe(true);
    expect(result.projection.reportMutated).toBe(false);
    expect(result.projection.generatesReports).toBe(false);
    expect(result.projection.channelActivated).toBe(false);
    expect(result.projection.authorityClass).toBe('notification-projection');

    expect(result.delivery?.deliveryId).toMatch(/^del-/);
    expect(result.projection.deliveryId).toBe(result.delivery?.deliveryId);

    const stored = query.getRun('run-15d-1');
    expect(stored?.reportRunId).toBe('run-15d-1');
    expect(stored).not.toHaveProperty('deliveryId');
    expect(JSON.stringify(query.listRuns({ workspaceId: 'ws-1' }))).not.toBe(beforeRuns);

    const telegram = notifications.getTelegramConnection('ws-1', 'user-1');
    expect(telegram.status).not.toBe('connected');
    expect(
      notifications.listChannels().find((channel) => channel.channelId === 'email')?.status,
    ).toBe('reserved-inactive');
    expect(
      notifications.listChannels().find((channel) => channel.channelId === 'slack')?.status,
    ).toBe('reserved-inactive');
  });

  it('uses existing weekly-report type for ops_weekly and preserves ReportRun immutability', () => {
    admit(lake, { eventId: 'evt-15d-2' });
    const first = consumer.requestAndDeliver({
      workspaceId: 'ws-1',
      userId: 'user-1',
      reportDefinitionId: 'def-15d-weekly',
      window: createHistoricalWindow({
        from: '2026-08-15T00:00:00.000Z',
        to: '2026-08-16T00:00:00.000Z',
      }),
      modes: ['paper'],
      requestedAt: at,
      reportRunId: 'run-15d-weekly',
    });
    const snapshot = JSON.stringify(query.getRun('run-15d-weekly'));
    const slices = JSON.stringify(query.listAggregations('run-15d-weekly'));

    expect(first.delivery?.type).toBe('weekly-report');
    expect(first.projection.notificationType).toBe('weekly-report');

    const second = consumer.deliverCompletedRun({
      workspaceId: 'ws-1',
      userId: 'user-1',
      reportRunId: 'run-15d-weekly',
      requestedAt: at,
    });

    expect(JSON.stringify(query.getRun('run-15d-weekly'))).toBe(snapshot);
    expect(JSON.stringify(query.listAggregations('run-15d-weekly'))).toBe(slices);
    expect(second.delivery?.type).toBe('weekly-report');
    expect(Object.isFrozen(query.getRun('run-15d-weekly'))).toBe(true);
    expect(second.delivery?.deliveryId).toMatch(/^del-/);
  });

  it('does not invent a report or invoke deliver when Reporting cannot supply the run', () => {
    const result = consumer.deliverCompletedRun({
      workspaceId: 'ws-1',
      userId: 'user-1',
      reportRunId: 'missing-15d',
      requestedAt: at,
    });
    expect(result.report.outcome).toBe('rejected');
    expect(result.delivery).toBeNull();
    expect(result.projection.invoked).toBe(false);
    expect(result.projection.notInvokedReason).toBe('report_not_completed');
    expect(result.projection.reportMutated).toBe(false);
    expect(query.getRun('missing-15d')).toBeNull();
  });

  it('records type-disabled skip through existing routing when that type is disabled', () => {
    admit(lake, { eventId: 'evt-15d-3' });
    notifications.upsertPreferences({
      workspaceId: 'ws-1',
      userId: 'user-1',
      typeRouting: {
        'daily-report': { enabled: false, channels: ['telegram'] },
      },
      updatedAt: at,
    });

    const result = consumer.requestAndDeliver({
      workspaceId: 'ws-1',
      userId: 'user-1',
      reportDefinitionId: 'def-15d',
      window: createHistoricalWindow({
        from: '2026-08-15T00:00:00.000Z',
        to: '2026-08-16T00:00:00.000Z',
      }),
      modes: ['paper'],
      requestedAt: at,
      reportRunId: 'run-15d-disabled',
    });

    expect(result.delivery?.outcome).toBe('skipped');
    expect(
      result.delivery?.attempts.some((attempt) => attempt.skipReason === 'type-disabled'),
    ).toBe(true);
    expect(result.projection.deliveryId).toBe(result.delivery?.deliveryId);
  });
});
