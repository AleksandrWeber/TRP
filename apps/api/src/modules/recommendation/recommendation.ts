import type { RecommendationMetadata } from './recommendation-metadata';
import type { RecommendationPriority } from './recommendation-priority';
import type { RecommendationType } from './recommendation-type';

/**
 * Research OS Recommendation domain entity (US098).
 * Actionable guidance derived from Insights — references Insight ids only.
 * In-memory domain; no Prisma / Repository.
 */
export type Recommendation = {
  id: string;
  insightIds: string[];
  campaignSessionIds: string[];
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  rationale: string;
  metadata: RecommendationMetadata;
  createdAt: string;
};
