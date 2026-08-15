import { describe, expect, it } from 'vitest';
import { toReportRunNarrativeView } from './report-run-narrative.view';

const at = '2026-08-15T17:00:00.000Z';

describe('PC-15 15-c — ReportRunNarrativeView', () => {
  it('projects an attached narrative without claiming ReportRun ownership', () => {
    const view = toReportRunNarrativeView({
      workspaceId: 'ws-1',
      reportRunId: 'run-1',
      reportOutcome: 'completed',
      narrative: Object.freeze({
        narrativeId: 'nar-1',
        workspaceId: 'ws-1',
        reportRunId: 'run-1',
        kind: 'narrative',
        text: 'commentary',
        sourceRefs: Object.freeze([{ ownerType: 'report-run' as const, id: 'run-1' }]),
        modesCovered: Object.freeze(['paper']),
        authorityClass: 'narrative',
        disclaimer: 'Non-authoritative.',
        createdAt: at,
      }),
    });
    expect(view.attached).toBe(true);
    expect(view.reportMutated).toBe(false);
    expect(view.authorityClass).toBe('narrative');
    expect(view.forcesTrade).toBe(false);
    expect(Object.isFrozen(view)).toBe(true);
  });
});
