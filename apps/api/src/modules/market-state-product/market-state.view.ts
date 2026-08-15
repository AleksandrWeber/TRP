/**
 * PC-10 — HTTP product views of existing Market State artifacts.
 *
 * Market State remains owner. Qualification unchanged. Profile unchanged.
 * Trading Orchestrator unchanged. Not a new SoT. Not classification. Not orchestration.
 */

import type { MarketState } from '../market-state/domain/market-state';
import type { MarketStateTransitionRecord } from '../market-state/domain/market-state-projection.store';
import type {
  ProfileLatestInput,
  QualificationSummaryInput,
} from '../market-state/domain/market-state-input-read-model';

export const MARKET_STATE_PRODUCT_FLAGS = Object.freeze({
  authorityClass: 'market_state_artifact' as const,
  forcesTrade: false as const,
  isQualification: false as const,
  isProfile: false as const,
  authorizesRuntime: false as const,
  classifiesMarket: false as const,
  selectsStrategy: false as const,
  orchestrates: false as const,
});

export function deriveMarketStateTargetId(
  workspaceId: string,
  exchangeScopeId: string,
  marketSymbol: string,
): string {
  return `mkt-state:${workspaceId}:${exchangeScopeId}:${marketSymbol}`;
}

export type MarketStateListItemView = Readonly<{
  marketStateId: string;
  workspaceId: string;
  targetId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  displayName: string;
  version: number;
  versionCount: number;
  lifecycleStatus: string;
  regimeLabel: string;
  publishedAt: string;
  publishedBy: string;
  isCurrent: boolean;
  isStale: boolean;
}> &
  typeof MARKET_STATE_PRODUCT_FLAGS;

export type MarketStateVersionListItemView = Readonly<{
  marketStateId: string;
  workspaceId: string;
  targetId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  version: number;
  lifecycleStatus: string;
  regimeLabel: string;
  publishedAt: string;
  publishedBy: string;
  isCurrent: boolean;
}> &
  typeof MARKET_STATE_PRODUCT_FLAGS;

export type MarketStateWorkspaceView = Readonly<{
  workspaceId: string;
  targetCount: number;
  versionCount: number;
  currentCount: number;
  current: readonly MarketStateListItemView[];
  recentVersions: readonly MarketStateVersionListItemView[];
}> &
  typeof MARKET_STATE_PRODUCT_FLAGS;

export type MarketStatePageView = Readonly<{
  items: readonly MarketStateListItemView[];
}> &
  typeof MARKET_STATE_PRODUCT_FLAGS;

export type MarketStateVersionPageView = Readonly<{
  items: readonly MarketStateVersionListItemView[];
}> &
  typeof MARKET_STATE_PRODUCT_FLAGS;

export type MarketStateLifecycleView = Readonly<{
  marketStateId: string;
  targetId: string;
  status: string;
  updatedAt: string;
  updatedBy: string;
  reason: string;
  isStale: boolean;
}> &
  typeof MARKET_STATE_PRODUCT_FLAGS;

export type MarketStateMetadataView = Readonly<{
  marketStateId: string;
  workspaceId: string;
  targetId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  version: number;
  observationAsOf: string;
  confidenceRef: string | null;
  profileRef: string | null;
  inputSummary: string;
  notes: string | null;
  publishedAt: string;
  publishedBy: string;
}> &
  typeof MARKET_STATE_PRODUCT_FLAGS;

export type MarketStateSnapshotView = Readonly<{
  regimeLabel: string;
  volatilityLabel: string | null;
  liquidityLabel: string | null;
  narrativeSummary: string;
}>;

export type MarketStateTransitionView = Readonly<{
  marketStateId: string;
  workspaceId: string;
  targetId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  fromVersion: number | null;
  toVersion: number;
  fromLifecycle: string | null;
  toLifecycle: string;
  transitionedAt: string;
}> &
  typeof MARKET_STATE_PRODUCT_FLAGS;

export type MarketStateTransitionPageView = Readonly<{
  items: readonly MarketStateTransitionView[];
}> &
  typeof MARKET_STATE_PRODUCT_FLAGS;

