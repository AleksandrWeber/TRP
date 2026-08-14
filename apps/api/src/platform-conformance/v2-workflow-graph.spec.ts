import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  hopById,
  V2_WORKFLOW_CONTRACT_FILES,
  V2_WORKFLOW_HOPS,
  V2_WORKFLOW_NODE_IDS,
  workflowSequence,
} from './v2-workflow-graph';

const API_ROOT = process.cwd();

describe('RC-28 Epic 2 — complete workflow graph', () => {
  it('covers the certified Research → Command Center sequence without skips', () => {
    expect(workflowSequence()).toEqual([
      'research-lab',
      'strategy-library',
      'runtime-enforcement',
      'trading-orchestrator',
      'trading-session',
      'orders',
      'execution',
      'accounting',
      'knowledge-lake',
      'reporting',
      'ai-analytics',
      'notification-delivery',
      'command-center',
    ]);
    expect(workflowSequence()).toEqual([...V2_WORKFLOW_NODE_IDS]);
    expect(V2_WORKFLOW_HOPS).toHaveLength(12);
  });

  it('keeps hops contiguous and acyclic', () => {
    for (let i = 0; i < V2_WORKFLOW_HOPS.length - 1; i += 1) {
      expect(V2_WORKFLOW_HOPS[i]!.to).toBe(V2_WORKFLOW_HOPS[i + 1]!.from);
    }
    const seen = new Set<string>();
    for (const node of workflowSequence()) {
      expect(seen.has(node)).toBe(false);
      seen.add(node);
    }
  });

  it('never transfers ownership and never declares a hidden dependency', () => {
    for (const hop of V2_WORKFLOW_HOPS) {
      expect(hop.ownershipTransfer).toBe(false);
      expect(hop.hiddenDependency).toBe(false);
      expect(hop.contract.length).toBeGreaterThan(0);
      expect(hop.portToken.length).toBeGreaterThan(0);
    }
  });

  it('places Library before Gate and Gate before Orchestrator / Session / Orders', () => {
    const seq = workflowSequence();
    expect(seq.indexOf('strategy-library')).toBeLessThan(seq.indexOf('runtime-enforcement'));
    expect(seq.indexOf('runtime-enforcement')).toBeLessThan(seq.indexOf('trading-orchestrator'));
    expect(seq.indexOf('runtime-enforcement')).toBeLessThan(seq.indexOf('trading-session'));
    expect(seq.indexOf('runtime-enforcement')).toBeLessThan(seq.indexOf('orders'));
  });

  it('keeps Reporting / AI / Notification after Lake and before Command Center', () => {
    const seq = workflowSequence();
    expect(seq.indexOf('knowledge-lake')).toBeLessThan(seq.indexOf('reporting'));
    expect(seq.indexOf('reporting')).toBeLessThan(seq.indexOf('ai-analytics'));
    expect(seq.indexOf('ai-analytics')).toBeLessThan(seq.indexOf('notification-delivery'));
    expect(seq.indexOf('notification-delivery')).toBeLessThan(seq.indexOf('command-center'));
  });

  it('resolves each hop id to a frozen catalog row', () => {
    expect(hopById('library-to-enforcement')?.owner).toBe('Runtime Enforcement');
    expect(hopById('orchestrator-to-session')?.consumerRole).toBe('handoff-intent');
    expect(existsSync(join(API_ROOT, V2_WORKFLOW_CONTRACT_FILES.RUNTIME_ENFORCEMENT_PORT))).toBe(
      true,
    );
  });
});
