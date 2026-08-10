import { describe, expect, it } from 'vitest';
import {
  REPORTING_AUTHORITY_CLASS,
  REPORTING_BOUNDARY,
  REPORTING_DISTINCT_FROM,
  REPORTING_FORBIDDEN_CAPABILITIES,
  REPORTING_MODULE_ID,
  REPORTING_NON_OWNED,
  REPORTING_OWNED_CONCERNS,
  isReportingForbiddenCapability,
  isReportingOwnedConcern,
  reportingAuthorizes,
  reportingIsSourceOfTruth,
  reportingOwnsBusinessState,
  reportingTrades,
  reportingValidatesStrategies,
  resolveEnforcementConflict,
  resolveLakeStorageConflict,
  resolveLibraryConflict,
  resolveReportingAuthorityConflict,
} from './reporting-boundary';

describe('RC-24 Epic 1 — Reporting boundary', () => {
  it('exposes an immutable projection boundary', () => {
    expect(Object.isFrozen(REPORTING_BOUNDARY)).toBe(true);
    expect(REPORTING_BOUNDARY.moduleId).toBe(REPORTING_MODULE_ID);
    expect(REPORTING_BOUNDARY.authorityClass).toBe(REPORTING_AUTHORITY_CLASS);
    expect(REPORTING_BOUNDARY.authorityClass).toBe('projection');
    expect(REPORTING_BOUNDARY.sourceOfTruth).toBe(false);
    expect(REPORTING_BOUNDARY.knowledgeLakeRole).toBe('read-only-consumer');
  });

  it('owns report-generation / analytical-projection boundaries and domain entities', () => {
    expect(REPORTING_OWNED_CONCERNS).toEqual([
      'report-generation-boundary',
      'analytical-projection-boundary',
      'report-definition',
      'report-run',
      'aggregation-slice',
      'historical-window',
    ]);
    expect(isReportingOwnedConcern('report-generation-boundary')).toBe(true);
    expect(isReportingOwnedConcern('report-definition')).toBe(true);
    expect(isReportingOwnedConcern('ledger')).toBe(false);
  });

  it('does not claim trading, validation, enforcement, session, accounting, or Lake storage', () => {
    expect(REPORTING_NON_OWNED).toEqual(
      expect.arrayContaining([
        'trading-decisions',
        'strategy-validation',
        'runtime-enforcement',
        'trading-session',
        'ledger',
        'accounting',
        'knowledge-lake',
        'strategy-library',
        'ai-analytics',
      ]),
    );
    for (const owner of REPORTING_NON_OWNED) {
      expect(REPORTING_BOUNDARY.nonOwned).toContain(owner);
    }
  });

  it('stays distinct from Lake, Library, Enforcement, AI, and research-report', () => {
    expect(REPORTING_DISTINCT_FROM).toEqual(
      expect.arrayContaining([
        'knowledge-lake',
        'strategy-library',
        'runtime-enforcement',
        'ai-analytics',
        'ai',
        'research-report',
        'bot-facade',
      ]),
    );
    expect(REPORTING_MODULE_ID).not.toBe('knowledge-lake');
    expect(REPORTING_MODULE_ID).not.toBe('ai-analytics');
  });

  it('forbids authorize / trade / validate / shadow-accounting / SoT substitution', () => {
    for (const capability of [
      'authorize-deployment',
      'trade',
      'validate-strategies',
      'certify-strategy',
      'mutate-ledger',
      'shadow-accounting',
      'recompute-authoritative-balances',
      'replace-runtime-enforcement',
      'replace-strategy-library',
      'become-source-of-truth',
    ] as const) {
      expect(isReportingForbiddenCapability(capability)).toBe(true);
      expect(REPORTING_FORBIDDEN_CAPABILITIES).toContain(capability);
    }
    expect(isReportingForbiddenCapability('request-report-run')).toBe(false);
  });

  it('activates Lake consumer + report generation ports in Epic 4', () => {
    expect(REPORTING_BOUNDARY.activePorts).toEqual({
      reportingService: true,
      reportingQuery: true,
      knowledgeLakeConsumer: true,
      historyReads: false,
      persistence: false,
      rest: false,
    });
  });

  it('never owns business state, never authorizes, never trades, never validates strategies', () => {
    expect(reportingOwnsBusinessState()).toBe(false);
    expect(reportingIsSourceOfTruth()).toBe(false);
    expect(reportingAuthorizes()).toBe(false);
    expect(reportingTrades()).toBe(false);
    expect(reportingValidatesStrategies()).toBe(false);
  });

  it('resolves authority conflicts away from Reporting', () => {
    expect(resolveReportingAuthorityConflict('cash')).toBe('source-of-truth');
    expect(resolveReportingAuthorityConflict('fills')).toBe('source-of-truth');
    expect(resolveReportingAuthorityConflict('orders')).toBe('source-of-truth');
    expect(resolveReportingAuthorityConflict('session-lifecycle')).toBe('source-of-truth');
    expect(resolveReportingAuthorityConflict('certification')).toBe('source-of-truth');
    expect(resolveLakeStorageConflict()).toBe('knowledge-lake');
    expect(resolveEnforcementConflict()).toBe('runtime-enforcement');
    expect(resolveLibraryConflict()).toBe('strategy-library');
  });
});
