/**
 * RC-26 Epic 5 — Orchestration workflow coordinator.
 *
 * Sequences: Market State → Library lookup/eligibility → Gate → Session handoff intent.
 * Delegates all business decisions to existing modules.
 * Never executes, creates Sessions, submits orders, or approves risk.
 */

import { Inject, Injectable } from '@nestjs/common';
import {
  createOrchestrationRun,
  withOrchestrationRunStatus,
  type OrchestrationRun,
} from '../domain/orchestration-run';
import { createSelectionDecision } from '../domain/selection-decision';
import { createSessionHandoffIntent } from '../domain/session-handoff-intent';
import {
  ORCHESTRATOR_MARKET_STATE_CONSUMER,
  ORCHESTRATOR_RISK_POLICY_READ_CONSUMER,
  ORCHESTRATOR_RUNTIME_ENFORCEMENT_CONSUMER,
  ORCHESTRATOR_STRATEGY_LIBRARY_CONSUMER,
  type CancelOrchestrationRun,
  type ConfirmOrchestrationRun,
  type EmitSessionHandoff,
  type OrchestrationCommandResult,
  type OrchestratorMarketStateConsumerPort,
  type OrchestratorRiskPolicyReadPort,
  type OrchestratorRuntimeEnforcementConsumerPort,
  type OrchestratorStrategyLibraryConsumerPort,
  type ProposeSelection,
  type RequestOrchestrationRun,
} from '../ports/trading-orchestrator.port';
import { OrchestrationCoordinationStore } from './orchestration-coordination.store';

function result(
  partial: Omit<
    OrchestrationCommandResult,
    'authorityClass' | 'forcesTrade' | 'approvesRisk' | 'submitsOrders'
  >,
): OrchestrationCommandResult {
  return Object.freeze({
    ...partial,
    authorityClass: 'orchestration_artifact' as const,
    forcesTrade: false as const,
    approvesRisk: false as const,
    submitsOrders: false as const,
  });
}

function nowOr(asOf: string | undefined, fallbackField: string): string {
  if (asOf !== undefined && asOf.trim() !== '') {
    const parsed = Date.parse(asOf);
    if (Number.isNaN(parsed)) {
      throw new Error(`${fallbackField} must be an ISO-8601 timestamp`);
    }
    return asOf.trim();
  }
  return new Date().toISOString();
}

@Injectable()
export class OrchestrationWorkflowCoordinator {
  constructor(
    @Inject(OrchestrationCoordinationStore)
    private readonly store: OrchestrationCoordinationStore,
    @Inject(ORCHESTRATOR_MARKET_STATE_CONSUMER)
    private readonly marketState: OrchestratorMarketStateConsumerPort,
    @Inject(ORCHESTRATOR_STRATEGY_LIBRARY_CONSUMER)
    private readonly library: OrchestratorStrategyLibraryConsumerPort,
    @Inject(ORCHESTRATOR_RUNTIME_ENFORCEMENT_CONSUMER)
    private readonly gate: OrchestratorRuntimeEnforcementConsumerPort,
    @Inject(ORCHESTRATOR_RISK_POLICY_READ_CONSUMER)
    private readonly riskPolicy: OrchestratorRiskPolicyReadPort,
  ) {}

  /**
   * Intent pipeline step 1: require Market State, create OrchestrationRun.
   */
  requestOrchestrationRun(cmd: RequestOrchestrationRun): OrchestrationCommandResult {
    const asOf = nowOr(cmd.asOf, 'asOf');
    const state = this.marketState.getCurrentMarketState({
      workspaceId: cmd.workspaceId,
      exchangeScopeId: cmd.exchangeScopeId,
      marketSymbol: cmd.marketSymbol,
      marketStateId: cmd.marketStateId,
    });

    if (!state) {
      return result({
        outcome: 'rejected',
        orchestrationRunId: '',
        rejectionReasons: Object.freeze(['missing_market_state']),
      });
    }

    const run = createOrchestrationRun({
      orchestrationRunId: this.store.nextId('run'),
      tradingOrchestratorId: cmd.tradingOrchestratorId?.trim() || 'orch-default',
      workspaceId: cmd.workspaceId,
      exchangeScopeId: cmd.exchangeScopeId,
      marketSymbol: cmd.marketSymbol,
      modeContext: cmd.modeContext,
      marketStateId: state.marketStateId,
      requestedBy: cmd.requestedBy,
      objective: cmd.objective,
      requiresConfirmation: cmd.requiresConfirmation === true,
      createdAt: asOf,
    });
    this.store.putRun(run);

    return result({
      outcome: 'accepted',
      orchestrationRunId: run.orchestrationRunId,
    });
  }

