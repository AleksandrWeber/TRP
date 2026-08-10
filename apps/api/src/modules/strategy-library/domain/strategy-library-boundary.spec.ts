import { describe, expect, it } from 'vitest';
import {
  STRATEGY_LIBRARY_AUTHORITY_CLASS,
  STRATEGY_LIBRARY_BOUNDARY,
  STRATEGY_LIBRARY_CLASSIFICATION,
  STRATEGY_LIBRARY_DISTINCT_FROM,
  STRATEGY_LIBRARY_FORBIDDEN_CAPABILITIES,
  STRATEGY_LIBRARY_MODULE_ID,
  STRATEGY_LIBRARY_NON_OWNED,
  STRATEGY_LIBRARY_OWNED_CONCERNS,
  isStrategyLibraryForbiddenCapability,
  isStrategyLibraryOwnedConcern,
  knowledgeLakeOwnsLibraryMembership,
  registryActiveMeansCertified,
  resolveLibraryAuthorityConflict,
  resolveNonLibraryConflict,
  strategyLibraryOwnsCertifiedMembership,
} from './strategy-library-boundary';

describe('RC-22 Epic 1 — Strategy Library boundary', () => {
  it('exposes an immutable SoT boundary for certified strategies', () => {
    expect(Object.isFrozen(STRATEGY_LIBRARY_BOUNDARY)).toBe(true);
    expect(STRATEGY_LIBRARY_BOUNDARY.moduleId).toBe(STRATEGY_LIBRARY_MODULE_ID);
    expect(STRATEGY_LIBRARY_BOUNDARY.moduleId).toBe('strategy-library');
    expect(STRATEGY_LIBRARY_BOUNDARY.authorityClass).toBe(STRATEGY_LIBRARY_AUTHORITY_CLASS);
    expect(STRATEGY_LIBRARY_BOUNDARY.authorityClass).toBe('source_of_truth');
    expect(strategyLibraryOwnsCertifiedMembership()).toBe(true);
  });

  it('declares owned certified-strategy concerns without implementing entities', () => {
    expect(STRATEGY_LIBRARY_OWNED_CONCERNS).toEqual([
      'certified-strategy-lifecycle',
      'strategy-versions',
      'certification-references',
      'eligibility-references',
      'tactical-envelope-binding-references',
    ]);
    for (const concern of STRATEGY_LIBRARY_OWNED_CONCERNS) {
      expect(isStrategyLibraryOwnedConcern(concern)).toBe(true);
      expect(STRATEGY_LIBRARY_BOUNDARY.ownedConcerns).toContain(concern);
    }
    expect(isStrategyLibraryOwnedConcern('trading-session')).toBe(false);
  });

  it('publishes classification vocabulary; registry active ≠ certified', () => {
    expect(STRATEGY_LIBRARY_CLASSIFICATION).toEqual([
      'research-artifact',
      'experimental-strategy',
      'certified-strategy',
      'deprecated-strategy',
      'archived-strategy',
    ]);
    expect(registryActiveMeansCertified()).toBe(false);
  });

  it('does not own Research, Paper, Session, Lake, or Execution', () => {
    expect(STRATEGY_LIBRARY_NON_OWNED).toEqual(
      expect.arrayContaining([
        'research-experiments',
        'paper-trading',
        'trading-session',
        'knowledge-lake',
        'execution-engine',
        'strategy-registry',
        'trading-orchestrator',
        'market-state-engine',
      ]),
    );
    for (const owner of STRATEGY_LIBRARY_NON_OWNED) {
      expect(STRATEGY_LIBRARY_BOUNDARY.nonOwned).toContain(owner);
    }
  });

  it('stays distinct from registry, Lake, Session stub, and Bot facade', () => {
    expect(STRATEGY_LIBRARY_DISTINCT_FROM).toEqual(
      expect.arrayContaining([
        'strategies',
        'knowledge-lake',
        'tactical-envelope',
        'bot-facade',
        'trading-session',
        'strategy-deployment',
      ]),
    );
    expect(STRATEGY_LIBRARY_MODULE_ID).not.toBe('strategies');
    expect(STRATEGY_LIBRARY_MODULE_ID).not.toBe('knowledge-lake');
    expect(STRATEGY_LIBRARY_MODULE_ID).not.toBe('bot-facade');
  });

  it('forbids execution, Lake-as-SoT, auto-certify, and Orchestrator absorption', () => {
    for (const capability of [
      'execute-strategy',
      'mutate-session-lifecycle',
      'mutate-paper-trading',
      'mutate-orders',
      'approve-risk',
      'submit-execution',
      'mutate-knowledge-lake-as-sot',
      'authorize-eligibility-from-lake',
      'invent-envelope-points',
      'auto-certify-without-human',
      'own-research-experiments',
      'implement-orchestrator',
      'implement-market-state',
    ] as const) {
      expect(isStrategyLibraryForbiddenCapability(capability)).toBe(true);
      expect(STRATEGY_LIBRARY_FORBIDDEN_CAPABILITIES).toContain(capability);
    }
    expect(isStrategyLibraryForbiddenCapability('lookup-certified-version')).toBe(false);
  });

  it('enables full Strategy Library domains (Epic 6); application ports stay inactive', () => {
    expect(STRATEGY_LIBRARY_BOUNDARY.activePorts).toEqual({
      registration: false,
      certification: false,
      certificationDomain: true,
      tacticalEnvelopeDomain: true,
      eligibilityDomain: true,
      lifecycleDomain: true,
      lookup: false,
      eligibility: false,
      lifecycle: false,
      persistence: false,
      strategyModel: true,
    });
  });

  it('treats Knowledge Lake as projection consumer only', () => {
    expect(STRATEGY_LIBRARY_BOUNDARY.knowledgeLakeRole).toBe('projection-consumer-only');
    expect(knowledgeLakeOwnsLibraryMembership()).toBe(false);
  });

  it('resolves certified-membership conflicts to Strategy Library', () => {
    expect(resolveLibraryAuthorityConflict('certified-membership')).toBe('strategy-library');
    expect(resolveLibraryAuthorityConflict('tactical-envelope')).toBe('strategy-library');
    expect(resolveLibraryAuthorityConflict('eligibility-status')).toBe('strategy-library');
  });

  it('does not steal Session / Paper / Execution / Lake authority', () => {
    expect(resolveNonLibraryConflict('session-lifecycle')).toBe('trading-session');
    expect(resolveNonLibraryConflict('paper-trading')).toBe('paper-trading');
    expect(resolveNonLibraryConflict('execution')).toBe('execution-engine');
    expect(resolveNonLibraryConflict('knowledge-lake-facts')).toBe('knowledge-lake-projection');
  });
});
