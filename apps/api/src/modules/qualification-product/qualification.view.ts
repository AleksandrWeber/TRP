/**
 * PC-08 — HTTP product views of existing Market Qualification artifacts.
 *
 * Qualification remains owner. Profile unchanged. Market State unchanged.
 * Not a new SoT. Not scoring. Not a trade authorization.
 */

import {
  isQualificationLifecycleState,
  type QualificationLifecycleState,
} from '../market-qualification/domain/market-qualification-domain-shared';
import type { MarketConfidence } from '../market-qualification/domain/market-confidence';
import type { MarketHealth } from '../market-qualification/domain/market-health';
import type { QualificationRun } from '../market-qualification/domain/qualification-run';
import type { QualificationState } from '../market-qualification/domain/qualification-state';
import type { QualificationTarget } from '../market-qualification/domain/qualification-target';
import type {
  MarketConfidenceView,
  MarketHealthView,
  QualificationRunResult,
  QualificationRunSummary,
  QualificationRunView,
  QualificationStateView,
  QualificationTargetView,
} from '../market-qualification/ports/market-qualification.port';

export const QUALIFICATION_PRODUCT_FLAGS = Object.freeze({
  authorityClass: 'research_artifact' as const,
  forcesTrade: false as const,
  authorizesSession: false as const,
  isMarketProfile: false as const,
  isMarketState: false as const,
  isRiskEngine: false as const,
  isExecutionEngine: false as const,
  isTradingSession: false as const,
  scoresMarket: false as const,
  calculatesConfidence: false as const,
});

const OPEN_RUN_STATUSES = Object.freeze(['requested', 'confirmed', 'running'] as const);

export type QualificationLifecycleActionView = Readonly<{
  canRequest: boolean;
  canConfirm: boolean;
  canCancel: boolean;
  canComplete: boolean;
  canFail: boolean;
  canRequalify: boolean;
}>;

export type QualificationTargetListItemView = Readonly<{
  targetId: string;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  displayName: string;
  lifecycleState: string;
  latestRunStatus: string | null;
  confidenceLevel: string | null;
  healthStatus: string | null;
  runCount: number;
  updatedAt: string;
}> &
  typeof QUALIFICATION_PRODUCT_FLAGS;

export type QualificationWorkspaceView = Readonly<{
  workspaceId: string;
  targetCount: number;
  qualifiedCount: number;
  qualifyingCount: number;
  pendingConfirmCount: number;
  failedCount: number;
  runCount: number;
  targets: readonly QualificationTargetListItemView[];
  recentRuns: readonly QualificationRunListItemView[];
}> &
  typeof QUALIFICATION_PRODUCT_FLAGS;

export type QualificationLifecycleProductView = Readonly<{
  targetId: string;
  workspaceId: string;
  state: string;
  activeRunId: string | null;
  latestCompletedRunId: string | null;
  latestProfileId: string | null;
  updatedAt: string;
  actions: QualificationLifecycleActionView;
}> &
  typeof QUALIFICATION_PRODUCT_FLAGS;

export type QualificationConfidenceProductView = Readonly<{
  targetId: string;
  workspaceId: string;
  level: string;
  score: number | null;
  rationaleSummary: string;
  sourceRunId: string;
  asOf: string;
  staleLabel: string;
}> &
  typeof QUALIFICATION_PRODUCT_FLAGS;

export type QualificationHealthIndicatorView = Readonly<{
  key: string;
  value: string;
  note: string | null;
}>;

export type QualificationHealthProductView = Readonly<{
  targetId: string;
  workspaceId: string;
  status: string;
  indicators: readonly QualificationHealthIndicatorView[];
  sourceRunId: string;
  asOf: string;
}> &
  typeof QUALIFICATION_PRODUCT_FLAGS;

