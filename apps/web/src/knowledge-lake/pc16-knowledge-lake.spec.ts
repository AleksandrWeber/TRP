import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), 'utf8');
}

describe('PC-16 Knowledge Lake product path', () => {
  it('registers Knowledge Lake home, history, and detail without renaming /knowledge', () => {
    const app = readSrc('../app/App.tsx');
    expect(app).toContain('path="knowledge-lake"');
    expect(app).toContain('path="knowledge-lake/history"');
    expect(app).toContain('path="knowledge-lake/:entryId"');
    expect(app).toContain('KnowledgeLakeHomePage');
    expect(app).toContain('KnowledgeLakeHistoryPage');
    expect(app).toContain('KnowledgeLakeDetailPage');
    expect(app).toContain('path="knowledge"');
    expect(app).toContain('KnowledgePage');
  });

  it('exposes KnowledgeLakeQueryPort over /knowledge-lake, not research /knowledge', () => {
    const api = readSrc('../shared/api.ts');
    expect(api).toContain('/knowledge-lake');
    expect(api).toContain('listKnowledgeLake');
    expect(api).toContain('searchKnowledgeLake');
    expect(api).toContain('getKnowledgeLakeEntry');
    expect(api).toContain('listKnowledge');
  });

  it('adds Knowledge Lake to the paper-first shell without Coming Soon or ledger claims', () => {
    const layout = readSrc('../layout/AppLayout.tsx');
    const catalog = readSrc('../shared/product-ui/catalog.ts');
    const home = readSrc('./KnowledgeLakeHomeView.tsx');
    const detail = readSrc('./KnowledgeLakeDetailView.tsx');
    expect(catalog).toContain("label: 'Knowledge Lake'");
    expect(catalog).toContain("to: '/knowledge-lake'");
    expect(catalog).toContain("label: 'Knowledge'");
    expect(catalog).toContain("to: '/knowledge'");
    expect(layout).not.toContain('Coming Soon');
    expect(home).toContain('analytical copies, not the');
    expect(home).toContain('ledger Source of Truth');
    expect(home).not.toContain('Coming Soon');
    expect(detail).toContain('Export projection (JSON)');
    expect(detail).toContain('not a PDF engine');
    expect(detail).toContain('Relationship viewer');
    expect(detail).not.toContain('Coming Soon');
  });
});
