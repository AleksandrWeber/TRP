/**
 * Extensible metadata for a Recommendation (US098).
 * Provenance / generation hints only — not Insight payload.
 */
export type RecommendationMetadata = {
  confidence?: number;
  generatedBy?: string;
  ruleId?: string;
  pipelineRunId?: string;
};
