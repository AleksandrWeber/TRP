import { Injectable } from '@nestjs/common';
import type { ResearchAnalyticalOutcome } from './research-analytical-outcome';
import {
  CampaignCompletedLakeProjectionAdapter,
  EvidenceGeneratedLakeProjectionAdapter,
  ExperimentCompletedLakeProjectionAdapter,
  ValidationCompletedLakeProjectionAdapter,
} from './research-lab-projection.adapters';

/**
 * RC-21 Epic 4 — one-way Research Lab outcomes → Knowledge Lake.
 *
 * Research has no durable outbox. This Lake-owned facade fans thin analytical
 * outcome markers into producer adapters. Adapters never throw (best-effort admit).
 *
 * Does not import Research SoT services. Does not redesign Lab workflows.
 * No query port, persistence product, Kafka, queues, or feedback into Lab.
 */
@Injectable()
export class KnowledgeLakeResearchLabProjectionService {
  constructor(
    private readonly campaign: CampaignCompletedLakeProjectionAdapter,
    private readonly experiment: ExperimentCompletedLakeProjectionAdapter,
    private readonly validation: ValidationCompletedLakeProjectionAdapter,
    private readonly evidence: EvidenceGeneratedLakeProjectionAdapter,
  ) {}

  /**
   * Project a Research analytical outcome. Never throws — Lake failure is isolated.
   * Returns true when an adapter accepted the outcome kind (admit may still be best-effort).
   */
  project(outcome: ResearchAnalyticalOutcome): boolean {
    try {
      return (
        this.campaign.project(outcome) ||
        this.experiment.project(outcome) ||
        this.validation.project(outcome) ||
        this.evidence.project(outcome)
      );
    } catch {
      // Defensive: adapters already best-effort; swallow unexpected failures.
      return false;
    }
  }

  /** Best-effort batch helper (same isolation semantics per item). */
  projectMany(outcomes: readonly ResearchAnalyticalOutcome[]): number {
    let accepted = 0;
    for (const outcome of outcomes) {
      if (this.project(outcome)) accepted += 1;
    }
    return accepted;
  }
}
