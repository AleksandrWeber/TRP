/**
 * Execution metadata for a CampaignSession.
 * Extensible: additional optional fields may be added over time.
 */
export type CampaignSessionMetadata = {
  engineVersion: string;
  datasetId?: string;
  tags?: string[];
};