export type QualificationRunListItemView = Readonly<{
  qualificationRunId: string;
  workspaceId: string;
  targetId: string;
  exchangeScopeId: string | null;
  marketSymbol: string | null;
  status: string;
  modeContext: string;
  createdAt: string;
  completedAt: string | null;
}> &
  typeof QUALIFICATION_PRODUCT_FLAGS;

export type QualificationRunPageView = Readonly<{
  items: readonly QualificationRunListItemView[];
}> &
  typeof QUALIFICATION_PRODUCT_FLAGS;

export type QualificationTargetPageView = Readonly<{
  items: readonly QualificationTargetListItemView[];
}> &
  typeof QUALIFICATION_PRODUCT_FLAGS;

export type QualificationHistoryItemView = Readonly<{
  kind: 'run' | 'lifecycle' | 'confidence' | 'health';
  at: string;
  summary: string;
  status?: string;
  qualificationRunId?: string;
}> &
  typeof QUALIFICATION_PRODUCT_FLAGS;

export type QualificationRunDetailView = Readonly<{
  qualificationRunId: string;
  workspaceId: string;
  targetId: string;
  exchangeScopeId: string | null;
  marketSymbol: string | null;
  displayName: string | null;
  status: string;
  modeContext: string;
  requestedBy: string;
  confirmedBy: string | null;
  createdAt: string;
  completedAt: string | null;
  rejectionReasons: readonly string[];
  inputSummary: Readonly<{
    observationCount: number;
    researchRefCount: number;
    liveMarketDataRefs: readonly string[];
    researchOutputRefs: readonly string[];
  }>;
  lifecycle: QualificationLifecycleProductView | null;
  confidence: QualificationConfidenceProductView | null;
  health: QualificationHealthProductView | null;
  actions: QualificationLifecycleActionView;
}> &
  typeof QUALIFICATION_PRODUCT_FLAGS;

export type QualificationTargetDetailView = Readonly<{
  targetId: string;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  displayName: string;
  current: QualificationTargetListItemView;
  lifecycle: QualificationLifecycleProductView;
  confidence: QualificationConfidenceProductView | null;
  health: QualificationHealthProductView | null;
  runs: readonly QualificationRunListItemView[];
  history: readonly QualificationHistoryItemView[];
  latestRun: QualificationRunDetailView | null;
}> &
  typeof QUALIFICATION_PRODUCT_FLAGS;

export type QualificationCommandView = Readonly<{
  outcome: string;
  qualificationRunId: string;
  rejectionReasons: readonly string[];
  publishedProfileId: string | null;
  target: QualificationTargetDetailView | null;
  run: QualificationRunDetailView | null;
}> &
  typeof QUALIFICATION_PRODUCT_FLAGS;

export function toLifecycleActions(
  args: Readonly<{
    state: string | null;
    openRunStatus: string | null;
  }>,
): QualificationLifecycleActionView {
  const known = args.state !== null && isQualificationLifecycleState(args.state);
  const state = known ? (args.state as QualificationLifecycleState) : null;
  const open = args.openRunStatus;
  const requested = open === 'requested';
  const running = open === 'running';
  const confirmed = open === 'confirmed';
  const busy = state === 'pending_confirm' || state === 'qualifying' || open !== null;
  return Object.freeze({
    canRequest: !busy && state !== 'qualified',
    canConfirm: requested,
    canCancel: requested || running || confirmed,
    canComplete: running,
    canFail: requested || running || confirmed,
    canRequalify: state === 'qualified' && open === null,
  });
}

export function toTargetListItemView(
  args: Readonly<{
    target: QualificationTarget | QualificationTargetView;
    state: QualificationState | QualificationStateView | null;
    confidence: MarketConfidence | MarketConfidenceView | null;
    health: MarketHealth | MarketHealthView | null;
    runs: readonly QualificationRunSummary[];
  }>,
): QualificationTargetListItemView {
  const latest = args.runs.at(-1) ?? null;
  return Object.freeze({
    targetId: args.target.targetId,
    workspaceId: args.target.workspaceId,
    exchangeScopeId: args.target.exchangeScopeId,
    marketSymbol: args.target.marketSymbol,
    displayName: args.target.displayName ?? args.target.marketSymbol,
    lifecycleState: args.state?.state ?? 'not_qualified',
    latestRunStatus: latest?.status ?? null,
    confidenceLevel: args.confidence?.level ?? null,
    healthStatus: args.health?.status ?? null,
    runCount: args.runs.length,
    updatedAt: args.state?.updatedAt ?? args.target.createdAt,
    ...QUALIFICATION_PRODUCT_FLAGS,
  });
}

