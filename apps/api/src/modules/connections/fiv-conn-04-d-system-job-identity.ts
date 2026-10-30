/**
 * FIV-CONN-04-D / P-D-02 — Canonical SYSTEM_JOB identity mirror (Connections-owned).
 *
 * Product Owner ratification is the policy SoT. This module is a code mirror only.
 * Do NOT read actor identity from env, DB, request, job payload, or user input.
 * Not a Nest provider. Not a general run-as / SYSTEM_JOB factory.
 */

import { isPrivilegedActorContext, type PrivilegedActorContext } from './migration-gate';

/** Exact ratified actorId — character-for-character (D-CONN04-PD02-SJ). */
export const FIV_CONN_04_D_SYSTEM_JOB_ACTOR_ID =
  'system-job:fiv-conn-04-migration-backfill' as const;

/** Exact ratified actorKind. */
export const FIV_CONN_04_D_SYSTEM_JOB_ACTOR_KIND = 'SYSTEM_JOB' as const;

export class FivConn04DSystemJobIdentityError extends Error {
  readonly code = 'FIV_CONN_04_D_SYSTEM_JOB_IDENTITY_INVALID' as const;

  constructor(message: string) {
    super(message);
    this.name = 'FivConn04DSystemJobIdentityError';
  }
}

/**
 * Fail-closed validation of a privileged context against the ratified identity.
 * Rejects blank, mismatched, or alternate actor sources.
 */
export function assertCanonicalFivConn04DSystemJobActor(
  actor: unknown,
): asserts actor is PrivilegedActorContext {
  if (!isPrivilegedActorContext(actor)) {
    throw new FivConn04DSystemJobIdentityError('Privileged actor context failed shape validation');
  }
  if (actor.actorId !== FIV_CONN_04_D_SYSTEM_JOB_ACTOR_ID) {
    throw new FivConn04DSystemJobIdentityError(
      'actorId does not match ratified FIV-CONN-04-D SYSTEM_JOB identity',
    );
  }
  if (actor.actorKind !== FIV_CONN_04_D_SYSTEM_JOB_ACTOR_KIND) {
    throw new FivConn04DSystemJobIdentityError('actorKind does not match ratified SYSTEM_JOB');
  }
  if (actor.actorId.trim() === '' || actor.actorId.trim() !== actor.actorId) {
    throw new FivConn04DSystemJobIdentityError('actorId must be exact non-blank ratified literal');
  }
}

export type BuildFivConn04DSystemJobActorInput = Readonly<{
  /** Optional correlation metadata only — never actorId / actorKind. */
  correlationId?: string;
}>;

/**
 * Capability-specific factory. Constructs only the ratified SYSTEM_JOB identity.
 * Does not accept actorId, actorKind, or raw PrivilegedActorContext.
 */
export function buildFivConn04DSystemJobActor(
  input?: BuildFivConn04DSystemJobActorInput,
): PrivilegedActorContext {
  const correlationId = input?.correlationId;
  if (correlationId !== undefined && typeof correlationId !== 'string') {
    throw new FivConn04DSystemJobIdentityError('correlationId must be a string when provided');
  }
  if (typeof correlationId === 'string' && correlationId.trim() === '') {
    throw new FivConn04DSystemJobIdentityError('correlationId must not be blank when provided');
  }

  const actor: PrivilegedActorContext = Object.freeze({
    actorId: FIV_CONN_04_D_SYSTEM_JOB_ACTOR_ID,
    actorKind: FIV_CONN_04_D_SYSTEM_JOB_ACTOR_KIND,
    ...(correlationId !== undefined ? { correlationId } : {}),
  });

  assertCanonicalFivConn04DSystemJobActor(actor);
  return actor;
}
