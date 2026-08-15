/**
 * PC-08 — product adapter over existing Market Qualification ports.
 *
 * Delegates commands and queries. Does not own qualification artifacts.
 * Does not score markets, publish profiles, or redesign Market State.
 */

import { Inject, Injectable } from '@nestjs/common';
import {
  MARKET_QUALIFICATION_QUERY_PORT,
  MARKET_QUALIFICATION_SERVICE_PORT,
  type CancelQualificationRun,
  type CompleteQualificationRun,
  type ConfirmQualificationRun,
  type FailQualificationRun,
  type MarketQualificationQueryPort,
  type MarketQualificationServicePort,
  type RequestQualificationRun,
} from '../market-qualification/ports/market-qualification.port';
import {
  toCommandView,
  toLifecycleView,
  toConfidenceView,
  toHealthView,
  toHistoryView,
  toRunDetailView,
  toRunListItemView,
  toRunPageView,
  toTargetDetailView,
  toTargetListItemView,
  toTargetPageView,
  toWorkspaceView,
  type QualificationCommandView,
  type QualificationConfidenceProductView,
  type QualificationHealthProductView,
  type QualificationHistoryItemView,
  type QualificationLifecycleProductView,
  type QualificationRunDetailView,
  type QualificationRunPageView,
  type QualificationTargetDetailView,
  type QualificationTargetPageView,
  type QualificationWorkspaceView,
} from './qualification.view';

@Injectable()
export class QualificationProductService {
  constructor(
    @Inject(MARKET_QUALIFICATION_SERVICE_PORT)
    private readonly commands: MarketQualificationServicePort,
    @Inject(MARKET_QUALIFICATION_QUERY_PORT)
    private readonly query: MarketQualificationQueryPort,
  ) {}

  getWorkspace(workspaceId: string): QualificationWorkspaceView {
    const targets = this.listTargetItems(workspaceId);
    const runs = this.listRunItems(workspaceId);
    return toWorkspaceView({ workspaceId, targets, recentRuns: runs });
  }

  listTargets(workspaceId: string): QualificationTargetPageView {
    return toTargetPageView(this.listTargetItems(workspaceId));
  }

  getTarget(workspaceId: string, targetId: string): QualificationTargetDetailView | null {
    const target = this.findTarget(workspaceId, targetId);
    if (!target) return null;
    return this.detailFor(target);
  }

  getLifecycle(workspaceId: string, targetId: string): QualificationLifecycleProductView | null {
    return this.getTarget(workspaceId, targetId)?.lifecycle ?? null;
  }

  getConfidence(workspaceId: string, targetId: string): QualificationConfidenceProductView | null {
    const detail = this.getTarget(workspaceId, targetId);
    return detail ? detail.confidence : null;
  }

  getHealth(workspaceId: string, targetId: string): QualificationHealthProductView | null {
    const detail = this.getTarget(workspaceId, targetId);
    return detail ? detail.health : null;
  }

  getHistory(
    workspaceId: string,
    targetId: string,
  ): readonly QualificationHistoryItemView[] | null {
    const detail = this.getTarget(workspaceId, targetId);
    return detail ? detail.history : null;
  }

  listRuns(
    workspaceId: string,
    filters?: Readonly<{ targetId?: string; status?: string }>,
  ): QualificationRunPageView {
    const items = this.listRunItems(workspaceId, filters?.targetId).filter((item) =>
      filters?.status ? item.status === filters.status : true,
    );
    return toRunPageView(items);
  }

  getRun(workspaceId: string, qualificationRunId: string): QualificationRunDetailView | null {
    const run = this.query.getQualificationRun({ workspaceId, qualificationRunId });
    if (!run) return null;
    const target = this.findTarget(workspaceId, run.targetId);
    const scoped = target
      ? {
          workspaceId,
          exchangeScopeId: target.exchangeScopeId,
          marketSymbol: target.marketSymbol,
        }
      : null;
    return toRunDetailView({
      run,
      target,
      state: scoped ? this.query.getQualificationState(scoped) : null,
      confidence: scoped ? this.query.getMarketConfidence(scoped) : null,
      health: scoped ? this.query.getMarketHealth(scoped) : null,
    });
  }