export function toLifecycleView(
  args: Readonly<{
    targetId: string;
    workspaceId: string;
    state: QualificationState | QualificationStateView | null;
    openRunStatus: string | null;
  }>,
): QualificationLifecycleProductView {
  const state = args.state?.state ?? 'not_qualified';
  return Object.freeze({
    targetId: args.targetId,
    workspaceId: args.workspaceId,
    state,
    activeRunId: args.state?.activeRunId ?? null,
    latestCompletedRunId: args.state?.latestCompletedRunId ?? null,
    latestProfileId: args.state?.latestProfileId ?? null,
    updatedAt: args.state?.updatedAt ?? '1970-01-01T00:00:00.000Z',
    actions: toLifecycleActions({ state, openRunStatus: args.openRunStatus }),
    ...QUALIFICATION_PRODUCT_FLAGS,
  });
}

export function toConfidenceView(
  confidence: MarketConfidence | MarketConfidenceView | null,
): QualificationConfidenceProductView | null {
  if (!confidence) return null;
  return Object.freeze({
    targetId: confidence.targetId,
    workspaceId: confidence.workspaceId,
    level: confidence.level,
    score: confidence.score ?? null,
    rationaleSummary: confidence.rationaleSummary,
    sourceRunId: confidence.sourceRunId,
    asOf: confidence.asOf,
    staleLabel: `as of ${confidence.asOf}`,
    ...QUALIFICATION_PRODUCT_FLAGS,
  });
}

export function toHealthView(
  health: MarketHealth | MarketHealthView | null,
): QualificationHealthProductView | null {
  if (!health) return null;
  return Object.freeze({
    targetId: health.targetId,
    workspaceId: health.workspaceId,
    status: health.status,
    indicators: Object.freeze(
      health.indicators.map((indicator) =>
        Object.freeze({
          key: indicator.key,
          value: indicator.value,
          note: indicator.note ?? null,
        }),
      ),
    ),
    sourceRunId: health.sourceRunId,
    asOf: health.asOf,
    ...QUALIFICATION_PRODUCT_FLAGS,
  });
}

export function toRunListItemView(
  args: Readonly<{
    run: QualificationRunSummary | QualificationRun | QualificationRunView;
    target?: QualificationTarget | QualificationTargetView | null;
  }>,
): QualificationRunListItemView {
  const completedAt = 'completedAt' in args.run ? (args.run.completedAt ?? null) : null;
  return Object.freeze({
    qualificationRunId: args.run.qualificationRunId,
    workspaceId: args.run.workspaceId,
    targetId: args.run.targetId,
    exchangeScopeId: args.target?.exchangeScopeId ?? null,
    marketSymbol: args.target?.marketSymbol ?? null,
    status: args.run.status,
    modeContext: args.run.modeContext,
    createdAt: args.run.createdAt,
    completedAt,
    ...QUALIFICATION_PRODUCT_FLAGS,
  });
}

export function toRunPageView(
  items: readonly QualificationRunListItemView[],
): QualificationRunPageView {
  return Object.freeze({
    items: Object.freeze([...items]),
    ...QUALIFICATION_PRODUCT_FLAGS,
  });
}

export function toTargetPageView(
  items: readonly QualificationTargetListItemView[],
): QualificationTargetPageView {
  return Object.freeze({
    items: Object.freeze([...items]),
    ...QUALIFICATION_PRODUCT_FLAGS,
  });
}

