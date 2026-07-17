import type { StrategyParams } from '@trp/research';

/**
 * Execution metadata for a CampaignSession.
 * Extensible: additional optional fields may be added over time.
 */
export type CampaignSessionMetadata = {
  engineVersion: string;
  datasetId?: string;
  tags?: string[];
  /** Optional params for Campaign Replay execution (US067). */
  paramsList?: StrategyParams[];
};
