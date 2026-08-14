import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const API_ROOT = process.cwd();
const DOCS = join(API_ROOT, '../../docs/project');
const CONFORMANCE = join(API_ROOT, 'src/platform-conformance');

const CONSTITUTION = [
  'trp-architecture-specification-v2.md',
  'v2-authority-matrix.md',
  'v2-alias-dictionary.md',
  'v2-cluster-isolation-invariants.md',
  'v2-tactics-contract.md',
] as const;

const RC28_PACKAGE = [
  'rc-28-implementation-plan.md',
  'rc-28-epic-breakdown.md',
  'rc-28-api-contract.md',
  'rc-28-integration-diagram.md',
  'rc-28-validation-summary.md',
  'rc-28-architecture-consistency-report.md',
  'rc-28-epic1-platform-integration-boundaries.md',
  'rc-28-epic2-cross-domain-workflow-verification.md',
  'rc-28-epic3-authority-ownership-verification.md',
  'rc-28-epic4-end-to-end-scenario-validation.md',
  'rc-28-epic5-performance-resilience-compatibility.md',
  'rc-28-epic6-version-2-certification.md',
  'rc-28-epic6-internal-audit-report.md',
  'rc-28-epic6-readiness-report.md',
  'rc-28-validation-report.md',
  'rc-28-version-2-certification.md',
  'rc-28-closure-report.md',
] as const;

const CLOSED_RC_REPORTS = [
  'rc-19-closure-report.md',
  'rc-20-closure-report.md',
  'rc-21-closure-report.md',
  'rc-22-closure-report.md',
  'rc-23-closure-report.md',
  'rc-24-closure-report.md',
  'rc-25-closure-report.md',
  'rc-26-closure-report.md',
  'rc-27-closure-report.md',
] as const;

const EPIC_CATALOGS = [
  'v2-platform-modules.ts',
  'v2-integration-graph.ts',
  'v2-ownership-graph.ts',
  'v2-authority-graph.ts',
  'v2-sot-map.ts',
  'v2-workflow-graph.ts',
  'v2-e2e-scenarios.ts',
  'v2-compatibility-matrix.ts',
  'v2-resilience-matrix.ts',
  'v2-certification-checklist.ts',
  'v2-residual-register.ts',
] as const;

describe('RC-28 Epic 6 — documentation completeness', () => {
  it('keeps Spec v2.0, Authority Matrix, Alias Dictionary, and isolation/tactics companions on disk', () => {
    for (const name of CONSTITUTION) {
      expect(existsSync(join(DOCS, name)), name).toBe(true);
    }
    const spec = readFileSync(join(DOCS, 'trp-architecture-specification-v2.md'), 'utf8');
    expect(spec).toContain('### 5.16 Command Center and Dashboard');
    expect(spec).toContain('### 5.13 Knowledge Lake');
    expect(spec).toContain('### 5.2 Strategy Library');
    expect(spec).toContain('### 5.10 Exchange Scope (UI: Cluster)');
    const matrix = readFileSync(join(DOCS, 'v2-authority-matrix.md'), 'utf8');
    const alias = readFileSync(join(DOCS, 'v2-alias-dictionary.md'), 'utf8');
    expect(matrix).toMatch(/Authority Matrix/i);
    expect(alias).toMatch(/Alias Dictionary/i);
  });

  it('keeps the RC-28 planning package and Epic 1–5 reports, plus RC-19…RC-27 closures', () => {
    for (const name of RC28_PACKAGE) {
      expect(existsSync(join(DOCS, name)), name).toBe(true);
    }
    for (const name of CLOSED_RC_REPORTS) {
      expect(existsSync(join(DOCS, name)), name).toBe(true);
    }
  });

  it('keeps the conformance catalog as documentation-backed verification, not a Nest module', () => {
    for (const name of EPIC_CATALOGS) {
      const path = join(CONFORMANCE, name);
      expect(existsSync(path), name).toBe(true);
      const source = readFileSync(path, 'utf8');
      expect(source).not.toMatch(/@Module/);
      expect(source).not.toMatch(/@Injectable/);
    }
    expect(existsSync(join(CONFORMANCE, 'README.md'))).toBe(true);
  });
});
