/**
 * PC-05 — product adapter over existing Reporting query ports.
 *
 * Delegates list/get to ReportingQueryPort. Attaches existing AI narrative
 * and Notification delivery reads. Does not generate reports, deliver, or
 * invent storage. Reporting remains report owner.
 */

import { Inject, Injectable } from '@nestjs/common';
import {
  NOTIFICATION_SERVICE_PORT,
  type NotificationServicePort,
} from '../notification-delivery/ports/notification.port';
import { ReportNarrativeConsumerService } from '../product-flow/report-narrative-consumer.service';
import {
  toReportRunDeliveryView,
  type ReportRunDeliveryView,
} from '../product-flow/report-run-delivery.view';
import type { ReportRun } from '../reporting/domain/report-run';
import { REPORTING_QUERY_PORT, type ReportingQueryPort } from '../reporting/ports/reporting.port';
import {
  runMatchesQuery,
  toReportDefinitionPageView,
  toReportDefinitionView,
  toReportRunDetailView,
  toReportRunListItemView,
  toReportRunPageView,
  type ListReportRunsQuery,
  type ReportDefinitionPageView,
  type ReportDefinitionView,
  type ReportRunDetailView,
  type ReportRunPageView,
} from './reporting.view';

@Injectable()
export class ReportingProductService {
  constructor(
    @Inject(REPORTING_QUERY_PORT)
    private readonly reportingQuery: ReportingQueryPort,
    @Inject(ReportNarrativeConsumerService)
    private readonly narratives: ReportNarrativeConsumerService,
    @Inject(NOTIFICATION_SERVICE_PORT)
    private readonly notifications: NotificationServicePort,
  ) {}

  listDefinitions(workspaceId: string, kind?: string): ReportDefinitionPageView {
    const page = this.reportingQuery.listDefinitions({
      workspaceId,
      ...(kind ? { kind } : {}),
    });
    return toReportDefinitionPageView(page.items);
  }

  getDefinition(workspaceId: string, reportDefinitionId: string): ReportDefinitionView | null {
    const definition = this.reportingQuery.getDefinition(reportDefinitionId);
    if (!definition || definition.workspaceId !== workspaceId) return null;
    return toReportDefinitionView(definition);
  }

  listRuns(query: ListReportRunsQuery): ReportRunPageView {
    const page = this.reportingQuery.listRuns({
      workspaceId: query.workspaceId,
      ...(query.reportDefinitionId ? { reportDefinitionId: query.reportDefinitionId } : {}),
    });
    const deliveries = this.notifications.listDeliveries({ workspaceId: query.workspaceId });
    const latestByRun = latestDeliveryByReportRun(deliveries);
    const filtered = [...page.items]
      .filter((run) => runMatchesQuery(run, query))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    const limit = query.limit !== undefined && query.limit >= 0 ? query.limit : filtered.length;
    const items = filtered.slice(0, limit).map((run) => {
      const delivery = latestByRun.get(run.reportRunId);
      return toReportRunListItemView(
        run,
        delivery ? { deliveryId: delivery.deliveryId, outcome: delivery.outcome } : null,
      );
    });
    return toReportRunPageView(items);
  }

  getRun(workspaceId: string, reportRunId: string): ReportRunDetailView | null {
    const run = this.scopedRun(workspaceId, reportRunId);
    if (!run) return null;
    const aggregations = this.reportingQuery.listAggregations(reportRunId);
    const narrative = this.narratives.getAttachedNarrative({ workspaceId, reportRunId });
    const deliveries = [...this.notifications.listDeliveries({ workspaceId, reportRunId })].sort(
      (left, right) => right.createdAt.localeCompare(left.createdAt),
    );
    const latest = deliveries[0];
    const delivery: ReportRunDeliveryView | null = latest
      ? toReportRunDeliveryView({
          workspaceId,
          userId: latest.userId,
          reportRunId,
          reportRun: run,
          delivery: latest,
          invoked: true,
          notificationType: latest.type,
        })
      : null;
    return toReportRunDetailView({
      run,
      aggregations,
      narrative,
      delivery,
    });
  }

  private scopedRun(workspaceId: string, reportRunId: string): ReportRun | null {
    const run = this.reportingQuery.getRun(reportRunId);
    if (!run || run.workspaceId !== workspaceId) return null;
    return run;
  }
}

function latestDeliveryByReportRun(
  deliveries: readonly {
    reportRunId?: string;
    deliveryId: string;
    outcome: string;
    createdAt: string;
  }[],
): Map<string, { deliveryId: string; outcome: string; createdAt: string }> {
  const sorted = [...deliveries].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
  const latest = new Map<string, { deliveryId: string; outcome: string; createdAt: string }>();
  for (const item of sorted) {
    const reportRunId = item.reportRunId;
    if (!reportRunId || latest.has(reportRunId)) continue;
    latest.set(reportRunId, {
      deliveryId: item.deliveryId,
      outcome: item.outcome,
      createdAt: item.createdAt,
    });
  }
  return latest;
}
