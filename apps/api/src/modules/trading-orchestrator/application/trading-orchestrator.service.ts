/**
 * RC-26 Epic 5 — TradingOrchestratorServicePort Nest adapter.
 */

import { Inject, Injectable } from '@nestjs/common';
import { OrchestrationWorkflowCoordinator } from './orchestration-workflow.coordinator';
import type {
  CancelOrchestrationRun,
  ConfirmOrchestrationRun,
  EmitSessionHandoff,
  OrchestrationCommandResult,
  ProposeSelection,
  RequestOrchestrationRun,
  TradingOrchestratorServicePort,
} from '../ports/trading-orchestrator.port';

@Injectable()
export class TradingOrchestratorService implements TradingOrchestratorServicePort {
  constructor(
    @Inject(OrchestrationWorkflowCoordinator)
    private readonly coordinator: OrchestrationWorkflowCoordinator,
  ) {}

  requestOrchestrationRun(cmd: RequestOrchestrationRun): OrchestrationCommandResult {
    return this.coordinator.requestOrchestrationRun(cmd);
  }

  confirmOrchestrationRun(cmd: ConfirmOrchestrationRun): OrchestrationCommandResult {
    return this.coordinator.confirmOrchestrationRun(cmd);
  }

  cancelOrchestrationRun(cmd: CancelOrchestrationRun): OrchestrationCommandResult {
    return this.coordinator.cancelOrchestrationRun(cmd);
  }

  proposeSelection(cmd: ProposeSelection): OrchestrationCommandResult {
    return this.coordinator.proposeSelection(cmd);
  }

  emitSessionHandoff(cmd: EmitSessionHandoff): OrchestrationCommandResult {
    return this.coordinator.emitSessionHandoff(cmd);
  }
}
