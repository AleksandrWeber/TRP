import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OutboxDispatcher } from '../../modules/event-processing';
import type { AnalyticalFactAdmission } from '../../modules/knowledge-lake/domain/analytical-fact-admission';
import { InMemoryKnowledgeLakeIngestionAdapter } from '../../modules/knowledge-lake/ingestion/in-memory-knowledge-lake-ingestion.adapter';
import { AiAnalyticsModule } from '../../modules/ai-analytics/ai-analytics.module';
import {
  MARKET_QUALIFICATION_QUERY_PORT,
  type MarketQualificationQueryPort,
} from '../../modules/market-qualification/ports/market-qualification.port';
import { MARKET_PROFILE_QUERY_PORT } from '../../modules/market-profile/ports/market-profile.port';
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
  STRATEGY_RUNTIME_PORT,
  type StrategyRuntimePort,
} from '../../modules/strategy-runtime/ports/strategy-runtime.port';
import { TRADING_SESSION_REPOSITORY } from '../../modules/trading-session/persistence/trading-session.repository';
import {
  OperatorProjectionService,
  ReportNarrativeConsumerService,
  ReportNotificationConsumerService,
} from '../../modules/product-flow';

const at = '2026-08-15T18:00:00.000Z';

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
    tradingSessionId: 'session-1',
    payload: { kind: 'marker', displayPnl: 4 },
    schemaVersion: '1',
    ...overrides,
  });
  expect(result.outcome).toBe('admitted');
}

async function compileFlow() {
  return Test.createTestingModule({
    imports: [ReportingModule, AiAnalyticsModule, NotificationDeliveryModule],
    providers: [
      ReportNarrativeConsumerService,
      ReportNotificationConsumerService,
      OperatorProjectionService,
      {
        provide: TRADING_SESSION_REPOSITORY,
        useValue: {
          findByWorkspaceId: vi.fn(async () => [
            Object.freeze({ id: 'session-1', status: 'running', origin: 'strategy' }),
          ]),
        },
      },
      {
        provide: STRATEGY_RUNTIME_PORT,
        useValue: {
          getLifecycle: vi.fn(async () =>
            Object.freeze({
              workspaceId: 'ws-1',
              sessionId: 'session-1',
              state: 'ARMED',
              fencingToken: 1,
              acceptsTicks: true,
              draining: false,
            }),
          ),
        } satisfies Partial<StrategyRuntimePort>,
      },
      {
        provide: MARKET_QUALIFICATION_QUERY_PORT,
        useValue: {
          listQualificationRuns: vi.fn(() => [
            Object.freeze({
              qualificationRunId: 'qual-1',
              workspaceId: 'ws-1',
              targetId: 'qual-tgt:ws-1:scope-binance:BTCUSDT',
              status: 'completed',
              modeContext: 'paper',
              createdAt: at,
              authorityClass: 'research_artifact',
              forcesTrade: false as const,
              authorizesSession: false as const,
            }),
          ]),
        } satisfies Partial<MarketQualificationQueryPort>,
      },
      {
        provide: MARKET_PROFILE_QUERY_PORT,
        useValue: {
          getLatestProfile: vi.fn(() =>
            Object.freeze({
              marketProfileId: 'profile-1',
              version: 1,
              qualificationRunId: 'qual-1',
            }),
          ),
        } as never,
      },
    ],
  })
    .overrideProvider(OutboxDispatcher)
    .useValue({
      register: () => undefined,
      stop: async () => undefined,
      start: () => undefined,
    })
    .compile();
}

describe('PC-15 15-f — Dashboard and Command Center product projections', () => {
  let reporting: ReportingServicePort;
  let query: ReportingQueryPort;
  let notifications: NotificationServicePort;
  let narratives: ReportNarrativeConsumerService;
  let deliveries: ReportNotificationConsumerService;
  let operator: OperatorProjectionService;
  let lake: InMemoryKnowledgeLakeIngestionAdapter;

  beforeEach(async () => {
    const app = await compileFlow();
    reporting = app.get(REPORTING_SERVICE_PORT);
    query = app.get(REPORTING_QUERY_PORT);
    notifications = app.get(NOTIFICATION_SERVICE_PORT);
    narratives = app.get(ReportNarrativeConsumerService);
    deliveries = app.get(ReportNotificationConsumerService);
    operator = app.get(OperatorProjectionService);
    lake = app.get(InMemoryKnowledgeLakeIngestionAdapter);
    reporting.registerDefinition(
      createReportDefinition({
        reportDefinitionId: 'def-15f',
        workspaceId: 'ws-1',
        name: 'Ops Daily',
        kind: 'ops_daily',
        defaultModes: ['paper'],
        metricKeys: ['fact_count', 'display_pnl_projection'],
        createdAt: at,
      }),
    );
  });

  it('projects completed flows onto existing Dashboard and Command Center reads', async () => {
    admit(lake, { eventId: 'evt-15f-1' });

    const report = reporting.requestReportRun({
      workspaceId: 'ws-1',
      reportDefinitionId: 'def-15f',
      window: createHistoricalWindow({
        from: '2026-08-15T00:00:00.000Z',
        to: '2026-08-16T00:00:00.000Z',
      }),
      modes: ['paper'],
      tradingSessionId: 'session-1',
      requestedAt: at,
      reportRunId: 'run-15f-1',
    });
    expect(report.outcome).toBe('completed');
    const runSnapshot = JSON.stringify(query.getRun('run-15f-1'));

    const narrative = narratives.narrateCompletedRun({
      workspaceId: 'ws-1',
      reportRunId: 'run-15f-1',
      requestedAt: at,
    });
    expect(narrative.attachment.attached).toBe(true);
    expect(narrative.attachment.narrativeUnavailable).toBe(false);

    const delivery = deliveries.deliverCompletedRun({
      workspaceId: 'ws-1',
      userId: 'user-1',
      reportRunId: 'run-15f-1',
      requestedAt: at,
    });
    expect(delivery.projection.invoked).toBe(true);
    expect(delivery.projection.reportMutated).toBe(false);

    const listed = notifications.listDeliveries({
      workspaceId: 'ws-1',
      reportRunId: 'run-15f-1',
    });
    expect(listed).toHaveLength(1);
    expect(listed[0]?.outcome).toBe('skipped');

    const dashboard = await operator.projectDashboard('ws-1', at);
    expect(dashboard.authorityClass).toBe('projection');
    expect(dashboard.reportMutated).toBe(false);
    expect(dashboard.newSoT).toBe(false);
    expect(dashboard.paperSessions[0]?.sessionId).toBe('session-1');
    expect(dashboard.runtime[0]?.workerState).toBe('ARMED');
    expect(dashboard.reportRuns[0]?.reportRunId).toBe('run-15f-1');
    expect(dashboard.reportRuns[0]?.narrativeAttached).toBe(true);
    expect(dashboard.deliveries[0]?.deliveryId).toBe(listed[0]?.deliveryId);
    expect(dashboard.qualification?.qualificationRunId).toBe('qual-1');
    expect(dashboard.profile?.marketProfileId).toBe('profile-1');

    const session = await operator.projectSession('ws-1', 'session-1');
    expect(session.latestReport?.reportRunId).toBe('run-15f-1');
    expect(session.delivery?.outcome).toBe('skipped');
    expect(session.delivery?.telegramAdapterReached).toBe(false);

    expect(JSON.stringify(query.getRun('run-15f-1'))).toBe(runSnapshot);
    expect(query.getRun('run-15f-1')).not.toHaveProperty('narrativeId');
    expect(query.getRun('run-15f-1')).not.toHaveProperty('deliveryId');
  });
});
