import { describe, expect, it } from 'vitest';
import { createHistoricalWindow } from '../modules/reporting/domain/historical-window';
import { createReportDefinition } from '../modules/reporting/domain/report-definition';
import { REPORTING_BOUNDARY } from '../modules/reporting/domain/reporting-boundary';
import { KNOWLEDGE_LAKE_AUTHORITY_CLASS } from '../modules/knowledge-lake/domain/knowledge-lake-boundary';
import { bootProjectionScenario, E2E_AS_OF } from './v2-e2e-fixtures';

describe('RC-28 Epic 5 — projection availability', () => {
  it('treats a missing Lake fact as null / empty projection, never SoT', async () => {
    const stack = await bootProjectionScenario();
    expect(stack.lake.getByEventId('missing-projection')).toBeNull();
    const page = stack.lake.list({ workspaceId: 'ws-missing' });
    expect(page.authorityClass).toBe('projection');
    expect(page.items).toEqual([]);
    expect(KNOWLEDGE_LAKE_AUTHORITY_CLASS).toBe('projection');
    await stack.moduleRef.close();
  });

  it('materializes an empty Reporting projection when Lake has no facts', async () => {
    const stack = await bootProjectionScenario();
    stack.reporting.registerDefinition(
      createReportDefinition({
        reportDefinitionId: 'def-proj-empty',
        workspaceId: 'ws-1',
        name: 'Empty Projection',
        kind: 'ops_daily',
        defaultModes: ['paper'],
        metricKeys: ['fact_count'],
        createdAt: E2E_AS_OF,
      }),
    );
    const report = stack.reporting.requestReportRun({
      workspaceId: 'ws-1',
      reportDefinitionId: 'def-proj-empty',
      window: createHistoricalWindow({
        from: '2026-08-14T00:00:00.000Z',
        to: '2026-08-15T00:00:00.000Z',
      }),
      modes: ['paper'],
      requestedAt: E2E_AS_OF,
      reportRunId: 'run-proj-empty',
    });
    expect(report.outcome).toBe('empty');
    expect(report.reportRun?.authorityClass).toBe('projection');
    expect(stack.reportingQuery.getRun('run-proj-empty')?.authorityClass).toBe('projection');
    expect(REPORTING_BOUNDARY.sourceOfTruth).toBe(false);
    await stack.moduleRef.close();
  });
});