  request(cmd: RequestQualificationRun): QualificationCommandView {
    const result = this.commands.requestQualificationRun(cmd);
    return this.toCommand(cmd.workspaceId, result);
  }

  confirm(cmd: ConfirmQualificationRun): QualificationCommandView {
    return this.toCommand(cmd.workspaceId, this.commands.confirmQualificationRun(cmd));
  }

  cancel(cmd: CancelQualificationRun): QualificationCommandView {
    return this.toCommand(cmd.workspaceId, this.commands.cancelQualificationRun(cmd));
  }

  complete(cmd: CompleteQualificationRun): QualificationCommandView {
    return this.toCommand(cmd.workspaceId, this.commands.completeQualificationRun(cmd));
  }

  fail(cmd: FailQualificationRun): QualificationCommandView {
    return this.toCommand(cmd.workspaceId, this.commands.failQualificationRun(cmd));
  }

  requalify(cmd: RequestQualificationRun): QualificationCommandView {
    return this.request(cmd);
  }

  private toCommand(
    workspaceId: string,
    result: ReturnType<MarketQualificationServicePort['requestQualificationRun']>,
  ): QualificationCommandView {
    const run = result.qualificationRunId
      ? this.getRun(workspaceId, result.qualificationRunId)
      : null;
    const target = run ? this.getTarget(workspaceId, run.targetId) : null;
    return toCommandView({ result, target, run });
  }

  private listTargetItems(workspaceId: string) {
    return this.query.listQualificationTargets({ workspaceId }).map((target) => {
      const scoped = {
        workspaceId,
        exchangeScopeId: target.exchangeScopeId,
        marketSymbol: target.marketSymbol,
      };
      return toTargetListItemView({
        target,
        state: this.query.getQualificationState(scoped),
        confidence: this.query.getMarketConfidence(scoped),
        health: this.query.getMarketHealth(scoped),
        runs: this.query.listQualificationRuns({
          workspaceId,
          targetId: target.targetId,
        }),
      });
    });
  }

  private listRunItems(workspaceId: string, targetId?: string) {
    const runs = this.query.listQualificationRuns({
      workspaceId,
      ...(targetId ? { targetId } : {}),
    });
    const targets = new Map(
      this.query
        .listQualificationTargets({ workspaceId })
        .map((target) => [target.targetId, target]),
    );
    return [...runs]
      .slice()
      .reverse()
      .map((run) => toRunListItemView({ run, target: targets.get(run.targetId) ?? null }));
  }

  private findTarget(workspaceId: string, targetId: string) {
    return (
      this.query
        .listQualificationTargets({ workspaceId })
        .find((item) => item.targetId === targetId) ?? null
    );
  }

  private detailFor(
    target: NonNullable<ReturnType<MarketQualificationQueryPort['getQualificationTarget']>>,
  ): QualificationTargetDetailView {
    const scoped = {
      workspaceId: target.workspaceId,
      exchangeScopeId: target.exchangeScopeId,
      marketSymbol: target.marketSymbol,
    };
    const runSummaries = this.query.listQualificationRuns({
      workspaceId: target.workspaceId,
      targetId: target.targetId,
    });
    const runDetails = runSummaries
      .map((summary) =>
        this.query.getQualificationRun({
          workspaceId: target.workspaceId,
          qualificationRunId: summary.qualificationRunId,
        }),
      )
      .filter((run): run is NonNullable<typeof run> => run !== null);
    const latest = runDetails.at(-1) ?? null;
    const state = this.query.getQualificationState(scoped);
    const confidence = this.query.getMarketConfidence(scoped);
    const health = this.query.getMarketHealth(scoped);
    return toTargetDetailView({
      target,
      state,
      confidence,
      health,
      runSummaries,
      runDetails,
      latestRun: latest
        ? toRunDetailView({ run: latest, target, state, confidence, health })
        : null,
    });
  }
}
