import type { ExperimentMetadata } from './experiment-metadata';
import type { ExperimentVersion } from './experiment-version';

/**
 * Primary research entity linking CampaignSession → Knowledge (US076).
 * In-memory domain model — independent from Prisma ExperimentsService.
 */
export type Experiment = {
  experimentId: string;
  sessionId: string;
  createdAt: string;
  currentVersion: number;
  versions: ExperimentVersion[];
  metadata: ExperimentMetadata;
};
