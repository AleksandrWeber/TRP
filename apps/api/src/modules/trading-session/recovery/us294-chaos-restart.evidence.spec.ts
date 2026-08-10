/**
 * US294 — Chaos / Restart Evidence suite (mandatory matrix M-01…M-12).
 *
 * Evidence-only: exercises existing Recovery / Session / Outbox / fencing
 * authorities under simulated process death. Does not redesign Recovery,
 * Runtime, RecoveryState, Incident, or Session lifecycle.
 *
 * Process boundary (NFR-2 / Story §10.2): durable Maps survive "SIGKILL";
 * volatile in-process caches are discarded — equivalent durable-store restart.
 *
 * Evidence Package: docs/project/rc-18-us294-chaos-restart-evidence.md
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  advanceDurableRecoveryPhase,
  openDurableRecoveryState,
  RecoveryPhase,
  withRecoveryFencingToken,
  type DurableRecoveryState,
} from '../domain/durable-recovery-state';
import {
  decideForceConfirmRecovering,
  type DiscoveryResumeIntent,
} from '../domain/force-confirm-recovering';
import { evaluateExecutionEligibility } from '../domain/execution-eligibility';
import { isRecoveryEligibleStatus } from '../domain/recovery-eligibility';
import {
  attachRecoveryLease,
  decideRecoveryLeaseAcquisition,
} from '../domain/recovery-lease-acquisition';
import { createRecoveryIncident } from '../domain/recovery-incident';
import type {
  LeasedRecoverySession,
  ValidatedRecoveryCheckpoint,
} from '../domain/recovery-checkpoint-validation';
import { reconcileRecoveryState } from '../domain/recovery-state-reconciliation';
import { discoverStartupRecoveryCandidate } from '../domain/startup-recovery-discovery';
import {
  assertLeaseCurrent,
  createTradingSession,
  transitionSession,
  type TradingSession,
} from '../domain/trading-session';
import { TradingSessionStatus } from '../domain/trading-session-status';
import type {
  RecoveryOrderSnapshot,
  RecoveryExecutionSnapshot,
} from '../ports/recovery-reconciliation.ports';
import { InMemoryOutboxRepository } from '../../event-processing/repositories/in-memory-outbox.repository';
import { OutboxDispatcher } from '../../event-processing/outbox-dispatcher.service';
import { InMemoryInboxRepository } from '../../event-processing/repositories/in-memory-inbox.repository';
import { InMemoryConsumerCheckpointRepository } from '../../event-processing/repositories/in-memory-consumer-checkpoint.repository';
import { IdempotentConsumerProcessor } from '../../event-processing/idempotent-consumer.processor';
import type { DurableEventEnvelope } from '../../event-processing/domain/durable-event-envelope';
import type { ConsumerProjectionHandler } from '../../event-processing/domain/consumer-apply-result';
import { OutboxStatus } from '../../event-processing/domain/outbox-status';
import { toDurableEventId } from '../../event-processing/domain/durable-event-id';

const T0 = '2026-08-01T14:00:00.000Z';
const T1 = '2026-08-01T14:00:10.000Z';
const T2 = '2026-08-01T14:00:20.000Z';
const T3 = '2026-08-01T14:00:30.000Z';
const T4 = '2026-08-01T14:00:40.000Z';

/**
 * Durable authority that survives simulated process death.
 * Volatile caches (stage lastResult, in-memory fences held only in worker) do not.
 */
class DurableRecoveryStore {
  sessions = new Map<string, TradingSession>();
  recoveryStates = new Map<string, DurableRecoveryState>();
  incidents = new Map<string, ReturnType<typeof createRecoveryIncident>>();
  outbox = new InMemoryOutboxRepository();
  /** Counts business effects keyed by eventId — must not grow on redelivery. */
  appliedEffects = new Map<string, number>();
  /** Volatile — cleared on SIGKILL simulation. */
  volatileStageCache = new Map<string, string>();
  dbAvailable = true;

  sigkill(): void {
    this.volatileStageCache.clear();
  }

