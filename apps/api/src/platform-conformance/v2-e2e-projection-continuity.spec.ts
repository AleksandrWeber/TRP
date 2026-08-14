import { describe, expect, it } from 'vitest';
import { KNOWLEDGE_LAKE_BOUNDARY } from '../modules/knowledge-lake/domain/knowledge-lake-boundary';
import { InMemoryKnowledgeLakeIngestionAdapter } from '../modules/knowledge-lake/ingestion/in-memory-knowledge-lake-ingestion.adapter';
import type { KnowledgeLakeQueryPort } from '../modules/knowledge-lake/ports/knowledge-lake-query.port';
import { importPaths, listTsFiles } from './graph-scan';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { E2E_AS_OF } from './v2-e2e-fixtures';

const API_ROOT = process.cwd();

describe('RC-28 Epic 4 — projection continuity', () => {
  it('admits append-only facts and queries them as projections, never SoT', () => {
    const lake = new InMemoryKnowledgeLakeIngestionAdapter();
    const query: KnowledgeLakeQueryPort = lake;
    const first = lake.admit({
      eventId: 'evt-proj-1',
      occurredAt: E2E_AS_OF,
      producer: 'orders',
      category: 'Trading',
      mode: 'paper',
      workspaceId: 'ws-1',
      tradingSessionId: 'session-1',
      payload: { kind: 'order_marker' },
      schemaVersion: '1',
    });
    expect(first.outcome).toBe('admitted');
    const duplicate = lake.admit({
      eventId: 'evt-proj-1',
      occurredAt: E2E_AS_OF,
      producer: 'orders',
      category: 'Trading',
      mode: 'paper',
      workspaceId: 'ws-1',
      payload: { kind: 'order_marker', mutated: true },
      schemaVersion: '1',
    });
    expect(duplicate.outcome).toBe('duplicate');
    const page = query.list({ workspaceId: 'ws-1' });
    expect(page.authorityClass).toBe('projection');
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.payload).toEqual({ kind: 'order_marker' });
    expect(KNOWLEDGE_LAKE_BOUNDARY.authorityClass).toBe('projection');
    expect(KNOWLEDGE_LAKE_BOUNDARY.writeSemantics).toBe('append-only');
    expect(KNOWLEDGE_LAKE_BOUNDARY.forbiddenCapabilities).toEqual(
      expect.arrayContaining(['mutate-orders', 'mutate-ledger', 'command-sot-feedback']),
    );
  });

  it('does not let Lake production sources import Orders, Ledger, or Session as SoT', () => {
    const root = join(API_ROOT, 'src/modules/knowledge-lake');
    const hits: string[] = [];
    for (const file of listTsFiles(root)) {
      for (const importPath of importPaths(readFileSync(file, 'utf8'))) {
        if (
          importPath.includes('/orders') ||
          importPath.includes('/ledger') ||
          importPath.includes('trading-session')
        ) {
          hits.push(`${file.split('/knowledge-lake/')[1]} → ${importPath}`);
        }
      }
    }
    expect(hits).toEqual([]);
  });
});
