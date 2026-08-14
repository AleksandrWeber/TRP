import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importPaths, listTsFiles } from './graph-scan';
import {
  findDirectedCycles,
  isAllowedConsume,
  V2_ALLOWED_CONSUME_EDGES,
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
        const target = resolveObserved(importPath, from);
        if (target && target !== from && !adjacency[from].includes(target)) {
          adjacency[from].push(target);
        }
      }
    }
  }
  return adjacency;
}

function resolveObserved(importPath: string, from: V2PlatformModuleId): V2PlatformModuleId | null {
  const normalized = importPath.replace(/\\/g, '/');
  for (const id of V2_NEST_MODULE_IDS) {
    if (id === from) continue;
    if (normalized === `../${id}` || normalized.startsWith(`../${id}/`)) return id;
    if (normalized.includes(`/${id}/`) || normalized.endsWith(`/${id}`)) return id;
  }
  return null;
}

describe('RC-28 Epic 5 — performance / dependency graph stability', () => {
  it('has unique allowed consume edges and no duplicate forbidden reverse pairs', () => {
    const allowedKeys = V2_ALLOWED_CONSUME_EDGES.map((edge) => `${edge.from}->${edge.to}`);
    expect(new Set(allowedKeys).size).toBe(allowedKeys.length);
    const forbiddenKeys = V2_FORBIDDEN_REVERSE_EDGES.map((edge) => `${edge.from}->${edge.to}`);
    expect(new Set(forbiddenKeys).size).toBe(forbiddenKeys.length);
    for (const edge of V2_ALLOWED_CONSUME_EDGES) {
      expect(
        V2_FORBIDDEN_REVERSE_EDGES.some((row) => row.from === edge.from && row.to === edge.to),
      ).toBe(false);
    }
  });

  it('does not add observed Nest imports beyond the allowed consume set or create cycles', () => {
    const adjacency = observedNestAdjacency();
    const extras: string[] = [];
    for (const [from, targets] of Object.entries(adjacency)) {
      for (const to of targets) {
        if (!isAllowedConsume(from as V2PlatformModuleId, to as V2PlatformModuleId)) {
          extras.push(`${from} → ${to}`);
        }
      }
    }
    expect(extras).toEqual([]);
    expect(findDirectedCycles(adjacency)).toEqual([]);
  });

  it('keeps product modules free of hidden platform-conformance coupling', () => {
    const hits: string[] = [];
    for (const id of V2_NEST_MODULE_IDS) {
      const dir = V2_PLATFORM_MODULE_CATALOG[id].nestDir;
      if (!dir) continue;
      for (const file of listTsFiles(join(API_ROOT, dir))) {
        if (readFileSync(file, 'utf8').includes('platform-conformance')) {
          hits.push(file);
        }
      }
    }
    const webRoot = join(API_ROOT, '../web/src/command-center');
    for (const file of listTsFiles(webRoot)) {
      if (readFileSync(file, 'utf8').includes('platform-conformance')) {
        hits.push(file);
      }
    }
    const commands = readFileSync(join(webRoot, 'session-commands.ts'), 'utf8');
    expect(commands).not.toMatch(/platform-conformance/);
    expect(hits).toEqual([]);
  });
});
