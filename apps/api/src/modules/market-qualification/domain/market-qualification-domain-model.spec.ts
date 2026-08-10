import { describe, expect, it } from 'vitest';
import { createMarketConfidence } from './market-confidence';
import { createMarketHealth } from './market-health';
import {
  MARKET_QUALIFICATION_DOMAIN_AUTHORITY_CLASS,
  canTransitionQualificationState,
} from './market-qualification-domain-shared';
import { createQualificationRun } from './qualification-run';
import { createQualificationState, transitionQualificationState } from './qualification-state';
import { createQualificationTarget } from './qualification-target';

describe('RC-25 Epic 3 — Market Qualification domain model', () => {
  it('creates immutable QualificationTarget with venue/market keying', () => {
    const target = createQualificationTarget({
      targetId: 'tgt-1',
      workspaceId: 'ws-1',
      exchangeScopeId: 'scope-binance',
      marketSymbol: 'BTCUSDT',
      createdAt: '2026-08-10T12:00:00.000Z',
    });
    expect(Object.isFrozen(target)).toBe(true);
    expect(target.authorityClass).toBe(MARKET_QUALIFICATION_DOMAIN_AUTHORITY_CLASS);
    expect(target.exchangeScopeId).toBe('scope-binance');
    expect(target.marketSymbol).toBe('BTCUSDT');
    expect(() => {
      (target as { marketSymbol: string }).marketSymbol = 'ETHUSDT';
    }).toThrow();
  });

  it('creates immutable QualificationRun and enforces heavy-work confirm for running', () => {
    const run = createQualificationRun({
      qualificationRunId: 'run-1',
      workspaceId: 'ws-1',
      targetId: 'tgt-1',
      modeContext: 'paper',
      status: 'requested',
      requestedBy: 'op-1',
      inputSummary: { observationCount: 0, researchRefCount: 0 },
      createdAt: '2026-08-10T12:00:00.000Z',
    });
    expect(Object.isFrozen(run)).toBe(true);
    expect(run.authorityClass).toBe('research_artifact');

    expect(() =>
      createQualificationRun({
        qualificationRunId: 'run-2',
        workspaceId: 'ws-1',
        targetId: 'tgt-1',
        modeContext: 'paper',
        status: 'running',
        requestedBy: 'op-1',
        inputSummary: { observationCount: 1, researchRefCount: 0 },
        createdAt: '2026-08-10T12:00:00.000Z',
      }),
    ).toThrow(/confirmedBy/);
  });

  it('enforces QualificationState lifecycle transitions only', () => {
    expect(canTransitionQualificationState('not_qualified', 'pending_confirm')).toBe(true);
    expect(canTransitionQualificationState('not_qualified', 'qualified')).toBe(false);
    expect(canTransitionQualificationState('qualified', 'qualifying')).toBe(true);
    expect(canTransitionQualificationState('failed', 'pending_confirm')).toBe(true);

    const state = createQualificationState({
      targetId: 'tgt-1',
      workspaceId: 'ws-1',
      state: 'not_qualified',
      updatedAt: '2026-08-10T12:00:00.000Z',
    });
    expect(Object.isFrozen(state)).toBe(true);
    expect(state.authorityClass).toBe('research_artifact');

    const pending = transitionQualificationState(
      state,
      'pending_confirm',
      '2026-08-10T12:01:00.000Z',
    );
    expect(pending.state).toBe('pending_confirm');
    expect(Object.isFrozen(pending)).toBe(true);

    expect(() =>
      transitionQualificationState(state, 'qualified', '2026-08-10T12:02:00.000Z'),
    ).toThrow(/forbidden QualificationState transition/);
  });

  it('creates MarketConfidence with forcesTrade always false (no scoring behaviour)', () => {
    const confidence = createMarketConfidence({
      targetId: 'tgt-1',
      workspaceId: 'ws-1',
      level: 'medium',
      score: 0.55,
      rationaleSummary: 'operator-supplied snapshot',
      sourceRunId: 'run-1',
      asOf: '2026-08-10T12:00:00.000Z',
    });
    expect(Object.isFrozen(confidence)).toBe(true);
    expect(confidence.forcesTrade).toBe(false);
    expect(confidence.authorityClass).toBe('research_artifact');
    expect(() =>
      createMarketConfidence({
        targetId: 'tgt-1',
        workspaceId: 'ws-1',
        level: 'medium',
        score: 1.5,
        rationaleSummary: 'bad',
        sourceRunId: 'run-1',
        asOf: '2026-08-10T12:00:00.000Z',
      }),
    ).toThrow(/\[0, 1\]/);
  });

  it('creates MarketHealth with closed indicator keys', () => {
    const health = createMarketHealth({
      targetId: 'tgt-1',
      workspaceId: 'ws-1',
      status: 'watch',
      indicators: [{ key: 'data_freshness', value: 'stale' }],
      sourceRunId: 'run-1',
      asOf: '2026-08-10T12:00:00.000Z',
    });
    expect(Object.isFrozen(health)).toBe(true);
    expect(health.authorityClass).toBe('research_artifact');
    expect(() =>
      createMarketHealth({
        targetId: 'tgt-1',
        workspaceId: 'ws-1',
        status: 'healthy',
        indicators: [{ key: 'kill_switch', value: 'on' }],
        sourceRunId: 'run-1',
        asOf: '2026-08-10T12:00:00.000Z',
      }),
    ).toThrow(/unknown health indicator/);
  });

  it('does not expose evaluation / selection helpers on domain modules', async () => {
    const shared = await import('./market-qualification-domain-shared');
    const confidence = await import('./market-confidence');
    expect(shared).not.toHaveProperty('scoreConfidence');
    expect(shared).not.toHaveProperty('evaluateMarket');
    expect(confidence).not.toHaveProperty('computeConfidence');
    expect(confidence).not.toHaveProperty('selectStrategy');
    expect(confidence).not.toHaveProperty('startSession');
  });
});
