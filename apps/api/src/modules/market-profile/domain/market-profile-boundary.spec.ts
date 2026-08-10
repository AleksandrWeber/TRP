import { describe, expect, it } from 'vitest';
import {
  MARKET_PROFILE_AUTHORITY_CLASS,
  MARKET_PROFILE_BOUNDARY,
  MARKET_PROFILE_DISTINCT_FROM,
  MARKET_PROFILE_FORBIDDEN_CAPABILITIES,
  MARKET_PROFILE_MODULE_ID,
  MARKET_PROFILE_NON_OWNED,
  MARKET_PROFILE_OWNED_CONCERNS,
  isMarketProfileForbiddenCapability,
  marketProfileCommandsSessions,
  marketProfileExpandsTacticalEnvelope,
  marketProfileForcesTrade,
  marketProfileIsExecutionSourceOfTruth,
  marketProfileOwnsQualificationDecisions,
  marketProfileReplacesRuntimeEnforcement,
  marketProfileReplacesStrategyLibrary,
  marketProfileSelectsStrategies,
} from './market-profile-boundary';

describe('RC-25 Epic 5 — Market Profile boundary', () => {
  it('exposes research_artifact boundary with publish + query active', () => {
    expect(Object.isFrozen(MARKET_PROFILE_BOUNDARY)).toBe(true);
    expect(MARKET_PROFILE_BOUNDARY.moduleId).toBe(MARKET_PROFILE_MODULE_ID);
    expect(MARKET_PROFILE_BOUNDARY.authorityClass).toBe(MARKET_PROFILE_AUTHORITY_CLASS);
    expect(MARKET_PROFILE_BOUNDARY.qualificationRole).toBe('upstream-read-consumer');
    expect(MARKET_PROFILE_BOUNDARY.executionSourceOfTruth).toBe(false);
    expect(MARKET_PROFILE_BOUNDARY.forcesTrade).toBe(false);
    expect(MARKET_PROFILE_BOUNDARY.activePorts).toEqual({
      marketProfileService: true,
      marketProfileQuery: true,
      observationalInputReads: true,
      consumerRead: true,
      persistence: false,
      rest: false,
    });
  });

  it('owns market profile, versioning, and dimension profiles', () => {
    expect(MARKET_PROFILE_OWNED_CONCERNS).toEqual(
      expect.arrayContaining([
        'market-profile-boundary',
        'market-profile',
        'profile-versioning',
        'volatility-profile',
        'liquidity-profile',
        'trend-profile',
        'structural-profile',
      ]),
    );
  });

  it('does not claim qualification decisions, Runtime, Library, Session, Reporting, or AI', () => {
    expect(MARKET_PROFILE_NON_OWNED).toEqual(
      expect.arrayContaining([
        'qualification-decisions',
        'qualification-state',
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

  it('stays distinct from Market Qualification, Market State, and Orchestrator', () => {
    expect(MARKET_PROFILE_DISTINCT_FROM).toEqual(
      expect.arrayContaining([
        'market-qualification',
        'market-state',
        'trading-orchestrator',
        'runtime-enforcement',
        'strategy-library',
      ]),
    );
    expect(MARKET_PROFILE_MODULE_ID).not.toBe('market-qualification');
    expect(MARKET_PROFILE_MODULE_ID).not.toBe('market-state');
  });

  it('forbids selection, execution, envelope expansion, and qualification decisions', () => {
    for (const capability of [
      'select-strategy',
      'force-trade',
      'expand-tactical-envelope',
      'make-qualification-decision',
      'replace-runtime-enforcement',
      'replace-strategy-library',
      'classify-market-state',
      'become-execution-source-of-truth',
    ] as const) {
      expect(isMarketProfileForbiddenCapability(capability)).toBe(true);
      expect(MARKET_PROFILE_FORBIDDEN_CAPABILITIES).toContain(capability);
    }
  });

  it('never executes as SoT, never trades, never selects, never expands envelopes', () => {
    expect(marketProfileIsExecutionSourceOfTruth()).toBe(false);
    expect(marketProfileForcesTrade()).toBe(false);
    expect(marketProfileSelectsStrategies()).toBe(false);
    expect(marketProfileCommandsSessions()).toBe(false);
    expect(marketProfileReplacesRuntimeEnforcement()).toBe(false);
    expect(marketProfileReplacesStrategyLibrary()).toBe(false);
    expect(marketProfileOwnsQualificationDecisions()).toBe(false);
    expect(marketProfileExpandsTacticalEnvelope()).toBe(false);
  });
});
