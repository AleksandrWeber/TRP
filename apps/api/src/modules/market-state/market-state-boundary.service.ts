import { Injectable } from '@nestjs/common';
import {
  MARKET_STATE_BOUNDARY,
  type MarketStateBoundary,
  marketStateCommandsSessions,
  marketStateForcesTrade,
  marketStateIsExecutionSourceOfTruth,
  marketStateIsProfile,
  marketStateIsQualification,
  marketStateOwnsProfileVersions,
  marketStateOwnsQualificationDecisions,
  marketStateSelectsStrategies,
} from './domain/market-state-boundary';

/**
 * RC-26 — injectable Market State boundary descriptor.
 *
 * Read-only. No classification behaviour. No Session / Runtime / Library commands.
 */
@Injectable()
export class MarketStateBoundaryService {
  getBoundary(): MarketStateBoundary {
    return MARKET_STATE_BOUNDARY;
  }

  isExecutionSourceOfTruth(): false {
    return marketStateIsExecutionSourceOfTruth();
  }

  forcesTrade(): false {
    return marketStateForcesTrade();
  }

  selectsStrategies(): false {
    return marketStateSelectsStrategies();
  }

  commandsSessions(): false {
    return marketStateCommandsSessions();
  }

  isQualification(): false {
    return marketStateIsQualification();
  }

  isProfile(): false {
    return marketStateIsProfile();
  }

  ownsQualificationDecisions(): false {
    return marketStateOwnsQualificationDecisions();
  }

  ownsProfileVersions(): false {
    return marketStateOwnsProfileVersions();
  }
}
