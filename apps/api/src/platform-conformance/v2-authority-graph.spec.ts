import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EXISTING_V2_BOUNDARIES } from './v2-platform-boundary';
import {
  COMMAND_CENTER_FORBIDDEN_RESPONSIBILITIES,
  V2_APPROVED_PORT_FILES,
  V2_APPROVED_PORTS,
  V2_AUTHORITY_GRAPH,
  V2_MATRIX_PRIMARY_CLASS,
  modulesClaimingMatrixClass,
} from './v2-authority-graph';
import { V2_PLATFORM_MODULE_CATALOG, V2_PLATFORM_MODULE_IDS } from './v2-platform-modules';

const API_ROOT = process.cwd();

describe('RC-28 Epic 3 — authority graph', () => {
  it('covers every Version 2 surface with owned and forbidden responsibilities', () => {
    expect(Object.keys(V2_AUTHORITY_GRAPH).sort()).toEqual([...V2_PLATFORM_MODULE_IDS].sort());
    for (const moduleId of V2_PLATFORM_MODULE_IDS) {
      const record = V2_AUTHORITY_GRAPH[moduleId];
      expect(record.ownedResponsibilities.length).toBeGreaterThan(0);
      expect(record.forbiddenResponsibilities.length).toBeGreaterThan(0);
      expect(record.authorityClass).toBe(V2_PLATFORM_MODULE_CATALOG[moduleId].authorityClass);
      expect(record.matrixPrimaryClass).toBe(V2_MATRIX_PRIMARY_CLASS[moduleId]);
      expect(record.mutatesTradingFinance).toBe(false);
      expect(record.approvedPorts).toEqual(V2_APPROVED_PORTS[moduleId]);
    }
  });

  it('keeps Authority Matrix primary classes disjoint per module', () => {
    expect(modulesClaimingMatrixClass('source_of_truth')).toEqual(['strategy-library']);
    expect(modulesClaimingMatrixClass('gate')).toEqual(['runtime-enforcement']);
    expect(modulesClaimingMatrixClass('narrative')).toEqual(['ai-analytics']);
    expect(modulesClaimingMatrixClass('command_ui')).toEqual(['command-center']);
    expect(modulesClaimingMatrixClass('policy_input')).toEqual(['exchange-scope']);
    expect(modulesClaimingMatrixClass('orchestration')).toEqual(['trading-orchestrator']);
    expect(modulesClaimingMatrixClass('projection')).toEqual(
      expect.arrayContaining(['knowledge-lake', 'reporting', 'notification-delivery']),
    );
    expect(modulesClaimingMatrixClass('projection')).toHaveLength(3);
  });

  it('composes Nest forbidden capabilities from existing boundary descriptors', () => {
    expect(V2_AUTHORITY_GRAPH['strategy-library'].forbiddenResponsibilities).toEqual(
      EXISTING_V2_BOUNDARIES['strategy-library'].forbiddenCapabilities,
    );
    expect(V2_AUTHORITY_GRAPH['runtime-enforcement'].forbiddenResponsibilities).toContain(
      'soft-fail-warn-and-continue',
    );
    expect(V2_AUTHORITY_GRAPH.reporting.forbiddenResponsibilities).toContain('shadow-accounting');
    expect(V2_AUTHORITY_GRAPH['ai-analytics'].forbiddenResponsibilities).toContain(
      'execute-trades',
    );
    expect(V2_AUTHORITY_GRAPH['notification-delivery'].forbiddenResponsibilities).toContain(
      'telegram-control-plane',
    );
    expect(V2_AUTHORITY_GRAPH['exchange-scope'].forbiddenResponsibilities).toContain(
      'clone-risk-engine',
    );
    expect(COMMAND_CENTER_FORBIDDEN_RESPONSIBILITIES).toContain('ui-only-kill');
  });

  it('binds each surface to already-frozen port files', () => {
    for (const moduleId of V2_PLATFORM_MODULE_IDS) {
      for (const token of V2_AUTHORITY_GRAPH[moduleId].approvedPorts) {
        const relative = V2_APPROVED_PORT_FILES[token as keyof typeof V2_APPROVED_PORT_FILES];
        expect(relative, token).toBeTruthy();
        expect(existsSync(join(API_ROOT, relative))).toBe(true);
        const source = readFileSync(join(API_ROOT, relative), 'utf8');
        expect(source).toContain(token);
      }
    }
  });
});
