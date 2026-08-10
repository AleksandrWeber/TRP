/**
 * RC-21 Epic 4 — Research Lab producer registry (documentation + routing).
 *
 * One-way projections only. Research remains SoT; Lake never commands Lab.
 * Contract producer id: docs/project/rc-21-api-contract.md §7 (`research-lab`)
 *
 * Research has no DurableEventEnvelope/outbox path. Epic 4 projects thin
 * analytical outcome markers derived from existing completion artifacts.
 */

import type { KnowledgeLakeEventCategory } from '../domain/knowledge-lake-boundary';

export type ResearchLabOutcomeKind =
  'campaign_completed' | 'experiment_completed' | 'validation_completed' | 'evidence_generated';

export type ResearchLabProducerRegistration = Readonly<{
  producerId: 'research-lab';
  /** Logical Research Lab surface — not a Nest module rename. */
  owningModule: 'research-lab';
  /** Existing Research artifact owners referenced via sourceRef. */
  sourceOwnerTypes: readonly string[];
  categories: readonly KnowledgeLakeEventCategory[];
  outcomeKinds: readonly ResearchLabOutcomeKind[];
  direction: 'producer-to-lake';
  feedbackToSoT: false;
  /** Insight / Recommendation / KnowledgeEntry are referenced, never cloned. */
  clonesResearchEntities: false;
}>;

/**
 * Canonical Research Lab producer for RC-21 Epic 4.
 * Trading-path producers remain in trading-path-producer-registry.ts.
 */
export const KNOWLEDGE_LAKE_RESEARCH_LAB_PRODUCER = Object.freeze({
  producerId: 'research-lab',
  owningModule: 'research-lab',
  sourceOwnerTypes: Object.freeze(['CampaignSession', 'Experiment', 'KnowledgeEntry'] as const),
  categories: Object.freeze(['Research', 'System'] as const),
  outcomeKinds: Object.freeze([
    'campaign_completed',
    'experiment_completed',
    'validation_completed',
    'evidence_generated',
  ] as const),
  direction: 'producer-to-lake',
  feedbackToSoT: false,
  clonesResearchEntities: false,
}) satisfies ResearchLabProducerRegistration;

export type ResearchLabProducerId = (typeof KNOWLEDGE_LAKE_RESEARCH_LAB_PRODUCER)['producerId'];
