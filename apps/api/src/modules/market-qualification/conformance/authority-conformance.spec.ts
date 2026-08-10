/**
 * RC-25 Epic 6 — Market Qualification authority conformance.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  MARKET_QUALIFICATION_BOUNDARY,
  MARKET_QUALIFICATION_FORBIDDEN_CAPABILITIES,
  MARKET_QUALIFICATION_NON_OWNED,
  marketQualificationCommandsSessions,
  marketQualificationForcesTrade,
  marketQualificationIsExecutionSourceOfTruth,
  marketQualificationOwnsMarketProfileVersions,
  marketQualificationSelectsStrategies,
} from '../domain/market-qualification-boundary';
import {
  MARKET_QUALIFICATION_CONSUMER_INTENDED,
  MARKET_QUALIFICATION_LAKE_PROJECTION_CATEGORY,
} from '../domain/market-qualification-consumer-read-model';
import { MARKET_QUALIFICATION_PORTS_ACTIVE } from '../ports/market-qualification.port';
import { MARKET_PROFILE_BOUNDARY } from '../../market-profile/domain/market-profile-boundary';

const QUAL_ROOT = join(process.cwd(), 'src/modules/market-qualification');
const PROFILE_ROOT = join(process.cwd(), 'src/modules/market-profile');
const RUNTIME_ROOT = join(process.cwd(), 'src/modules/runtime-enforcement');
const LIBRARY_ROOT = join(process.cwd(), 'src/modules/strategy-library');
const REPORTING_ROOT = join(process.cwd(), 'src/modules/reporting');
const AI_ROOT = join(process.cwd(), 'src/modules/ai-analytics');

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

describe('RC-25 Epic 6 — Market Qualification authority conformance', () => {
  it('keeps Qualification as research_artifact owner of state/confidence/health/lifecycle', () => {
    expect(MARKET_QUALIFICATION_BOUNDARY.authorityClass).toBe('research_artifact');
    expect(MARKET_QUALIFICATION_BOUNDARY.ownedConcerns).toEqual(
      expect.arrayContaining([
        'qualification-state',
        'market-confidence',
        'market-health',
        'qualification-lifecycle',
      ]),
    );
    expect(marketQualificationIsExecutionSourceOfTruth()).toBe(false);
    expect(marketQualificationForcesTrade()).toBe(false);
    expect(marketQualificationSelectsStrategies()).toBe(false);
    expect(marketQualificationCommandsSessions()).toBe(false);
    expect(marketQualificationOwnsMarketProfileVersions()).toBe(false);
  });

  it('does not claim Profile versions or Runtime Gate ownership', () => {
    expect(MARKET_QUALIFICATION_NON_OWNED).toEqual(
      expect.arrayContaining([
        'market-profile-versions',
        'runtime-enforcement',
        'strategy-library',
        'trading-session',
        'reporting',
        'ai-analytics',
      ]),
    );
    expect(MARKET_PROFILE_BOUNDARY.ownedConcerns).toEqual(
      expect.arrayContaining(['profile-versioning', 'market-profile']),
    );
    for (const capability of [
      'force-trade',
      'authorize-session-start',
      'select-strategy',
      'replace-runtime-enforcement',
    ] as const) {
      expect(MARKET_QUALIFICATION_FORBIDDEN_CAPABILITIES).toContain(capability);
    }
  });

  it('activates consumer read ports without REST/persistence', () => {
    expect(MARKET_QUALIFICATION_PORTS_ACTIVE).toEqual({
      marketQualificationService: true,
      marketQualificationQuery: true,
      liveMarketDataConsumer: true,
      researchOutputConsumer: true,
      consumerRead: true,
      persistence: false,
      rest: false,
    });
    expect(MARKET_QUALIFICATION_BOUNDARY.activePorts.consumerRead).toBe(true);
    expect(MARKET_QUALIFICATION_CONSUMER_INTENDED).toEqual([
      'trading-orchestrator',
      'reporting',
      'ai-analytics',
    ]);
    expect(MARKET_QUALIFICATION_LAKE_PROJECTION_CATEGORY).toBe('MarketQualification');
  });

  it('forbids reverse Profile → Qualification ownership transfer and Runtime coupling', () => {
    expect(moduleImports(PROFILE_ROOT, 'market-qualification-lifecycle')).toBe(false);
    expect(moduleImports(QUAL_ROOT, 'market-profile')).toBe(false);
    expect(moduleImports(QUAL_ROOT, 'runtime-enforcement')).toBe(false);
    expect(moduleImports(QUAL_ROOT, 'strategy-library')).toBe(false);
    expect(moduleImports(QUAL_ROOT, 'trading-session')).toBe(false);
    expect(moduleImports(RUNTIME_ROOT, 'market-qualification')).toBe(false);
    expect(moduleImports(LIBRARY_ROOT, 'market-qualification')).toBe(false);
    expect(moduleImports(REPORTING_ROOT, 'market-qualification')).toBe(false);
    expect(moduleImports(AI_ROOT, 'market-qualification')).toBe(false);
  });

  it('consumer read adapter exposes no command / mutation surface', async () => {
    const adapter = await import('../adapters/market-qualification-consumer-read.adapter');
    const ctor = adapter.MarketQualificationConsumerReadAdapter.prototype;
    expect(ctor).not.toHaveProperty('requestQualificationRun');
    expect(ctor).not.toHaveProperty('confirmQualificationRun');
    expect(ctor).not.toHaveProperty('completeQualificationRun');
    expect(ctor).not.toHaveProperty('scoreConfidence');
    expect(ctor).not.toHaveProperty('selectStrategy');
  });
});
