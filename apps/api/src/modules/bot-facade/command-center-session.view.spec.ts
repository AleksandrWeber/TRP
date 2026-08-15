import { describe, expect, it } from 'vitest';
import { TradingSessionStatus } from '../trading-session/domain/trading-session-status';
import type { BotView } from './domain/bot-view';
import { toCommandCenterSessionView, toSessionHealthView } from './command-center-session.view';

const bot: BotView = Object.freeze({
  id: 'session-1',
  tradingSessionId: 'session-1',
  workspaceId: 'ws-1',
  exchangeScopeId: 'exchange-scope:binance',
  paperAccountId: 'acct-1',
  status: TradingSessionStatus.RUNNING,
  state: TradingSessionStatus.RUNNING,
  mission: Object.freeze({ deploymentId: 'dep-1' }),
  origin: 'strategy',
  version: 2,
  failureReason: null,
  createdAt: '2026-08-15T12:00:00.000Z',
  recordedAt: '2026-08-15T12:00:01.000Z',
  actorId: 'user-1',
  correlationId: null,
  leaseOwnerId: 'user-1',
  fencingToken: 1,
});

describe('PC-13 — Command Center session view', () => {
  it('projects health and deployment reference from the Session Bot view', () => {
    const health = toSessionHealthView(bot);
    expect(health.lifecycleStatus).toBe(TradingSessionStatus.RUNNING);
    expect(health.leasePresent).toBe(true);
    expect(health.failureReason).toBeNull();
  });

  it('attaches runtime status as a consumer read without inventing Session fields', () => {
    const view = toCommandCenterSessionView(
      bot,
      {
        workspaceId: 'ws-1',
        sessionId: 'session-1',
        state: 'ARMED',
        fencingToken: 1,
        acceptsTicks: true,
        draining: false,
      },
      {
        workspaceId: 'ws-1',
        sessionId: 'session-1',
        deploymentId: 'dep-1',
        checkpointVersion: null,
        lastProcessedEventId: null,
        lastProcessedCandleSequence: null,
        runtimeVersion: '1',
        evaluationEnabled: true,
        workerState: 'ARMED',
        acceptsTicks: true,
      },
    );
    expect(view.id).toBe(view.tradingSessionId);
    expect(view.deploymentReference.deploymentId).toBe('dep-1');
    expect(view.runtimeStatus.workerState).toBe('ARMED');
    expect(view.runtimeStatus.acceptsTicks).toBe(true);
    expect(view.sessionHandoff).toBeNull();
    expect(view.latestReport).toBeNull();
    expect(view.delivery).toBeNull();
    expect(view).not.toHaveProperty('orderTicket');
    expect(view).not.toHaveProperty('killSwitch');
  });

  it('attaches report and delivery as consumer projections without inventing Session fields', () => {
    const view = toCommandCenterSessionView(bot, null, null, null, {
      latestReport: Object.freeze({
        reportRunId: 'run-1',
        status: 'completed',
        tradingSessionId: 'session-1',
        narrativeAttached: true,
        narrativeUnavailable: false,
      }),
      delivery: Object.freeze({
        deliveryId: 'del-1',
        reportRunId: 'run-1',
        outcome: 'skipped',
        telegramAdapterReached: false,
        skipReasons: Object.freeze(['channel-not-connected'] as const),
      }),
    });
    expect(view.latestReport?.reportRunId).toBe('run-1');
    expect(view.delivery?.outcome).toBe('skipped');
    expect(view).not.toHaveProperty('orderTicket');
    expect(view).not.toHaveProperty('killSwitch');
  });
});
