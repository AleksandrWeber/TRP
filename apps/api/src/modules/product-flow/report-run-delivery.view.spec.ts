import { describe, expect, it } from 'vitest';
import { toReportRunDeliveryView, notificationTypeForReportKind } from './report-run-delivery.view';

const at = '2026-08-15T17:00:00.000Z';

describe('PC-15 15-d — ReportRunDeliveryView', () => {
  it('projects a recorded delivery without claiming ReportRun ownership', () => {
    const view = toReportRunDeliveryView({
      workspaceId: 'ws-1',
      userId: 'user-1',
      reportRunId: 'run-1',
      reportOutcome: 'completed',
      notificationType: 'daily-report',
      invoked: true,
      delivery: Object.freeze({
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
      }),
    });
    expect(view.attached).toBe(true);
    expect(view.invoked).toBe(true);
    expect(view.deliveryId).toBe('del-1');
    expect(view.outcome).toBe('skipped');
    expect(view.skipReasons).toEqual(['channel-not-connected']);
    expect(view.reportMutated).toBe(false);
    expect(view.generatesReports).toBe(false);
    expect(view.channelActivated).toBe(false);
    expect(view.telegramAdapterReached).toBe(false);
    expect(view.reservedChannelSkips).toEqual([]);
    expect(view.authorityClass).toBe('notification-projection');
    expect(view.forcesTrade).toBe(false);
    expect(Object.isFrozen(view)).toBe(true);
  });

  it('maps existing report kinds onto existing notification types only', () => {
    expect(notificationTypeForReportKind('ops_daily')).toBe('daily-report');
    expect(notificationTypeForReportKind('ops_weekly')).toBe('weekly-report');
    expect(notificationTypeForReportKind('research_summary')).toBe('daily-report');
    expect(notificationTypeForReportKind('custom')).toBe('daily-report');
  });
});
