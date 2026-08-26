import { describe, expect, it } from 'vitest';
import {
  MARKET_QUALIFICATION_AUTHORITY_CLASS,
  MARKET_QUALIFICATION_BOUNDARY,
  MARKET_QUALIFICATION_DISTINCT_FROM,
  MARKET_QUALIFICATION_FORBIDDEN_CAPABILITIES,
  MARKET_QUALIFICATION_MODULE_ID,
  MARKET_QUALIFICATION_NON_OWNED,
  MARKET_QUALIFICATION_OWNED_CONCERNS,
  isMarketQualificationForbiddenCapability,
  marketQualificationCommandsSessions,
  marketQualificationForcesTrade,
  marketQualificationIsExecutionSourceOfTruth,
  marketQualificationOwnsMarketProfileVersions,
  marketQualificationReplacesRuntimeEnforcement,
  marketQualificationReplacesStrategyLibrary,
  marketQualificationSelectsStrategies,
} from './market-qualification-boundary';

describe('RC-25 Epic 2 — Market Qualification boundary', () => {
  it('exposes research_artifact boundary with lifecycle + read consumers active', () => {
    expect(Object.isFrozen(MARKET_QUALIFICATION_BOUNDARY)).toBe(true);
    expect(MARKET_QUALIFICATION_BOUNDARY.moduleId).toBe(MARKET_QUALIFICATION_MODULE_ID);
    expect(MARKET_QUALIFICATION_BOUNDARY.authorityClass).toBe(MARKET_QUALIFICATION_AUTHORITY_CLASS);
    expect(MARKET_QUALIFICATION_BOUNDARY.liveMarketDataRole).toBe('read-only-consumer');
    expect(MARKET_QUALIFICATION_BOUNDARY.researchOutputsRole).toBe('read-only-consumer');
    expect(MARKET_QUALIFICATION_BOUNDARY.executionSourceOfTruth).toBe(false);
    expect(MARKET_QUALIFICATION_BOUNDARY.forcesTrade).toBe(false);
    expect(MARKET_QUALIFICATION_BOUNDARY.activePorts).toEqual({
      marketQualificationService: true,
      marketQualificationQuery: true,
      liveMarketDataConsumer: true,
      researchOutputConsumer: true,
      consumerRead: true,
      persistence: true,
      rest: false,
    });
  });

  it('owns qualification target, run, state, confidence, health, and lifecycle', () => {
    expect(MARKET_QUALIFICATION_OWNED_CONCERNS).toEqual(
      expect.arrayContaining([
        'qualification-boundary',
        'qualification-target',
        'qualification-run',
        'qualification-state',
        'market-confidence',
        'market-health',
        'qualification-lifecycle',
      ]),
    );
  });

  it('does not claim Profile versions, Runtime, Library, Session, Reporting, or AI', () => {
    expect(MARKET_QUALIFICATION_NON_OWNED).toEqual(
      expect.arrayContaining([
        'market-profile-versions',
        'runtime-enforcement',
        'strategy-library',
        'trading-session',
        'strategy-selection',
        'reporting',
        'ai-analytics',
        'orders',
        'execution-engine',
      ]),
    );
  });

  it('stays distinct from Market Profile, Market State, Orchestrator, and Runtime', () => {
    expect(MARKET_QUALIFICATION_DISTINCT_FROM).toEqual(
      expect.arrayContaining([
        'market-profile',
        'market-state',
        'trading-orchestrator',
        'runtime-enforcement',
        'strategy-library',
        'trading-session',
      ]),
    );
    expect(MARKET_QUALIFICATION_MODULE_ID).not.toBe('market-profile');
    expect(MARKET_QUALIFICATION_MODULE_ID).not.toBe('runtime-enforcement');
  });

  it('forbids selection, execution, Session commands, and SoT substitution', () => {
    for (const capability of [
      'select-strategy',
      'force-trade',
      'command-trading-session',
      'replace-runtime-enforcement',
      'replace-strategy-library',
      'expand-tactical-envelope',
      'become-execution-source-of-truth',
      'auto-spend-heavy-jobs-without-confirm',
    ] as const) {
      expect(isMarketQualificationForbiddenCapability(capability)).toBe(true);
      expect(MARKET_QUALIFICATION_FORBIDDEN_CAPABILITIES).toContain(capability);
    }
  });

  it('never executes as SoT, never trades, never selects, never commands Session', () => {
    expect(marketQualificationIsExecutionSourceOfTruth()).toBe(false);
    expect(marketQualificationForcesTrade()).toBe(false);
    expect(marketQualificationSelectsStrategies()).toBe(false);
    expect(marketQualificationCommandsSessions()).toBe(false);
    expect(marketQualificationReplacesRuntimeEnforcement()).toBe(false);
    expect(marketQualificationReplacesStrategyLibrary()).toBe(false);
    expect(marketQualificationOwnsMarketProfileVersions()).toBe(false);
  });
});
