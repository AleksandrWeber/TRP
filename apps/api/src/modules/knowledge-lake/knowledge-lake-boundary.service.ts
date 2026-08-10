import { Injectable } from '@nestjs/common';
import {
  KNOWLEDGE_LAKE_BOUNDARY,
  type KnowledgeLakeBoundary,
  knowledgeLakeOwnsBusinessState,
  resolveAuthorityConflict,
} from './domain/knowledge-lake-boundary';

/**
 * RC-21 Epic 1 — injectable boundary descriptor.
 *
 * Read-only access to Lake ownership invariants.
 * No command methods toward Orders / Risk / Session / Ledger / Execution.
 */
@Injectable()
export class KnowledgeLakeBoundaryService {
  /** Immutable Knowledge Lake boundary (projection warehouse). */
  getBoundary(): KnowledgeLakeBoundary {
    return KNOWLEDGE_LAKE_BOUNDARY;
  }

  /** Lake never owns business state (Authority Matrix). */
  ownsBusinessState(): false {
    return knowledgeLakeOwnsBusinessState();
  }

  /**
   * On cash / fills / orders / lifecycle disputes, SoT wins.
   * Lake loses by design.
   */
  resolveConflict(concern: 'cash' | 'fills' | 'orders' | 'session-lifecycle'): 'source-of-truth' {
    return resolveAuthorityConflict(concern);
  }
}
