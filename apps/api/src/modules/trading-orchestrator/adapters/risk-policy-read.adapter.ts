/**
 * RC-26 Epic 5 — Risk policy read adapter (null / empty).
 *
 * Logical RiskPolicyReadPort consumer. No Risk Engine Nest port exists yet.
 * Returns null — never approveRisk, never Kill Switch, never ledger authority.
 */

import { Injectable } from '@nestjs/common';
import type {
  ExchangeRiskPolicyView,
  OrchestratorRiskPolicyReadPort,
  SelectionConstraintView,
} from '../ports/trading-orchestrator.port';

@Injectable()
export class NullOrchestratorRiskPolicyReadAdapter implements OrchestratorRiskPolicyReadPort {
  getExchangeRiskPolicy(_query: {
    workspaceId: string;
    exchangeScopeId: string;
  }): ExchangeRiskPolicyView | null {
    return null;
  }

  getSelectionConstraints(_query: {
    workspaceId: string;
    exchangeScopeId?: string;
  }): SelectionConstraintView | null {
    return null;
  }
}
