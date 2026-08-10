import { Injectable } from '@nestjs/common';
import {
  MARKET_QUALIFICATION_BOUNDARY,
  type MarketQualificationBoundary,
  marketQualificationCommandsSessions,
  marketQualificationForcesTrade,
  marketQualificationIsExecutionSourceOfTruth,
  marketQualificationOwnsMarketProfileVersions,
  marketQualificationReplacesRuntimeEnforcement,
  marketQualificationReplacesStrategyLibrary,
  marketQualificationSelectsStrategies,
} from './domain/market-qualification-boundary';

/**
 * RC-25 — injectable Market Qualification boundary descriptor.
 *
 * Read-only. No evaluation behaviour. No Session / Runtime / Library commands.
 */
@Injectable()
export class MarketQualificationBoundaryService {
  getBoundary(): MarketQualificationBoundary {
    return MARKET_QUALIFICATION_BOUNDARY;
  }

  isExecutionSourceOfTruth(): false {
    return marketQualificationIsExecutionSourceOfTruth();
  }

  forcesTrade(): false {
    return marketQualificationForcesTrade();
  }

  selectsStrategies(): false {
    return marketQualificationSelectsStrategies();
  }

  commandsSessions(): false {
    return marketQualificationCommandsSessions();
  }

  replacesRuntimeEnforcement(): false {
    return marketQualificationReplacesRuntimeEnforcement();
  }

  replacesStrategyLibrary(): false {
    return marketQualificationReplacesStrategyLibrary();
  }

  ownsMarketProfileVersions(): false {
    return marketQualificationOwnsMarketProfileVersions();
  }
}
