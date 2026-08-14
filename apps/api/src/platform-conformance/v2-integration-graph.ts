/**
 * RC-28 Epic 1 — allowed consume edges and forbidden reverse edges
 * among Version 2 modules.
 *
 * Edge meaning: `from` may depend on / read `to`. Reverse of an allowed
 * consume is forbidden unless explicitly listed as allowed the other way.
 */

import { V2_NEST_MODULE_IDS, type V2PlatformModuleId } from './v2-platform-modules';

export type V2ConsumeEdge = Readonly<{
  from: V2PlatformModuleId;
  to: V2PlatformModuleId;
  kind: 'read-consume' | 'identity-key' | 'command-route';
}>;

/**
 * Architecturally allowed production dependencies among the twelve V2 surfaces.
 * Observed Nest imports must be a subset of this list (plus out-of-catalog
 * modules such as live-market-data, trading-session, risk).
 */
export const V2_ALLOWED_CONSUME_EDGES: readonly V2ConsumeEdge[] = Object.freeze([
  { from: 'runtime-enforcement', to: 'strategy-library', kind: 'read-consume' },
  { from: 'trading-orchestrator', to: 'strategy-library', kind: 'read-consume' },
  { from: 'trading-orchestrator', to: 'runtime-enforcement', kind: 'read-consume' },
  { from: 'trading-orchestrator', to: 'market-state', kind: 'read-consume' },
  { from: 'trading-orchestrator', to: 'market-qualification', kind: 'read-consume' },
  { from: 'trading-orchestrator', to: 'market-profile', kind: 'read-consume' },
  { from: 'trading-orchestrator', to: 'exchange-scope', kind: 'identity-key' },
  { from: 'reporting', to: 'knowledge-lake', kind: 'read-consume' },
  { from: 'reporting', to: 'exchange-scope', kind: 'identity-key' },
  { from: 'ai-analytics', to: 'reporting', kind: 'read-consume' },
  { from: 'market-qualification', to: 'knowledge-lake', kind: 'read-consume' },
  { from: 'market-profile', to: 'market-qualification', kind: 'read-consume' },
  { from: 'market-state', to: 'market-qualification', kind: 'read-consume' },
  { from: 'market-state', to: 'market-profile', kind: 'read-consume' },
  { from: 'knowledge-lake', to: 'exchange-scope', kind: 'identity-key' },
  { from: 'command-center', to: 'exchange-scope', kind: 'read-consume' },
  { from: 'command-center', to: 'reporting', kind: 'read-consume' },
  { from: 'command-center', to: 'trading-orchestrator', kind: 'read-consume' },
  { from: 'command-center', to: 'market-state', kind: 'read-consume' },
  { from: 'command-center', to: 'notification-delivery', kind: 'read-consume' },
]);

/**
 * Named reverse / steal edges that must never appear as production imports
 * among V2 modules (Plan §3.1 / Integration Diagram §3.5).
 */
export const V2_FORBIDDEN_REVERSE_EDGES: readonly V2ConsumeEdge[] = Object.freeze([
  { from: 'knowledge-lake', to: 'reporting', kind: 'read-consume' },
  { from: 'knowledge-lake', to: 'strategy-library', kind: 'read-consume' },
  { from: 'knowledge-lake', to: 'runtime-enforcement', kind: 'read-consume' },
  { from: 'strategy-library', to: 'runtime-enforcement', kind: 'read-consume' },
  { from: 'strategy-library', to: 'trading-orchestrator', kind: 'read-consume' },
  { from: 'runtime-enforcement', to: 'trading-orchestrator', kind: 'read-consume' },
  { from: 'runtime-enforcement', to: 'knowledge-lake', kind: 'read-consume' },
  { from: 'ai-analytics', to: 'knowledge-lake', kind: 'read-consume' },
  { from: 'ai-analytics', to: 'strategy-library', kind: 'read-consume' },
  { from: 'ai-analytics', to: 'runtime-enforcement', kind: 'read-consume' },
  { from: 'notification-delivery', to: 'reporting', kind: 'read-consume' },
  { from: 'notification-delivery', to: 'strategy-library', kind: 'read-consume' },
  { from: 'notification-delivery', to: 'runtime-enforcement', kind: 'read-consume' },
  { from: 'exchange-scope', to: 'strategy-library', kind: 'read-consume' },
  { from: 'exchange-scope', to: 'runtime-enforcement', kind: 'read-consume' },
  { from: 'exchange-scope', to: 'trading-orchestrator', kind: 'read-consume' },
  { from: 'exchange-scope', to: 'reporting', kind: 'read-consume' },
  { from: 'exchange-scope', to: 'knowledge-lake', kind: 'read-consume' },
  { from: 'exchange-scope', to: 'market-state', kind: 'read-consume' },
  { from: 'market-qualification', to: 'market-profile', kind: 'read-consume' },
  { from: 'market-qualification', to: 'market-state', kind: 'read-consume' },
  { from: 'market-qualification', to: 'trading-orchestrator', kind: 'read-consume' },
  { from: 'market-profile', to: 'market-state', kind: 'read-consume' },
  { from: 'market-profile', to: 'trading-orchestrator', kind: 'read-consume' },
  { from: 'market-state', to: 'trading-orchestrator', kind: 'read-consume' },
  { from: 'reporting', to: 'ai-analytics', kind: 'read-consume' },
  { from: 'trading-orchestrator', to: 'reporting', kind: 'read-consume' },
  { from: 'trading-orchestrator', to: 'ai-analytics', kind: 'read-consume' },
]);

export function allowedTargets(from: V2PlatformModuleId): readonly V2PlatformModuleId[] {
  return V2_ALLOWED_CONSUME_EDGES.filter((edge) => edge.from === from).map((edge) => edge.to);
}

export function isAllowedConsume(from: V2PlatformModuleId, to: V2PlatformModuleId): boolean {
  return V2_ALLOWED_CONSUME_EDGES.some((edge) => edge.from === from && edge.to === to);
}

export function isForbiddenReverse(from: V2PlatformModuleId, to: V2PlatformModuleId): boolean {
  return V2_FORBIDDEN_REVERSE_EDGES.some((edge) => edge.from === from && edge.to === to);
}

export function adjacencyFromAllowedEdges(): Record<V2PlatformModuleId, V2PlatformModuleId[]> {
  const adjacency = {} as Record<V2PlatformModuleId, V2PlatformModuleId[]>;
  for (const id of V2_NEST_MODULE_IDS) adjacency[id] = [];
  adjacency['command-center'] = [];
  for (const edge of V2_ALLOWED_CONSUME_EDGES) {
    adjacency[edge.from].push(edge.to);
  }
  return adjacency;
}

export function findDirectedCycles(
  adjacency: Readonly<Record<string, readonly string[]>>,
): string[][] {
  const cycles: string[][] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];

  function dfs(node: string): void {
    if (visiting.has(node)) {
      const start = stack.indexOf(node);
      cycles.push([...stack.slice(Math.max(0, start)), node]);
      return;
    }
    if (visited.has(node)) return;
    visiting.add(node);
    stack.push(node);
    for (const next of adjacency[node] ?? []) dfs(next);
    stack.pop();
    visiting.delete(node);
    visited.add(node);
  }

  for (const node of Object.keys(adjacency)) dfs(node);
  return cycles;
}
