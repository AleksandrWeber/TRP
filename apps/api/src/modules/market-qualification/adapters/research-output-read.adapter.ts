/**
 * RC-25 Epic 2 — Research output read adapter (Qualification consumer).
 *
 * Maps Knowledge Lake Research-category projections → ResearchOutputRef[].
 * Empty-safe. No Lab redesign. No evaluation.
 */

import { Inject, Injectable } from '@nestjs/common';
import type { KnowledgeLakeQueryPort } from '../../knowledge-lake/ports/knowledge-lake-query.port';
import { KNOWLEDGE_LAKE_QUERY_PORT } from '../../knowledge-lake/ports/knowledge-lake-query.port';
import {
  toResearchOutputRefs,
  type ResearchOutputReadQuery,
  type ResearchOutputRef,
} from '../domain/market-qualification-observational-read-model';
import type { ResearchOutputReadPort } from '../ports/market-qualification.port';

@Injectable()
export class ResearchOutputReadAdapter implements ResearchOutputReadPort {
  constructor(
    @Inject(KNOWLEDGE_LAKE_QUERY_PORT)
    private readonly lakeQuery: KnowledgeLakeQueryPort,
  ) {}

  getApprovedResearchOutputs(query: ResearchOutputReadQuery): readonly ResearchOutputRef[] {
    if (!query.workspaceId) {
      return Object.freeze([]);
    }
    const page = this.lakeQuery.list({
      workspaceId: query.workspaceId,
      categories: ['Research'],
      exchangeScopeId: query.exchangeScopeId,
      limit: query.limit,
    });
    return toResearchOutputRefs(page.items);
  }
}
