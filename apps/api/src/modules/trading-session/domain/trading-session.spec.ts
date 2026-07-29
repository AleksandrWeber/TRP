import { describe, expect, it } from 'vitest';
import { canTransition } from './session-transitions';
import { createTradingSession, transitionSession } from './trading-session';
import { TradingSessionStatus } from './trading-session-status';

const ts = '2026-07-18T15:00:00.000Z';

function base() {
  return createTradingSession({
    id: 'session-1',
    workspaceId: 'ws-1',
    paperAccountId: 'account-1',
    deploymentId: 'deployment-manual-1',
    origin: 'manual',
    actorId: 'actor-1',
    idempotencyKey: 'create-1',
    createdAt: ts,
    recordedAt: ts,
  });
}

describe('US156 / US217 — Trading Session domain', () => {
  it('creates a manual session in CREATED without strategy fields', () => {
    const session = base();
    expect(session.status).toBe(TradingSessionStatus.CREATED);
    expect(session.origin).toBe('manual');
    expect(session.lease).toBeNull();
    expect(session).not.toHaveProperty('strategyState');
    expect(Object.isFrozen(session)).toBe(true);
  });

  it('creates a strategy-origin session bound only by deploymentId', () => {
    const session = createTradingSession({
      id: 'session-strategy-1',
      workspaceId: 'ws-1',
      paperAccountId: 'account-1',
      deploymentId: 'deployment-approved-1',
      origin: 'strategy',
      actorId: 'actor-1',
      idempotencyKey: 'create-strategy-1',
      createdAt: ts,
      recordedAt: ts,
    });
    expect(session.origin).toBe('strategy');
    expect(session.deploymentId).toBe('deployment-approved-1');
    expect(session).not.toHaveProperty('parameters');
    expect(session).not.toHaveProperty('configurationHash');
  });

  it('rejects unsupported origins', () => {
    expect(() =>
      createTradingSession({
        id: 'session-bad',
        workspaceId: 'ws-1',
        paperAccountId: 'account-1',
        deploymentId: 'deployment-1',
        origin: 'live' as 'manual',
        actorId: 'actor-1',
        idempotencyKey: 'bad',
        createdAt: ts,
        recordedAt: ts,
      }),
    ).toThrow(/unsupported trading session origin/);
  });

  it('allows only ADR-014 transitions and rejects invalid ones', () => {
    expect(canTransition(TradingSessionStatus.CREATED, TradingSessionStatus.STARTING)).toBe(true);
    expect(canTransition(TradingSessionStatus.RUNNING, TradingSessionStatus.PAUSED)).toBe(true);
    expect(canTransition(TradingSessionStatus.STOPPED, TradingSessionStatus.RUNNING)).toBe(false);
    expect(() => transitionSession(base(), TradingSessionStatus.RUNNING, ts)).toThrow(
      /invalid trading session transition/,
    );
  });

  it('keeps deployment identity distinct from runtime status', () => {
    const started = transitionSession(
      transitionSession(base(), TradingSessionStatus.STARTING, ts),
      TradingSessionStatus.RUNNING,
      '2026-07-18T15:00:01.000Z',
    );
    expect(started.deploymentId).toBe('deployment-manual-1');
    expect(started.status).toBe(TradingSessionStatus.RUNNING);
    expect(started.version).toBe(3);
  });
});
