import { describe, expect, it } from 'vitest';
import { duplicateSotConcepts, sotOwnerOf, tradingFinanceOwners, V2_SOT_MAP } from './v2-sot-map';
import { V2_PLATFORM_MODULE_IDS } from './v2-platform-modules';

describe('RC-28 Epic 3 — SoT uniqueness', () => {
  it('assigns each business concept to exactly one owner', () => {
    expect(duplicateSotConcepts()).toEqual([]);
    const concepts = V2_SOT_MAP.map((row) => row.concept);
    expect(concepts).toEqual([...new Set(concepts)]);
  });

  it('keeps trading/finance SoT on Freeze owners only', () => {
    expect([...tradingFinanceOwners()].sort()).toEqual(
      ['accounting', 'execution-engine', 'orders', 'risk-engine', 'trading-session'].sort(),
    );
    for (const row of V2_SOT_MAP.filter((item) => item.isTradingFinanceSoT)) {
      expect(V2_PLATFORM_MODULE_IDS as readonly string[]).not.toContain(row.owner);
    }
  });

  it('does not let projections or narratives claim money SoT', () => {
    expect(sotOwnerOf('cash-ledger')).toBe('accounting');
    expect(sotOwnerOf('analytical-warehouse')).not.toBe('accounting');
    expect(sotOwnerOf('report-generation')).not.toBe('accounting');
    expect(sotOwnerOf('analytical-narrative')).not.toBe('accounting');
    expect(sotOwnerOf('ops-command-entry')).not.toBe('trading-session');
    expect(
      V2_SOT_MAP.filter((row) =>
        [
          'knowledge-lake',
          'reporting',
          'ai-analytics',
          'notification-delivery',
          'command-center',
        ].includes(row.owner),
      ).every((row) => row.isTradingFinanceSoT === false),
    ).toBe(true);
  });
});
