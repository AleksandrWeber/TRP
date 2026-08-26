import { describe, expect, it } from 'vitest';
import {
  MARKET_STATE_AUTHORITY_CLASS,
  MARKET_STATE_BOUNDARY,
  MARKET_STATE_DISTINCT_FROM,
  MARKET_STATE_FORBIDDEN_CAPABILITIES,
  MARKET_STATE_MODULE_ID,
  MARKET_STATE_NON_OWNED,
  MARKET_STATE_OWNED_CONCERNS,
  isMarketStateForbiddenCapability,
  marketStateCommandsSessions,
  marketStateForcesTrade,
  marketStateIsExecutionSourceOfTruth,
  marketStateIsProfile,
  marketStateIsQualification,
  marketStateOwnsProfileVersions,
  marketStateOwnsQualificationDecisions,
  marketStateSelectsStrategies,
} from './market-state-boundary';

describe('RC-26 Epic 2 — Market State boundary', () => {
  it('exposes market_state_artifact boundary with input consumers active', () => {
    expect(Object.isFrozen(MARKET_STATE_BOUNDARY)).toBe(true);
    expect(MARKET_STATE_BOUNDARY.moduleId).toBe(MARKET_STATE_MODULE_ID);
    expect(MARKET_STATE_BOUNDARY.authorityClass).toBe(MARKET_STATE_AUTHORITY_CLASS);
    expect(MARKET_STATE_BOUNDARY.liveMarketDataRole).toBe('read-only-consumer');
    expect(MARKET_STATE_BOUNDARY.researchConfidenceRole).toBe('read-only-consumer');
    expect(MARKET_STATE_BOUNDARY.executionSourceOfTruth).toBe(false);
    expect(MARKET_STATE_BOUNDARY.forcesTrade).toBe(false);
    expect(MARKET_STATE_BOUNDARY.isQualification).toBe(false);
    expect(MARKET_STATE_BOUNDARY.isProfile).toBe(false);
    expect(MARKET_STATE_BOUNDARY.activePorts).toEqual({
      marketStateService: false,
      marketStateQuery: false,
      liveMarketDataConsumer: true,
      qualificationConsumer: true,
      profileConsumer: true,
      consumerRead: true,
      persistence: true,
      rest: false,
    });
  });

  it('owns market-state boundary, version, lifecycle, snapshot, and metadata', () => {
    expect(MARKET_STATE_OWNED_CONCERNS).toEqual(
      expect.arrayContaining([
        'market-state-boundary',
        'market-state',
        'market-state-version',
        'market-state-lifecycle',
        'market-state-snapshot',
        'market-state-metadata',
        'current-state-snapshot',
      ]),
    );
  });

  it('does not claim Qualification, Profile, Selection, Runtime, Library, Session, Reporting, or AI', () => {
    expect(MARKET_STATE_NON_OWNED).toEqual(
      expect.arrayContaining([
        'qualification-decisions',
        'qualification-lifecycle',
        'market-profile-versions',
        'strategy-selection',
        'trading-orchestrator',
        'runtime-enforcement',
        'strategy-library',
        'trading-session',
        'reporting',
        'ai-analytics',
        'orders',
        'execution-engine',
      ]),
    );
  });

  it('stays distinct from Qualification, Profile, and Orchestrator', () => {
    expect(MARKET_STATE_DISTINCT_FROM).toEqual(
      expect.arrayContaining([
        'market-qualification',
        'market-profile',
        'trading-orchestrator',
        'runtime-enforcement',
        'strategy-library',
      ]),
    );
    expect(MARKET_STATE_MODULE_ID).not.toBe('market-qualification');
    expect(MARKET_STATE_MODULE_ID).not.toBe('market-profile');
    expect(MARKET_STATE_MODULE_ID).not.toBe('trading-orchestrator');
  });

  it('forbids qualification ownership, selection, execution, and becoming second Qualification', () => {
    for (const capability of [
      'run-qualification',
      'publish-market-profile',
      'become-second-qualification',
      'select-strategy',
      'force-trade',
      'replace-runtime-enforcement',
      'become-execution-source-of-truth',
    ] as const) {
      expect(isMarketStateForbiddenCapability(capability)).toBe(true);
      expect(MARKET_STATE_FORBIDDEN_CAPABILITIES).toContain(capability);
    }
  });

  it('never executes as SoT, never trades, never selects, never is Qualification/Profile', () => {
    expect(marketStateIsExecutionSourceOfTruth()).toBe(false);
    expect(marketStateForcesTrade()).toBe(false);
    expect(marketStateSelectsStrategies()).toBe(false);
    expect(marketStateCommandsSessions()).toBe(false);
    expect(marketStateIsQualification()).toBe(false);
    expect(marketStateIsProfile()).toBe(false);
    expect(marketStateOwnsQualificationDecisions()).toBe(false);
    expect(marketStateOwnsProfileVersions()).toBe(false);
  });
});
