import { describe, expect, it } from 'vitest';
import { createStrategy, strategyHasCertificationState } from './strategy';
import {
  appendStrategyVersion,
  assertUniqueStrategyVersion,
  createStrategyVersion,
  strategyVersionContentIsImmutable,
  strategyVersionHasCertificationState,
  strategyVersionIdentityKey,
} from './strategy-version';

const createdAt = '2026-08-10T12:00:00.000Z';

describe('RC-22 Epic 2 — Strategy domain model', () => {
  it('creates an immutable Strategy family', () => {
    const strategy = createStrategy({
      strategyFamilyId: 'fam-momentum',
      name: 'Momentum Family',
      description: 'Lab lineage',
      registryRef: 'reg-123',
      workspaceId: 'ws-1',
      createdAt,
    });

    expect(Object.isFrozen(strategy)).toBe(true);
    expect(strategy.strategyFamilyId).toBe('fam-momentum');
    expect(strategy.name).toBe('Momentum Family');
    expect(strategy.description).toBe('Lab lineage');
    expect(strategy.registryRef).toBe('reg-123');
    expect(strategyHasCertificationState(strategy)).toBe(false);
    expect(strategy).not.toHaveProperty('status');
    expect(strategy).not.toHaveProperty('certification');
  });

  it('rejects empty Strategy name / ids', () => {
    expect(() =>
      createStrategy({
        strategyFamilyId: ' ',
        name: 'X',
        workspaceId: 'ws-1',
        createdAt,
      }),
    ).toThrow(/strategyFamilyId/);
    expect(() =>
      createStrategy({
        strategyFamilyId: 'fam-1',
        name: '  ',
        workspaceId: 'ws-1',
        createdAt,
      }),
    ).toThrow(/name/);
  });
});

describe('RC-22 Epic 2 — StrategyVersion domain model', () => {
  const baseVersionInput = {
    libraryEntryId: 'lib-entry-1',
    strategyFamilyId: 'fam-momentum',
    version: '1.0.0',
    contentHash: 'sha256:abc',
    market: 'crypto-spot',
    supportedExchangeScopeIds: ['binance-spot'],
    supportedTimeframes: ['1h', '4h'],
    supportedSymbols: ['BTCUSDT', 'ETHUSDT'],
    workspaceId: 'ws-1',
    createdAt,
  };

  it('creates an immutable StrategyVersion without certification state', () => {
    const version = createStrategyVersion(baseVersionInput);

    expect(Object.isFrozen(version)).toBe(true);
    expect(strategyVersionContentIsImmutable(version)).toBe(true);
    expect(version.libraryEntryId).toBe('lib-entry-1');
    expect(version.version).toBe('1.0.0');
    expect(version.contentHash).toBe('sha256:abc');
    expect(version.supportedExchangeScopeIds).toEqual(['binance-spot']);
    expect(version.supportedTimeframes).toEqual(['1h', '4h']);
    expect(version.supportedUniverse).toEqual({
      kind: 'symbols',
      symbols: ['BTCUSDT', 'ETHUSDT'],
    });
    expect(strategyVersionHasCertificationState(version)).toBe(false);
    expect(version).not.toHaveProperty('status');
    expect(version).not.toHaveProperty('certification');
    expect(version).not.toHaveProperty('tacticalEnvelope');
    expect(version).not.toHaveProperty('evidence');
    expect(version).not.toHaveProperty('eligibility');
  });

  it('creates StrategyVersion with universeRef instead of symbols', () => {
    const version = createStrategyVersion({
      ...baseVersionInput,
      libraryEntryId: 'lib-entry-u',
      supportedSymbols: undefined,
      universeRef: 'universe:majors-v1',
    });
    expect(version.supportedUniverse).toEqual({
      kind: 'universe-ref',
      universeRef: 'universe:majors-v1',
    });
  });

  it('rejects content mutation surface (frozen + no certification fields)', () => {
    const version = createStrategyVersion(baseVersionInput);
    expect(() => {
      (version as { contentHash: string }).contentHash = 'sha256:mutated';
    }).toThrow();
    expect(version.contentHash).toBe('sha256:abc');
  });

  it('allows multiple versions under one Strategy family', () => {
    const v1 = createStrategyVersion(baseVersionInput);
    const v2 = createStrategyVersion({
      ...baseVersionInput,
      libraryEntryId: 'lib-entry-2',
      version: '1.1.0',
      contentHash: 'sha256:def',
    });

    const versions = appendStrategyVersion(appendStrategyVersion([], v1), v2);
    expect(versions).toHaveLength(2);
    expect(versions.map((v) => v.version)).toEqual(['1.0.0', '1.1.0']);
    expect(Object.isFrozen(versions)).toBe(true);
  });

  it('enforces strategyFamilyId + version uniqueness', () => {
    const v1 = createStrategyVersion(baseVersionInput);
    const duplicate = createStrategyVersion({
      ...baseVersionInput,
      libraryEntryId: 'lib-entry-dup',
    });
    expect(strategyVersionIdentityKey(v1)).toBe('fam-momentum::1.0.0');
    expect(() => assertUniqueStrategyVersion([v1], duplicate)).toThrow(/duplicate StrategyVersion/);
    expect(() => appendStrategyVersion([v1], duplicate)).toThrow(/duplicate StrategyVersion/);
  });

  it('rejects mixing families when appending', () => {
    const v1 = createStrategyVersion(baseVersionInput);
    const other = createStrategyVersion({
      ...baseVersionInput,
      libraryEntryId: 'lib-other',
      strategyFamilyId: 'fam-other',
      version: '1.0.0',
    });
    expect(() => appendStrategyVersion([v1], other)).toThrow(/same strategyFamilyId/);
  });

  it('requires scopes, timeframes, and exactly one universe source', () => {
    expect(() =>
      createStrategyVersion({
        ...baseVersionInput,
        supportedExchangeScopeIds: [],
      }),
    ).toThrow(/supportedExchangeScopeIds/);
    expect(() =>
      createStrategyVersion({
        ...baseVersionInput,
        supportedSymbols: undefined,
        universeRef: undefined,
      }),
    ).toThrow(/exactly one/);
    expect(() =>
      createStrategyVersion({
        ...baseVersionInput,
        universeRef: 'universe:x',
      }),
    ).toThrow(/exactly one/);
  });
});
