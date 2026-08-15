import { Inject, Injectable } from '@nestjs/common';
import type { DeliveryResult } from '../notification-delivery/domain/delivery';
import {
  isNotificationType,
  type NotificationType,
} from '../notification-delivery/domain/notification-type';
import {
  NOTIFICATION_SERVICE_PORT,
  type NotificationServicePort,
} from '../notification-delivery/ports/notification.port';
import type { ReportRun } from '../reporting/domain/report-run';
import {
  REPORTING_QUERY_PORT,
  REPORTING_SERVICE_PORT,
  type ReportRunResult,
  type ReportingQueryPort,
  type ReportingServicePort,
  type RequestReportRun,
} from '../reporting/ports/reporting.port';
import {
  notificationTypeForReportKind,
  toReportRunDeliveryView,
  type ReportDeliveryNotInvokedReason,
  type ReportRunDeliveryView,
} from './report-run-delivery.view';

export type RequestReportAndDeliverCommand = RequestReportRun &
  Readonly<{
    userId: string;
    notificationType?: NotificationType;
  }>;

export type DeliverCompletedReportCommand = Readonly<{
  workspaceId: string;
  userId: string;
  reportRunId: string;
  requestedAt?: string;
  notificationType?: NotificationType;
}>;

export type ReportNotificationFlowResult = Readonly<{
  report: ReportRunResult;
  delivery: DeliveryResult | null;
  projection: ReportRunDeliveryView;
}>;

/**
 * PC-15 15-d — completed ReportRun invokes Notification Delivery.
 *
 * Reporting remains report owner (request/query are delegated).
 * Notification Delivery remains delivery only (`deliver()` is delegated).
 * Notification never owns reports. Notification never generates reports.
 * ReportRun is never mutated. No scheduler, retries, or channel activation.
 */
@Injectable()
export class ReportNotificationConsumerService {
  constructor(
    @Inject(REPORTING_SERVICE_PORT)
    private readonly reporting: ReportingServicePort,
    @Inject(REPORTING_QUERY_PORT)
    private readonly reportingQuery: ReportingQueryPort,
    @Inject(NOTIFICATION_SERVICE_PORT)
    private readonly notifications: NotificationServicePort,
  ) {}

  requestAndDeliver(command: RequestReportAndDeliverCommand): ReportNotificationFlowResult {
    const report = this.reporting.requestReportRun(command);
    const reportRunId =
      report.reportRun?.reportRunId ?? command.reportRunId?.trim() ?? 'unspecified';
    return this.maybeDeliver(
      command.workspaceId,
      command.userId,
      reportRunId,
      report,
      command.notificationType,
      command.requestedAt,
    );
  }

  deliverCompletedRun(command: DeliverCompletedReportCommand): ReportNotificationFlowResult {
    const run = this.reportingQuery.getRun(command.reportRunId);
    const scoped = run && run.workspaceId === command.workspaceId ? run : null;
    const report: ReportRunResult = Object.freeze({
      outcome: scoped ? mapRunOutcome(scoped) : 'rejected',
      ...(scoped ? { reportRun: scoped } : {}),
      aggregations: scoped
        ? this.reportingQuery.listAggregations(command.reportRunId)
        : Object.freeze([]),
      ...(scoped ? {} : { rejectionReasons: Object.freeze(['report_run_not_found']) }),
      authorityClass: 'projection',
    });
    return this.maybeDeliver(
      command.workspaceId,
      command.userId,
      command.reportRunId,
      report,
      command.notificationType,
      command.requestedAt,
    );
  }

  private maybeDeliver(
    workspaceId: string,
    userId: string,
    reportRunId: string,
    report: ReportRunResult,
    requestedType: NotificationType | undefined,
    requestedAt: string | undefined,
  ): ReportNotificationFlowResult {
    const trimmedUser = userId.trim();
    if (!trimmedUser) {
      return this.skip(workspaceId, userId, reportRunId, report, requestedType, 'user_id_required');
    }
    if (requestedType !== undefined && !isNotificationType(requestedType)) {
      return this.skip(
        workspaceId,
        trimmedUser,
        reportRunId,
        report,
        null,
        'unknown_notification_type',
      );
    }
    const run = report.reportRun;
    const completed = report.outcome === 'completed' || report.outcome === 'empty';
    if (!completed || !run) {
      return this.skip(
        workspaceId,
        trimmedUser,
        reportRunId,
        report,
        requestedType ?? notificationTypeForReportKind(run?.definitionSnapshot.kind),
        'report_not_completed',
      );
    }

    const type = requestedType ?? notificationTypeForReportKind(run.definitionSnapshot.kind);
    const at = requestedAt ?? run.createdAt;
    const copy = deliveryCopy(run);
    const delivery = this.notifications.deliver({
      workspaceId,
      userId: trimmedUser,
      type,
      subject: copy.subject,
      body: copy.body,
      reportRunId: run.reportRunId,
      requestedAt: at,
    });

    return Object.freeze({
      report,
      delivery,
      projection: toReportRunDeliveryView({
        workspaceId,
        userId: trimmedUser,
        reportRunId: run.reportRunId,
        reportRun: run,
        reportOutcome: report.outcome,
        notificationType: type,
        delivery,
        invoked: true,
      }),
    });
  }

  private skip(
    workspaceId: string,
    userId: string,
    reportRunId: string,
    report: ReportRunResult,
    notificationType: NotificationType | null | undefined,
    reason: ReportDeliveryNotInvokedReason,
  ): ReportNotificationFlowResult {
    return Object.freeze({
      report,
      delivery: null,
      projection: toReportRunDeliveryView({
        workspaceId,
        userId,
        reportRunId,
        reportRun: report.reportRun ?? null,
        reportOutcome: report.outcome,
        notificationType: notificationType ?? null,
        delivery: null,
        invoked: false,
        notInvokedReason: reason,
      }),
    });
  }
}

function mapRunOutcome(run: ReportRun): ReportRunResult['outcome'] {
  if (run.status === 'completed' || run.status === 'empty' || run.status === 'rejected') {
    return run.status;
  }
  return 'rejected';
}

function deliveryCopy(run: ReportRun): Readonly<{ subject: string; body: string }> {
  return Object.freeze({
    subject: `Report ${run.reportRunId} ${run.status}`,
    body: `ReportRun ${run.reportRunId} (${run.definitionSnapshot.kind}) is ${run.status}. Delivery only — Notification Delivery does not generate reports.`,
  });
}
