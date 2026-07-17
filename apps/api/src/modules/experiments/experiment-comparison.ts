import type { ComparisonResult } from './comparison-result';

/**
 * Deterministic comparison between two Experiment versions (US078).
 */
export type ExperimentComparison = {
  leftExperimentId: string;
  rightExperimentId: string;
  leftVersion: number;
  rightVersion: number;
  result: ComparisonResult;
};
