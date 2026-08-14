import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importPaths, listTsFiles, resolveV2ImportTarget } from './graph-scan';
import { V2_AUTHORITY_GRAPH } from './v2-authority-graph';
import {
  findDirectedCycles,
  isAllowedConsume,
  isForbiddenReverse,
  V2_FORBIDDEN_REVERSE_EDGES,
} from './v2-integration-graph';
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

describe('RC-28 Epic 3 — authority dependency graph', () => {
  it('matches observed consume direction to the authority graph', () => {
    const adjacency = observedNestAdjacency();
    const leaks: string[] = [];
    for (const from of V2_NEST_MODULE_IDS) {
      const allowed = new Set(V2_AUTHORITY_GRAPH[from].consumes);
      for (const to of adjacency[from] ?? []) {
        if (!allowed.has(to as V2PlatformModuleId)) {
          leaks.push(`${from} → ${to}`);
        }
        if (!isAllowedConsume(from, to as V2PlatformModuleId)) {
          leaks.push(`not-allowed ${from} → ${to}`);
        }
      }
    }
    expect(leaks).toEqual([]);
  });

  it('does not realize named reverse dependencies', () => {
    const adjacency = observedNestAdjacency();
    const hits: string[] = [];
    for (const edge of V2_FORBIDDEN_REVERSE_EDGES) {
      if ((adjacency[edge.from] ?? []).includes(edge.to)) {
        hits.push(`${edge.from} → ${edge.to}`);
      }
      if (isForbiddenReverse(edge.from, edge.to) === false) {
        hits.push(`catalog-miss ${edge.from} → ${edge.to}`);
      }
    }
    expect(hits).toEqual([]);
    expect(findDirectedCycles(adjacency)).toEqual([]);
  });

  it('keeps forbidden consumers from importing the owned surface', () => {
    const adjacency = observedNestAdjacency();
    const hits: string[] = [];
    for (const moduleId of V2_NEST_MODULE_IDS) {
      for (const consumer of V2_AUTHORITY_GRAPH[moduleId].forbiddenConsumers) {
        if ((adjacency[consumer] ?? []).includes(moduleId)) {
          hits.push(`${consumer} consumes ${moduleId}`);
        }
      }
    }
    expect(hits).toEqual([]);
  });

  it('does not add a hidden command path from Notification, AI, or Lake into Session/Orders', () => {
    const scans: Array<[string, string[]]> = [
      ['src/modules/notification-delivery', ['trading-session', '/orders', 'runtime-enforcement']],
      ['src/modules/ai-analytics', ['trading-session', '/orders', 'strategy-library']],
      ['src/modules/knowledge-lake', ['trading-session', '/orders', 'runtime-enforcement']],
    ];
    const hits: string[] = [];
    for (const [dir, fragments] of scans) {
      const root = join(API_ROOT, dir);
      expect(existsSync(root)).toBe(true);
      for (const file of listTsFiles(root)) {
        for (const importPath of importPaths(readFileSync(file, 'utf8'))) {
          for (const fragment of fragments) {
            if (importPath.includes(fragment)) {
              hits.push(`${dir} ${file.split(`/${dir.split('/').pop()}/`)[1]} → ${importPath}`);
            }
          }
        }
      }
    }
    expect(hits).toEqual([]);
  });
});
