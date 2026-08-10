import { describe, expect, it } from 'vitest';
import {
  ANALYTICAL_NARRATIVE_AUTHORITY_CLASS,
  ANALYTICAL_NARRATIVE_DEFAULT_DISCLAIMER,
  analyticalNarrativeOwnedByReporting,
  createAnalyticalNarrative,
} from './analytical-narrative';

describe('RC-24 Epic 3 — AnalyticalNarrative domain (AI Analytics owned)', () => {
  it('creates immutable narrative with source refs and SoT-wins disclaimer', () => {
    const narrative = createAnalyticalNarrative({
      narrativeId: 'nar-1',
      workspaceId: 'ws-1',
      reportRunId: 'run-1',
      kind: 'summarize',
      text: 'Two paper trading facts observed in the window.',
      sourceRefs: [
        { ownerType: 'knowledge-lake', id: 'evt-1' },
        { ownerType: 'report-run', id: 'run-1' },
      ],
      modesCovered: ['paper'],
      createdAt: '2026-08-10T12:00:00.000Z',
    });

    expect(narrative.authorityClass).toBe(ANALYTICAL_NARRATIVE_AUTHORITY_CLASS);
    expect(narrative.authorityClass).toBe('narrative');
    expect(narrative.disclaimer).toBe(ANALYTICAL_NARRATIVE_DEFAULT_DISCLAIMER);
    expect(Object.isFrozen(narrative)).toBe(true);
    expect(analyticalNarrativeOwnedByReporting()).toBe(false);
  });

  it('rejects empty sourceRefs', () => {
    expect(() =>
      createAnalyticalNarrative({
        narrativeId: 'nar-bad',
        workspaceId: 'ws-1',
        kind: 'explain',
        text: 'Missing sources',
        sourceRefs: [],
        modesCovered: [],
        createdAt: '2026-08-10T12:00:00.000Z',
      }),
    ).toThrow(/sourceRefs must be non-empty/);
  });

  it('does not expose AI runtime generation helpers', async () => {
    const mod = await import('./analytical-narrative');
    expect(mod).not.toHaveProperty('callProvider');
    expect(mod).not.toHaveProperty('generateNarrativeFromLake');
    expect(mod).not.toHaveProperty('executeTrade');
  });
});
