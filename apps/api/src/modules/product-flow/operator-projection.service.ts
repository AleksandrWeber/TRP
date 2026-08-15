import { Inject, Injectable } from '@nestjs/common';
import {
  MARKET_QUALIFICATION_QUERY_PORT,
  type MarketQualificationQueryPort,
} from '../market-qualification/ports/market-qualification.port';
import {
  MARKET_PROFILE_QUERY_PORT,
  type MarketProfileQueryPort,
} from '../market-profile/ports/market-profile.port';
import {
  NOTIFICATION_SERVICE_PORT,
  type NotificationServicePort,
} from '../notification-delivery/ports/notification.port';
import { REPORTING_QUERY_PORT, type ReportingQueryPort } from '../reporting/ports/reporting.port';
import {
  STRATEGY_RUNTIME_PORT,
  type StrategyRuntimePort,
} from '../strategy-runtime/ports/strategy-runtime.port';
import {
  TRADING_SESSION_REPOSITORY,
  type TradingSessionRepository,
} from '../trading-session/persistence/trading-session.repository';
import { ReportNarrativeConsumerService } from './report-narrative-consumer.service';
import {
  toOperatorDashboardView,
  toSessionOperatorProjection,
  type OperatorDashboardView,
  type OperatorDeliveryTile,
  type OperatorReportTile,
  type SessionOperatorProjection,
} from './operator-dashboard.view';

/**
 * PC-15 15-f — compose existing owner reads for Dashboard and Command Center.
 *
 * No writes. No new SoT. No owner redesign.
 */
@Injectable()
export class OperatorProjectionService {
  constructor(
    @Inject(REPORTING_QUERY_PORT)
    private readonly reportingQuery: ReportingQueryPort,
    @Inject(NOTIFICATION_SERVICE_PORT)
    private readonly notifications: NotificationServicePort,
    @Inject(MARKET_QUALIFICATION_QUERY_PORT)
    private readonly qualificationQuery: MarketQualificationQueryPort,
    @Inject(MARKET_PROFILE_QUERY_PORT)
    private readonly profileQuery: MarketProfileQueryPort,
    @Inject(TRADING_SESSION_REPOSITORY)
    private readonly sessions: TradingSessionRepository,
    @Inject(STRATEGY_RUNTIME_PORT)
    private readonly runtime: StrategyRuntimePort,
    @Inject(ReportNarrativeConsumerService)
    private readonly narratives: ReportNarrativeConsumerService,
  ) {}

  async projectDashboard(
    workspaceId: string,
    generatedAt = new Date().toISOString(),
  ): Promise<OperatorDashboardView> {
    const scoped = workspaceId.trim();
    const [paperSessions, reportRuns, deliveries, qualification] = await Promise.all([
      this.projectSessions(scoped),
      Promise.resolve(this.projectReportRuns(scoped)),
      Promise.resolve(this.projectDeliveries(scoped)),
      Promise.resolve(this.projectQualification(scoped)),
    ]);
    const runtime = await this.projectRuntime(
      scoped,
      paperSessions.map((session) => session.sessionId),
    );
    const profile = qualification ? this.projectProfile(scoped, qualification.targetId) : null;
    return toOperatorDashboardView({
      workspaceId: scoped,
      generatedAt,
      paperSessions,
      runtime,
      reportRuns,
      deliveries,
      qualification,
      profile,
    });
  }

  async projectSession(workspaceId: string, sessionId: string): Promise<SessionOperatorProjection> {
    const scoped = workspaceId.trim();
    const reports = this.projectReportRuns(scoped).filter(
      (run) => run.tradingSessionId === sessionId,
    );
    const latestReport = reports[0] ?? null;
    const deliveries = this.projectDeliveries(scoped, latestReport?.reportRunId);
    return toSessionOperatorProjection({
      latestReport,
      delivery: deliveries[0] ?? null,
    });
  }

