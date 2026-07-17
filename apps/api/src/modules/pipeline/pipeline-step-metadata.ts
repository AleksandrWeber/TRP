/**
 * Metadata describing a Pipeline step definition (US082).
 * Stored on Pipeline — never the executable instance.
 */
export type PipelineStepMetadata = {
  stepId: string;
  name: string;
  description: string;
  order: number;
};
