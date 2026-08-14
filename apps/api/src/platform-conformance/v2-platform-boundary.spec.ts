import { describe, expect, it } from 'vitest';
import {
  EXISTING_V2_BOUNDARIES,
  V2_PLATFORM_AUDIT_ID,
  V2_PLATFORM_BOUNDARY,
  v2PlatformIntroducesApplicationPorts,
  v2PlatformIsNewModule,
  v2PlatformIsNewSourceOfTruth,
} from './v2-platform-boundary';
import { V2_PLATFORM_MODULE_CATALOG, V2_PLATFORM_MODULE_IDS } from './v2-platform-modules';

describe('RC-28 Epic 1 — platform integration boundary', () => {
  it('is an audit catalog, not a thirteenth Nest module or SoT', () => {
    expect(Object.isFrozen(V2_PLATFORM_BOUNDARY)).toBe(true);
    expect(V2_PLATFORM_BOUNDARY.auditId).toBe(V2_PLATFORM_AUDIT_ID);
    expect(V2_PLATFORM_BOUNDARY.moduleCount).toBe(12);
    expect(V2_PLATFORM_BOUNDARY.isNestModule).toBe(false);
    expect(V2_PLATFORM_BOUNDARY.isNewDomain).toBe(false);
    expect(V2_PLATFORM_BOUNDARY.isNewSourceOfTruth).toBe(false);
    expect(V2_PLATFORM_BOUNDARY.isNewApplicationPort).toBe(false);
    expect(V2_PLATFORM_BOUNDARY.isNewRuntime).toBe(false);
    expect(V2_PLATFORM_BOUNDARY.registeredInAppModule).toBe(false);
    expect(v2PlatformIsNewModule()).toBe(false);
    expect(v2PlatformIsNewSourceOfTruth()).toBe(false);
    expect(v2PlatformIntroducesApplicationPorts()).toBe(false);
  });

  it('catalogues every RC-20…RC-27 integration surface', () => {
    expect(V2_PLATFORM_MODULE_IDS).toEqual([
      'command-center',
      'knowledge-lake',
      'strategy-library',
      'runtime-enforcement',
      'reporting',
      'ai-analytics',
      'notification-delivery',
      'market-qualification',
      'market-profile',
      'market-state',
      'trading-orchestrator',
      'exchange-scope',
    ]);
    for (const id of V2_PLATFORM_MODULE_IDS) {
      expect(V2_PLATFORM_MODULE_CATALOG[id].moduleId).toBe(id);
      expect(V2_PLATFORM_MODULE_CATALOG[id].closedRc).toMatch(/^RC-2[0-7]$/);
    }
  });

  it('reuses existing closed boundary descriptors without replacing them', () => {
    expect(EXISTING_V2_BOUNDARIES['knowledge-lake'].authorityClass).toBe('projection');
    expect(EXISTING_V2_BOUNDARIES['strategy-library'].authorityClass).toBe('source_of_truth');
    expect(EXISTING_V2_BOUNDARIES['runtime-enforcement'].authorityClass).toBe('gate');
    expect(EXISTING_V2_BOUNDARIES.reporting.authorityClass).toBe('projection');
    expect(EXISTING_V2_BOUNDARIES['ai-analytics'].authorityClass).toBe('narrative');
    expect(EXISTING_V2_BOUNDARIES['notification-delivery'].authorityClass).toBe(
      'notification-projection',
    );
    expect(EXISTING_V2_BOUNDARIES['market-qualification'].authorityClass).toBe('research_artifact');
    expect(EXISTING_V2_BOUNDARIES['market-profile'].authorityClass).toBe('research_artifact');
    expect(EXISTING_V2_BOUNDARIES['market-state'].authorityClass).toBe('market_state_artifact');
    expect(EXISTING_V2_BOUNDARIES['trading-orchestrator'].authorityClass).toBe(
      'orchestration_artifact',
    );
    expect(EXISTING_V2_BOUNDARIES['exchange-scope'].authorityClass).toBe('exchange_scope_artifact');
    expect(EXISTING_V2_BOUNDARIES['exchange-scope'].isolationRole).toBe('isolation-boundary');
  });
});
