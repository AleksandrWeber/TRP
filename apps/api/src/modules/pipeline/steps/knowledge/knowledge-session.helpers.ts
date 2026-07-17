import type { Experiment } from '../../../experiments/experiment';
import type { CampaignReport } from '../../../research-campaign/campaign-report.types';

/**
 * Shared Knowledge extraction helpers (US090).
 * Extracted from KnowledgeExtractionService.resolveCurrentReport — no new logic.
 */
export function resolveCurrentReport(experiment: Experiment): CampaignReport {
  const current = experiment.versions.find((v) => v.version === experiment.currentVersion);
  if (!current) {
    throw new Error(
      `Experiment ${experiment.experimentId} has no version ${experiment.currentVersion}`,
    );
  }
  return current.report;
}
