/**
 * Extensible metadata for an Insight (US095).
 * Provenance / execution hints only — not Knowledge payload.
 */
export type InsightMetadata = {
  model?: string;
  promptVersion?: string;
  executionTime?: number;
  pipelineRunId?: string;
};
