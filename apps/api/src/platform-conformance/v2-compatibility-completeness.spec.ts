import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { V2_APPROVED_PORT_FILES } from './v2-authority-graph';
import { V2_COMPATIBILITY_MATRIX } from './v2-compatibility-matrix';
import { V2_E2E_SCENARIOS } from './v2-e2e-scenarios';
import { V2_WORKFLOW_HOPS } from './v2-workflow-graph';
import { V2_READINESS } from './v2-certification-checklist';

const API_ROOT = process.cwd();
const DOCS = join(API_ROOT, '../../docs/project');

describe('RC-28 Epic 6 — compatibility completeness', () => {
  it('keeps RC-19…RC-27 contracts frozen and present on disk', () => {
    expect(V2_COMPATIBILITY_MATRIX.map((row) => row.rc)).toEqual([
      'RC-19',
      'RC-20',
      'RC-21',
      'RC-22',
      'RC-23',
      'RC-24',
      'RC-25',
      'RC-26',
      'RC-27',
    ]);
    for (const row of V2_COMPATIBILITY_MATRIX) {
      expect(row.newInRc28).toBe(false);
      expect(row.paperFreeze).toBe(true);
      for (const token of row.portTokens) {
        const relative = V2_APPROVED_PORT_FILES[token as keyof typeof V2_APPROVED_PORT_FILES];
        expect(existsSync(join(API_ROOT, relative)), token).toBe(true);
      }
    }
  });

  it('keeps Spec v2.0, Authority Matrix, and Alias Dictionary as unmodified companions', () => {
    const spec = readFileSync(join(DOCS, 'trp-architecture-specification-v2.md'), 'utf8');
    const matrix = readFileSync(join(DOCS, 'v2-authority-matrix.md'), 'utf8');
    const alias = readFileSync(join(DOCS, 'v2-alias-dictionary.md'), 'utf8');
    for (const row of V2_COMPATIBILITY_MATRIX) {
      for (const heading of row.specSections) {
        expect(spec).toContain(heading);
      }
    }
    expect(matrix).toMatch(/Authority Matrix/i);
    expect(alias).toMatch(/Bot/);
    expect(alias).toMatch(/Cluster/);
    expect(V2_READINESS.newOwnership).toBe(false);
    expect(V2_READINESS.newApis).toBe(false);
  });

  it('keeps certified workflow hops and E2E scenarios on existing contracts only', () => {
    expect(V2_WORKFLOW_HOPS.length).toBeGreaterThan(0);
    expect(V2_E2E_SCENARIOS.every((row) => row.newApi === false)).toBe(true);
    expect(V2_E2E_SCENARIOS.every((row) => row.ownershipTransfer === false)).toBe(true);
    expect(V2_WORKFLOW_HOPS.every((hop) => hop.ownershipTransfer === false)).toBe(true);
    expect(V2_WORKFLOW_HOPS.every((hop) => hop.hiddenDependency === false)).toBe(true);
  });
});
