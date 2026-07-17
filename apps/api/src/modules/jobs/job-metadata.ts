import type { StrategyParams } from '@trp/research';
import type { CampaignSession } from '../campaign-session/campaign-session';

/**
 * Extensible metadata attached to a Job (US069–US071).
 */
export type JobMetadata = {
  engineVersion?: string;
  datasetId?: string;
  strategyId?: string;
  tags?: string[];
  /** Required for JobType.CAMPAIGN execution. */
  paramsList?: StrategyParams[];
  /** Required for JobType.REPLAY execution (transient; not loaded from Persistence). */
  session?: CampaignSession;
};
