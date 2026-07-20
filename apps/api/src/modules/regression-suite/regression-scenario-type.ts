/**
 * Supported regression scenario identifiers (US198).
 */

export const REGRESSION_SCENARIO_TYPES = Object.freeze([
  'Smoke',
  'HistoricalReplay',
  'WalkForward',
  'MultiYearResearch',
  'DeterministicReplayValidation',
] as const);

export type RegressionScenarioType = (typeof REGRESSION_SCENARIO_TYPES)[number];

export function isRegressionScenarioType(value: unknown): value is RegressionScenarioType {
  return (
    typeof value === 'string' && (REGRESSION_SCENARIO_TYPES as readonly string[]).includes(value)
  );
}
