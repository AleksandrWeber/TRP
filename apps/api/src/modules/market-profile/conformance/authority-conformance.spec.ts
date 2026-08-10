/**
 * RC-25 Epic 6 — Market Profile authority conformance.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MARKET_QUALIFICATION_BOUNDARY } from '../../market-qualification/domain/market-qualification-boundary';
import {
  MARKET_PROFILE_BOUNDARY,
  MARKET_PROFILE_FORBIDDEN_CAPABILITIES,
  MARKET_PROFILE_NON_OWNED,
  marketProfileCommandsSessions,
  marketProfileExpandsTacticalEnvelope,
  marketProfileForcesTrade,
  marketProfileIsExecutionSourceOfTruth,
  marketProfileOwnsQualificationDecisions,
  marketProfileSelectsStrategies,
} from '../domain/market-profile-boundary';
import {
  MARKET_PROFILE_CONSUMER_INTENDED,
  MARKET_PROFILE_LAKE_PROJECTION_CATEGORY,
} from '../domain/market-profile-consumer-read-model';
import { MARKET_PROFILE_PORTS_ACTIVE } from '../ports/market-profile.port';

const PROFILE_ROOT = join(process.cwd(), 'src/modules/market-profile');
const QUAL_ROOT = join(process.cwd(), 'src/modules/market-qualification');
const RUNTIME_ROOT = join(process.cwd(), 'src/modules/runtime-enforcement');
const LIBRARY_ROOT = join(process.cwd(), 'src/modules/strategy-library');
const REPORTING_ROOT = join(process.cwd(), 'src/modules/reporting');
const AI_ROOT = join(process.cwd(), 'src/modules/ai-analytics');
const LMD_ROOT = join(process.cwd(), 'src/modules/live-market-data');

function listTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...listTsFiles(full));
    else if (full.endsWith('.ts') && !full.endsWith('.spec.ts')) out.push(full);
  }
  return out;
}

function importPaths(source: string): string[] {
  return [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]!);
}

function moduleImports(root: string, needle: string): boolean {
  try {
    for (const file of listTsFiles(root)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (importPath.replace(/\\/g, '/').includes(needle)) return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

describe('RC-25 Epic 6 — Market Profile authority conformance', () => {
  it('keeps Profile as research_artifact owner of versions/dimensions only', () => {
    expect(MARKET_PROFILE_BOUNDARY.authorityClass).toBe('research_artifact');
    expect(MARKET_PROFILE_BOUNDARY.ownedConcerns).toEqual(
      expect.arrayContaining([
        'market-profile',
        'profile-versioning',
        'volatility-profile',
        'liquidity-profile',
        'trend-profile',
        'structural-profile',
      ]),
    );
    expect(marketProfileIsExecutionSourceOfTruth()).toBe(false);
    expect(marketProfileForcesTrade()).toBe(false);
    expect(marketProfileSelectsStrategies()).toBe(false);
    expect(marketProfileCommandsSessions()).toBe(false);
    expect(marketProfileOwnsQualificationDecisions()).toBe(false);
    expect(marketProfileExpandsTacticalEnvelope()).toBe(false);
  });

  it('does not claim Qualification state/confidence/health ownership', () => {
    expect(MARKET_PROFILE_NON_OWNED).toEqual(
      expect.arrayContaining([
        'qualification-decisions',
        'qualification-state',
        'qualification-lifecycle',
        'runtime-enforcement',
        'strategy-library',
        'trading-session',
        'reporting',
        'ai-analytics',
      ]),
    );
    expect(MARKET_QUALIFICATION_BOUNDARY.ownedConcerns).toEqual(
      expect.arrayContaining(['qualification-state', 'market-confidence', 'market-health']),
    );
    for (const capability of [
      'force-trade',
      'select-strategy',
      'make-qualification-decision',
      'expand-tactical-envelope',
    ] as const) {
      expect(MARKET_PROFILE_FORBIDDEN_CAPABILITIES).toContain(capability);
    }
  });

  it('activates consumer read ports without REST/persistence/calculation', () => {
    expect(MARKET_PROFILE_PORTS_ACTIVE).toEqual({
      marketProfileService: true,
      marketProfileQuery: true,
      observationalInputReads: true,
      consumerRead: true,
      persistence: false,
      rest: false,
    });
    expect(MARKET_PROFILE_BOUNDARY.activePorts.consumerRead).toBe(true);
    expect(MARKET_PROFILE_CONSUMER_INTENDED).toEqual([
      'trading-orchestrator',
      'reporting',
      'ai-analytics',
    ]);
    expect(MARKET_PROFILE_LAKE_PROJECTION_CATEGORY).toBe('MarketProfile');
  });

  it('preserves Qualification → Profile dependency only (no reverse / LMD-direct / Runtime)', () => {
    expect(moduleImports(PROFILE_ROOT, 'market-qualification')).toBe(true);
    expect(moduleImports(QUAL_ROOT, 'market-profile')).toBe(false);
    expect(moduleImports(PROFILE_ROOT, 'live-market-data')).toBe(false);
    expect(moduleImports(PROFILE_ROOT, 'runtime-enforcement')).toBe(false);
    expect(moduleImports(PROFILE_ROOT, 'strategy-library')).toBe(false);
    expect(moduleImports(PROFILE_ROOT, 'trading-session')).toBe(false);
    expect(moduleImports(RUNTIME_ROOT, 'market-profile')).toBe(false);
    expect(moduleImports(LIBRARY_ROOT, 'market-profile')).toBe(false);
    expect(moduleImports(REPORTING_ROOT, 'market-profile')).toBe(false);
    expect(moduleImports(AI_ROOT, 'market-profile')).toBe(false);
    expect(moduleImports(LMD_ROOT, 'market-profile')).toBe(false);
  });

  it('consumer read adapter exposes no publish / calculation surface', async () => {
    const adapter = await import('../adapters/market-profile-consumer-read.adapter');
    const ctor = adapter.MarketProfileConsumerReadAdapter.prototype;
    expect(ctor).not.toHaveProperty('publishProfileVersion');
    expect(ctor).not.toHaveProperty('computeVolatility');
    expect(ctor).not.toHaveProperty('detectTrend');
    expect(ctor).not.toHaveProperty('selectStrategy');
    expect(ctor).not.toHaveProperty('authorizeSession');
  });
});