export function toHistoryView(
  args: Readonly<{
    state: QualificationState | QualificationStateView | null;
    confidence: MarketConfidence | MarketConfidenceView | null;
    health: MarketHealth | MarketHealthView | null;
    runs: readonly (QualificationRun | QualificationRunView | QualificationRunSummary)[];
  }>,
): readonly QualificationHistoryItemView[] {
  const items: QualificationHistoryItemView[] = [];
  for (const run of args.runs) {
    items.push(
      Object.freeze({
        kind: 'run' as const,
        at: run.createdAt,
        summary: `Run ${run.status}`,
        status: run.status,
        qualificationRunId: run.qualificationRunId,
        ...QUALIFICATION_PRODUCT_FLAGS,
      }),
    );
    if ('completedAt' in run && run.completedAt) {
      items.push(
        Object.freeze({
          kind: 'run' as const,
          at: run.completedAt,
          summary: `Run ${run.status}`,
          status: run.status,
          qualificationRunId: run.qualificationRunId,
          ...QUALIFICATION_PRODUCT_FLAGS,
        }),
      );
    }
  }
  if (args.state) {
    items.push(
      Object.freeze({
        kind: 'lifecycle' as const,
        at: args.state.updatedAt,
        summary: `Lifecycle ${args.state.state}`,
        status: args.state.state,
        ...QUALIFICATION_PRODUCT_FLAGS,
      }),
    );
  }
  if (args.confidence) {
    items.push(
      Object.freeze({
        kind: 'confidence' as const,
        at: args.confidence.asOf,
        summary: `Confidence ${args.confidence.level}`,
        status: args.confidence.level,
        qualificationRunId: args.confidence.sourceRunId,
        ...QUALIFICATION_PRODUCT_FLAGS,
      }),
    );
  }
  if (args.health) {
    items.push(
      Object.freeze({
        kind: 'health' as const,
        at: args.health.asOf,
        summary: `Health ${args.health.status}`,
        status: args.health.status,
        qualificationRunId: args.health.sourceRunId,
        ...QUALIFICATION_PRODUCT_FLAGS,
      }),
    );
  }
  return Object.freeze(
    items.sort(
      (left, right) => right.at.localeCompare(left.at) || left.kind.localeCompare(right.kind),
    ),
  );
}

export function toRunDetailView(
  args: Readonly<{
    run: QualificationRun | QualificationRunView;
    target: QualificationTarget | QualificationTargetView | null;
    state: QualificationState | QualificationStateView | null;
    confidence: MarketConfidence | MarketConfidenceView | null;
    health: MarketHealth | MarketHealthView | null;
  }>,
): QualificationRunDetailView {
  const openStatus = isOpenRunStatus(args.run.status) ? args.run.status : null;
  return Object.freeze({
    qualificationRunId: args.run.qualificationRunId,
    workspaceId: args.run.workspaceId,
    targetId: args.run.targetId,
    exchangeScopeId: args.target?.exchangeScopeId ?? null,
    marketSymbol: args.target?.marketSymbol ?? null,
    displayName: args.target?.displayName ?? args.target?.marketSymbol ?? null,
    status: args.run.status,
    modeContext: args.run.modeContext,
    requestedBy: args.run.requestedBy,
    confirmedBy: args.run.confirmedBy ?? null,
    createdAt: args.run.createdAt,
    completedAt: args.run.completedAt ?? null,
    rejectionReasons: Object.freeze([...(args.run.rejectionReasons ?? [])]),
    inputSummary: Object.freeze({
      observationCount: args.run.inputSummary.observationCount,
      researchRefCount: args.run.inputSummary.researchRefCount,
      liveMarketDataRefs: Object.freeze([...args.run.inputSummary.liveMarketDataRefs]),
      researchOutputRefs: Object.freeze([...args.run.inputSummary.researchOutputRefs]),
    }),
    lifecycle: args.target
      ? toLifecycleView({
          targetId: args.target.targetId,
          workspaceId: args.run.workspaceId,
          state: args.state,
          openRunStatus: openStatus,
        })
      : null,
    confidence: toConfidenceView(args.confidence),
    health: toHealthView(args.health),
    actions: toLifecycleActions({
      state: args.state?.state ?? null,
      openRunStatus: openStatus,
    }),
    ...QUALIFICATION_PRODUCT_FLAGS,
  });
}

