import { describe, expect, it, vi } from 'vitest';
import type { DeliveryResult } from '../notification-delivery/domain/delivery';
import type { ReportRun } from '../reporting/domain/report-run';
import { OperatorProjectionService } from './operator-projection.service';
import type { ReportRunNarrativeView } from './report-run-narrative.view';

const at = '2026-08-15T18:00:00.000Z';

function completedRun(): ReportRun {
  return Object.freeze({
    reportRunId: 'run-1',
    workspaceId: 'ws-1',
    reportDefinitionId: 'def-1',
    definitionSnapshot: Object.freeze({
      reportDefinitionId: 'def-1',
      workspaceId: 'ws-1',
      name: 'Ops Daily',
      kind: 'ops_daily',
      defaultModes: Object.freeze(['paper']),
      metricKeys: Object.freeze(['fact_count']),
      authorityClass: 'projection',
      createdAt: at,
    }),
    window: Object.freeze({ from: '2026-08-15T00:00:00.000Z', to: '2026-08-16T00:00:00.000Z' }),
    modes: Object.freeze(['paper']),
    exchangeScopeId: 'binance-spot',
    tradingSessionId: 'session-1',
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

function delivery(): DeliveryResult {
  return Object.freeze({
    deliveryId: 'del-1',
    workspaceId: 'ws-1',
    userId: 'user-1',
    type: 'daily-report',
    reportRunId: 'run-1',
    attempts: Object.freeze([
      Object.freeze({
        channelId: 'telegram',
        outcome: 'skipped',
        skipReason: 'channel-not-connected',
      }),
    ]),
    outcome: 'skipped',
    createdAt: at,
  }) as DeliveryResult;
}

function harness() {
  const reportingQuery = {
    listRuns: vi.fn(() => Object.freeze({ items: [completedRun()], authorityClass: 'projection' })),
    getRun: vi.fn(),
  };
  const notifications = {
    listDeliveries: vi.fn(() => [delivery()]),
    deliver: vi.fn(),
  };
  const qualificationQuery = {
    listQualificationRuns: vi.fn(() => [
      Object.freeze({
        qualificationRunId: 'qual-1',
        workspaceId: 'ws-1',
        targetId: 'qual-tgt:ws-1:scope-binance:BTCUSDT',
        status: 'completed',
        modeContext: 'paper',
        createdAt: at,
        authorityClass: 'research_artifact',
        forcesTrade: false,
        authorizesSession: false,
      }),
    ]),
  };
  const profileQuery = {
    getLatestProfile: vi.fn(() =>
      Object.freeze({
        marketProfileId: 'profile-1',
        version: 1,
        qualificationRunId: 'qual-1',
      }),
    ),
  };
  const sessions = {
    findByWorkspaceId: vi.fn(async () => [
      Object.freeze({ id: 'session-1', status: 'running', origin: 'strategy' }),
    ]),
  };
  const runtime = {
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
  };
  const narratives = {
    getAttachedNarrative: vi.fn((): ReportRunNarrativeView =>
      Object.freeze({
        reportRunId: 'run-1',
        workspaceId: 'ws-1',
        reportStatus: 'completed',
        reportOutcome: 'completed',
        narrativeId: 'nar-1',
        narrativeKind: 'narrative',
        narrativeText: 'ok',
        narrativeUnavailable: false,
        attached: true,
        reportMutated: false,
        forcesTrade: false,
        authorityClass: 'narrative',
      }),
    ),
  };

  const service = new OperatorProjectionService(
    reportingQuery as never,
    notifications as never,
    qualificationQuery as never,
    profileQuery as never,
    sessions as never,
    runtime as never,
    narratives as never,
  );

  return { service, reportingQuery, notifications, narratives, profileQuery };
}

describe('PC-15 15-f — operator projection service', () => {
  it('composes existing owner reads into a Dashboard projection without writes', async () => {
    const { service, notifications, narratives } = harness();
    const view = await service.projectDashboard('ws-1', at);

    expect(view.paperSessions).toEqual([
      { sessionId: 'session-1', status: 'running', origin: 'strategy' },
    ]);
    expect(view.runtime[0]?.workerState).toBe('ARMED');
    expect(view.reportRuns[0]?.reportRunId).toBe('run-1');
    expect(view.reportRuns[0]?.narrativeAttached).toBe(true);
    expect(view.deliveries[0]?.deliveryId).toBe('del-1');
    expect(view.qualification?.qualificationRunId).toBe('qual-1');
    expect(view.profile?.marketProfileId).toBe('profile-1');
    expect(view.authorityClass).toBe('projection');
    expect(view.reportMutated).toBe(false);
    expect(notifications.deliver).not.toHaveBeenCalled();
    expect(narratives.getAttachedNarrative).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      reportRunId: 'run-1',
    });
  });

  it('projects session report and delivery from existing reads without re-delivering', async () => {
    const { service, notifications } = harness();
    const view = await service.projectSession('ws-1', 'session-1');
    expect(view.latestReport?.reportRunId).toBe('run-1');
    expect(view.delivery?.outcome).toBe('skipped');
    expect(notifications.listDeliveries).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      reportRunId: 'run-1',
    });
    expect(notifications.deliver).not.toHaveBeenCalled();
  });

  it('leaves profile null when the qualification target cannot be parsed', async () => {
    const { service, profileQuery } = harness();
    const qualificationQuery = {
      listQualificationRuns: vi.fn(() => [
        Object.freeze({
          qualificationRunId: 'qual-2',
          workspaceId: 'ws-1',
          targetId: 'unparseable',
          status: 'completed',
          modeContext: 'paper',
          createdAt: at,
          authorityClass: 'research_artifact',
          forcesTrade: false,
          authorizesSession: false,
        }),
      ]),
    };
    const isolated = new OperatorProjectionService(
      {
        listRuns: vi.fn(() => Object.freeze({ items: [], authorityClass: 'projection' })),
      } as never,
      { listDeliveries: vi.fn(() => []), deliver: vi.fn() } as never,
      qualificationQuery as never,
      profileQuery as never,
      { findByWorkspaceId: vi.fn(async () => []) } as never,
      { getLifecycle: vi.fn() } as never,
      { getAttachedNarrative: vi.fn() } as never,
    );
    const view = await isolated.projectDashboard('ws-1', at);
    expect(view.qualification?.targetId).toBe('unparseable');
    expect(view.profile).toBeNull();
    expect(profileQuery.getLatestProfile).not.toHaveBeenCalled();
  });
});
