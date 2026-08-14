/**
 * RC-28 Epic 5 — resilience cases for missing / unavailable dependencies.
 *
 * Expected outcomes are fail-closed or empty projection — never invented SoT.
 */

export const V2_RESILIENCE_CASE_IDS = Object.freeze([
  'missing-library',
  'missing-gate-identity',
  'missing-scope',
  'lake-query-miss',
  'unavailable-knowledge-lake',
  'unavailable-reporting',
  'unavailable-ai',
  'unavailable-notification',
] as const);

export type V2ResilienceCaseId = (typeof V2_RESILIENCE_CASE_IDS)[number];

export type V2ResilienceCase = Readonly<{
  caseId: V2ResilienceCaseId;
  missing: string;
  expected:
    | 'fail-closed'
    | 'empty-projection'
    | 'narrative-unavailable'
    | 'delivery-skipped'
    | 'commands-still-route';
  inventsSourceOfTruth: false;
}>;

export const V2_RESILIENCE_MATRIX: readonly V2ResilienceCase[] = Object.freeze([
  Object.freeze({
    caseId: 'missing-library',
    missing: 'Strategy Library record',
    expected: 'fail-closed',
    inventsSourceOfTruth: false,
  }),
  Object.freeze({
    caseId: 'missing-gate-identity',
    missing: 'Gate identity',
    expected: 'fail-closed',
    inventsSourceOfTruth: false,
  }),
  Object.freeze({
    caseId: 'missing-scope',
    missing: 'Exchange Scope match',
    expected: 'fail-closed',
    inventsSourceOfTruth: false,
  }),
  Object.freeze({
    caseId: 'lake-query-miss',
    missing: 'Knowledge Lake fact',
    expected: 'empty-projection',
    inventsSourceOfTruth: false,
  }),
  Object.freeze({
    caseId: 'unavailable-knowledge-lake',
    missing: 'Knowledge Lake facts for Reporting',
    expected: 'empty-projection',
    inventsSourceOfTruth: false,
  }),
  Object.freeze({
    caseId: 'unavailable-reporting',
    missing: 'ReportRun',
    expected: 'narrative-unavailable',
    inventsSourceOfTruth: false,
  }),
  Object.freeze({
    caseId: 'unavailable-ai',
    missing: 'AI Analytics',
    expected: 'commands-still-route',
    inventsSourceOfTruth: false,
  }),
  Object.freeze({
    caseId: 'unavailable-notification',
    missing: 'Notification channel',
    expected: 'delivery-skipped',
    inventsSourceOfTruth: false,
  }),
]);