  confirmOrchestrationRun(cmd: ConfirmOrchestrationRun): OrchestrationCommandResult {
    const asOf = nowOr(cmd.asOf, 'asOf');
    const run = this.requireRun(cmd.workspaceId, cmd.orchestrationRunId);
    if (!run) {
      return result({
        outcome: 'failed',
        orchestrationRunId: cmd.orchestrationRunId,
        rejectionReasons: Object.freeze(['orchestration_run_not_found']),
      });
    }

    if (cmd.changesActiveSessionMission === true && !cmd.confirmedBy.trim()) {
      return result({
        outcome: 'rejected',
        orchestrationRunId: run.orchestrationRunId,
        rejectionReasons: Object.freeze(['confirmation_required_for_session_mission_change']),
      });
    }

    try {
      const next = withOrchestrationRunStatus(run, 'confirmed', asOf, {
        confirmedBy: cmd.confirmedBy,
      });
      this.store.putRun(next);
      return result({
        outcome: 'accepted',
        orchestrationRunId: next.orchestrationRunId,
      });
    } catch (error) {
      return result({
        outcome: 'rejected',
        orchestrationRunId: run.orchestrationRunId,
        rejectionReasons: Object.freeze([
          error instanceof Error ? error.message : 'confirm_failed',
        ]),
      });
    }
  }

  cancelOrchestrationRun(cmd: CancelOrchestrationRun): OrchestrationCommandResult {
    const asOf = nowOr(cmd.asOf, 'asOf');
    const run = this.requireRun(cmd.workspaceId, cmd.orchestrationRunId);
    if (!run) {
      return result({
        outcome: 'failed',
        orchestrationRunId: cmd.orchestrationRunId,
        rejectionReasons: Object.freeze(['orchestration_run_not_found']),
      });
    }

    try {
      const next = withOrchestrationRunStatus(run, 'cancelled', asOf, {
        rejectionReasons: Object.freeze([cmd.reason?.trim() || 'cancelled_by_operator']),
      });
      this.store.putRun(next);
      return result({
        outcome: 'cancelled',
        orchestrationRunId: next.orchestrationRunId,
        rejectionReasons: next.rejectionReasons,
      });
    } catch (error) {
      return result({
        outcome: 'rejected',
        orchestrationRunId: run.orchestrationRunId,
        rejectionReasons: Object.freeze([error instanceof Error ? error.message : 'cancel_failed']),
      });
    }
  }

