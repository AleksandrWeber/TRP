import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateDeployment } from '../modules/runtime-enforcement/domain/validate-deployment';
import { RUNTIME_ENFORCEMENT_FORBIDDEN_CAPABILITIES } from '../modules/runtime-enforcement/domain/runtime-enforcement-boundary';
import { importPaths, listTsFiles } from './graph-scan';

const API_ROOT = process.cwd();

const emptyLibraryReads = {
  getByLibraryEntryId: () => null,
  getByFamilyVersion: () => null,
  familyExistsInWorkspace: () => false,
};

describe('RC-28 Epic 2 — fail-closed behaviour', () => {
  it('Gate fails closed on missing identity instead of throwing or passing', () => {
    const decision = validateDeployment(
      { workspaceId: 'ws-1', purpose: 'deployment_bind' },
      emptyLibraryReads,
      '2026-08-14T00:00:00.000Z',
    );
    expect(decision.outcome).toBe('fail');
    expect(decision.validation).toBe('INVALID');
    expect(decision.reasons).toContain('identity_ambiguous');
  });

  it('Gate fails closed when Library has no matching certified record', () => {
    const decision = validateDeployment(
      { workspaceId: 'ws-1', libraryEntryId: 'missing-entry', purpose: 'deployment_bind' },
      emptyLibraryReads,
      '2026-08-14T00:00:00.000Z',
    );
    expect(decision.outcome).toBe('fail');
    expect(decision.validation).toBe('INVALID');
    expect(decision.reasons.length).toBeGreaterThan(0);
  });

  it('forbids soft-fail as an Enforcement capability and in production sources', () => {
    expect(RUNTIME_ENFORCEMENT_FORBIDDEN_CAPABILITIES).toContain('soft-fail-warn-and-continue');
    const root = join(API_ROOT, 'src/modules/runtime-enforcement');
    const violations: string[] = [];
    for (const file of listTsFiles(root)) {
      const source = readFileSync(file, 'utf8');
      if (/warnAndContinue|softFail\s*=\s*true|failOpen/i.test(source)) {
        violations.push(file.split('/runtime-enforcement/')[1] ?? file);
      }
    }
    expect(violations).toEqual([]);
  });

  it('Orchestrator calls validateDeployment before emitting Session handoff intent', () => {
    const source = readFileSync(
      join(
        API_ROOT,
        'src/modules/trading-orchestrator/application/orchestration-workflow.coordinator.ts',
      ),
      'utf8',
    );
    const gateCall = source.indexOf('this.gate.validateDeployment');
    const intent = source.indexOf('createSessionHandoffIntent({');
    expect(gateCall).toBeGreaterThan(0);
    expect(intent).toBeGreaterThan(gateCall);
    expect(source).toMatch(/enforcement\.outcome !== 'pass'/);
  });

  it('Strategy Deployment consumes the Gate and does not import Strategy Library', () => {
    const service = readFileSync(
      join(API_ROOT, 'src/modules/strategy-deployment/strategy-deployment.service.ts'),
      'utf8',
    );
    expect(service).toMatch(/RUNTIME_ENFORCEMENT_PORT/);
    expect(service).toMatch(/validateDeployment/);
    const violations: string[] = [];
    for (const file of listTsFiles(join(API_ROOT, 'src/modules/strategy-deployment'))) {
      for (const importPath of importPaths(readFileSync(file, 'utf8'))) {
        if (importPath.includes('strategy-library')) {
          violations.push(`${file.split('/strategy-deployment/')[1]} → ${importPath}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('Trading Session does not bypass Gate or Library', () => {
    const violations: string[] = [];
    for (const file of listTsFiles(join(API_ROOT, 'src/modules/trading-session'))) {
      for (const importPath of importPaths(readFileSync(file, 'utf8'))) {
        if (importPath.includes('strategy-library') || importPath.includes('runtime-enforcement')) {
          violations.push(`${file.split('/trading-session/')[1]} → ${importPath}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
