/**
 * RC-23 Epic 6 — Authority conformance (verification only).
 *
 * No new business behaviour. Asserts Epics 1–5 preserve Spec / Matrix / Alias ownership.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  RUNTIME_ENFORCEMENT_BOUNDARY,
  RUNTIME_ENFORCEMENT_FORBIDDEN_CAPABILITIES,
  RUNTIME_ENFORCEMENT_NON_OWNED,
  knowledgeLakeAuthorizesEnforcement,
  resolveLibraryAuthorityConflict,
  runtimeOwnsCertification,
  runtimeSelectsStrategies,
  validatesDoesNotDecide,
} from '../domain/runtime-enforcement-boundary';
import { RUNTIME_ENFORCEMENT_PORTS_ACTIVE } from '../ports/runtime-enforcement.port';
import { STRATEGY_LIBRARY_BOUNDARY } from '../../strategy-library/domain/strategy-library-boundary';

const ENFORCEMENT_ROOT = join(process.cwd(), 'src/modules/runtime-enforcement');
const LIBRARY_ROOT = join(process.cwd(), 'src/modules/strategy-library');
const SESSION_ROOT = join(process.cwd(), 'src/modules/trading-session');
const DEPLOYMENT_ROOT = join(process.cwd(), 'src/modules/strategy-deployment');

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

function moduleImports(root: string, needle: string): string[] {
  const hits: string[] = [];
  for (const file of listTsFiles(root)) {
    const source = readFileSync(file, 'utf8');
    for (const importPath of importPaths(source)) {
      if (importPath.replace(/\\/g, '/').includes(needle)) {
        hits.push(`${file} → ${importPath}`);
      }
    }
  }
  return hits;
}

describe('RC-23 Epic 6 — Authority conformance', () => {
  it('keeps Runtime Enforcement as Gate only (validates ≠ decides)', () => {
    expect(RUNTIME_ENFORCEMENT_BOUNDARY.authorityClass).toBe('gate');
    expect(validatesDoesNotDecide()).toBe(true);
    expect(runtimeOwnsCertification()).toBe(false);
    expect(runtimeSelectsStrategies()).toBe(false);
    expect(knowledgeLakeAuthorizesEnforcement()).toBe(false);
    expect(RUNTIME_ENFORCEMENT_BOUNDARY.strategyLibraryRole).toBe('read-only-consumer');
    expect(RUNTIME_ENFORCEMENT_BOUNDARY.knowledgeLakeRole).toBe('never-authority');
  });

  it('keeps Strategy Library as certification/eligibility/envelope SoT', () => {
    expect(STRATEGY_LIBRARY_BOUNDARY.authorityClass).toBe('source_of_truth');
    expect(STRATEGY_LIBRARY_BOUNDARY.ownedConcerns).toEqual(
      expect.arrayContaining([
        'certified-strategy-lifecycle',
        'certification-references',
        'eligibility-references',
        'tactical-envelope-binding-references',
      ]),
    );
    expect(resolveLibraryAuthorityConflict('certified-membership')).toBe('strategy-library');
    expect(resolveLibraryAuthorityConflict('eligibility-status')).toBe('strategy-library');
    expect(resolveLibraryAuthorityConflict('tactical-envelope')).toBe('strategy-library');
  });

  it('declares non-owned and forbidden capabilities for Enforcement', () => {
    for (const owner of [
      'strategy-certification',
      'strategy-eligibility',
      'library-tactical-envelope',
      'trading-session',
      'strategy-deployment',
      'trading-orchestrator',
      'market-state-engine',
      'knowledge-lake',
    ] as const) {
      expect(RUNTIME_ENFORCEMENT_NON_OWNED).toContain(owner);
    }
    for (const capability of [
      'certify-strategy',
      'select-strategy',
      'authorize-from-lake',
      'soft-fail-warn-and-continue',
      'implement-orchestrator',
      'implement-market-state',
      'write-library-certification',
    ] as const) {
      expect(RUNTIME_ENFORCEMENT_FORBIDDEN_CAPABILITIES).toContain(capability);
    }
  });

  it('activates Gate + Library reads only (no REST/persistence product)', () => {
    expect(RUNTIME_ENFORCEMENT_PORTS_ACTIVE).toEqual({
      validateDeployment: true,
      libraryLookup: true,
      libraryEligibility: true,
      persistence: false,
      rest: false,
    });
  });

  it('preserves dependency direction: Library never depends on Enforcement', () => {
    expect(moduleImports(LIBRARY_ROOT, 'runtime-enforcement')).toEqual([]);
  });

  it('preserves dependency direction: Session never imports Enforcement or Library', () => {
    expect(moduleImports(SESSION_ROOT, 'runtime-enforcement')).toEqual([]);
    expect(moduleImports(SESSION_ROOT, 'strategy-library')).toEqual([]);
  });

  it('preserves dependency direction: Deployment consumes Enforcement; never imports Library', () => {
    expect(moduleImports(DEPLOYMENT_ROOT, 'runtime-enforcement').length).toBeGreaterThan(0);
    expect(moduleImports(DEPLOYMENT_ROOT, 'strategy-library')).toEqual([]);
  });

  it('forbids soft-fail / warn-and-continue strings in Enforcement production sources', () => {
    const violations: string[] = [];
    for (const file of listTsFiles(ENFORCEMENT_ROOT)) {
      const source = readFileSync(file, 'utf8');
      if (/warnAndContinue|softFail\s*=\s*true|failOpen/i.test(source)) {
        violations.push(file);
      }
    }
    expect(violations).toEqual([]);
  });

  it('does not introduce Orchestrator or Market State modules on the Enforcement path', () => {
    const moduleSource = readFileSync(
      join(ENFORCEMENT_ROOT, 'runtime-enforcement.module.ts'),
      'utf8',
    );
    expect(moduleSource).not.toMatch(/Orchestrator|MarketState|StrategySelection/);
    expect(moduleImports(ENFORCEMENT_ROOT, 'trading-orchestrator')).toEqual([]);
    expect(moduleImports(ENFORCEMENT_ROOT, 'market-state')).toEqual([]);
  });
});