  saveSession(session: TradingSession): TradingSession {
    if (!this.dbAvailable) throw new Error('database_unavailable');
    this.sessions.set(session.id, session);
    return session;
  }

  saveRecoveryState(state: DurableRecoveryState): DurableRecoveryState {
    if (!this.dbAvailable) throw new Error('database_unavailable');
    this.recoveryStates.set(state.sessionId, state);
    return state;
  }

  saveIncident(incident: ReturnType<typeof createRecoveryIncident>): void {
    if (!this.dbAvailable) throw new Error('database_unavailable');
    this.incidents.set(incident.incidentId, incident);
  }
}

function runningSession(id = 'session-1'): TradingSession {
  const created = createTradingSession({
    id,
    workspaceId: 'ws-1',
    paperAccountId: 'account-1',
    deploymentId: 'deployment-1',
    origin: 'strategy',
    actorId: 'actor-1',
    idempotencyKey: `idem-${id}`,
    createdAt: T0,
    recordedAt: T0,
  });
  return transitionSession(
    transitionSession(created, TradingSessionStatus.STARTING, T0),
    TradingSessionStatus.RUNNING,
    T0,
  );
}

function discoveryFor(session: TradingSession) {
  return discoverStartupRecoveryCandidate([session]);
}

function forceRecovering(store: DurableRecoveryStore, session: TradingSession, at: string) {
  const discovery = discoveryFor(session);
  const open = decideForceConfirmRecovering({
    discovery,
    session,
    recordedAt: at,
    priorOpen: null,
  });
  expect(open.action === 'forced' || open.action === 'confirmed').toBe(true);
  expect(open.evaluationAdmitted).toBe(false);
  expect(open.signalIntentEmitted).toBe(false);
  const next = open.nextSession ?? session;
  store.saveSession(next);
  return { discovery, open, session: next };
}