export type MarketStateQualificationReferenceView = Readonly<{
  present: boolean;
  qualificationTargetId: string | null;
  lifecycleState: string | null;
  confidenceLevel: string | null;
  healthStatus: string | null;
  latestRunStatus: string | null;
  sourceRunId: string | null;
  asOf: string | null;
}> &
  typeof MARKET_STATE_PRODUCT_FLAGS;

export type MarketStateProfileReferenceView = Readonly<{
  present: boolean;
  marketProfileId: string | null;
  profileTargetId: string | null;
  version: number | null;
  qualificationRunId: string | null;
  confidenceLevel: string | null;
  publishedAt: string | null;
}> &
  typeof MARKET_STATE_PRODUCT_FLAGS;

export type MarketStateDetailView = Readonly<{
  marketStateId: string;
  workspaceId: string;
  targetId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  displayName: string;
  version: number;
  isCurrent: boolean;
  currentVersion: number;
  lifecycle: MarketStateLifecycleView;
  snapshot: MarketStateSnapshotView;
  metadata: MarketStateMetadataView;
  qualification: MarketStateQualificationReferenceView;
  profile: MarketStateProfileReferenceView;
  versions: readonly MarketStateVersionListItemView[];
  transitions: readonly MarketStateTransitionView[];
}> &
  typeof MARKET_STATE_PRODUCT_FLAGS;

export type MarketStateTargetDetailView = Readonly<{
  targetId: string;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  displayName: string;
  currentVersion: number;
  current: MarketStateDetailView;
  versions: readonly MarketStateVersionListItemView[];
  transitions: readonly MarketStateTransitionView[];
}> &
  typeof MARKET_STATE_PRODUCT_FLAGS;

export type MarketStateRefreshView = Readonly<{
  outcome: 'accepted';
  marketStateId: string;
  version: number;
  current: MarketStateDetailView;
}> &
  typeof MARKET_STATE_PRODUCT_FLAGS;

export function toVersionListItemView(
  args: Readonly<{
    state: MarketState;
    currentVersion: number;
  }>,
): MarketStateVersionListItemView {
  return Object.freeze({
    marketStateId: args.state.marketStateId,
    workspaceId: args.state.workspaceId,
    targetId: deriveMarketStateTargetId(
      args.state.workspaceId,
      args.state.exchangeScopeId,
      args.state.marketSymbol,
    ),
    exchangeScopeId: args.state.exchangeScopeId,
    marketSymbol: args.state.marketSymbol,
    version: args.state.version.version,
    lifecycleStatus: args.state.lifecycle.status,
    regimeLabel: args.state.snapshot.regime,
    publishedAt: args.state.version.publishedAt,
    publishedBy: args.state.version.publishedBy,
    isCurrent: args.state.version.version === args.currentVersion,
    ...MARKET_STATE_PRODUCT_FLAGS,
  });
}

export function toListItemView(
  args: Readonly<{
    current: MarketState;
    versionCount: number;
  }>,
): MarketStateListItemView {
  return Object.freeze({
    marketStateId: args.current.marketStateId,
    workspaceId: args.current.workspaceId,
    targetId: deriveMarketStateTargetId(
      args.current.workspaceId,
      args.current.exchangeScopeId,
      args.current.marketSymbol,
    ),
    exchangeScopeId: args.current.exchangeScopeId,
    marketSymbol: args.current.marketSymbol,
    displayName: args.current.marketSymbol,
    version: args.current.version.version,
    versionCount: args.versionCount,
    lifecycleStatus: args.current.lifecycle.status,
    regimeLabel: args.current.snapshot.regime,
    publishedAt: args.current.version.publishedAt,
    publishedBy: args.current.version.publishedBy,
    isCurrent: true,
    isStale: isStaleLifecycle(args.current.lifecycle.status),
    ...MARKET_STATE_PRODUCT_FLAGS,
  });
}

