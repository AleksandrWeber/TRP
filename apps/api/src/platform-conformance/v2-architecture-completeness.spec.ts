import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importPaths, listTsFiles } from './graph-scan';
import { findDirectedCycles, isAllowedConsume } from './v2-integration-graph';
import { duplicateOwnerConcerns } from './v2-ownership-graph';
import { V2_ARCHITECTURE_INVARIANTS } from './v2-certification-checklist';
import {
  V2_PLATFORM_BOUNDARY,
  v2PlatformIntroducesApplicationPorts,
  v2PlatformIsNewModule,
  v2PlatformIsNewSourceOfTruth,
} from './v2-platform-boundary';
import {
  V2_NEST_MODULE_IDS,
  V2_PLATFORM_MODULE_CATALOG,
  V2_PLATFORM_MODULE_IDS,
  type V2PlatformModuleId,
} from './v2-platform-modules';
import { duplicateSotConcepts, tradingFinanceOwners } from './v2-sot-map';

const API_ROOT = process.cwd();

function observedNestAdjacency(): Record<string, string[]> {
  const adjacency: Record<string, string[]> = {};
  for (const from of V2_NEST_MODULE_IDS) {
    adjacency[from] = [];
    const dir = V2_PLATFORM_MODULE_CATALOG[from].nestDir;
    if (!dir) continue;
    for (const file of listTsFiles(join(API_ROOT, dir))) {
      const source = readFileSync(file, 'utf8');
      for (const importPath of importPaths(source)) {
        if (!importPath.startsWith('.')) continue;
        const normalized = importPath.replace(/\\/g, '/');
        for (const id of V2_NEST_MODULE_IDS) {
          if (id === from) continue;
          if (
            normalized === `../${id}` ||
            normalized.startsWith(`../${id}/`) ||
            normalized.includes(`/${id}/`) ||
            normalized.endsWith(`/${id}`)
          ) {
            if (!adjacency[from].includes(id)) adjacency[from].push(id);
          }
        }
      }
    }
  }
  return adjacency;
}

describe('RC-28 Epic 6 — architecture completeness', () => {
  it('keeps the twelve Spec surfaces without new SoT, modules, ports, or runtime', () => {
    expect(V2_PLATFORM_MODULE_IDS).toHaveLength(12);
    expect(V2_PLATFORM_BOUNDARY.moduleCount).toBe(12);
    expect(v2PlatformIsNewModule()).toBe(false);
    expect(v2PlatformIsNewSourceOfTruth()).toBe(false);
    expect(v2PlatformIntroducesApplicationPorts()).toBe(false);
    expect(V2_PLATFORM_BOUNDARY.isNewRuntime).toBe(false);
    expect(V2_ARCHITECTURE_INVARIANTS.newSourceOfTruth).toBe(false);
    expect(V2_ARCHITECTURE_INVARIANTS.architecturalDrift).toBe(false);
    for (const id of V2_NEST_MODULE_IDS) {
      const record = V2_PLATFORM_MODULE_CATALOG[id];
      expect(existsSync(join(API_ROOT, record.nestDir!, `${id}.module.ts`))).toBe(true);
    }
    const commandCenter = join(API_ROOT, '../web/src/command-center');
    expect(existsSync(join(commandCenter, 'CommandCenterPage.tsx'))).toBe(true);
    expect(existsSync(join(commandCenter, 'session-commands.ts'))).toBe(true);
  });

  it('has unique ownership, no dependency cycles, and no extra observed consume edges', () => {
    expect(duplicateOwnerConcerns()).toEqual([]);
    expect(duplicateSotConcepts()).toEqual([]);
    expect([...tradingFinanceOwners()].sort()).toEqual(
      ['accounting', 'execution-engine', 'orders', 'risk-engine', 'trading-session'].sort(),
    );
    const adjacency = observedNestAdjacency();
    expect(findDirectedCycles(adjacency)).toEqual([]);
    const extras: string[] = [];
    for (const [from, targets] of Object.entries(adjacency)) {
      for (const to of targets) {
        if (!isAllowedConsume(from as V2PlatformModuleId, to as V2PlatformModuleId)) {
          extras.push(`${from} → ${to}`);
        }
      }
    }
    expect(extras).toEqual([]);
    expect(V2_ARCHITECTURE_INVARIANTS.ownershipOverlap).toBe(false);
    expect(V2_ARCHITECTURE_INVARIANTS.dependencyCycles).toBe(false);
  });

  it('has no hidden command paths on Command Center and no catalog hub in AppModule', () => {
    const commands = readFileSync(
      join(API_ROOT, '../web/src/command-center/session-commands.ts'),
      'utf8',
    );
    expect(commands).toMatch(/pauseTradingSession/);
    expect(commands).toMatch(/resumeTradingSession/);
    expect(commands).toMatch(/stopTradingSession/);
    expect(commands).not.toMatch(/submitOrder/);
    expect(commands).not.toMatch(/approveRisk/);
    expect(commands).not.toMatch(/certifyStrategy/);
    expect(commands).not.toMatch(/executeTrade/);
    const appSource = readFileSync(join(API_ROOT, 'src/app.module.ts'), 'utf8');
    expect(appSource).not.toMatch(/platform-conformance/);
    expect(appSource).not.toMatch(/PlatformConformanceModule/);
    expect(V2_ARCHITECTURE_INVARIANTS.hiddenCommandPaths).toBe(false);
  });
});