  /**
   * Intent pipeline step 2: Library lookup + eligibility (delegation only).
   * Does not invent strategies or envelope points.
   */
  proposeSelection(cmd: ProposeSelection): OrchestrationCommandResult {
    const asOf = nowOr(cmd.asOf, 'asOf');
    const run = this.requireRun(cmd.workspaceId, cmd.orchestrationRunId);
    if (!run) {
      return result({
        outcome: 'failed',
        orchestrationRunId: cmd.orchestrationRunId,
        rejectionReasons: Object.freeze(['orchestration_run_not_found']),
      });
    }

    if (run.requiresConfirmation && run.status === 'requested') {
      return result({
        outcome: 'rejected',
        orchestrationRunId: run.orchestrationRunId,
        rejectionReasons: Object.freeze(['confirmation_required']),
      });
    }

    const selectable =
      run.status === 'confirmed' ||
      run.status === 'selecting' ||
      (run.status === 'requested' && !run.requiresConfirmation);
    if (!selectable) {
      return result({
        outcome: 'rejected',
        orchestrationRunId: run.orchestrationRunId,
        rejectionReasons: Object.freeze([`invalid_run_status:${run.status}`]),
      });
    }

    let working = run;
    if (working.status === 'requested') {
      working = withOrchestrationRunStatus(working, 'confirmed', asOf, {
        confirmedBy: cmd.proposedBy,
      });
      this.store.putRun(working);
    }
    if (working.status === 'confirmed') {
      working = withOrchestrationRunStatus(working, 'selecting', asOf);
      this.store.putRun(working);
    }

    // Market State still pinned on the run (pipeline step 1 already enforced).
    if (!working.marketStateId) {
      return this.failRun(working, asOf, ['missing_market_state']);
    }

    const libraryRecord = this.library.lookupCertified({
      libraryEntryId: cmd.libraryEntryId,
      workspaceId: cmd.workspaceId,
    });
    if (!libraryRecord) {
      return this.failRun(working, asOf, ['library_entry_not_found_or_uncertified']);
    }
    if (libraryRecord.strategyVersionId !== cmd.strategyVersionId) {
      return this.failRun(working, asOf, ['strategy_version_mismatch']);
    }
    if (
      libraryRecord.envelopeVersion !== null &&
      libraryRecord.envelopeVersion !== cmd.envelopeVersion
    ) {
      return this.failRun(working, asOf, ['envelope_version_mismatch']);
    }

    const eligibility = this.library.checkEligibility({
      libraryEntryId: cmd.libraryEntryId,
      workspaceId: cmd.workspaceId,
      exchangeScopeId: working.exchangeScopeId,
      tacticPoint: {
        symbol:
          typeof cmd.tacticPoint.symbol === 'string'
            ? cmd.tacticPoint.symbol
            : working.marketSymbol,
        timeframe:
          typeof cmd.tacticPoint.timeframe === 'string' ? cmd.tacticPoint.timeframe : undefined,
        exchangeScopeId: working.exchangeScopeId,
        riskPerTrade:
          typeof cmd.tacticPoint.riskPerTrade === 'number'
            ? cmd.tacticPoint.riskPerTrade
            : undefined,
      },
    });
    if (eligibility.outcome !== 'eligible') {
      return this.failRun(working, asOf, [
        'strategy_ineligible',
        ...eligibility.reasons.map((r) => `eligibility:${r}`),
      ]);
    }

    // Risk policy read only — never approveRisk.
    const constraints = this.riskPolicy.getSelectionConstraints({
      workspaceId: cmd.workspaceId,
      exchangeScopeId: working.exchangeScopeId,
    });
    if (constraints?.allowedSymbols && constraints.allowedSymbols.length > 0) {
      const symbol =
        typeof cmd.tacticPoint.symbol === 'string' ? cmd.tacticPoint.symbol : working.marketSymbol;
      if (!constraints.allowedSymbols.includes(symbol)) {
        return this.failRun(working, asOf, ['risk_constraint_symbol_forbidden']);
      }
    }
    if (
      constraints?.maxRiskPerTrade !== undefined &&
      typeof cmd.tacticPoint.riskPerTrade === 'number' &&
      cmd.tacticPoint.riskPerTrade > constraints.maxRiskPerTrade
    ) {
      return this.failRun(working, asOf, ['risk_constraint_risk_per_trade']);
    }

    const selection = createSelectionDecision({
      selectionDecisionId: this.store.nextId('sel'),
      orchestrationRunId: working.orchestrationRunId,
      workspaceId: cmd.workspaceId,
      libraryEntryId: libraryRecord.libraryEntryId,
      strategyVersionId: libraryRecord.strategyVersionId,
      eligibilityRef: `elig:${eligibility.libraryEntryId ?? libraryRecord.libraryEntryId}:${eligibility.checkedAt}`,
      marketStateId: working.marketStateId,
      envelopeVersion: cmd.envelopeVersion,
      tacticPoint: cmd.tacticPoint,
      rankRationale: 'delegated_library_identity_only',
      selectedAt: asOf,
      selectedBy: cmd.proposedBy,
    });
    this.store.putSelection(selection);

    const selected = withOrchestrationRunStatus(working, 'selected', asOf, {
      selectionDecisionId: selection.selectionDecisionId,
    });
    this.store.putRun(selected);

    return result({
      outcome: 'proposed',
      orchestrationRunId: selected.orchestrationRunId,
      selectionDecisionId: selection.selectionDecisionId,
    });
  }

