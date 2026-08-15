import { describe, expect, it } from 'vitest';
import { toOperatorDashboardView, toSessionOperatorProjection } from './operator-dashboard.view';

const at = '2026-08-15T18:00:00.000Z';

describe('PC-15 15-f — operator dashboard view', () => {
  it('freezes a projection-only dashboard composition', () => {
    const view = toOperatorDashboardView({
      workspaceId: 'ws-1',
      generatedAt: at,
      paperSessions: [{ sessionId: 'session-1', status: 'running', origin: 'strategy' }],
      runtime: [{ sessionId: 'session-1', workerState: 'ARMED', acceptsTicks: true }],
      reportRuns: [
        {
          reportRunId: 'run-1',
          status: 'completed',
          tradingSessionId: 'session-1',
          narrativeAttached: true,
          narrativeUnavailable: false,
        },
      ],
      deliveries: [
        {
          deliveryId: 'del-1',
          reportRunId: 'run-1',
          outcome: 'skipped',
          telegramAdapterReached: false,
          skipReasons: ['channel-not-connected'] as const,
        },
      ],
      qualification: {
        qualificationRunId: 'qual-1',
        status: 'completed',
        targetId: 'qual-tgt:ws-1:scope-binance:BTCUSDT',
      },
      profile: {
        marketProfileId: 'profile-1',
        version: 1,
        qualificationRunId: 'qual-1',
      },
    });

    expect(view.authorityClass).toBe('projection');
    expect(view.reportMutated).toBe(false);
    expect(view.commandUiOnly).toBe(true);
    expect(view.newSoT).toBe(false);
    expect(Object.isFrozen(view)).toBe(true);
    expect(view).not.toHaveProperty('orderTicket');
    expect(view).not.toHaveProperty('killSwitch');
  });

  it('projects session report and delivery without owner fields', () => {
    const view = toSessionOperatorProjection({
      latestReport: {
        reportRunId: 'run-1',
        status: 'completed',
        tradingSessionId: 'session-1',
        narrativeAttached: true,
        narrativeUnavailable: false,
      },
      delivery: {
        deliveryId: 'del-1',
        reportRunId: 'run-1',
        outcome: 'skipped',
        telegramAdapterReached: false,
        skipReasons: ['channel-not-connected'] as const,
      },
    });
    expect(view.latestReport?.reportRunId).toBe('run-1');
    expect(view.delivery?.outcome).toBe('skipped');
    expect(Object.isFrozen(view)).toBe(true);
  });
});
