import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importPaths, listTsFiles, resolveV2ImportTarget } from './graph-scan';
import { findDirectedCycles, isAllowedConsume, isForbiddenReverse } from './v2-integration-graph';
import {
  V2_NEST_MODULE_IDS,
  V2_PLATFORM_MODULE_CATALOG,
  type V2PlatformModuleId,
} from './v2-platform-modules';

const API_ROOT = process.cwd();

function observedNestAdjacency(): Record<string, string[]> {
  const adjacency: Record<string, string[]> = {};
  for (const from of V2_NEST_MODULE_IDS) {
    adjacency[from] = [];
    const dir = V2_PLATFORM_MODULE_CATALOG[from].nestDir;
    if (!dir) continue;
    const root = join(API_ROOT, dir);
    for (const file of listTsFiles(root)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (!importPath.startsWith('.')) continue;
        const target = resolveV2ImportTarget(importPath, from);
        if (target && target !== from && !adjacency[from].includes(target)) {
          adjacency[from].push(target);
        }
      }
    }
  }
  return adjacency;
}

describe('RC-28 Epic 1 — dependency graph', () => {
  it('restricts production V2 Nest imports to the allowed consume set', () => {
    const violations: string[] = [];
    const adjacency = observedNestAdjacency();
    for (const [from, targets] of Object.entries(adjacency)) {
      for (const to of targets) {
        if (!isAllowedConsume(from as V2PlatformModuleId, to as V2PlatformModuleId)) {
          violations.push(`${from} → ${to}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('does not realize any named forbidden reverse edge in production imports', () => {
    const adjacency = observedNestAdjacency();
    const hits: string[] = [];
    for (const [from, targets] of Object.entries(adjacency)) {
      for (const to of targets) {
        if (isForbiddenReverse(from as V2PlatformModuleId, to as V2PlatformModuleId)) {
          hits.push(`${from} → ${to}`);
        }
      }
    }
    expect(hits).toEqual([]);
  });

  it('has no circular production dependencies among V2 Nest modules', () => {
    expect(findDirectedCycles(observedNestAdjacency())).toEqual([]);
  });

  it('keeps Exchange Scope free of engine / reporting / lake production imports', () => {
    const scopeDir = join(API_ROOT, V2_PLATFORM_MODULE_CATALOG['exchange-scope'].nestDir!);
    const forbidden = [
      '/orders',
      '/risk-engine',
      '/execution-engine',
      '/trading-session',
      '/runtime-enforcement',
      '/strategy-library',
      '/reporting',
      '/ai-analytics',
      '/knowledge-lake',
      '/notification-delivery',
      '/trading-orchestrator',
      '/market-state',
    ];
    const violations: string[] = [];
    for (const file of listTsFiles(scopeDir)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (!importPath.startsWith('.')) continue;
        const normalized = importPath.replace(/\\/g, '/');
        for (const segment of forbidden) {
          if (normalized.includes(segment)) {
            violations.push(`${file.split('/exchange-scope/')[1]} → ${importPath}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('does not let Command Center UI import a Nest V2 module as a second SoT', () => {
    const webRoot = join(API_ROOT, '../web/src/command-center');
    expect(existsSync(webRoot)).toBe(true);
    const forbidden = [
      'knowledge-lake',
      'strategy-library',
      'runtime-enforcement',
      'exchange-scope/domain',
      'orders/',
      'ledger',
    ];
    const violations: string[] = [];
    for (const file of listTsFiles(webRoot)) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        const normalized = importPath.replace(/\\/g, '/');
        for (const segment of forbidden) {
          if (normalized.includes(segment)) {
            violations.push(`${file.split('/command-center/')[1]} → ${importPath}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
