import { describe, expect, it } from 'vitest';
import {
  AI_ANALYTICS_AUTHORITY_CLASS,
  AI_ANALYTICS_BOUNDARY,
  AI_ANALYTICS_DISTINCT_FROM,
  AI_ANALYTICS_FORBIDDEN_CAPABILITIES,
  AI_ANALYTICS_MODULE_ID,
  AI_ANALYTICS_NON_OWNED,
  aiAnalyticsIsSourceOfTruth,
  aiAnalyticsMakesTradingDecisions,
  aiAnalyticsModifiesReports,
  aiAnalyticsQueriesKnowledgeLakeDirectly,
  aiAnalyticsReplacesRuntimeEnforcement,
  aiAnalyticsReplacesStrategyLibrary,
  isAiAnalyticsForbiddenCapability,
} from './ai-analytics-boundary';

describe('RC-24 Epic 5 — AI Analytics boundary', () => {
  it('exposes an immutable narrative boundary with active ports', () => {
    expect(Object.isFrozen(AI_ANALYTICS_BOUNDARY)).toBe(true);
    expect(AI_ANALYTICS_BOUNDARY.moduleId).toBe(AI_ANALYTICS_MODULE_ID);
    expect(AI_ANALYTICS_BOUNDARY.authorityClass).toBe(AI_ANALYTICS_AUTHORITY_CLASS);
    expect(AI_ANALYTICS_BOUNDARY.authorityClass).toBe('narrative');
    expect(AI_ANALYTICS_BOUNDARY.reportingRole).toBe('read-only-consumer');
    expect(AI_ANALYTICS_BOUNDARY.knowledgeLakeRole).toBe('never-direct');
    expect(AI_ANALYTICS_BOUNDARY.sourceOfTruth).toBe(false);
    expect(AI_ANALYTICS_BOUNDARY.activePorts).toEqual({
      explain: true,
      summarize: true,
      identifyTrends: true,
      generateNarrative: true,
      persistence: false,
      rest: false,
    });
  });

  it('does not claim Reporting reports, Lake, Enforcement, Library, or trading SoT', () => {
    expect(AI_ANALYTICS_NON_OWNED).toEqual(
      expect.arrayContaining([
        'reporting-reports',
        'knowledge-lake',
        'runtime-enforcement',
        'strategy-library',
        'trading-decisions',
        'orders',
        'ledger',
      ]),
    );
  });

  it('stays distinct from Reporting and the existing AI Gateway module', () => {
    expect(AI_ANALYTICS_DISTINCT_FROM).toEqual(
      expect.arrayContaining(['reporting', 'ai', 'knowledge-lake']),
    );
    expect(AI_ANALYTICS_MODULE_ID).not.toBe('reporting');
    expect(AI_ANALYTICS_MODULE_ID).not.toBe('ai');
  });

  it('forbids trading decisions, SoT substitution, direct Lake, and report mutation', () => {
    for (const capability of [
      'execute-trades',
      'approve-trades',
      'replace-runtime-enforcement',
      'replace-strategy-library',
      'become-source-of-truth',
      'bypass-risk',
      'modify-report-run',
      'query-knowledge-lake-directly',
    ] as const) {
      expect(isAiAnalyticsForbiddenCapability(capability)).toBe(true);
      expect(AI_ANALYTICS_FORBIDDEN_CAPABILITIES).toContain(capability);
    }
  });

  it('never becomes SoT, never trades, never replaces Enforcement/Library, never mutates reports', () => {
    expect(aiAnalyticsIsSourceOfTruth()).toBe(false);
    expect(aiAnalyticsMakesTradingDecisions()).toBe(false);
    expect(aiAnalyticsReplacesRuntimeEnforcement()).toBe(false);
    expect(aiAnalyticsReplacesStrategyLibrary()).toBe(false);
    expect(aiAnalyticsQueriesKnowledgeLakeDirectly()).toBe(false);
    expect(aiAnalyticsModifiesReports()).toBe(false);
  });

  it('owns analytical-narrative boundary and entity', () => {
    expect(AI_ANALYTICS_BOUNDARY.ownedConcerns).toEqual(
      expect.arrayContaining(['analytical-narrative-boundary', 'analytical-narrative']),
    );
  });
});