function openRecoveryState(
  store: DurableRecoveryStore,
  session: TradingSession,
  at: string,
  opts?: {
    preRecoveryStatus?: TradingSessionStatus;
    resumeIntent?: DiscoveryResumeIntent;
  },
) {
  const prior = store.recoveryStates.get(session.id) ?? null;
  const result = openDurableRecoveryState({
    sessionId: session.id,
    workspaceId: session.workspaceId,
    sessionStatus: session.status,
    preRecoveryStatus: opts?.preRecoveryStatus ?? TradingSessionStatus.RUNNING,
    resumeIntent: opts?.resumeIntent ?? TradingSessionStatus.RUNNING,
    recordedAt: at,
    prior,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.reason);
  store.saveRecoveryState(result.state);
  return result.state;
}

function acquireLease(
  store: DurableRecoveryStore,
  session: TradingSession,
  ownerId: string,
  at: string,
) {
  const candidate = discoveryFor(session).candidate!;
  const decision = decideRecoveryLeaseAcquisition(session, {
    candidate,
    ownerId,
    nowIso: at,
    recordedAt: at,
    leaseTtlMs: 300_000,
  });
  expect(decision.outcome).toBe('LEASE_ACQUIRED');
  if (decision.outcome !== 'LEASE_ACQUIRED') throw new Error(decision.reason);
  const next = attachRecoveryLease(session, decision.lease, at);
  store.saveSession(next);
  let state = store.recoveryStates.get(session.id);
  if (state) {
    state = withRecoveryFencingToken(state, decision.lease.fencingToken, at);
    store.saveRecoveryState(state);
  }
  return { session: next, lease: decision.lease, fencingToken: decision.lease.fencingToken };
}

function advancePhase(
  store: DurableRecoveryStore,
  session: TradingSession,
  to: RecoveryPhase,
  at: string,
  fencingToken?: number,
) {
  const state = store.recoveryStates.get(session.id)!;
  const advanced = advanceDurableRecoveryPhase({
    state,
    sessionStatus: session.status,
    to,
    recordedAt: at,
    fencingToken: fencingToken ?? state.fencingToken ?? undefined,
    lastSemanticEventId: to === RecoveryPhase.READY ? 'evt-10' : undefined,
  });
  expect(advanced.ok).toBe(true);
  if (!advanced.ok) throw new Error(advanced.reason);
  store.saveRecoveryState(advanced.state);
  return advanced.state;
}

describe('US294 — Chaos / Restart Evidence (M-01…M-12)', () => {
  let store: DurableRecoveryStore;

  beforeEach(() => {
    store = new DurableRecoveryStore();
  });

  it('M-01 Crash after Discovery — rediscover eligible; no evaluation from discovery alone', () => {
    const session = runningSession();
    store.saveSession(session);
    const discovery = discoveryFor(session);
    expect(discovery.outcome).toBe('recovery_candidate');
    expect(discovery.recoveringOpen).toBeNull();
    store.volatileStageCache.set('lastResult', 'DISCOVERED');

    // Crash before Recovery Open
    store.sigkill();
    expect(store.volatileStageCache.size).toBe(0);

    const after = store.sessions.get(session.id)!;
    const rediscovery = discoveryFor(after);
    expect(rediscovery.outcome).toBe('recovery_candidate');
    expect(rediscovery.candidate!.sessionId).toBe(session.id);
    expect(isRecoveryEligibleStatus(after.status)).toBe(true);
    // Discovery alone does not admit evaluation / Intent
    expect(rediscovery.recoveringOpen).toBeNull();
  });

  it('M-02 Crash after Recovery Open — RECOVERING + intent survive; no Intent on re-entry', () => {
    let session = runningSession();
    store.saveSession(session);
    const { open, session: recovering } = forceRecovering(store, session, T0);
    session = recovering;
    expect(session.status).toBe(TradingSessionStatus.RECOVERING);
    expect(open.resumeIntent).toBe(TradingSessionStatus.RUNNING);
    const state = openRecoveryState(store, session, T0, {
      preRecoveryStatus: open.preRecoveryStatus!,
      resumeIntent: open.resumeIntent!,
    });
    expect(state.phase).toBe(RecoveryPhase.RECOVERING);
    store.volatileStageCache.set('phase', 'OPEN');

    store.sigkill();

    const durableSession = store.sessions.get(session.id)!;
    const durableState = store.recoveryStates.get(session.id)!;
    expect(durableSession.status).toBe(TradingSessionStatus.RECOVERING);
    expect(durableState.resumeIntent).toBe(TradingSessionStatus.RUNNING);
    expect(durableState.preRecoveryStatus).toBe(TradingSessionStatus.RUNNING);

    const reOpen = decideForceConfirmRecovering({
      discovery: discoveryFor(durableSession),
      session: durableSession,
      recordedAt: T1,
      priorOpen: open,
    });
    expect(reOpen.action).toBe('confirmed');
    expect(reOpen.evaluationAdmitted).toBe(false);
    expect(reOpen.signalIntentEmitted).toBe(false);

    const reentryState = openRecoveryState(store, durableSession, T1, {
      preRecoveryStatus: TradingSessionStatus.PAUSED,
      resumeIntent: TradingSessionStatus.PAUSED,
    });
    expect(reentryState.resumeIntent).toBe(TradingSessionStatus.RUNNING);
    expect(reentryState.phase).toBe(RecoveryPhase.RECOVERING);
  });

  it('M-03 Crash after Lease — re-lease new generation; stale fence rejected', () => {
    let session = runningSession();
    store.saveSession(session);
    const { open, session: recovering } = forceRecovering(store, session, T0);
    session = recovering;
    openRecoveryState(store, session, T0, {
      preRecoveryStatus: open.preRecoveryStatus!,
      resumeIntent: open.resumeIntent!,
    });
    const first = acquireLease(store, session, 'runtime-a', T1);
    const staleToken = first.fencingToken;
    expect(staleToken).toBe(1);
    store.volatileStageCache.set('fence', String(staleToken));

    store.sigkill();

    // Re-entry while phase still RECOVERING (lease open): confirm path preserves
    // RecoveryState row; Session lease may still hold stale generation until expiry.
    session = store.sessions.get(session.id)!;
    const reentry = openRecoveryState(store, session, T2);
    expect(reentry.phase).toBe(RecoveryPhase.RECOVERING);
    expect(reentry.resumeIntent).toBe(open.resumeIntent);

    // Expire prior lease so new owner can acquire a new fencing generation
    const expired = Object.freeze({
      ...session,
      lease: session.lease ? Object.freeze({ ...session.lease, expiresAt: T1 }) : null,
    });
    store.saveSession(expired);

    const second = acquireLease(store, expired, 'runtime-b', T2);
    expect(second.fencingToken).toBeGreaterThan(staleToken);
    expect(store.recoveryStates.get(session.id)!.fencingToken).toBe(second.fencingToken);

    // Stale fence cannot authorize execution / lease asserts
    const withNewLease = store.sessions.get(session.id)!;
    expect(() => assertLeaseCurrent(withNewLease, staleToken, T2)).toThrow(/stale fencing token/);
    const runningWithLease = Object.freeze({
      ...withNewLease,
      status: TradingSessionStatus.RUNNING,
    });
    const eligibility = evaluateExecutionEligibility(runningWithLease, staleToken, T2);
    expect(eligibility.eligible).toBe(false);
  });

  it('M-04 Crash after Checkpoint — durable progress retained; cannot skip to READY', () => {
    let session = runningSession();
    store.saveSession(session);
    const { open, session: recovering } = forceRecovering(store, session, T0);
    session = recovering;
    openRecoveryState(store, session, T0, {
      preRecoveryStatus: open.preRecoveryStatus!,
      resumeIntent: open.resumeIntent!,
    });
    const leased = acquireLease(store, session, 'runtime-a', T1);
    session = leased.session;
    advancePhase(store, session, RecoveryPhase.VALIDATING, T1, leased.fencingToken);
    store.volatileStageCache.set('checkpoint', 'VALIDATING');

    store.sigkill();

    const prior = store.recoveryStates.get(session.id)!;
    expect(prior.lastAttemptedPhase).toBe(RecoveryPhase.VALIDATING);

    session = store.sessions.get(session.id)!;
    const reentry = openRecoveryState(store, session, T2);
    expect(reentry.phase).toBe(RecoveryPhase.RECOVERING);
    expect(reentry.resumeIntent).toBe(open.resumeIntent);
    // Must not skip validate/reconcile
    const skip = advanceDurableRecoveryPhase({
      state: reentry,
      sessionStatus: TradingSessionStatus.RECOVERING,
      to: RecoveryPhase.READY,
      recordedAt: T2,
    });
    expect(skip.ok).toBe(false);
  });

  it('M-05 Crash during Reconciliation — re-entry; mismatch fails closed (no silent RECONCILED)', () => {
    let session = runningSession();
    store.saveSession(session);
    const { open, session: recovering } = forceRecovering(store, session, T0);
    session = recovering;
    openRecoveryState(store, session, T0, {
      preRecoveryStatus: open.preRecoveryStatus!,
      resumeIntent: open.resumeIntent!,
    });
    const leased = acquireLease(store, session, 'runtime-a', T1);
    session = leased.session;
    advancePhase(store, session, RecoveryPhase.VALIDATING, T1, leased.fencingToken);
    advancePhase(store, session, RecoveryPhase.RECONCILING, T2, leased.fencingToken);
    store.volatileStageCache.set('reconcile', 'IN_PROGRESS');

    store.sigkill();

    session = store.sessions.get(session.id)!;
    const reentry = openRecoveryState(store, session, T3);
    expect(reentry.phase).toBe(RecoveryPhase.RECOVERING);

    // Partial/mismatched foreign views must not silent-green
    const leasedView: LeasedRecoverySession = Object.freeze({
      sessionId: session.id,
      workspaceId: session.workspaceId,
      deploymentId: session.deploymentId,
      ownerId: 'runtime-a',
      fencingToken: leased.fencingToken,
    });
    const checkpoint: ValidatedRecoveryCheckpoint = Object.freeze({
      checkpointId: 'scp-1',
      sessionId: session.id,
      workspaceId: session.workspaceId,
      deploymentId: session.deploymentId,
      lastProcessedEventId: 'evt-10',
      runtimeVersion: '1',
      version: 2,
      updatedAt: T2,
      streamId: 'stream-1',
      sequence: 10,
    });
    const order: RecoveryOrderSnapshot = Object.freeze({
      orderId: 'ord-1',
      status: 'submitted',
      tradingSessionId: session.id,
      paperAccountId: session.paperAccountId,
      openOrUncertain: true,
    });
    const exec: RecoveryExecutionSnapshot = Object.freeze({
      orderId: 'ord-1',
      status: 'unknown',
      terminal: false,
      fillCount: 0,
      reconciliationRequired: true,
    });
    const failed = reconcileRecoveryState({
      leased: leasedView,
      checkpoint,
      session: {
        sessionId: session.id,
        workspaceId: session.workspaceId,
        deploymentId: session.deploymentId,
        paperAccountId: session.paperAccountId,
        status: TradingSessionStatus.RECOVERING,
        fencingToken: leased.fencingToken,
      },
      runtime: {
        checkpointEventId: 'evt-10',
        checkpointStreamId: 'stream-1',
        checkpointSequence: 10,
        deploymentId: session.deploymentId,
        intents: [],
      },
      orders: [order],
      execution: [exec],
      accounting: {
        status: 'mismatch',
        sourceHash: 'a',
        rebuiltHash: 'b',
        reason: 'projection_drift',
      },
      risk: null,
    });
    expect(failed.outcome).toBe('RECONCILIATION_FAILED');

    // Fail-closed commit (US293 path) after ambiguity — legal from RECOVERING
    const incident = createRecoveryIncident({
      workspaceId: session.workspaceId,
      sessionId: session.id,
      recoveryId: reentry.recoveryId,
      recoveryAttempt: reentry.recoveryAttempt,
      reasonClass: 'reconciliation_ambiguity',
      failureReason: failed.reason,
      createdAt: T3,
    });
    store.saveIncident(incident);
    const failedPhase = advanceDurableRecoveryPhase({
      state: reentry,
      sessionStatus: TradingSessionStatus.RECOVERING,
      to: RecoveryPhase.FAILED,
      recordedAt: T3,
      failureReason: failed.reason,
      incidentId: incident.incidentId,
    });
    expect(failedPhase.ok).toBe(true);
    if (!failedPhase.ok) return;
    store.saveRecoveryState(failedPhase.state);
    expect(failedPhase.state.phase).toBe(RecoveryPhase.FAILED);
    expect(failedPhase.state.incidentId).toBe(incident.incidentId);
  });

  it('M-06 Crash before Resume — no premature evaluation; caches non-authoritative', () => {
    let session = runningSession();
    store.saveSession(session);
    const { open, session: recovering } = forceRecovering(store, session, T0);
    session = recovering;
    openRecoveryState(store, session, T0, {
      preRecoveryStatus: open.preRecoveryStatus!,
      resumeIntent: open.resumeIntent!,
    });
    const leased = acquireLease(store, session, 'runtime-a', T1);
    session = leased.session;
    advancePhase(store, session, RecoveryPhase.VALIDATING, T1, leased.fencingToken);
    advancePhase(store, session, RecoveryPhase.RECONCILING, T2, leased.fencingToken);
    // Reconcile OK recorded only in volatile cache — not yet READY
    store.volatileStageCache.set('reconcile', 'RECONCILED');
    store.volatileStageCache.set('admitEvaluation', 'true');

    store.sigkill();
    expect(store.volatileStageCache.get('admitEvaluation')).toBeUndefined();

    const state = store.recoveryStates.get(session.id)!;
    expect(state.phase).toBe(RecoveryPhase.RECONCILING);
    expect(session.status).toBe(TradingSessionStatus.RECOVERING);
    // No SignalIntent / evaluation while RECOVERING
    const eligibility = evaluateExecutionEligibility(session, leased.fencingToken, T3);
    expect(eligibility.eligible).toBe(false);
  });

  it('M-07 Crash after READY — re-entry safe; no skip of exit gates; no execution while RECOVERING', () => {
    let session = runningSession();
    store.saveSession(session);
    const { open, session: recovering } = forceRecovering(store, session, T0);
    session = recovering;
    openRecoveryState(store, session, T0, {
      preRecoveryStatus: open.preRecoveryStatus!,
      resumeIntent: open.resumeIntent!,
    });
    const leased = acquireLease(store, session, 'runtime-a', T1);
    session = leased.session;
    advancePhase(store, session, RecoveryPhase.VALIDATING, T1, leased.fencingToken);
    advancePhase(store, session, RecoveryPhase.RECONCILING, T2, leased.fencingToken);
    advancePhase(store, session, RecoveryPhase.READY, T3, leased.fencingToken);
    expect(store.recoveryStates.get(session.id)!.phase).toBe(RecoveryPhase.READY);
    store.volatileStageCache.set('ready', 'true');

    store.sigkill();

    session = store.sessions.get(session.id)!;
    expect(session.status).toBe(TradingSessionStatus.RECOVERING);
    const eligibility = evaluateExecutionEligibility(session, leased.fencingToken, T4);
    expect(eligibility.eligible).toBe(false);

    const reentry = openRecoveryState(store, session, T4);
    expect(reentry.phase).toBe(RecoveryPhase.RECOVERING);
    expect(reentry.resumeIntent).toBe(open.resumeIntent);
    // Cannot jump READY without validate/reconcile again
    expect(
      advanceDurableRecoveryPhase({
        state: reentry,
        sessionStatus: TradingSessionStatus.RECOVERING,
        to: RecoveryPhase.READY,
        recordedAt: T4,
      }).ok,
    ).toBe(false);
  });

  it('M-08 Double Restart — second restart idempotent; identity retained; fence restores', () => {
    let session = runningSession();
    store.saveSession(session);
    const { open, session: recovering } = forceRecovering(store, session, T0);
    session = recovering;
    openRecoveryState(store, session, T0, {
      preRecoveryStatus: open.preRecoveryStatus!,
      resumeIntent: open.resumeIntent!,
    });
    const firstLease = acquireLease(store, session, 'runtime-a', T1);
    session = firstLease.session;
    advancePhase(store, session, RecoveryPhase.VALIDATING, T1, firstLease.fencingToken);

    store.sigkill(); // restart 1
    session = store.sessions.get(session.id)!;
    let state = openRecoveryState(store, session, T2);
    expect(state.sessionId).toBe('session-1');
    expect(state.phase).toBe(RecoveryPhase.RECOVERING);
    expect(state.recoveryAttempt).toBe(2);
    expect(state.resumeIntent).toBe(open.resumeIntent);

    store.saveSession(
      Object.freeze({
        ...session,
        lease: session.lease ? Object.freeze({ ...session.lease, expiresAt: T1 }) : null,
      }),
    );
    const secondLease = acquireLease(store, store.sessions.get(session.id)!, 'runtime-b', T2);
    session = secondLease.session;
    advancePhase(store, session, RecoveryPhase.VALIDATING, T2, secondLease.fencingToken);

    store.sigkill(); // restart 2
    session = store.sessions.get(session.id)!;
    state = openRecoveryState(store, session, T3);
    expect(state.sessionId).toBe('session-1');
    expect(state.resumeIntent).toBe(open.resumeIntent);
    expect(state.recoveryAttempt).toBe(3);
    expect(state.phase).toBe(RecoveryPhase.RECOVERING);

    store.saveSession(
      Object.freeze({
        ...session,
        lease: session.lease ? Object.freeze({ ...session.lease, expiresAt: T2 }) : null,
      }),
    );
    const thirdLease = acquireLease(store, store.sessions.get(session.id)!, 'runtime-c', T3);
    expect(thirdLease.fencingToken).toBeGreaterThan(secondLease.fencingToken);
    expect(thirdLease.fencingToken).toBeGreaterThan(firstLease.fencingToken);

    // No duplicate Session identity / no duplicate RecoveryState rows
    expect([...store.sessions.keys()]).toEqual(['session-1']);
    expect(store.recoveryStates.size).toBe(1);
  });

  it('M-09 Duplicate Recovery Attempt — idempotent confirm; intent not rewritten', () => {
    let session = runningSession();
    store.saveSession(session);
    const first = forceRecovering(store, session, T0);
    session = first.session;
    const state1 = openRecoveryState(store, session, T0, {
      preRecoveryStatus: first.open.preRecoveryStatus!,
      resumeIntent: first.open.resumeIntent!,
    });

    const second = decideForceConfirmRecovering({
      discovery: discoveryFor(session),
      session,
      recordedAt: T1,
      priorOpen: first.open,
    });
    expect(second.action).toBe('confirmed');
    expect(second.transitioned).toBe(false);
    expect(second.evaluationAdmitted).toBe(false);

    const state2 = openRecoveryState(store, session, T1, {
      preRecoveryStatus: TradingSessionStatus.PAUSED,
      resumeIntent: TradingSessionStatus.PAUSED,
    });
    expect(state2.resumeIntent).toBe(state1.resumeIntent);
    expect(state2.recoveryId).toBe(state1.recoveryId);
    expect(state2.phase).toBe(RecoveryPhase.RECOVERING);
    expect(store.sessions.size).toBe(1);
  });

  it('M-10 Lost Outbox Delivery — redelivery does not duplicate business effects', async () => {
    const eventId = toDurableEventId(
      'trading-session:session-1:TradingSessionRecovering:v3:forced',
    );
    const envelope: DurableEventEnvelope = Object.freeze({
      eventId,
      eventType: 'TradingSessionRecovering',
      schemaVersion: 1,
      aggregateType: 'TradingSession',
      aggregateId: 'session-1',
      aggregateVersion: 1,
      workspaceId: 'ws-1',
      occurredAt: T0,
      recordedAt: T0,
      payload: Object.freeze({ sessionId: 'session-1', status: 'RECOVERING' }),
    });

    await store.outbox.insert(envelope, T0);
    expect((await store.outbox.findByEventId(eventId))?.status).toBe(OutboxStatus.PENDING);

    // Lost delivery: row never dispatched (stays PENDING) through process death
    store.sigkill();

    const inbox = new InMemoryInboxRepository();
    const checkpoints = new InMemoryConsumerCheckpointRepository();
    const processor = new IdempotentConsumerProcessor(inbox, checkpoints);
    const projections = new Map<string, { count: number }>();
    const handler: ConsumerProjectionHandler<{ count: number }> = {
      consumerId: 'trading-session-recovery-audit',
      consumerVersion: '1',
      apply: (_e, current) => {
        store.appliedEffects.set(
          String(eventId),
          (store.appliedEffects.get(String(eventId)) ?? 0) + 1,
        );
        return { count: (current?.count ?? 0) + 1 };
      },
      getProjection: (ws, stream) => projections.get(`${ws}::${stream}`) ?? null,
      saveProjection: (ws, stream, p) => {
        projections.set(`${ws}::${stream}`, p);
      },
    };

    let handleCount = 0;
    const dispatcher = new OutboxDispatcher(store.outbox);
    dispatcher.register({
      consumerId: 'trading-session-recovery-audit',
      handle: async (env) => {
        handleCount += 1;
        const result = await processor.process(env, handler, T1);
        if (result.outcome !== 'applied' && result.outcome !== 'duplicate') {
          throw new Error(`unexpected outcome: ${result.outcome}`);
        }
      },
    });
    dispatcher.start();

    const first = await dispatcher.dispatchOnce(T1);
    expect(first.published).toBe(1);
    expect(handleCount).toBe(1);
    expect(store.appliedEffects.get(String(eventId))).toBe(1);
    expect(projections.size).toBe(1);

    // Simulate lost Outbox publication status while Inbox/ack survives (at-least-once)
    await store.outbox.updateDelivery(eventId, {
      status: OutboxStatus.PENDING,
      publishedAt: null,
      updatedAt: T2,
    });
    const second = await dispatcher.dispatchOnce(T2);
    expect(second.published).toBe(1);
    expect(handleCount).toBe(1);
    expect(store.appliedEffects.get(String(eventId))).toBe(1);
    expect([...projections.values()][0]).toEqual({ count: 1 });

    // Duplicate insert of same eventId rejected
    await expect(store.outbox.insert(envelope, T3)).rejects.toThrow(/already exists/);
  });

  it('M-11 Database unavailable during Recovery — no false-green resume; durable state retained', () => {
    let session = runningSession();
    store.saveSession(session);
    const { open, session: recovering } = forceRecovering(store, session, T0);
    session = recovering;
    openRecoveryState(store, session, T0, {
      preRecoveryStatus: open.preRecoveryStatus!,
      resumeIntent: open.resumeIntent!,
    });
    const before = store.recoveryStates.get(session.id)!;
    expect(before.phase).toBe(RecoveryPhase.RECOVERING);

    store.dbAvailable = false;
    expect(() => store.saveRecoveryState(withRecoveryFencingToken(before, 99, T1))).toThrow(
      /database_unavailable/,
    );

    // No false-green: phase remains pre-failure durable authority
    store.dbAvailable = true;
    const after = store.recoveryStates.get(session.id)!;
    expect(after.phase).toBe(RecoveryPhase.RECOVERING);
    expect(after.fencingToken).toBeNull();
    expect(session.status).toBe(TradingSessionStatus.RECOVERING);
    const eligibility = evaluateExecutionEligibility(session, 1, T1);
    expect(eligibility.eligible).toBe(false);
  });

  it('M-12 Process SIGKILL — last durable commit authority; cold start recovers; no duplicates', () => {
    let session = runningSession();
    store.saveSession(session);
    const { open, session: recovering } = forceRecovering(store, session, T0);
    session = recovering;
    openRecoveryState(store, session, T0, {
      preRecoveryStatus: open.preRecoveryStatus!,
      resumeIntent: open.resumeIntent!,
    });
    const leased = acquireLease(store, session, 'runtime-a', T1);
    session = leased.session;
    advancePhase(store, session, RecoveryPhase.VALIDATING, T1, leased.fencingToken);
    // Uncommitted volatile work
    store.volatileStageCache.set('uncommittedReconcile', 'partial');

    store.sigkill(); // SIGKILL-class

    expect(store.volatileStageCache.size).toBe(0);
    const durableSession = store.sessions.get('session-1')!;
    const durableState = store.recoveryStates.get('session-1')!;
    expect(durableSession.id).toBe('session-1');
    expect(durableSession.status).toBe(TradingSessionStatus.RECOVERING);
    expect(durableState.lastAttemptedPhase).toBe(RecoveryPhase.VALIDATING);

    // Cold start: rediscover → confirm → re-open at RECOVERING
    const coldDiscovery = discoveryFor(durableSession);
    expect(coldDiscovery.outcome).toBe('recovery_candidate');
    const coldOpen = decideForceConfirmRecovering({
      discovery: coldDiscovery,
      session: durableSession,
      recordedAt: T2,
      priorOpen: open,
    });
    expect(coldOpen.action).toBe('confirmed');
    expect(coldOpen.signalIntentEmitted).toBe(false);

    const coldState = openRecoveryState(store, durableSession, T2);
    expect(coldState.phase).toBe(RecoveryPhase.RECOVERING);
    expect(coldState.resumeIntent).toBe(open.resumeIntent);
    expect([...store.sessions.keys()]).toEqual(['session-1']);
    expect(store.recoveryStates.size).toBe(1);
  });
});