export function toTargetDetailView(
  args: Readonly<{
    target: QualificationTarget | QualificationTargetView;
    state: QualificationState | QualificationStateView | null;
    confidence: MarketConfidence | MarketConfidenceView | null;
    health: MarketHealth | MarketHealthView | null;
    runSummaries: readonly QualificationRunSummary[];
    runDetails: readonly (QualificationRun | QualificationRunView)[];
    latestRun: QualificationRunDetailView | null;
  }>,
): QualificationTargetDetailView {
  const open = args.runDetails.find((run) => isOpenRunStatus(run.status)) ?? null;
  return Object.freeze({
    targetId: args.target.targetId,
    workspaceId: args.target.workspaceId,
    exchangeScopeId: args.target.exchangeScopeId,
    marketSymbol: args.target.marketSymbol,
    displayName: args.target.displayName ?? args.target.marketSymbol,
    current: toTargetListItemView({
      target: args.target,
      state: args.state,
      confidence: args.confidence,
      health: args.health,
      runs: args.runSummaries,
    }),
    lifecycle: toLifecycleView({
      targetId: args.target.targetId,
      workspaceId: args.target.workspaceId,
      state: args.state,
      openRunStatus: open?.status ?? null,
    }),
    confidence: toConfidenceView(args.confidence),
    health: toHealthView(args.health),
    runs: Object.freeze(
      [...args.runSummaries]
        .slice()
        .reverse()
        .map((run) => toRunListItemView({ run, target: args.target })),
    ),
    history: toHistoryView({
      state: args.state,
      confidence: args.confidence,
      health: args.health,
      runs: args.runDetails,
    }),
    latestRun: args.latestRun,
    ...QUALIFICATION_PRODUCT_FLAGS,
  });
}

export function toWorkspaceView(
  args: Readonly<{
    workspaceId: string;
    targets: readonly QualificationTargetListItemView[];
    recentRuns: readonly QualificationRunListItemView[];
  }>,
): QualificationWorkspaceView {
  return Object.freeze({
    workspaceId: args.workspaceId,
    targetCount: args.targets.length,
    qualifiedCount: args.targets.filter((item) => item.lifecycleState === 'qualified').length,
    qualifyingCount: args.targets.filter((item) => item.lifecycleState === 'qualifying').length,
    pendingConfirmCount: args.targets.filter((item) => item.lifecycleState === 'pending_confirm')
      .length,
    failedCount: args.targets.filter((item) => item.lifecycleState === 'failed').length,
    runCount: args.recentRuns.length,
    targets: Object.freeze([...args.targets]),
    recentRuns: Object.freeze(args.recentRuns.slice(0, 8)),
    ...QUALIFICATION_PRODUCT_FLAGS,
  });
}

export function toCommandView(
  args: Readonly<{
    result: QualificationRunResult;
    target: QualificationTargetDetailView | null;
    run: QualificationRunDetailView | null;
  }>,
): QualificationCommandView {
  return Object.freeze({
    outcome: args.result.outcome,
    qualificationRunId: args.result.qualificationRunId,
    rejectionReasons: Object.freeze([...(args.result.rejectionReasons ?? [])]),
    publishedProfileId:
      args.result.publishedProfileId ?? args.target?.lifecycle.latestProfileId ?? null,
    target: args.target,
    run: args.run,
    ...QUALIFICATION_PRODUCT_FLAGS,
  });
}

export function isOpenRunStatus(status: string): boolean {
  return (OPEN_RUN_STATUSES as readonly string[]).includes(status);
}
