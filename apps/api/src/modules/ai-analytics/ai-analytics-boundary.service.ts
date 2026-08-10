import { Injectable } from '@nestjs/common';
import {
  AI_ANALYTICS_BOUNDARY,
  type AiAnalyticsBoundary,
  aiAnalyticsIsSourceOfTruth,
  aiAnalyticsMakesTradingDecisions,
  aiAnalyticsModifiesReports,
  aiAnalyticsQueriesKnowledgeLakeDirectly,
  aiAnalyticsReplacesRuntimeEnforcement,
  aiAnalyticsReplacesStrategyLibrary,
} from './domain/ai-analytics-boundary';

/**
 * RC-24 — injectable AI Analytics boundary descriptor.
 */
@Injectable()
export class AiAnalyticsBoundaryService {
  getBoundary(): AiAnalyticsBoundary {
    return AI_ANALYTICS_BOUNDARY;
  }

  isSourceOfTruth(): false {
    return aiAnalyticsIsSourceOfTruth();
  }

  makesTradingDecisions(): false {
    return aiAnalyticsMakesTradingDecisions();
  }

  replacesRuntimeEnforcement(): false {
    return aiAnalyticsReplacesRuntimeEnforcement();
  }

  replacesStrategyLibrary(): false {
    return aiAnalyticsReplacesStrategyLibrary();
  }

  queriesKnowledgeLakeDirectly(): false {
    return aiAnalyticsQueriesKnowledgeLakeDirectly();
  }

  modifiesReports(): false {
    return aiAnalyticsModifiesReports();
  }
}
