/**
 * Extensible metadata for an Experiment domain entity (US076).
 */
export type ExperimentMetadata = {
  engineVersion?: string;
  datasetId?: string;
  strategyId?: string;
  tags?: string[];
  source?: string;
};
