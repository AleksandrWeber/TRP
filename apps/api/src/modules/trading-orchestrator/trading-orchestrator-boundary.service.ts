import { Injectable } from '@nestjs/common';
import {
  TRADING_ORCHESTRATOR_BOUNDARY,
  type TradingOrchestratorBoundary,
  tradingOrchestratorApprovesRisk,
  tradingOrchestratorForcesTrade,
  tradingOrchestratorIsExecutionEngine,
  tradingOrchestratorIsExecutionSourceOfTruth,
  tradingOrchestratorOwnsMarketProfile,
  tradingOrchestratorOwnsMarketState,
  tradingOrchestratorOwnsQualification,
  tradingOrchestratorOwnsSessionLifecycle,
  tradingOrchestratorReplacesRuntimeEnforcement,
  tradingOrchestratorReplacesStrategyLibrary,
  tradingOrchestratorSubmitsOrders,
} from './domain/trading-orchestrator-boundary';

/**
 * RC-26 — injectable Trading Orchestrator boundary descriptor.
 *
 * Read-only. No orchestration behaviour. No Orders / Execution / Risk commands.
 */
@Injectable()
export class TradingOrchestratorBoundaryService {
  getBoundary(): TradingOrchestratorBoundary {
    return TRADING_ORCHESTRATOR_BOUNDARY;
  }

  isExecutionSourceOfTruth(): false {
    return tradingOrchestratorIsExecutionSourceOfTruth();
  }

  forcesTrade(): false {
    return tradingOrchestratorForcesTrade();
  }

  approvesRisk(): false {
    return tradingOrchestratorApprovesRisk();
  }

  submitsOrders(): false {
    return tradingOrchestratorSubmitsOrders();
  }

  ownsSessionLifecycle(): false {
    return tradingOrchestratorOwnsSessionLifecycle();
  }

  replacesRuntimeEnforcement(): false {
    return tradingOrchestratorReplacesRuntimeEnforcement();
  }

  replacesStrategyLibrary(): false {
    return tradingOrchestratorReplacesStrategyLibrary();
  }

  ownsQualification(): false {
    return tradingOrchestratorOwnsQualification();
  }

  ownsMarketProfile(): false {
    return tradingOrchestratorOwnsMarketProfile();
  }

  ownsMarketState(): false {
    return tradingOrchestratorOwnsMarketState();
  }

  isExecutionEngine(): false {
    return tradingOrchestratorIsExecutionEngine();
  }
}
