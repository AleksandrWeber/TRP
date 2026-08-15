import { describe, expect, it, vi } from 'vitest';
import type { DeliveryResult } from '../notification-delivery/domain/delivery';
import type { ReportRun } from '../reporting/domain/report-run';
import type { ReportRunResult } from '../reporting/ports/reporting.port';
import { ReportNotificationConsumerService } from './report-notification-consumer.service';

const at = '2026-08-15T17:00:00.000Z';

function completedRun(kind: 'ops_daily' | 'ops_weekly' = 'ops_daily'): ReportRun {
  return Object.freeze({
    reportRunId: 'run-1',
    workspaceId: 'ws-1',
    reportDefinitionId: 'def-1',
    definitionSnapshot: Object.freeze({
      reportDefinitionId: 'def-1',
      workspaceId: 'ws-1',
      name: kind === 'ops_weekly' ? 'Ops Weekly' : 'Ops Daily',
      kind,
      defaultModes: Object.freeze(['paper']),
      metricKeys: Object.freeze(['fact_count']),
      authorityClass: 'projection',
      createdAt: at,
    }),
    window: Object.freeze({ from: '2026-08-15T00:00:00.000Z', to: '2026-08-16T00:00:00.000Z' }),
    modes: Object.freeze(['paper']),
    exchangeScopeId: 'binance-spot',
    status: 'completed',
    authorityClass: 'projection',
    sourceSummary: Object.freeze({
      factCount: 1,
      lakeEventIds: Object.freeze(['evt-1']),
      sourceRefs: Object.freeze([{ ownerType: 'knowledge-lake', id: 'evt-1' }]),
    }),
    createdAt: at,
  }) as ReportRun;
}

function completedReport(overrides?: Partial<ReportRunResult>): ReportRunResult {
  return Object.freeze({
    outcome: 'completed',
    reportRun: completedRun(),
    aggregations: Object.freeze([]),
    authorityClass: 'projection',
    ...overrides,
  });
}

function skippedDelivery(overrides?: Partial<DeliveryResult>): DeliveryResult {
  return Object.freeze({
    deliveryId: 'del-1',
    workspaceId: 'ws-1',
    userId: 'user-1',
    type: 'daily-report',
    reportRunId: 'run-1',
    attempts: Object.freeze([
      Object.freeze({
        channelId: 'telegram' as const,
        outcome: 'skipped' as const,
        skipReason: 'channel-not-connected' as const,
      }),
    ]),
    outcome: 'skipped',
    createdAt: at,
    ...overrides,
  });
}

function harness(overrides?: {
  report?: ReportRunResult;
  run?: ReportRun | null;
  delivery?: DeliveryResult;
}) {
  const report = overrides?.report ?? completedReport();
  const delivery = overrides?.delivery ?? skippedDelivery();
  const reporting = {
    requestReportRun: vi.fn(() => report),
  };
  const reportingQuery = {
    getRun: vi.fn(() =>
      overrides && 'run' in overrides ? overrides.run : (report.reportRun ?? null),
    ),
    listAggregations: vi.fn(() => report.aggregations),
  };
  const notifications = {
    deliver: vi.fn(() => delivery),
    connectTelegram: vi.fn(),
  };
  const consumer = new ReportNotificationConsumerService(
    reporting as never,
    reportingQuery as never,
    notifications as never,
  );
  return { consumer, reporting, reportingQuery, notifications, delivery };
}

describe('PC-15 15-d — ReportNotificationConsumerService', () => {
  it('requests a ReportRun then delivers with an existing type and reportRunId', () => {
    const { consumer, reporting, notifications, delivery } = harness();
    const result = consumer.requestAndDeliver({
      workspaceId: 'ws-1',
      userId: 'user-1',
      reportDefinitionId: 'def-1',
      window: { from: '2026-08-15T00:00:00.000Z', to: '2026-08-16T00:00:00.000Z' },
      modes: ['paper'],
      requestedAt: at,
      reportRunId: 'run-1',
    });

    expect(reporting.requestReportRun).toHaveBeenCalledTimes(1);
    expect(notifications.deliver).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'ws-1',
        userId: 'user-1',
        type: 'daily-report',
        reportRunId: 'run-1',
        requestedAt: at,
      }),
    );
    expect(notifications.connectTelegram).not.toHaveBeenCalled();
    expect(result.delivery?.deliveryId).toBe(delivery.deliveryId);
    expect(result.projection.invoked).toBe(true);
    expect(result.projection.reportMutated).toBe(false);
    expect(result.projection.generatesReports).toBe(false);
    expect(result.projection.channelActivated).toBe(false);
    expect(result.projection.outcome).toBe('skipped');
    expect(result.projection.skipReasons).toEqual(['channel-not-connected']);
  });

  it('maps ops_weekly onto the existing weekly-report type', () => {
    const weekly = completedRun('ops_weekly');
    const { consumer, notifications } = harness({
      report: completedReport({ reportRun: weekly }),
      delivery: skippedDelivery({ type: 'weekly-report', reportRunId: 'run-1' }),
    });
    consumer.requestAndDeliver({
      workspaceId: 'ws-1',
      userId: 'user-1',
      reportDefinitionId: 'def-1',
      window: { from: '2026-08-15T00:00:00.000Z', to: '2026-08-16T00:00:00.000Z' },
      modes: ['paper'],
      requestedAt: at,
    });
    expect(notifications.deliver).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'weekly-report', reportRunId: 'run-1' }),
    );
  });

  it('does not deliver when Reporting rejects or the run is missing', () => {
    const { consumer, notifications } = harness({
      report: completedReport({
        outcome: 'rejected',
        reportRun: undefined,
        rejectionReasons: ['definition_required'],
      }),
    });
    const result = consumer.requestAndDeliver({
      workspaceId: 'ws-1',
      userId: 'user-1',
      window: { from: '2026-08-15T00:00:00.000Z', to: '2026-08-16T00:00:00.000Z' },
      modes: ['paper'],
      reportRunId: 'missing-run',
    });

    expect(notifications.deliver).not.toHaveBeenCalled();
    expect(result.delivery).toBeNull();
    expect(result.projection.invoked).toBe(false);
    expect(result.projection.notInvokedReason).toBe('report_not_completed');
    expect(result.projection.reportMutated).toBe(false);
  });

  it('delivers an already completed ReportRun via query without rewriting the run', () => {
    const { consumer, reporting, reportingQuery, notifications } = harness({
      run: completedRun(),
    });
    const result = consumer.deliverCompletedRun({
      workspaceId: 'ws-1',
      userId: 'user-1',
      reportRunId: 'run-1',
      requestedAt: at,
    });

    expect(reporting.requestReportRun).not.toHaveBeenCalled();
    expect(reportingQuery.getRun).toHaveBeenCalledWith('run-1');
    expect(notifications.deliver).toHaveBeenCalledTimes(1);
    expect(result.report.reportRun?.reportRunId).toBe('run-1');
    expect(result.projection.reportMutated).toBe(false);
  });
});
