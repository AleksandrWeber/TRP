/**
 * RC-21 Epic 4 — Lake-owned Research analytical outcome inputs.
 *
 * These are thin projection inputs mapped from existing Research completion
 * artifacts (CampaignSession, Experiment, KnowledgeEntry refs). They are NOT
 * Research domain entities and must not become a second Research SoT.
 *
 * Prefer sourceRef / ids over cloning Insight, Recommendation, or KnowledgeEntry.
 */

import type { ResearchLabOutcomeKind } from './research-lab-producer-registry';

type ResearchOutcomeBase<Kind extends ResearchLabOutcomeKind> = Readonly<{
  kind: Kind;
  eventId: string;
  occurredAt: string;
  workspaceId: string;
  correlationId?: string;
  schemaVersion?: string;
}>;

/** Campaign completed / failed analytical marker (refs CampaignSession). */
export type CampaignCompletedOutcome = ResearchOutcomeBase<'campaign_completed'> &
  Readonly<{
    campaignSessionId: string;
    status: 'COMPLETED' | 'FAILED';
    campaignId?: string;
    strategyId?: string;
    datasetId?: string;
    verdict?: string;
    passCount?: number;
    failCount?: number;
    needsReviewCount?: number;
    totalRuns?: number;
  }>;

/** Experiment completed analytical marker (refs Experiment). */
export type ExperimentCompletedOutcome = ResearchOutcomeBase<'experiment_completed'> &
  Readonly<{
    experimentId: string;
    verdict?: string;
    strategyId?: string;
    datasetId?: string;
    configHash?: string;
    campaignSessionId?: string;
  }>;

/** Validation completed analytical marker (refs Experiment validation). */
export type ValidationCompletedOutcome = ResearchOutcomeBase<'validation_completed'> &
  Readonly<{
    experimentId: string;
    verdict: string;
    reasons?: readonly string[];
    validationVersion?: string;
  }>;

/**
 * Evidence generated analytical marker.
 * References KnowledgeEntry by id — does not clone knowledge payload.
 */
export type EvidenceGeneratedOutcome = ResearchOutcomeBase<'evidence_generated'> &
  Readonly<{
    knowledgeEntryId: string;
    experimentId: string;
    status: 'created' | 'duplicate';
    validationStatus?: string;
  }>;

export type ResearchAnalyticalOutcome =
  | CampaignCompletedOutcome
  | ExperimentCompletedOutcome
  | ValidationCompletedOutcome
  | EvidenceGeneratedOutcome;
