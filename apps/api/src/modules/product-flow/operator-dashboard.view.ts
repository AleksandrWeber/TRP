/**
 * PC-15 15-f — operator Dashboard / Command Center consumer projections.
 *
 * Composition of existing owner reads. Not a new Source of Truth.
 * Dashboard remains projection only. Command Center remains command UI.
 */
import type { DeliveryOutcome, DeliverySkipReason } from '../notification-delivery/domain/delivery';

export type OperatorReportTile = Readonly<{
  reportRunId: string;
  status: string;
  tradingSessionId: string | null;
  narrativeAttached: boolean;
  narrativeUnavailable: boolean;
}>;

export type OperatorDeliveryTile = Readonly<{
  deliveryId: string;
  reportRunId: string | null;
  outcome: DeliveryOutcome;
  telegramAdapterReached: boolean;
  skipReasons: readonly DeliverySkipReason[];
}>;

export type OperatorSessionTile = Readonly<{
  sessionId: string;
  status: string;
  origin: string;
}>;

export type OperatorRuntimeTile = Readonly<{
  sessionId: string;
  workerState: string;
  acceptsTicks: boolean;
}>;

export type OperatorQualificationTile = Readonly<{
  qualificationRunId: string;
  status: string;
  targetId: string;
}>;

export type OperatorProfileTile = Readonly<{
  marketProfileId: string;
  version: number;
  qualificationRunId: string;
}>;

export type OperatorDashboardView = Readonly<{
  workspaceId: string;
  generatedAt: string;
  paperSessions: readonly OperatorSessionTile[];
  runtime: readonly OperatorRuntimeTile[];
  reportRuns: readonly OperatorReportTile[];
  deliveries: readonly OperatorDeliveryTile[];
  qualification: OperatorQualificationTile | null;
  profile: OperatorProfileTile | null;
  authorityClass: 'projection';
  reportMutated: false;
  commandUiOnly: true;
  newSoT: false;
}>;

export type SessionOperatorProjection = Readonly<{
  latestReport: OperatorReportTile | null;
  delivery: OperatorDeliveryTile | null;
}>;

export function toOperatorDashboardView(input: {
  workspaceId: string;
  generatedAt: string;
  paperSessions: readonly OperatorSessionTile[];
  runtime: readonly OperatorRuntimeTile[];
  reportRuns: readonly OperatorReportTile[];
  deliveries: readonly OperatorDeliveryTile[];
  qualification: OperatorQualificationTile | null;
  profile: OperatorProfileTile | null;
}): OperatorDashboardView {
  return Object.freeze({
    workspaceId: input.workspaceId,
    generatedAt: input.generatedAt,
    paperSessions: Object.freeze([...input.paperSessions]),
    runtime: Object.freeze([...input.runtime]),
    reportRuns: Object.freeze([...input.reportRuns]),
    deliveries: Object.freeze([...input.deliveries]),
    qualification: input.qualification,
    profile: input.profile,
    authorityClass: 'projection' as const,
    reportMutated: false as const,
    commandUiOnly: true as const,
    newSoT: false as const,
  });
}

export function toSessionOperatorProjection(input: {
  latestReport: OperatorReportTile | null;
  delivery: OperatorDeliveryTile | null;
}): SessionOperatorProjection {
  return Object.freeze({
    latestReport: input.latestReport,
    delivery: input.delivery,
  });
}
