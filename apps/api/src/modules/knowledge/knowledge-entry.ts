import type { KnowledgeMetadata } from './knowledge-metadata';
import type { KnowledgeTag } from './knowledge-tag';

/**
 * Analytical Knowledge domain entity above Experiments (US075).
 * In-memory only — independent from Prisma research_outcome persistence.
 */
export type KnowledgeEntry = {
  knowledgeId: string;
  workspaceId: string;
  experimentId: string;
  createdAt: string;
  title: string;
  summary: string;
  tags: KnowledgeTag[];
  insights: string[];
  metadata: KnowledgeMetadata;
};
