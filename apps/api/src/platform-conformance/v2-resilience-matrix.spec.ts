import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateDeployment } from '../modules/runtime-enforcement/domain/validate-deployment';
import { createHistoricalWindow } from '../modules/reporting/domain/historical-window';
import { createReportDefinition } from '../modules/reporting/domain/report-definition';
import {
  bootNotificationScenario,
  bootProjectionScenario,
  E2E_AS_OF,
  e2eCertifiedRecord,
  e2eLibraryReads,
} from './v2-e2e-fixtures';
import { V2_RESILIENCE_CASE_IDS, V2_RESILIENCE_MATRIX } from './v2-resilience-matrix';

const API_ROOT = process.cwd();

describe('RC-28 Epic 5 — resilience matrix', () => {
  it('names fail-closed / empty / unavailable cases without inventing SoT', () => {
    expect(V2_RESILIENCE_MATRIX.map((row) => row.caseId)).toEqual([...V2_RESILIENCE_CASE_IDS]);
    for (const row of V2_RESILIENCE_MATRIX) {
      expect(row.inventsSourceOfTruth).toBe(false);
    }
  });

  it('fails closed on missing Library, missing Gate identity, and missing scope', () => {
    const emptyReads = {
      getByLibraryEntryId: () => null,
      getByFamilyVersion: () => null,
      familyExistsInWorkspace: () => false,
    };
    const missingIdentity = validateDeployment(
      { workspaceId: 'ws-1', purpose: 'deployment_bind' },
      emptyReads,
      E2E_AS_OF,
    );
    expect(missingIdentity.outcome).toBe('fail');
    expect(missingIdentity.validation).toBe('INVALID');

    const missingLibrary = validateDeployment(
      {
        workspaceId: 'ws-1',
        libraryEntryId: 'missing-entry',
        purpose: 'deployment_bind',
        requestedAt: E2E_AS_OF,
      },
      emptyReads,
      E2E_AS_OF,
    );
    expect(missingLibrary.outcome).toBe('fail');
    expect(missingLibrary.validation).toBe('INVALID');

    const record = e2eCertifiedRecord();
    const missingScope = validateDeployment(
      {
        workspaceId: 'ws-1',
        libraryEntryId: record.version.libraryEntryId,
        exchangeScopeId: 'exchange-scope:unknown',
        purpose: 'deployment_bind',
        requestedAt: E2E_AS_OF,
      },
      e2eLibraryReads(record),
      E2E_AS_OF,
    );
    expect(missingScope.outcome).toBe('fail');
    expect(missingScope.reasons).toEqual(expect.arrayContaining(['scope_not_allowed']));
  });

  it('returns empty Lake / Reporting projections when Knowledge Lake facts are unavailable', async () => {
    const stack = await bootProjectionScenario();
    expect(stack.lake.getByEventId('missing')).toBeNull();
    const page = stack.lake.list({ workspaceId: 'ws-empty' });
    expect(page.authorityClass).toBe('projection');
    expect(page.items).toEqual([]);

    stack.reporting.registerDefinition(
      createReportDefinition({
        reportDefinitionId: 'def-empty-lake',
        workspaceId: 'ws-1',
        name: 'Empty Lake',
        kind: 'ops_daily',
        defaultModes: ['paper'],
        metricKeys: ['fact_count'],
        createdAt: E2E_AS_OF,
      }),
    );
    const report = stack.reporting.requestReportRun({
      workspaceId: 'ws-1',
      reportDefinitionId: 'def-empty-lake',
      window: createHistoricalWindow({
        from: '2026-08-14T00:00:00.000Z',
        to: '2026-08-15T00:00:00.000Z',
      }),
      modes: ['paper'],
      requestedAt: E2E_AS_OF,
      reportRunId: 'run-empty-lake',
    });
    expect(report.outcome).toBe('empty');
    expect(report.reportRun?.authorityClass).toBe('projection');
    await stack.moduleRef.close();
  });

  it('keeps AI narrative unavailable and Notification skipped without inventing SoT', async () => {
    const stack = await bootProjectionScenario();
    const narrative = stack.ai.summarize({
      workspaceId: 'ws-1',
      reportRunId: 'missing-run',
      requestedAt: E2E_AS_OF,
    });
    expect(narrative.authorityClass).toBe('narrative');
    expect(narrative.text).toMatch(/unavailable/i);
    expect(narrative.modelMeta?.outcome).toBe('unavailable');
    await stack.moduleRef.close();

    const notify = await bootNotificationScenario();
    const skipped = notify.port.deliver({
      workspaceId: 'ws-1',
      userId: 'op-1',
      type: 'daily-report',
      subject: 'Unavailable channel',
      body: 'No Telegram connected',
      requestedAt: E2E_AS_OF,
    });
    expect(skipped.attempts.some((attempt) => attempt.skipReason === 'channel-not-connected')).toBe(
      true,
    );
    expect(notify.telegram.listSent()).toHaveLength(0);
    await notify.moduleRef.close();

    const commands = readFileSync(
      join(API_ROOT, '../web/src/command-center/session-commands.ts'),
      'utf8',
    );
    expect(commands).toMatch(/pauseTradingSession/);
    expect(commands).not.toMatch(/ai-analytics/);
    expect(commands).not.toMatch(/knowledge-lake/);
  });
});