  /**
   * Intent pipeline steps 3–4: Gate validation → Session handoff intent.
   * Fail-closed on Gate reject. Never creates Session / Orders.
   */
  emitSessionHandoff(cmd: EmitSessionHandoff): OrchestrationCommandResult {
    const asOf = nowOr(cmd.asOf, 'asOf');
    const run = this.requireRun(cmd.workspaceId, cmd.orchestrationRunId);
    if (!run) {
      return result({
        outcome: 'failed',
        orchestrationRunId: cmd.orchestrationRunId,
        rejectionReasons: Object.freeze(['orchestration_run_not_found']),
      });
    }

    if (run.status !== 'selected' && run.status !== 'handing_off') {
      return result({
        outcome: 'rejected',
        orchestrationRunId: run.orchestrationRunId,
        rejectionReasons: Object.freeze([`invalid_run_status:${run.status}`]),
      });
    }

    const selection = this.store.getSelection(cmd.selectionDecisionId);
    if (!selection || selection.orchestrationRunId !== run.orchestrationRunId) {
      return result({
        outcome: 'rejected',
        orchestrationRunId: run.orchestrationRunId,
        rejectionReasons: Object.freeze(['selection_decision_not_found']),
      });
    }

    let working = run;
    if (working.status === 'selected') {
      working = withOrchestrationRunStatus(working, 'handing_off', asOf);
      this.store.putRun(working);
    }

    const enforcement = this.gate.validateDeployment({
      workspaceId: cmd.workspaceId,
      libraryEntryId: selection.libraryEntryId,
      exchangeScopeId: working.exchangeScopeId,
      tacticPoint: selection.tacticPoint,
      tradingSessionId: cmd.tradingSessionId,
      purpose: cmd.tradingSessionId ? 'session_start' : 'deployment_bind',
      requestedAt: asOf,
    });

    if (enforcement.outcome !== 'pass' || enforcement.validation !== 'VALID') {
      const failed = withOrchestrationRunStatus(working, 'rejected', asOf, {
        rejectionReasons: Object.freeze([
          'runtime_enforcement_rejected',
          ...enforcement.reasons.map((r) => `enforcement:${r}`),
        ]),
      });
      this.store.putRun(failed);
      return result({
        outcome: 'rejected',
        orchestrationRunId: failed.orchestrationRunId,
        selectionDecisionId: selection.selectionDecisionId,
        enforcementDecisionRef: enforcement.decisionRef,
        rejectionReasons: failed.rejectionReasons,
      });
    }

    const intent = createSessionHandoffIntent({
      sessionHandoffIntentId: this.store.nextId('handoff'),
      orchestrationRunId: working.orchestrationRunId,
      selectionDecisionId: selection.selectionDecisionId,
      workspaceId: cmd.workspaceId,
      tradingSessionId: cmd.tradingSessionId,
      deploymentBindRef: cmd.deploymentBindRef,
      enforcementDecisionRef: enforcement.decisionRef,
      proposedAt: asOf,
      proposedBy: cmd.requestedBy,
    });
    this.store.putHandoff(intent);

    const handedOff = withOrchestrationRunStatus(working, 'handed_off', asOf, {
      sessionHandoffIntentId: intent.sessionHandoffIntentId,
    });
    this.store.putRun(handedOff);

    return result({
      outcome: 'handed_off',
      orchestrationRunId: handedOff.orchestrationRunId,
      selectionDecisionId: selection.selectionDecisionId,
      sessionHandoffIntentId: intent.sessionHandoffIntentId,
      enforcementDecisionRef: enforcement.decisionRef,
    });
  }

  private requireRun(workspaceId: string, orchestrationRunId: string): OrchestrationRun | null {
    const run = this.store.getRun(orchestrationRunId);
    if (!run || run.workspaceId !== workspaceId) return null;
    return run;
  }

  private failRun(
    run: OrchestrationRun,
    asOf: string,
    reasons: readonly string[],
  ): OrchestrationCommandResult {
    const failed = withOrchestrationRunStatus(run, 'rejected', asOf, {
      rejectionReasons: Object.freeze([...reasons]),
    });
    this.store.putRun(failed);
    return result({
      outcome: 'rejected',
      orchestrationRunId: failed.orchestrationRunId,
      rejectionReasons: failed.rejectionReasons,
    });
  }
}
