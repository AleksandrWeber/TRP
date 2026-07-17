import { Module } from '@nestjs/common';
import { RecommendationController } from './recommendation.controller';
import { RecommendationDomainService } from './recommendation-domain.service';

/**
 * Recommendation Nest module (US098, US100).
 * Domain CRUD + deterministic generateFromInsights.
 * Read-only REST via RecommendationController.
 * No Pipeline / Prisma / Repository / Jobs / Export / Import / AI.
 */
@Module({
  controllers: [RecommendationController],
  providers: [RecommendationDomainService],
  exports: [RecommendationDomainService],
})
export class RecommendationModule {}
