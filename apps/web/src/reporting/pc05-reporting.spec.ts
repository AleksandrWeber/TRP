import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), 'utf8');
}

describe('PC-05 Reporting product path', () => {
  it('registers reporting home, history, and detail routes without /reports', () => {
    const app = readSrc('../app/App.tsx');
    expect(app).toContain('path="reporting"');
    expect(app).toContain('path="reporting/history"');
    expect(app).toContain('path="reporting/:reportRunId"');
    expect(app).toContain('ReportingHomePage');
    expect(app).toContain('ReportingHistoryPage');
    expect(app).toContain('ReportingDetailPage');
    expect(app).not.toMatch(/path="reports"/);
  });

  it('exposes ReportingQueryPort over /report-runs, not research /reports', () => {
    const api = readSrc('../shared/api.ts');
    expect(api).toContain('/report-runs');
    expect(api).toContain('`/report-runs/${reportRunId}`');
    expect(api).toContain('listReportRuns');
    expect(api).toContain('getReportRun');
    expect(api).not.toContain("'/reports'");
  });

  it('adds Reporting to the paper-first shell without Coming Soon or ledger claims', () => {
    const layout = readSrc('../layout/AppLayout.tsx');
    const catalog = readSrc('../shared/product-ui/catalog.ts');
    const home = readSrc('./ReportingHomeView.tsx');
    const detail = readSrc('./ReportingDetailView.tsx');
    expect(catalog).toContain("label: 'Reporting'");
    expect(catalog).toContain("to: '/reporting'");
    expect(layout).not.toContain('Coming Soon');
    expect(home).toContain('not the ledger Source of Truth');
    expect(home).not.toContain('Coming Soon');
    expect(detail).toContain('Export projection (JSON)');
    expect(detail).toContain('not a PDF engine');
    expect(detail).not.toContain('Coming Soon');
  });
});
