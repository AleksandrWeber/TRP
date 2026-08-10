/**
 * RC-25 Epic 4 — Market Qualification lifecycle service.
 *
 * Manages qualification workflow state only.
 * Does NOT score markets, calculate confidence, generate profiles,
 * authorize trading, or select strategies.
 */

import { Inject, Injectable } from '@nestjs/common';
import { InMemoryQualificationStore } from './adapters/in-memory-qualification-store';
import { createMarketConfidence } from './domain/market-confidence';
import { createMarketHealth } from './domain/market-health';
import {
  canTransitionQualificationState,
  type QualificationLifecycleState,
} from './domain/market-qualification-domain-shared';
import { createQualificationRun, type QualificationRun } from './domain/qualification-run';
import {
  createQualificationState,
  transitionQualificationState,
  type QualificationState,
} from './domain/qualification-state';
import { createQualificationTarget } from './domain/qualification-target';
import {
  deriveQualificationRunId,
  deriveQualificationTargetId,
} from './lifecycle/derive-qualification-ids';
import { MarketQualificationObservationalReadService } from './market-qualification-observational-read.service';
import type {
  CancelQualificationRun,
  CompleteQualificationRun,
  ConfirmQualificationRun,
  FailQualificationRun,
  MarketQualificationServicePort,
  QualificationRunResult,
  RequestQualificationRun,
} from './ports/market-qualification.port';

const DEFAULT_TS = '1970-01-01T00:00:00.000Z';

@Injectable()
export class MarketQualificationLifecycleService implements MarketQualificationServicePort {
  constructor(
    @Inject(InMemoryQualificationStore)
    private readonly store: InMemoryQualificationStore,
    @Inject(MarketQualificationObservationalReadService)
    private readonly observationalReads: MarketQualificationObservationalReadService,
  ) {}

  requestQualificationRun(cmd: RequestQualificationRun): QualificationRunResult {
    if (!cmd.workspaceId?.trim()) {
      return rejectedResult('', null, ['workspace_required']);
    }
    if (!cmd.exchangeScopeId?.trim() || !cmd.marketSymbol?.trim()) {
      return rejectedResult('', null, ['target_required']);
    }
    if (!cmd.requestedBy?.trim()) {
      return rejectedResult('', null, ['requested_by_required']);
    }
    if (!cmd.modeContext?.trim()) {
      return rejectedResult('', null, ['mode_context_required']);
    }

    const createdAt = cmd.requestedAt?.trim() || DEFAULT_TS;
    const targetId = deriveQualificationTargetId(
      cmd.workspaceId,
      cmd.exchangeScopeId,
      cmd.marketSymbol,
    );

    let target = this.store.getTarget(targetId);
    if (!target) {
      target = createQualificationTarget({
        targetId,
        workspaceId: cmd.workspaceId,
        exchangeScopeId: cmd.exchangeScopeId,
        marketSymbol: cmd.marketSymbol,
        createdAt,
      });
      this.store.putTarget(target);
    }

    let state = this.store.getState(targetId);
    if (!state) {
      state = createQualificationState({
        targetId,
        workspaceId: cmd.workspaceId,
        state: 'not_qualified',
        updatedAt: createdAt,
      });
      this.store.putState(state);
    }

    if (state.state === 'qualifying' || state.state === 'pending_confirm') {
      return rejectedResult('', state, [
        state.state === 'qualifying' ? 'already_qualifying' : 'already_pending_confirm',
      ]);
    }

    const openRun = this.store
      .listRuns(cmd.workspaceId, targetId)
      .find(
        (existing) =>
          existing.status === 'requested' ||
          existing.status === 'confirmed' ||
          existing.status === 'running',
      );
    if (openRun) {
      return rejectedResult(openRun.qualificationRunId, state, ['open_run_exists']);
    }

    const requestTransition = resolveRequestTransition(state.state);
    if (!requestTransition) {
      return rejectedResult('', state, [`invalid_state_for_request:${state.state}`]);
    }

    const observations = this.observationalReads.getMarketObservations({
      workspaceId: cmd.workspaceId,
      exchangeScopeId: cmd.exchangeScopeId,
      instrument: cmd.marketSymbol,
    });
    const research = this.observationalReads.getApprovedResearchOutputs({
      workspaceId: cmd.workspaceId,
      exchangeScopeId: cmd.exchangeScopeId,
    });

    const qualificationRunId =
      cmd.qualificationRunId?.trim() ||
      deriveQualificationRunId([
        cmd.workspaceId,
        cmd.exchangeScopeId,
        cmd.marketSymbol,
        createdAt,
        cmd.requestedBy,
      ]);

    if (this.store.getRun(qualificationRunId)) {
      return rejectedResult(qualificationRunId, state, ['run_id_exists']);
    }

    let run: QualificationRun;
    try {
      run = createQualificationRun({
        qualificationRunId,
        workspaceId: cmd.workspaceId,
        targetId,
        modeContext: cmd.modeContext,
        status: 'requested',
        requestedBy: cmd.requestedBy,
        inputSummary: {
          observationCount: observations.length,
          researchRefCount: research.length,
          liveMarketDataRefs: observations.map((o) => o.streamId),
          researchOutputRefs: research.map((r) => r.eventId),
        },
        createdAt,
      });
    } catch (error) {
      return rejectedResult('', state, [error instanceof Error ? error.message : 'invalid_run']);
    }

    // Heavy work does not start here. From `qualified`, state stays put until confirm
    // (domain allows qualified → qualifying on confirm). Other states move to pending_confirm.
    const nextState =
      requestTransition === 'unchanged'
        ? state
        : transitionQualificationState(state, requestTransition, createdAt);

    this.store.putRun(run);
    if (nextState !== state) {
      this.store.putState(nextState);
    }

    return {
      outcome: 'accepted',
      qualificationRunId,
      qualificationState: nextState,
      forcesTrade: false,
      authorizesSession: false,
    };
  }

