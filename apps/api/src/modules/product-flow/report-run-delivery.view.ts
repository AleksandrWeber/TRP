/**
 * PC-15 15-d — Reporting projection of a Notification Delivery result.
 *
 * Not ReportRun SoT. Not a notification owner. ReportRun is never mutated.
 * Notification Delivery remains delivery only and never generates reports.
 */
import type {
  DeliveryOutcome,
  DeliveryResult,
  DeliverySkipReason,
} from '../notification-delivery/domain/delivery';
import type { NotificationChannelId } from '../notification-delivery/domain/notification-channel';
import type { NotificationType } from '../notification-delivery/domain/notification-type';
import type { ReportRun } from '../reporting/domain/report-run';
import type { ReportRunOutcome } from '../reporting/ports/reporting.port';

export type ReportDeliveryNotInvokedReason =
  'report_not_completed' | 'user_id_required' | 'unknown_notification_type';

export type ReportRunDeliveryView = Readonly<{
  reportRunId: string;
  workspaceId: string;
  userId: string;
  reportStatus: string | null;
  reportOutcome: ReportRunOutcome | 'missing';
  invoked: boolean;
  notInvokedReason?: ReportDeliveryNotInvokedReason;
  notificationType: NotificationType | null;
  deliveryId: string | null;
  outcome: DeliveryOutcome | 'not-invoked';
  skipReasons: readonly DeliverySkipReason[];
  channelsAttempted: readonly NotificationChannelId[];
  telegramAdapterReached: boolean;
  reservedChannelSkips: readonly NotificationChannelId[];
  attached: true;
  reportMutated: false;
  generatesReports: false;
  channelActivated: false;
  forcesTrade: false;
  authorityClass: 'notification-projection';
}>;

export function notificationTypeForReportKind(kind: string | undefined): NotificationType {
  if (kind === 'ops_weekly') return 'weekly-report';
  return 'daily-report';
}

export function toReportRunDeliveryView(input: {
  workspaceId: string;
  userId: string;
  reportRunId: string;
  reportRun?: ReportRun | null;
  reportOutcome?: ReportRunOutcome | 'missing';
  notificationType?: NotificationType | null;
  delivery?: DeliveryResult | null;
  invoked: boolean;
  notInvokedReason?: ReportDeliveryNotInvokedReason;
}): ReportRunDeliveryView {
  const skipReasons = Object.freeze(
    (input.delivery?.attempts ?? [])
      .map((attempt) => attempt.skipReason)
      .filter((reason): reason is DeliverySkipReason => Boolean(reason)),
  );
  const channelsAttempted = Object.freeze(
    (input.delivery?.attempts ?? []).map((attempt) => attempt.channelId),
  );
  const telegramAttempt = (input.delivery?.attempts ?? []).find(
    (attempt) => attempt.channelId === 'telegram',
  );
  const telegramAdapterReached =
    telegramAttempt?.outcome === 'delivered' || telegramAttempt?.outcome === 'failed';
  const reservedChannelSkips = Object.freeze(
    (input.delivery?.attempts ?? [])
      .filter((attempt) => attempt.skipReason === 'channel-reserved')
      .map((attempt) => attempt.channelId),
  );
  return Object.freeze({
    reportRunId: input.reportRunId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    reportStatus: input.reportRun?.status ?? null,
    reportOutcome:
      input.reportOutcome ?? (input.reportRun ? mapStatus(input.reportRun.status) : 'missing'),
    invoked: input.invoked,
    ...(input.notInvokedReason ? { notInvokedReason: input.notInvokedReason } : {}),
    notificationType: input.notificationType ?? input.delivery?.type ?? null,
    deliveryId: input.delivery?.deliveryId ?? null,
    outcome: input.delivery?.outcome ?? 'not-invoked',
    skipReasons,
    channelsAttempted,
    telegramAdapterReached,
    reservedChannelSkips,
    attached: true as const,
    reportMutated: false as const,
    generatesReports: false as const,
    channelActivated: false as const,
    forcesTrade: false as const,
    authorityClass: 'notification-projection' as const,
  });
}

function mapStatus(status: string): ReportRunOutcome | 'missing' {
  if (status === 'completed' || status === 'empty' || status === 'rejected') {
    return status;
  }
  return 'missing';
}
