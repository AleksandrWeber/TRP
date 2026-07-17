/**
 * Mutable generic execution state for a PipelineRun (US081).
 * No campaign / experiment / knowledge-specific fields.
 */
export type PipelineContext = {
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  variables: Record<string, unknown>;
  metadata: Record<string, unknown>;
};
