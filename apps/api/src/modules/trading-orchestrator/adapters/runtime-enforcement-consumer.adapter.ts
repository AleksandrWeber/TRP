/**
 * RC-26 Epic 5 — Runtime Enforcement Gate consumer adapter.
 *
 * Delegates validateDeployment to RC-23 Gate. Never soft-passes.
 * Never owns validation logic.
 */

import { Inject, Injectable } from '@nestjs/common';
import {
  RUNTIME_ENFORCEMENT_PORT,
  type RuntimeEnforcementPort,
} from '../../runtime-enforcement/ports/runtime-enforcement.port';
import type {
  OrchestratorEnforcementDecision,
  OrchestratorRuntimeEnforcementConsumerPort,
  OrchestratorValidateDeployment,
} from '../ports/trading-orchestrator.port';

@Injectable()
export class OrchestratorRuntimeEnforcementConsumerAdapter implements OrchestratorRuntimeEnforcementConsumerPort {
  constructor(
    @Inject(RUNTIME_ENFORCEMENT_PORT)
    private readonly gate: RuntimeEnforcementPort,
  ) {}

  validateDeployment(cmd: OrchestratorValidateDeployment): OrchestratorEnforcementDecision {
    const decision = this.gate.validateDeployment({
      workspaceId: cmd.workspaceId,
      libraryEntryId: cmd.libraryEntryId,
      exchangeScopeId: cmd.exchangeScopeId,
      tacticPoint: cmd.tacticPoint,
      purpose: cmd.purpose,
      tradingSessionId: cmd.tradingSessionId,
      requestedAt: cmd.requestedAt,
    });

    const decisionRef = `enf:${decision.checkedAt}:${decision.outcome}:${decision.reasons.join(',')}`;
    return Object.freeze({
      outcome: decision.outcome,
      validation: decision.validation,
      reasons: Object.freeze([...decision.reasons]),
      checkedAt: decision.checkedAt,
      decisionRef,
    });
  }
}
