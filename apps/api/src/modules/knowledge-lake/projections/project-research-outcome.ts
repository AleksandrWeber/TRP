/**
 * RC-21 Epic 4 — map Research analytical outcomes → AnalyticalFactAdmission.
 *
 * Never invents Research business events. Never clones Insight / Recommendation /
 * KnowledgeEntry bodies. Analytical markers + sourceRef only.
 */

import type { AnalyticalFactAdmission } from '../domain/analytical-fact-admission';
import type { KnowledgeLakeEventCategory } from '../domain/knowledge-lake-boundary';
import type { ResearchAnalyticalOutcome } from './research-analytical-outcome';
import { KNOWLEDGE_LAKE_RESEARCH_LAB_PRODUCER } from './research-lab-producer-registry';

const SCHEMA_VERSION = '1';

function categoryFor(outcome: ResearchAnalyticalOutcome): KnowledgeLakeEventCategory {
  // Parallel to Epic 3 session Failed → System: failed campaigns are ops markers.
  if (outcome.kind === 'campaign_completed' && outcome.status === 'FAILED') {
    return 'System';
  }
  return 'Research';
}

function sourceRefFor(outcome: ResearchAnalyticalOutcome): AnalyticalFactAdmission['sourceRef'] {
  switch (outcome.kind) {
    case 'campaign_completed':
      return Object.freeze({
        ownerType: 'CampaignSession',
        id: outcome.campaignSessionId,
      });
    case 'experiment_completed':
    case 'validation_completed':
      return Object.freeze({
        ownerType: 'Experiment',
        id: outcome.experimentId,
      });
    case 'evidence_generated':
      return Object.freeze({
        ownerType: 'KnowledgeEntry',
        id: outcome.knowledgeEntryId,
      });
  }
}

function thinPayload(outcome: ResearchAnalyticalOutcome): Readonly<Record<string, unknown>> {
  switch (outcome.kind) {
    case 'campaign_completed':
      return Object.freeze({
        kind: 'research_analytical_marker',
        outcomeKind: outcome.kind,
        status: outcome.status,
        ...(outcome.campaignId !== undefined ? { campaignId: outcome.campaignId } : {}),
        ...(outcome.strategyId !== undefined ? { strategyId: outcome.strategyId } : {}),
        ...(outcome.datasetId !== undefined ? { datasetId: outcome.datasetId } : {}),
        ...(outcome.verdict !== undefined ? { verdict: outcome.verdict } : {}),
        ...(outcome.passCount !== undefined ? { passCount: outcome.passCount } : {}),
        ...(outcome.failCount !== undefined ? { failCount: outcome.failCount } : {}),
        ...(outcome.needsReviewCount !== undefined
          ? { needsReviewCount: outcome.needsReviewCount }
          : {}),
        ...(outcome.totalRuns !== undefined ? { totalRuns: outcome.totalRuns } : {}),
      });
    case 'experiment_completed':
      return Object.freeze({
        kind: 'research_analytical_marker',
        outcomeKind: outcome.kind,
        ...(outcome.verdict !== undefined ? { verdict: outcome.verdict } : {}),
        ...(outcome.strategyId !== undefined ? { strategyId: outcome.strategyId } : {}),
        ...(outcome.datasetId !== undefined ? { datasetId: outcome.datasetId } : {}),
        ...(outcome.configHash !== undefined ? { configHash: outcome.configHash } : {}),
        ...(outcome.campaignSessionId !== undefined
          ? { campaignSessionId: outcome.campaignSessionId }
          : {}),
      });
    case 'validation_completed':
      return Object.freeze({
        kind: 'research_analytical_marker',
        outcomeKind: outcome.kind,
        verdict: outcome.verdict,
        ...(outcome.reasons !== undefined ? { reasons: Object.freeze([...outcome.reasons]) } : {}),
        ...(outcome.validationVersion !== undefined
          ? { validationVersion: outcome.validationVersion }
          : {}),
      });
    case 'evidence_generated':
      return Object.freeze({
        kind: 'research_analytical_marker',
        outcomeKind: outcome.kind,
        status: outcome.status,
        experimentId: outcome.experimentId,
        // Intentionally no knowledge payload / insights / recommendations clone.
        ...(outcome.validationStatus !== undefined
          ? { validationStatus: outcome.validationStatus }
          : {}),
      });
  }
}

/**
 * Project a Research analytical outcome into a Lake admission, or null if out of scope.
 */
export function projectResearchOutcome(
  outcome: ResearchAnalyticalOutcome,
): AnalyticalFactAdmission | null {
  if (
    !(KNOWLEDGE_LAKE_RESEARCH_LAB_PRODUCER.outcomeKinds as readonly string[]).includes(outcome.kind)
  ) {
    return null;
  }

  return Object.freeze({
    eventId: outcome.eventId,
    occurredAt: outcome.occurredAt,
    producer: KNOWLEDGE_LAKE_RESEARCH_LAB_PRODUCER.producerId,
    category: categoryFor(outcome),
    mode: 'research' as const,
    workspaceId: outcome.workspaceId,
    ...(outcome.correlationId !== undefined ? { correlationId: outcome.correlationId } : {}),
    sourceRef: sourceRefFor(outcome),
    payload: thinPayload(outcome),
    schemaVersion: outcome.schemaVersion ?? SCHEMA_VERSION,
  });
}
