import { describe, expect, it } from 'vitest';
import { createHistoricalWindow } from '../modules/reporting/domain/historical-window';
import { createReportDefinition } from '../modules/reporting/domain/report-definition';
import { REPORTING_BOUNDARY } from '../modules/reporting/domain/reporting-boundary';
import { isMoneyAdjacentMetricKey } from '../modules/reporting/domain/reporting-domain-shared';
import { AI_ANALYTICS_BOUNDARY } from '../modules/ai-analytics/domain/ai-analytics-boundary';
import { bootProjectionScenario, E2E_AS_OF } from './v2-e2e-fixtures';

describe('RC-28 Epic 4 — reporting continuity', () => {
  it('materializes labeled paper report projections from Lake facts without shadow accounting', async () => {
    const stack = await bootProjectionScenario();
    expect(
      stack.lake.admit({
        eventId: 'evt-rep-1',
        occurredAt: E2E_AS_OF,
        producer: 'trading-session',
        category: 'Trading',
        mode: 'paper',
        workspaceId: 'ws-1',
        tradingSessionId: 'session-1',
        payload: { displayPnl: 12 },
        schemaVersion: '1',
      }).outcome,
    ).toBe('admitted');

    stack.reporting.registerDefinition(
      createReportDefinition({
        reportDefinitionId: 'def-rep',
        workspaceId: 'ws-1',
        name: 'Paper Ops',
        kind: 'ops_daily',
        defaultModes: ['paper'],
        metricKeys: ['fact_count', 'display_pnl_projection'],
        createdAt: E2E_AS_OF,
      }),
    );
    const report = stack.reporting.requestReportRun({
      workspaceId: 'ws-1',
      reportDefinitionId: 'def-rep',
      window: createHistoricalWindow({
        from: '2026-08-14T00:00:00.000Z',
        to: '2026-08-15T00:00:00.000Z',
      }),
      modes: ['paper'],
      requestedAt: E2E_AS_OF,
      reportRunId: 'run-rep-1',
    });
    expect(report.outcome).toBe('completed');
    const run = stack.reportingQuery.getRun('run-rep-1');
    expect(run?.modes).toEqual(['paper']);
    expect(run?.authorityClass).toBe('projection');
    expect(isMoneyAdjacentMetricKey('display_pnl_projection')).toBe(true);
    expect(REPORTING_BOUNDARY.sourceOfTruth).toBe(false);
    expect(REPORTING_BOUNDARY.forbiddenCapabilities).toEqual(
      expect.arrayContaining(['shadow-accounting', 'recompute-authoritative-balances', 'trade']),
    );

    const narrative = stack.ai.summarize({
      workspaceId: 'ws-1',
      reportRunId: 'run-rep-1',
      requestedAt: E2E_AS_OF,
    });
    expect(narrative.authorityClass).toBe('narrative');
    expect(narrative.sourceRefs.every((ref) => ref.ownerType !== 'knowledge-lake')).toBe(true);
    expect(AI_ANALYTICS_BOUNDARY.knowledgeLakeRole).toBe('never-direct');
    await stack.moduleRef.close();
  });
});
