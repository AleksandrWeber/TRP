export { RecommendationModule } from './recommendation.module';
export { RecommendationDomainService } from './recommendation-domain.service';
export type {
  CreateRecommendationInput,
  UpdateRecommendationInput,
  RecommendationSearchFilters,
} from './recommendation-domain.service';
export type { Recommendation } from './recommendation';
export type { RecommendationMetadata } from './recommendation-metadata';
export { RecommendationType } from './recommendation-type';
export { RecommendationPriority } from './recommendation-priority';
export {
  draftRecommendationsFromInsights,
  type RecommendationDraft,
} from './recommendation-generation.rules';
export type { RecommendationRepository } from './repositories/recommendation.repository';
export { RECOMMENDATION_REPOSITORY } from './repositories/recommendation.repository.token';
export { InMemoryRecommendationRepository } from './repositories/in-memory-recommendation.repository';