  confirmQualificationRun(cmd: ConfirmQualificationRun): QualificationRunResult {
    const resolved = this.requireRun(cmd.workspaceId, cmd.qualificationRunId);
    if (!resolved.ok) return resolved.result;
    const run = resolved.run;

    if (run.status !== 'requested') {
      return rejectedResult(run.qualificationRunId, this.store.getState(run.targetId), [
        `invalid_run_status:${run.status}`,
      ]);
    }
    if (!cmd.confirmedBy?.trim()) {
      return rejectedResult(run.qualificationRunId, this.store.getState(run.targetId), [
        'confirmed_by_required',
      ]);
    }

    const confirmedAt = cmd.confirmedAt?.trim() || DEFAULT_TS;
    const state = this.store.getState(run.targetId);
    if (!state) {
      return rejectedResult(run.qualificationRunId, null, ['state_missing']);
    }
    // pending_confirm → qualifying (first qualify); qualified → qualifying (requalify).
    if (state.state !== 'pending_confirm' && state.state !== 'qualified') {
      return rejectedResult(run.qualificationRunId, state, [
        `invalid_state_for_confirm:${state.state}`,
      ]);
    }
    if (!canTransitionQualificationState(state.state, 'qualifying')) {
      return rejectedResult(run.qualificationRunId, state, [
        `invalid_state_for_confirm:${state.state}`,
      ]);
    }

    const confirmedRun = createQualificationRun({
      qualificationRunId: run.qualificationRunId,
      workspaceId: run.workspaceId,
      targetId: run.targetId,
      modeContext: run.modeContext,
      status: 'running',
      requestedBy: run.requestedBy,
      confirmedBy: cmd.confirmedBy,
      inputSummary: run.inputSummary,
      createdAt: run.createdAt,
    });

    const nextState = transitionQualificationState(state, 'qualifying', confirmedAt, {
      activeRunId: run.qualificationRunId,
    });

    this.store.putRun(confirmedRun);
    this.store.putState(nextState);

    return {
      outcome: 'running',
      qualificationRunId: confirmedRun.qualificationRunId,
      qualificationState: nextState,
      forcesTrade: false,
      authorizesSession: false,
    };
  }

