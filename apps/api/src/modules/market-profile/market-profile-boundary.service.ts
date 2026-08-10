import { Injectable } from '@nestjs/common';
import {
  MARKET_PROFILE_BOUNDARY,
  type MarketProfileBoundary,
  marketProfileCommandsSessions,
  marketProfileExpandsTacticalEnvelope,
  marketProfileForcesTrade,
  marketProfileIsExecutionSourceOfTruth,
  marketProfileOwnsQualificationDecisions,
  marketProfileReplacesRuntimeEnforcement,
  marketProfileReplacesStrategyLibrary,
  marketProfileSelectsStrategies,
} from './domain/market-profile-boundary';

/**
 * RC-25 — injectable Market Profile boundary descriptor.
 *
 * Read-only. No profile calculation. No Session / Runtime / Library commands.
 */
@Injectable()
export class MarketProfileBoundaryService {
  getBoundary(): MarketProfileBoundary {
    return MARKET_PROFILE_BOUNDARY;
  }

  isExecutionSourceOfTruth(): false {
    return marketProfileIsExecutionSourceOfTruth();
  }

  forcesTrade(): false {
    return marketProfileForcesTrade();
  }

  selectsStrategies(): false {
    return marketProfileSelectsStrategies();
  }

  commandsSessions(): false {
    return marketProfileCommandsSessions();
  }

  replacesRuntimeEnforcement(): false {
    return marketProfileReplacesRuntimeEnforcement();
  }

  replacesStrategyLibrary(): false {
    return marketProfileReplacesStrategyLibrary();
  }

  ownsQualificationDecisions(): false {
    return marketProfileOwnsQualificationDecisions();
  }

  expandsTacticalEnvelope(): false {
    return marketProfileExpandsTacticalEnvelope();
  }
}
