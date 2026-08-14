import { describe, expect, it } from 'vitest';
import { ownerOf, V2_EXTERNAL_SOLE_OWNERS, V2_SOLE_OWNERS } from './v2-ownership-graph';
import { V2_DISJOINT_OWNERS, V2_SOT_MAP, sotOwnerOf } from './v2-sot-map';

describe('RC-28 Epic 3 — ownership map', () => {
  it('keeps Library ≠ Gate ≠ Session ≠ Orchestrator ≠ Risk ≠ Execution ≠ Ledger ≠ Lake ≠ Reporting ≠ AI ≠ Notification ≠ Command Center ≠ Scope', () => {
    expect([...V2_DISJOINT_OWNERS].sort()).toEqual([...new Set(V2_DISJOINT_OWNERS)].sort());
    expect(sotOwnerOf('certified-strategy-lifecycle')).toBe('strategy-library');
    expect(sotOwnerOf('enforcement-pass-fail')).toBe('runtime-enforcement');
    expect(sotOwnerOf('trading-session-lifecycle')).toBe('trading-session');
    expect(sotOwnerOf('orchestration-run')).toBe('trading-orchestrator');
    expect(sotOwnerOf('risk-decision')).toBe('risk-engine');
    expect(sotOwnerOf('execution-submit')).toBe('execution-engine');
    expect(sotOwnerOf('cash-ledger')).toBe('accounting');
    expect(sotOwnerOf('analytical-warehouse')).toBe('knowledge-lake');
    expect(sotOwnerOf('report-generation')).toBe('reporting');
    expect(sotOwnerOf('analytical-narrative')).toBe('ai-analytics');
    expect(sotOwnerOf('notification-delivery')).toBe('notification-delivery');
    expect(sotOwnerOf('ops-command-entry')).toBe('command-center');
    expect(sotOwnerOf('exchange-scope-identity')).toBe('exchange-scope');
  });

  it('does not collapse Freeze owners into the twelve V2 surfaces', () => {
    expect(V2_EXTERNAL_SOLE_OWNERS['trading-session-lifecycle']).toBe('trading-session');
    expect(V2_EXTERNAL_SOLE_OWNERS['risk-decisions']).toBe('risk-engine');
    expect(V2_EXTERNAL_SOLE_OWNERS.orders).toBe('orders');
    expect(V2_EXTERNAL_SOLE_OWNERS.execution).toBe('execution-engine');
    expect(V2_EXTERNAL_SOLE_OWNERS.ledger).toBe('accounting');
    expect(V2_SOLE_OWNERS.some((row) => row.concern === 'orders')).toBe(false);
    expect(V2_SOLE_OWNERS.some((row) => row.concern === 'cash-ledger')).toBe(false);
  });

  it('aligns Epic 1 sole-owner rows with the Epic 3 ownership map', () => {
    expect(ownerOf('certified-strategy-lifecycle')).toBe(
      sotOwnerOf('certified-strategy-lifecycle'),
    );
    expect(ownerOf('enforcement-pass-fail')).toBe(sotOwnerOf('enforcement-pass-fail'));
    expect(ownerOf('orchestration-run')).toBe(sotOwnerOf('orchestration-run'));
    expect(ownerOf('analytical-warehouse')).toBe(sotOwnerOf('analytical-warehouse'));
    expect(
      V2_SOT_MAP.filter((row) => row.owner === 'strategy-library').map((row) => row.concept),
    ).toEqual(
      expect.arrayContaining(['certified-strategy-lifecycle', 'tactical-envelope-binding']),
    );
  });
});