export function toLifecycleView(state: MarketState): MarketStateLifecycleView {
  return Object.freeze({
    marketStateId: state.marketStateId,
    targetId: deriveMarketStateTargetId(
      state.workspaceId,
      state.exchangeScopeId,
      state.marketSymbol,
    ),
    status: state.lifecycle.status,
    updatedAt: state.lifecycle.updatedAt,
    updatedBy: state.lifecycle.updatedBy,
    reason: state.lifecycle.reason,
    isStale: isStaleLifecycle(state.lifecycle.status),
    ...MARKET_STATE_PRODUCT_FLAGS,
  });
}

export function toMetadataView(state: MarketState): MarketStateMetadataView {
  return Object.freeze({
    marketStateId: state.marketStateId,
    workspaceId: state.workspaceId,
    targetId: deriveMarketStateTargetId(
      state.workspaceId,
      state.exchangeScopeId,
      state.marketSymbol,
    ),
    exchangeScopeId: state.exchangeScopeId,
    marketSymbol: state.marketSymbol,
    version: state.version.version,
    observationAsOf: state.metadata.observationAsOf,
    confidenceRef: state.metadata.confidenceRef ?? null,
    profileRef: state.metadata.profileRef ?? null,
    inputSummary: state.metadata.inputSummary,
    notes: state.metadata.notes ?? null,
    publishedAt: state.version.publishedAt,
    publishedBy: state.version.publishedBy,
    ...MARKET_STATE_PRODUCT_FLAGS,
  });
}

export function toSnapshotView(state: MarketState): MarketStateSnapshotView {
  return Object.freeze({
    regimeLabel: state.snapshot.regime,
    volatilityLabel: state.snapshot.volatilityClass ?? null,
    liquidityLabel: state.snapshot.liquidityClass ?? null,
    narrativeSummary: state.snapshot.narrativeSummary,
  });
}

export function toTransitionView(row: MarketStateTransitionRecord): MarketStateTransitionView {
  return Object.freeze({
    marketStateId: row.marketStateId,
    workspaceId: row.workspaceId,
    targetId: deriveMarketStateTargetId(row.workspaceId, row.exchangeScopeId, row.marketSymbol),
    exchangeScopeId: row.exchangeScopeId,
    marketSymbol: row.marketSymbol,
    fromVersion: row.fromVersion,
    toVersion: row.toVersion,
    fromLifecycle: row.fromLifecycle ?? null,
    toLifecycle: row.toLifecycle,
    transitionedAt: row.transitionedAt,
    ...MARKET_STATE_PRODUCT_FLAGS,
  });
}

export function toQualificationReferenceView(
  summary: QualificationSummaryInput | null,
): MarketStateQualificationReferenceView {
  if (!summary) {
    return Object.freeze({
      present: false,
      qualificationTargetId: null,
      lifecycleState: null,
      confidenceLevel: null,
      healthStatus: null,
      latestRunStatus: null,
      sourceRunId: null,
      asOf: null,
      ...MARKET_STATE_PRODUCT_FLAGS,
    });
  }
  return Object.freeze({
    present: true,
    qualificationTargetId: summary.targetId,
    lifecycleState: summary.lifecycle?.state ?? null,
    confidenceLevel: summary.confidence?.level ?? null,
    healthStatus: summary.health?.status ?? null,
    latestRunStatus: summary.latestRunStatus ?? null,
    sourceRunId: summary.confidence?.sourceRunId ?? summary.health?.sourceRunId ?? null,
    asOf: summary.confidence?.asOf ?? summary.health?.asOf ?? summary.lifecycle?.updatedAt ?? null,
    ...MARKET_STATE_PRODUCT_FLAGS,
  });
}

export function toProfileReferenceView(
  latest: ProfileLatestInput | null,
): MarketStateProfileReferenceView {
  if (!latest) {
    return Object.freeze({
      present: false,
      marketProfileId: null,
      profileTargetId: null,
      version: null,
      qualificationRunId: null,
      confidenceLevel: null,
      publishedAt: null,
      ...MARKET_STATE_PRODUCT_FLAGS,
    });
  }
  return Object.freeze({
    present: true,
    marketProfileId: latest.marketProfileId,
    profileTargetId: latest.targetId,
    version: latest.version,
    qualificationRunId: latest.qualificationRunId,
    confidenceLevel: latest.confidenceLevel,
    publishedAt: latest.publishedAt,
    ...MARKET_STATE_PRODUCT_FLAGS,
  });
}

