/**
 * RC-25 Epic 3 — QualificationState (lifecycle state for a target).
 *
 * Domain Model Contract §6.
 * Structure + transition invariant helpers only — no evaluation behaviour.
 */

import {
  MARKET_QUALIFICATION_DOMAIN_AUTHORITY_CLASS,
  assertIsoTimestamp,
  assertNonEmptyString,
  assertQualificationStateTransition,
  canTransitionQualificationState,
  deepFreeze,
  isQualificationLifecycleState,
  type QualificationLifecycleState,
} from './market-qualification-domain-shared';

export type QualificationState = Readonly<{
  targetId: string;
  workspaceId: string;
  state: QualificationLifecycleState;
  activeRunId?: string;
  latestCompletedRunId?: string;
  latestProfileId?: string;
  updatedAt: string;
  authorityClass: typeof MARKET_QUALIFICATION_DOMAIN_AUTHORITY_CLASS;
}>;

export type CreateQualificationStateInput = Readonly<{
  targetId: string;
  workspaceId: string;
  state: string;
  activeRunId?: string;
  latestCompletedRunId?: string;
  latestProfileId?: string;
  updatedAt: string;
}>;

/**
 * Create an immutable QualificationState snapshot.
 * Does not start Sessions, approve risk, or select strategies.
 */
export function createQualificationState(input: CreateQualificationStateInput): QualificationState {
  const targetId = assertNonEmptyString(input.targetId, 'targetId');
  const workspaceId = assertNonEmptyString(input.workspaceId, 'workspaceId');
  const updatedAt = assertIsoTimestamp(input.updatedAt, 'updatedAt');

  const stateRaw = assertNonEmptyString(input.state, 'state');
  if (!isQualificationLifecycleState(stateRaw)) {
    throw new Error(`state must be a known QualificationLifecycleState`);
  }

  if (stateRaw === 'qualifying' && !input.activeRunId?.trim()) {
    throw new Error('qualifying state requires activeRunId');
  }

  const activeRunId =
    input.activeRunId !== undefined && input.activeRunId.trim() !== ''
      ? input.activeRunId.trim()
      : undefined;
  const latestCompletedRunId =
    input.latestCompletedRunId !== undefined && input.latestCompletedRunId.trim() !== ''
      ? input.latestCompletedRunId.trim()
      : undefined;
  const latestProfileId =
    input.latestProfileId !== undefined && input.latestProfileId.trim() !== ''
      ? input.latestProfileId.trim()
      : undefined;

  return deepFreeze({
    targetId,
    workspaceId,
    state: stateRaw,
    ...(activeRunId !== undefined ? { activeRunId } : {}),
    ...(latestCompletedRunId !== undefined ? { latestCompletedRunId } : {}),
    ...(latestProfileId !== undefined ? { latestProfileId } : {}),
    updatedAt,
    authorityClass: MARKET_QUALIFICATION_DOMAIN_AUTHORITY_CLASS,
  });
}

/**
 * Produce a new immutable QualificationState after a validated transition.
 * Does not evaluate markets — only enforces allowed lifecycle edges.
 */
export function transitionQualificationState(
  current: QualificationState,
  to: QualificationLifecycleState,
  updatedAt: string,
  patch?: Readonly<{
    activeRunId?: string | null;
    latestCompletedRunId?: string | null;
    latestProfileId?: string | null;
  }>,
): QualificationState {
  assertQualificationStateTransition(current.state, to);
  const nextUpdatedAt = assertIsoTimestamp(updatedAt, 'updatedAt');

  const activeRunId =
    patch?.activeRunId === null
      ? undefined
      : patch?.activeRunId !== undefined
        ? patch.activeRunId
        : to === 'qualifying'
          ? current.activeRunId
          : undefined;

  return createQualificationState({
    targetId: current.targetId,
    workspaceId: current.workspaceId,
    state: to,
    activeRunId,
    latestCompletedRunId:
      patch?.latestCompletedRunId === null
        ? undefined
        : (patch?.latestCompletedRunId ?? current.latestCompletedRunId),
    latestProfileId:
      patch?.latestProfileId === null
        ? undefined
        : (patch?.latestProfileId ?? current.latestProfileId),
    updatedAt: nextUpdatedAt,
  });
}

export { canTransitionQualificationState, assertQualificationStateTransition };