  private async projectSessions(workspaceId: string) {
    const rows = await this.sessions.findByWorkspaceId(workspaceId);
    return Object.freeze(
      rows.map((session) =>
        Object.freeze({
          sessionId: session.id,
          status: session.status,
          origin: session.origin,
        }),
      ),
    );
  }

  private async projectRuntime(workspaceId: string, sessionIds: readonly string[]) {
    const tiles = await Promise.all(
      sessionIds.map(async (sessionId) => {
        const lifecycle = await this.runtime.getLifecycle(workspaceId, sessionId).catch(() => null);
        return Object.freeze({
          sessionId,
          workerState: lifecycle?.state ?? 'IDLE',
          acceptsTicks: lifecycle?.acceptsTicks ?? false,
        });
      }),
    );
    return Object.freeze(tiles);
  }

  private projectReportRuns(workspaceId: string): readonly OperatorReportTile[] {
    const items = [...this.reportingQuery.listRuns({ workspaceId }).items].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );
    return Object.freeze(
      items.map((run) => {
        const narrative = this.narratives.getAttachedNarrative({
          workspaceId,
          reportRunId: run.reportRunId,
        });
        return Object.freeze({
          reportRunId: run.reportRunId,
          status: run.status,
          tradingSessionId: run.tradingSessionId ?? null,
          narrativeAttached: narrative.attached && !narrative.narrativeUnavailable,
          narrativeUnavailable: narrative.narrativeUnavailable,
        });
      }),
    );
  }

  private projectDeliveries(
    workspaceId: string,
    reportRunId?: string,
  ): readonly OperatorDeliveryTile[] {
    const items = this.notifications.listDeliveries({
      workspaceId,
      ...(reportRunId ? { reportRunId } : {}),
    });
    const sorted = [...items].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    return Object.freeze(
      sorted.map((item) => {
        const telegram = item.attempts.find((attempt) => attempt.channelId === 'telegram');
        return Object.freeze({
          deliveryId: item.deliveryId,
          reportRunId: item.reportRunId ?? null,
          outcome: item.outcome,
          telegramAdapterReached:
            telegram?.outcome === 'delivered' || telegram?.outcome === 'failed',
          skipReasons: Object.freeze(
            item.attempts
              .map((attempt) => attempt.skipReason)
              .filter((reason): reason is NonNullable<typeof reason> => Boolean(reason)),
          ),
        });
      }),
    );
  }

  private projectQualification(workspaceId: string) {
    const runs = [...this.qualificationQuery.listQualificationRuns({ workspaceId })].sort(
      (left, right) => right.createdAt.localeCompare(left.createdAt),
    );
    const latest = runs[0];
    if (!latest) return null;
    return Object.freeze({
      qualificationRunId: latest.qualificationRunId,
      status: latest.status,
      targetId: latest.targetId,
    });
  }

  private projectProfile(workspaceId: string, targetId: string) {
    const parsed = parseQualificationTargetId(workspaceId, targetId);
    if (!parsed) return null;
    const latest = this.profileQuery.getLatestProfile({
      workspaceId,
      exchangeScopeId: parsed.exchangeScopeId,
      marketSymbol: parsed.marketSymbol,
    });
    if (!latest) return null;
    return Object.freeze({
      marketProfileId: latest.marketProfileId,
      version: latest.version,
      qualificationRunId: latest.qualificationRunId,
    });
  }
}

function parseQualificationTargetId(
  workspaceId: string,
  targetId: string,
): { exchangeScopeId: string; marketSymbol: string } | null {
  const prefix = `qual-tgt:${workspaceId}:`;
  if (!targetId.startsWith(prefix)) return null;
  const rest = targetId.slice(prefix.length);
  const idx = rest.lastIndexOf(':');
  if (idx <= 0 || idx === rest.length - 1) return null;
  return {
    exchangeScopeId: rest.slice(0, idx),
    marketSymbol: rest.slice(idx + 1),
  };
}
