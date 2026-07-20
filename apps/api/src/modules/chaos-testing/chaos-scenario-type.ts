/**
 * Target execution services for US199 Chaos Testing.
 */

export const CHAOS_SCENARIO_TYPES = Object.freeze([
  'Smoke',
  'HistoricalReplay',
  'WalkForward',
  'MultiYearResearch',
  'DeterministicReplayValidation',
] as const);

export type ChaosScenarioType = (typeof CHAOS_SCENARIO_TYPES)[number];

export function isChaosScenarioType(value: unknown): value is ChaosScenarioType {
  return typeof value === 'string' && (CHAOS_SCENARIO_TYPES as readonly string[]).includes(value);
}
