/**
 * W3-O01-d — Operational readiness evaluation (pure).
 *
 * Platform readiness is derived only from owner readiness.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 */

import {
  W3_O01_C_RECOVERY_DEPENDENCIES,
  W3_O01_C_RECOVERY_ORDER,
  type W3O01CRecoveryOwner,
} from '../../persistence/analytical-restart-recovery';
import type { AnalyticalOwnerBootOutcome } from '../../persistence/analytical-owner-continuity-status';

export const OPERATIONAL_STATES = Object.freeze([
  'Recovering',
  'Ready',
  'Degraded',
  'Unavailable',
] as const);

export type OperationalState = (typeof OPERATIONAL_STATES)[number];

export function assertOperationalState(value: string): asserts value is OperationalState {
  if (!(OPERATIONAL_STATES as readonly string[]).includes(value)) {
    throw new Error(`Operational Continuity rejects unsupported state: ${value}`);
  }
}

export type OwnerOperationalView = Readonly<{
  owner: W3O01CRecoveryOwner;
  state: OperationalState;
  recoveryRequired: true;
  dependencyOwners: readonly W3O01CRecoveryOwner[];
  reason?: string;
}>;

/** W3-O02-d — Notification Durable Queue continuity fields on platform readiness. */
export type NotificationQueueContinuityView = Readonly<{
  operationalState: OperationalState;
  ownerReadiness: AnalyticalOwnerBootOutcome;
  recoveryTimestamp: string | null;
  recoveryDurationMs: number | null;
  reason?: string;
  openCount: number;
  abandonedCount: number;
  channelUnavailable: boolean;
  integrityVerified: boolean;
  workspaceIds: readonly string[];
}>;

export type PlatformOperationalProjection = Readonly<{
  platformState: OperationalState;
  ownerStates: readonly OwnerOperationalView[];
  unavailableOwners: readonly W3O01CRecoveryOwner[];
  degradedOwners: readonly W3O01CRecoveryOwner[];
  recoveryTimestamp: string | null;
  recoveryDurationMs: number | null;
  /** W3-O02-d — Notification Durable Queue operational continuity (derived). */
  notificationQueue: NotificationQueueContinuityView | null;
}>;

export type EvaluateOwnerReadinessInput = Readonly<{
  /** Raw boot outcomes from hydrate / memory driver. Missing → treated as Ready after recovery window. */
  bootByOwner: ReadonlyMap<W3O01CRecoveryOwner, AnalyticalOwnerBootOutcome>;
  bootReasons?: ReadonlyMap<W3O01CRecoveryOwner, string | undefined>;
  /** When true, every owner is still Recovering (recovery not finalized). */
  recovering: boolean;
}>;

/**
 * Evaluate each durable analytical owner, then apply dependency degradation.
 * Unavailable owners never become Ready via dependency rules.
 * Dependency Unavailable → dependent Degraded (if own boot was Ready).
 */
export function evaluateOwnerOperationalStates(
  input: EvaluateOwnerReadinessInput,
): readonly OwnerOperationalView[] {
  if (input.recovering) {
    return Object.freeze(
      W3_O01_C_RECOVERY_ORDER.map((owner) =>
        Object.freeze({
          owner,
          state: 'Recovering' as const,
          recoveryRequired: true as const,
          dependencyOwners: W3_O01_C_RECOVERY_DEPENDENCIES[owner],
          reason: input.bootReasons?.get(owner),
        }),
      ),
    );
  }

  const base = new Map<W3O01CRecoveryOwner, OperationalState>();
  for (const owner of W3_O01_C_RECOVERY_ORDER) {
    const boot = input.bootByOwner.get(owner) ?? 'ready';
    base.set(owner, boot === 'unavailable' ? 'Unavailable' : 'Ready');
  }

  const views: OwnerOperationalView[] = [];
  for (const owner of W3_O01_C_RECOVERY_ORDER) {
    let state = base.get(owner)!;
    const deps = W3_O01_C_RECOVERY_DEPENDENCIES[owner];
    if (state === 'Ready') {
      const depUnavailable = deps.some((dep) => base.get(dep) === 'Unavailable');
      if (depUnavailable) {
        state = 'Degraded';
      }
    }
    assertOperationalState(state);
    views.push(
      Object.freeze({
        owner,
        state,
        recoveryRequired: true,
        dependencyOwners: deps,
        reason: input.bootReasons?.get(owner),
      }),
    );
  }
  return Object.freeze(views);
}

/** Derive platform state solely from owner states. No hardcoded global. */
export function derivePlatformOperationalState(
  owners: readonly OwnerOperationalView[],
): OperationalState {
  if (owners.length === 0) {
    return 'Ready';
  }
  if (owners.some((o) => o.state === 'Recovering')) {
    return 'Recovering';
  }
  const allUnavailable = owners.every((o) => o.state === 'Unavailable');
  if (allUnavailable) {
    return 'Unavailable';
  }
  if (owners.some((o) => o.state === 'Unavailable' || o.state === 'Degraded')) {
    return 'Degraded';
  }
  return 'Ready';
}

export function buildPlatformOperationalProjection(input: {
  owners: readonly OwnerOperationalView[];
  recoveryTimestamp: string | null;
  recoveryDurationMs: number | null;
  notificationQueue?: NotificationQueueContinuityView | null;
}): PlatformOperationalProjection {
  const platformState = derivePlatformOperationalState(input.owners);
  assertOperationalState(platformState);
  return Object.freeze({
    platformState,
    ownerStates: input.owners,
    unavailableOwners: Object.freeze(
      input.owners.filter((o) => o.state === 'Unavailable').map((o) => o.owner),
    ),
    degradedOwners: Object.freeze(
      input.owners.filter((o) => o.state === 'Degraded').map((o) => o.owner),
    ),
    recoveryTimestamp: input.recoveryTimestamp,
    recoveryDurationMs: input.recoveryDurationMs,
    notificationQueue: input.notificationQueue ?? null,
  });
}

/**
 * Graceful degradation check: independent Ready owners remain Ready when another is Unavailable.
 */
export function healthyOwnersContinueWhileOthersUnavailable(
  owners: readonly OwnerOperationalView[],
): boolean {
  const unavailable = owners.filter((o) => o.state === 'Unavailable');
  if (unavailable.length === 0) return true;
  const independentReady = owners.filter(
    (o) =>
      o.state === 'Ready' &&
      !o.dependencyOwners.some((dep) => unavailable.some((u) => u.owner === dep)),
  );
  return independentReady.length > 0 || owners.every((o) => o.state === 'Unavailable');
}
