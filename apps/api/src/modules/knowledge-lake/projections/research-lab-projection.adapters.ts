import { Inject, Injectable } from '@nestjs/common';
import { bestEffortAdmit } from './best-effort-admit';
import { projectResearchOutcome } from './project-research-outcome';
import type {
  CampaignCompletedOutcome,
  EvidenceGeneratedOutcome,
  ExperimentCompletedOutcome,
  ResearchAnalyticalOutcome,
  ValidationCompletedOutcome,
} from './research-analytical-outcome';
import {
  KNOWLEDGE_LAKE_INGESTION_PORT,
  type KnowledgeLakeIngestionPort,
} from '../ports/knowledge-lake-ingestion.port';

/**
 * Thin projection adapter: campaign completion → Lake (Research / System).
 * Does not call Research command ports. Does not clone campaign reports.
 */
@Injectable()
export class CampaignCompletedLakeProjectionAdapter {
  constructor(
    @Inject(KNOWLEDGE_LAKE_INGESTION_PORT)
    private readonly ingestion: KnowledgeLakeIngestionPort,
  ) {}

  project(outcome: ResearchAnalyticalOutcome): boolean {
    if (outcome.kind !== 'campaign_completed') return false;
    const fact = projectResearchOutcome(outcome as CampaignCompletedOutcome);
    if (!fact || fact.producer !== 'research-lab') return false;
    bestEffortAdmit(this.ingestion, fact);
    return true;
  }
}

/** Thin projection adapter: experiment completion → Lake. */
@Injectable()
export class ExperimentCompletedLakeProjectionAdapter {
  constructor(
    @Inject(KNOWLEDGE_LAKE_INGESTION_PORT)
    private readonly ingestion: KnowledgeLakeIngestionPort,
  ) {}

  project(outcome: ResearchAnalyticalOutcome): boolean {
    if (outcome.kind !== 'experiment_completed') return false;
    const fact = projectResearchOutcome(outcome as ExperimentCompletedOutcome);
    if (!fact || fact.producer !== 'research-lab') return false;
    bestEffortAdmit(this.ingestion, fact);
    return true;
  }
}

/** Thin projection adapter: validation completion → Lake. */
@Injectable()
export class ValidationCompletedLakeProjectionAdapter {
  constructor(
    @Inject(KNOWLEDGE_LAKE_INGESTION_PORT)
    private readonly ingestion: KnowledgeLakeIngestionPort,
  ) {}

  project(outcome: ResearchAnalyticalOutcome): boolean {
    if (outcome.kind !== 'validation_completed') return false;
    const fact = projectResearchOutcome(outcome as ValidationCompletedOutcome);
    if (!fact || fact.producer !== 'research-lab') return false;
    bestEffortAdmit(this.ingestion, fact);
    return true;
  }
}

/**
 * Thin projection adapter: evidence generated → Lake.
 * sourceRef → KnowledgeEntry only; never clones knowledge payload.
 */
@Injectable()
export class EvidenceGeneratedLakeProjectionAdapter {
  constructor(
    @Inject(KNOWLEDGE_LAKE_INGESTION_PORT)
    private readonly ingestion: KnowledgeLakeIngestionPort,
  ) {}

  project(outcome: ResearchAnalyticalOutcome): boolean {
    if (outcome.kind !== 'evidence_generated') return false;
    const fact = projectResearchOutcome(outcome as EvidenceGeneratedOutcome);
    if (!fact || fact.producer !== 'research-lab') return false;
    bestEffortAdmit(this.ingestion, fact);
    return true;
  }
}