  cancelQualificationRun(cmd: CancelQualificationRun): QualificationRunResult {
    const resolved = this.requireRun(cmd.workspaceId, cmd.qualificationRunId);
    if (!resolved.ok) return resolved.result;
    const run = resolved.run;

    if (run.status !== 'requested' && run.status !== 'confirmed' && run.status !== 'running') {
      return rejectedResult(run.qualificationRunId, this.store.getState(run.targetId), [
        `invalid_run_status:${run.status}`,
      ]);
    }

    const cancelledAt = cmd.cancelledAt?.trim() || DEFAULT_TS;
    const state = this.store.getState(run.targetId);
    if (!state) {
      return rejectedResult(run.qualificationRunId, null, ['state_missing']);
    }

    const cancelledRun = createQualificationRun({
      qualificationRunId: run.qualificationRunId,
      workspaceId: run.workspaceId,
      targetId: run.targetId,
      modeContext: run.modeContext,
      status: 'cancelled',
      requestedBy: run.requestedBy,
      confirmedBy: run.confirmedBy,
      inputSummary: run.inputSummary,
      rejectionReasons: cmd.reasons?.length ? cmd.reasons : ['cancelled'],
      completedAt: cancelledAt,
      createdAt: run.createdAt,
    });

    let nextState = state;
    if (state.state === 'pending_confirm' || state.state === 'qualifying') {
      if (canTransitionQualificationState(state.state, 'failed')) {
        nextState = transitionQualificationState(state, 'failed', cancelledAt, {
          activeRunId: null,
        });
      }
    }

    this.store.putRun(cancelledRun);
    this.store.putState(nextState);

    return {
      outcome: 'cancelled',
      qualificationRunId: cancelledRun.qualificationRunId,
      qualificationState: nextState,
      rejectionReasons: cancelledRun.rejectionReasons,
      forcesTrade: false,
      authorizesSession: false,
    };
  }

  completeQualificationRun(cmd: CompleteQualificationRun): QualificationRunResult {
    const resolved = this.requireRun(cmd.workspaceId, cmd.qualificationRunId);
    if (!resolved.ok) return resolved.result;
    const run = resolved.run;

    if (run.status !== 'running') {
      return rejectedResult(run.qualificationRunId, this.store.getState(run.targetId), [
        `invalid_run_status:${run.status}`,
      ]);
    }

    const completedAt = cmd.completedAt?.trim() || DEFAULT_TS;
    const state = this.store.getState(run.targetId);
    if (!state || state.state !== 'qualifying') {
      return rejectedResult(run.qualificationRunId, state, [
        `invalid_state_for_complete:${state?.state ?? 'missing'}`,
      ]);
    }

    // Optional caller-supplied snapshots only — never calculated here.
    // Validate before committing lifecycle mutations.
    let marketConfidence = this.store.getConfidence(run.targetId) ?? undefined;
    let marketHealth = this.store.getHealth(run.targetId) ?? undefined;
    try {
      if (cmd.confidence) {
        marketConfidence = createMarketConfidence({
          ...cmd.confidence,
          targetId: run.targetId,
          workspaceId: run.workspaceId,
          sourceRunId: run.qualificationRunId,
        });
      }
      if (cmd.health) {
        marketHealth = createMarketHealth({
          ...cmd.health,
          targetId: run.targetId,
          workspaceId: run.workspaceId,
          sourceRunId: run.qualificationRunId,
        });
      }
    } catch (error) {
      return rejectedResult(run.qualificationRunId, state, [
        error instanceof Error ? error.message : 'invalid_snapshot',
      ]);
    }

    const completedRun = createQualificationRun({
      qualificationRunId: run.qualificationRunId,
      workspaceId: run.workspaceId,
      targetId: run.targetId,
      modeContext: run.modeContext,
      status: 'completed',
      requestedBy: run.requestedBy,
      confirmedBy: run.confirmedBy,
      inputSummary: run.inputSummary,
      completedAt,
      createdAt: run.createdAt,
    });

    const nextState = transitionQualificationState(state, 'qualified', completedAt, {
      activeRunId: null,
      latestCompletedRunId: run.qualificationRunId,
    });

    this.store.putRun(completedRun);
    this.store.putState(nextState);
    if (cmd.confidence && marketConfidence) {
      this.store.putConfidence(marketConfidence);
    }
    if (cmd.health && marketHealth) {
      this.store.putHealth(marketHealth);
    }

    return {
      outcome: 'completed',
      qualificationRunId: completedRun.qualificationRunId,
      qualificationState: nextState,
      ...(marketConfidence ? { marketConfidence } : {}),
      ...(marketHealth ? { marketHealth } : {}),
      forcesTrade: false,
      authorizesSession: false,
    };
  }

