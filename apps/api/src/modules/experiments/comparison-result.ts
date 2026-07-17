import type { ComparisonChange } from './comparison-change';

/**
 * Structural diff between two Experiment version snapshots (US078).
 */
export type ComparisonResult = {
  addedInsights: string[];
  removedInsights: string[];
  summaryChanged: boolean;
  previousSummary: string;
  currentSummary: string;
  addedTags: string[];
  removedTags: string[];
  metadataDifferences: ComparisonChange[];
};
