import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EXCHANGE_SCOPE_NON_OWNED } from '../modules/exchange-scope/domain/exchange-scope-boundary';
import { KNOWLEDGE_LAKE_NON_OWNED_SOT } from '../modules/knowledge-lake/domain/knowledge-lake-boundary';
import { REPORTING_NON_OWNED } from '../modules/reporting/domain/reporting-boundary';
import { RUNTIME_ENFORCEMENT_NON_OWNED } from '../modules/runtime-enforcement/domain/runtime-enforcement-boundary';
import { STRATEGY_LIBRARY_NON_OWNED } from '../modules/strategy-library/domain/strategy-library-boundary';
import { TRADING_ORCHESTRATOR_NON_OWNED } from '../modules/trading-orchestrator/domain/trading-orchestrator-boundary';
import { EXISTING_V2_BOUNDARIES } from './v2-platform-boundary';
import {
  duplicateOwnerConcerns,
  ownerOf,
  V2_EXTERNAL_SOLE_OWNERS,
  V2_SOLE_OWNERS,
} from './v2-ownership-graph';

describe('RC-28 Epic 1 — ownership graph', () => {
  it('assigns each integration concern to exactly one V2 owner', () => {
    expect(duplicateOwnerConcerns()).toEqual([]);
    expect(ownerOf('certified-strategy-lifecycle')).toBe('strategy-library');
    expect(ownerOf('enforcement-pass-fail')).toBe('runtime-enforcement');
    expect(ownerOf('analytical-warehouse')).toBe('knowledge-lake');
    expect(ownerOf('report-generation')).toBe('reporting');
    expect(ownerOf('analytical-narrative')).toBe('ai-analytics');
    expect(ownerOf('notification-delivery')).toBe('notification-delivery');
    expect(ownerOf('qualification-run')).toBe('market-qualification');
    expect(ownerOf('market-profile-versions')).toBe('market-profile');
    expect(ownerOf('current-state-snapshot')).toBe('market-state');
    expect(ownerOf('orchestration-run')).toBe('trading-orchestrator');
    expect(ownerOf('exchange-scope-identity')).toBe('exchange-scope');
    expect(ownerOf('ops-command-entry')).toBe('command-center');
  });

  it('does not move Freeze owners into the twelve V2 surfaces', () => {
    expect(V2_EXTERNAL_SOLE_OWNERS['trading-session-lifecycle']).toBe('trading-session');
    expect(V2_EXTERNAL_SOLE_OWNERS['risk-decisions']).toBe('risk-engine');
    expect(V2_EXTERNAL_SOLE_OWNERS.orders).toBe('orders');
    expect(V2_EXTERNAL_SOLE_OWNERS.execution).toBe('execution-engine');
    expect(V2_EXTERNAL_SOLE_OWNERS.ledger).toBe('accounting');
    expect(V2_SOLE_OWNERS.some((row) => row.concern === 'orders')).toBe(false);
    expect(V2_SOLE_OWNERS.some((row) => row.concern === 'risk-decisions')).toBe(false);
  });

  it('has unique ownedConcerns across closed Nest boundary descriptors', () => {
    const seen = new Map<string, string>();
    const collisions: string[] = [];
    for (const [moduleId, boundary] of Object.entries(EXISTING_V2_BOUNDARIES)) {
      const concerns =
        'ownedConcerns' in boundary && Array.isArray(boundary.ownedConcerns)
          ? boundary.ownedConcerns
          : [];
      for (const concern of concerns) {
        const previous = seen.get(concern);
        if (previous) collisions.push(`${concern} claimed by ${previous} and ${moduleId}`);
        else seen.set(concern, moduleId);
      }
    }
    expect(collisions).toEqual([]);
  });

  it('preserves non-ownership of money / session / gate / library where declared', () => {
    expect(KNOWLEDGE_LAKE_NON_OWNED_SOT).toEqual(
      expect.arrayContaining(['orders', 'ledger', 'trading-session', 'risk-engine']),
    );
    expect(REPORTING_NON_OWNED).toEqual(
      expect.arrayContaining(['ledger', 'orders', 'runtime-enforcement', 'strategy-library']),
    );
    expect(STRATEGY_LIBRARY_NON_OWNED).toEqual(
      expect.arrayContaining(['trading-session', 'execution-engine', 'orders']),
    );
    expect(RUNTIME_ENFORCEMENT_NON_OWNED).toEqual(
      expect.arrayContaining(['strategy-library', 'trading-session', 'trading-orchestrator']),
    );
    expect(TRADING_ORCHESTRATOR_NON_OWNED).toEqual(
      expect.arrayContaining([
        'orders',
        'execution-engine',
        'risk-decisions',
        'runtime-enforcement-gate',
      ]),
    );
    expect(EXCHANGE_SCOPE_NON_OWNED).toEqual(
      expect.arrayContaining([
        'strategy-library',
        'runtime-enforcement',
        'orders',
        'risk-engine',
        'execution-engine',
        'trading-orchestrator',
      ]),
    );
  });

  it('does not place the audit catalog on disk as a Nest module', () => {
    expect(join('src', 'platform-conformance')).not.toContain('src/modules/');
  });
});