  failQualificationRun(cmd: FailQualificationRun): QualificationRunResult {
    const resolved = this.requireRun(cmd.workspaceId, cmd.qualificationRunId);
    if (!resolved.ok) return resolved.result;
    const run = resolved.run;

    if (run.status !== 'running' && run.status !== 'confirmed' && run.status !== 'requested') {
      return rejectedResult(run.qualificationRunId, this.store.getState(run.targetId), [
        `invalid_run_status:${run.status}`,
      ]);
    }
    if (!cmd.reasons?.length) {
      return rejectedResult(run.qualificationRunId, this.store.getState(run.targetId), [
        'reasons_required',
      ]);
    }

    const failedAt = cmd.failedAt?.trim() || DEFAULT_TS;
    const state = this.store.getState(run.targetId);
    if (!state) {
      return rejectedResult(run.qualificationRunId, null, ['state_missing']);
    }

    const failedRun = createQualificationRun({
      qualificationRunId: run.qualificationRunId,
      workspaceId: run.workspaceId,
      targetId: run.targetId,
      modeContext: run.modeContext,
      status: 'failed',
      requestedBy: run.requestedBy,
      confirmedBy: run.confirmedBy,
      inputSummary: run.inputSummary,
      rejectionReasons: cmd.reasons,
      completedAt: failedAt,
      createdAt: run.createdAt,
    });

    let nextState = state;
    if (
      (state.state === 'qualifying' || state.state === 'pending_confirm') &&
      canTransitionQualificationState(state.state, 'failed')
    ) {
      nextState = transitionQualificationState(state, 'failed', failedAt, {
        activeRunId: null,
      });
    }

    this.store.putRun(failedRun);
    this.store.putState(nextState);

    return {
      outcome: 'failed',
      qualificationRunId: failedRun.qualificationRunId,
      qualificationState: nextState,
      rejectionReasons: cmd.reasons,
      forcesTrade: false,
      authorizesSession: false,
    };
  }

  private requireRun(
    workspaceId: string,
    qualificationRunId: string,
  ): { ok: true; run: QualificationRun } | { ok: false; result: QualificationRunResult } {
    if (!workspaceId?.trim() || !qualificationRunId?.trim()) {
      return {
        ok: false,
        result: rejectedResult(qualificationRunId ?? '', null, ['run_required']),
      };
    }
    const run = this.store.getRun(qualificationRunId);
    if (!run || run.workspaceId !== workspaceId) {
      return {
        ok: false,
        result: rejectedResult(qualificationRunId, null, ['run_not_found']),
      };
    }
    return { ok: true, run };
  }
}

function resolveRequestTransition(
  state: QualificationLifecycleState,
): QualificationLifecycleState | 'unchanged' | null {
  if (canTransitionQualificationState(state, 'pending_confirm')) {
    return 'pending_confirm';
  }
  // Requalify while still qualified: keep state until confirm (heavy-work rule).
  if (state === 'qualified') {
    return 'unchanged';
  }
  return null;
}

function rejectedResult(
  qualificationRunId: string,
  qualificationState: QualificationState | null,
  rejectionReasons: readonly string[],
): QualificationRunResult {
  return {
    outcome: 'rejected',
    qualificationRunId,
    qualificationState,
    rejectionReasons,
    forcesTrade: false,
    authorizesSession: false,
  };
}
