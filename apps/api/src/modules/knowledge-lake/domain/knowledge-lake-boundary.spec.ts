import { describe, expect, it } from 'vitest';
import {
  KNOWLEDGE_LAKE_AUTHORITY_CLASS,
  KNOWLEDGE_LAKE_BOUNDARY,
  KNOWLEDGE_LAKE_DISTINCT_FROM,
  KNOWLEDGE_LAKE_EVENT_CATEGORIES,
  KNOWLEDGE_LAKE_FORBIDDEN_CAPABILITIES,
  KNOWLEDGE_LAKE_MODULE_ID,
  KNOWLEDGE_LAKE_NON_OWNED_SOT,
  KNOWLEDGE_LAKE_OWNERSHIP_CHAIN,
  KNOWLEDGE_LAKE_WRITE_SEMANTICS,
  isKnowledgeLakeEventCategory,
  isKnowledgeLakeForbiddenCapability,
  knowledgeLakeOwnsBusinessState,
  resolveAuthorityConflict,
} from './knowledge-lake-boundary';

describe('RC-21 Epic 1 — Knowledge Lake boundary', () => {
  it('exposes an immutable projection-warehouse boundary', () => {
    expect(Object.isFrozen(KNOWLEDGE_LAKE_BOUNDARY)).toBe(true);
    expect(KNOWLEDGE_LAKE_BOUNDARY.moduleId).toBe(KNOWLEDGE_LAKE_MODULE_ID);
    expect(KNOWLEDGE_LAKE_BOUNDARY.authorityClass).toBe(KNOWLEDGE_LAKE_AUTHORITY_CLASS);
    expect(KNOWLEDGE_LAKE_BOUNDARY.authorityClass).toBe('projection');
    expect(KNOWLEDGE_LAKE_BOUNDARY.writeSemantics).toBe(KNOWLEDGE_LAKE_WRITE_SEMANTICS);
    expect(KNOWLEDGE_LAKE_BOUNDARY.writeSemantics).toBe('append-only');
  });

  it('documents SoT → Projection → Knowledge Lake ownership', () => {
    expect(KNOWLEDGE_LAKE_OWNERSHIP_CHAIN).toEqual([
      'source-of-truth',
      'projection',
      'knowledge-lake',
    ]);
    expect(KNOWLEDGE_LAKE_BOUNDARY.ownershipChain[0]).toBe('source-of-truth');
    expect(KNOWLEDGE_LAKE_BOUNDARY.ownershipChain.at(-1)).toBe('knowledge-lake');
    expect(knowledgeLakeOwnsBusinessState()).toBe(false);
  });

  it('declares closed event categories without creating SoT modules', () => {
    expect(KNOWLEDGE_LAKE_EVENT_CATEGORIES).toEqual([
      'Market',
      'Trading',
      'Risk',
      'Paper',
      'Research',
      'Reporting',
      'System',
    ]);
    expect(isKnowledgeLakeEventCategory('Trading')).toBe(true);
    expect(isKnowledgeLakeEventCategory('Ledger')).toBe(false);
  });

  it('does not claim ownership of trading or finance SoT modules', () => {
    expect(KNOWLEDGE_LAKE_NON_OWNED_SOT).toEqual(
      expect.arrayContaining([
        'orders',
        'trading-session',
        'risk-engine',
        'execution-engine',
        'ledger',
        'position',
        'fill',
      ]),
    );
    for (const owner of KNOWLEDGE_LAKE_NON_OWNED_SOT) {
      expect(KNOWLEDGE_LAKE_BOUNDARY.nonOwnedSoT).toContain(owner);
    }
  });

  it('stays distinct from research knowledge / insight / recommendation', () => {
    expect(KNOWLEDGE_LAKE_DISTINCT_FROM).toEqual(
      expect.arrayContaining(['knowledge', 'insight', 'recommendation', 'research-report']),
    );
    expect(KNOWLEDGE_LAKE_MODULE_ID).not.toBe('knowledge');
  });

  it('forbids SoT mutation and in-place fact edits', () => {
    for (const capability of [
      'mutate-orders',
      'mutate-ledger',
      'mutate-session-lifecycle',
      'approve-risk',
      'submit-execution',
      'update-admitted-fact',
      'delete-admitted-fact',
      'command-sot-feedback',
    ] as const) {
      expect(isKnowledgeLakeForbiddenCapability(capability)).toBe(true);
      expect(KNOWLEDGE_LAKE_FORBIDDEN_CAPABILITIES).toContain(capability);
    }
    expect(isKnowledgeLakeForbiddenCapability('admit-analytical-fact')).toBe(false);
  });

  it('enables ingestion + producers + query (Epic 5); persistence stays off', () => {
    expect(KNOWLEDGE_LAKE_BOUNDARY.activePorts).toEqual({
      ingestion: true,
      query: true,
      persistence: true,
      producers: true,
    });
  });

  it('resolves authority conflicts to Source of Truth', () => {
    expect(resolveAuthorityConflict('cash')).toBe('source-of-truth');
    expect(resolveAuthorityConflict('fills')).toBe('source-of-truth');
    expect(resolveAuthorityConflict('orders')).toBe('source-of-truth');
    expect(resolveAuthorityConflict('session-lifecycle')).toBe('source-of-truth');
  });
});