export function toDetailView(
  args: Readonly<{
    state: MarketState;
    currentVersion: number;
    versions: readonly MarketStateVersionListItemView[];
    transitions: readonly MarketStateTransitionView[];
    qualification: MarketStateQualificationReferenceView;
    profile: MarketStateProfileReferenceView;
  }>,
): MarketStateDetailView {
  return Object.freeze({
    marketStateId: args.state.marketStateId,
    workspaceId: args.state.workspaceId,
    targetId: deriveMarketStateTargetId(
      args.state.workspaceId,
      args.state.exchangeScopeId,
      args.state.marketSymbol,
    ),
    exchangeScopeId: args.state.exchangeScopeId,
    marketSymbol: args.state.marketSymbol,
    displayName: args.state.marketSymbol,
    version: args.state.version.version,
    isCurrent: args.state.version.version === args.currentVersion,
    currentVersion: args.currentVersion,
    lifecycle: toLifecycleView(args.state),
    snapshot: toSnapshotView(args.state),
    metadata: toMetadataView(args.state),
    qualification: args.qualification,
    profile: args.profile,
    versions: Object.freeze([...args.versions]),
    transitions: Object.freeze([...args.transitions]),
    ...MARKET_STATE_PRODUCT_FLAGS,
  });
}

export function toTargetDetailView(
  args: Readonly<{
    current: MarketStateDetailView;
    versions: readonly MarketStateVersionListItemView[];
    transitions: readonly MarketStateTransitionView[];
  }>,
): MarketStateTargetDetailView {
  return Object.freeze({
    targetId: args.current.targetId,
    workspaceId: args.current.workspaceId,
    exchangeScopeId: args.current.exchangeScopeId,
    marketSymbol: args.current.marketSymbol,
    displayName: args.current.displayName,
    currentVersion: args.current.currentVersion,
    current: args.current,
    versions: Object.freeze([...args.versions]),
    transitions: Object.freeze([...args.transitions]),
    ...MARKET_STATE_PRODUCT_FLAGS,
  });
}

export function toWorkspaceView(
  args: Readonly<{
    workspaceId: string;
    current: readonly MarketStateListItemView[];
    recentVersions: readonly MarketStateVersionListItemView[];
    versionCount: number;
  }>,
): MarketStateWorkspaceView {
  return Object.freeze({
    workspaceId: args.workspaceId,
    targetCount: args.current.length,
    versionCount: args.versionCount,
    currentCount: args.current.length,
    current: Object.freeze([...args.current]),
    recentVersions: Object.freeze(args.recentVersions.slice(0, 8)),
    ...MARKET_STATE_PRODUCT_FLAGS,
  });
}

export function toCurrentPageView(items: readonly MarketStateListItemView[]): MarketStatePageView {
  return Object.freeze({
    items: Object.freeze([...items]),
    ...MARKET_STATE_PRODUCT_FLAGS,
  });
}

export function toVersionPageView(
  items: readonly MarketStateVersionListItemView[],
): MarketStateVersionPageView {
  return Object.freeze({
    items: Object.freeze([...items]),
    ...MARKET_STATE_PRODUCT_FLAGS,
  });
}

export function toTransitionPageView(
  items: readonly MarketStateTransitionView[],
): MarketStateTransitionPageView {
  return Object.freeze({
    items: Object.freeze([...items]),
    ...MARKET_STATE_PRODUCT_FLAGS,
  });
}

export function toRefreshView(current: MarketStateDetailView): MarketStateRefreshView {
  return Object.freeze({
    outcome: 'accepted' as const,
    marketStateId: current.marketStateId,
    version: current.version,
    current,
    ...MARKET_STATE_PRODUCT_FLAGS,
  });
}

function isStaleLifecycle(status: string): boolean {
  return status === 'archived' || status === 'superseded';
}
