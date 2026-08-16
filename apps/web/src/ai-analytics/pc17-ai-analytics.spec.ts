import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), 'utf8');
}

describe('PC-17 AI Analytics product path', () => {
  it('registers AI Analytics home, history, and detail without replacing /ai', () => {
    const app = readSrc('../app/App.tsx');
    expect(app).toContain('path="ai-analytics"');
    expect(app).toContain('path="ai-analytics/history"');
    expect(app).toContain('path="ai-analytics/:analysisId"');
    expect(app).toContain('AiAnalyticsHomePage');
    expect(app).toContain('AiAnalyticsHistoryPage');
    expect(app).toContain('AiAnalyticsDetailPage');
    expect(app).toContain('path="ai"');
    expect(app).toContain('AiPage');
  });

  it('exposes AIAnalyticsPort over /ai-analytics, not OpenRouter /ai/execute', () => {
    const api = readSrc('../shared/api.ts');
    expect(api).toContain('/ai-analytics');
    expect(api).toContain('listAiAnalytics');
    expect(api).toContain('generateAiAnalytics');
    expect(api).toContain('getAiAnalytics');
    expect(api).toContain('aiExecute');
  });

  it('adds AI Analytics to the paper-first shell without Coming Soon or trade claims', () => {
    const layout = readSrc('../layout/AppLayout.tsx');
    const catalog = readSrc('../shared/product-ui/catalog.ts');
    const home = readSrc('./AiAnalyticsHomeView.tsx');
    const detail = readSrc('./AiAnalyticsDetailView.tsx');
    expect(catalog).toContain("label: 'AI Analytics'");
    expect(catalog).toContain("to: '/ai-analytics'");
    expect(catalog).toContain("label: 'AI'");
    expect(catalog).toContain("to: '/ai'");
    expect(layout).not.toContain('Coming Soon');
    expect(home).toContain('Narrative and analysis only');
    expect(home).toContain('never authorizes trades');
    expect(home).toContain('OpenRouter');
    expect(home).not.toContain('Coming Soon');
    expect(detail).toContain('Explanation, not an order');
    expect(detail).toContain('Recommendations');
    expect(detail).toContain('Reasoning');
    expect(detail).toContain('Source viewer');
    expect(detail).toContain('Comparison view');
    expect(detail).toContain('Knowledge references');
    expect(detail).not.toContain('Coming Soon');
  });
});
