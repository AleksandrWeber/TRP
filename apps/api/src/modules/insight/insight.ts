import type { InsightMetadata } from './insight-metadata';
import type { InsightSource } from './insight-source';
import type { InsightType } from './insight-type';

/**
 * Research OS Insight domain entity (US095).
 * Analytical interpretation above Knowledge — references KnowledgeEntry ids only.
 * In-memory domain; no Prisma / Repository.
 */
export type Insight = {
  id: string;
  workspaceId: string;
  campaignSessionId?: string;
  experimentId?: string;
  knowledgeEntryIds: string[];
  type: InsightType;
  title: string;
  summary: string;
  /** Confidence in [0, 1]. */
  confidence: number;
  sources: InsightSource[];
  metadata: InsightMetadata;
  createdAt: string;
};
