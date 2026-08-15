import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('PC-09 market profile DTOs', () => {
  it('exposes query transport only — no publish body', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/validation/dto/market-profile.dto.ts'),
      'utf8',
    );
    expect(source).toContain('ListMarketProfileHistoryQueryDto');
    expect(source).toContain('CompareMarketProfileQueryDto');
    expect(source).toContain('fromVersion');
    expect(source).not.toContain('publishProfileVersion');
    expect(source).not.toContain('class Publish');
  });
});
