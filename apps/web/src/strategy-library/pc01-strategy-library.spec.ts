import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), 'utf8');
}

describe('PC-01 Strategy Library product path', () => {
  it('registers Strategy Library as a distinct route from research CRUD', () => {
    const app = readSrc('../app/App.tsx');
    expect(app).toContain('path="strategy-library"');
    expect(app).toContain('path="strategy-library/:libraryEntryId"');
    expect(app).toContain('path="strategies"');
    expect(app).toContain('StrategyLibraryPage');
    expect(app).toContain('StrategiesPage');
  });

  it('exposes Lookup and Eligibility over /strategy-library, not /strategies', () => {
    const api = readSrc('../shared/api.ts');
    expect(api).toContain('/strategy-library');
    expect(api).toContain('`/strategy-library/${libraryEntryId}`');
    expect(api).toContain('`/strategy-library/${libraryEntryId}/eligibility`');
    expect(api).toContain('/strategies');
  });

  it('keeps research strategy CRUD labeled as not the Library', () => {
    const strategies = readSrc('../pages/StrategiesPage.tsx');
    const layout = readSrc('../layout/AppLayout.tsx');
    expect(strategies).toContain('Research strategies');
    expect(strategies).toContain('This is not the');
    expect(strategies).toContain('to="/strategy-library"');
    expect(strategies).toContain('to="/strategy-library/certify"');
    expect(layout).toContain("label: 'Strategy Library'");
    expect(layout).toContain("label: 'Research strategies'");
    expect(layout).not.toContain('Coming Soon');
  });
});
