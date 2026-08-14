import { Injectable } from '@nestjs/common';
import {
  EXCHANGE_SCOPE_BOUNDARY,
  type ExchangeScopeBoundary,
  exchangeScopeApprovesRisk,
  exchangeScopeForcesTrade,
  exchangeScopeIsExecutionEngine,
  exchangeScopeIsExecutionSourceOfTruth,
  exchangeScopeIsRiskEngine,
  exchangeScopeIsRuntime,
  exchangeScopeIsStrategyLibrary,
  exchangeScopeIsTradingSession,
  exchangeScopeOwnsSessionLifecycle,
  exchangeScopeOwnsStrategyCertification,
  exchangeScopeSubmitsOrders,
} from './domain/exchange-scope-boundary';

/**
 * RC-27 — injectable Exchange Scope boundary descriptor.
 *
 * Read-only. No lifecycle behaviour. No trading-path commands.
 */
@Injectable()
export class ExchangeScopeBoundaryService {
  getBoundary(): ExchangeScopeBoundary {
    return EXCHANGE_SCOPE_BOUNDARY;
  }

  isExecutionSourceOfTruth(): false {
    return exchangeScopeIsExecutionSourceOfTruth();
  }

  approvesRisk(): false {
    return exchangeScopeApprovesRisk();
  }

  submitsOrders(): false {
    return exchangeScopeSubmitsOrders();
  }

  isRuntime(): false {
    return exchangeScopeIsRuntime();
  }

  isTradingSession(): false {
    return exchangeScopeIsTradingSession();
  }

  isExecutionEngine(): false {
    return exchangeScopeIsExecutionEngine();
  }

  isStrategyLibrary(): false {
    return exchangeScopeIsStrategyLibrary();
  }

  isRiskEngine(): false {
    return exchangeScopeIsRiskEngine();
  }

  forcesTrade(): false {
    return exchangeScopeForcesTrade();
  }

  ownsSessionLifecycle(): false {
    return exchangeScopeOwnsSessionLifecycle();
  }

  ownsStrategyCertification(): false {
    return exchangeScopeOwnsStrategyCertification();
  }
}
