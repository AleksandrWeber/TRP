import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  openDurableRecoveryState,
  RecoveryPhase,
  type DurableRecoveryState,
} from '../domain/durable-recovery-state';
import type { RecoveryIncident } from '../domain/recovery-incident';
import type { RecoveryIncidentRepository } from '../domain/recovery-incident.repository';
import type { RecoveryStateRepository } from '../domain/recovery-state.repository';
import {
  createTradingSession,
  transitionSession,
  type TradingSession,
} from '../domain/trading-session';
import { TradingSessionStatus } from '../domain/trading-session-status';
import type { TradingSessionRepository } from '../persistence/trading-session.repository';
import { RecoveryIncidentFailClosedService } from './recovery-incident-fail-closed.service';
import { RecoveryPhaseProgressService } from './recovery-phase-progress.service';
import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';

const at = '2026-08-01T12:00:00.000Z';

function recoveringSession(): TradingSession {
  const created = createTradingSession({
    id: 'session-1',
    workspaceId: 'ws-1',
    paperAccountId: 'account-1',
    deploymentId: 'deployment-1',
    origin: 'strategy',
    actorId: 'actor-1',
    idempotencyKey: 'idem-1',
    createdAt: at,
    recordedAt: at,
  });
  return transitionSession(
    transitionSession(created, TradingSessionStatus.STARTING, at),
    TradingSessionStatus.RECOVERING,
    at,
  );
}

describe('US293 — RecoveryIncidentFailClosedService', () => {
  let sessions: TradingSessionRepository;
  let recoveryStates: Map<string, DurableRecoveryState>;
  let incidents: Map<string, RecoveryIncident>;
  let sessionRow: TradingSession;
  let service: RecoveryIncidentFailClosedService;
  let persistOrder: string[];

  beforeEach(() => {
    persistOrder = [];
    sessionRow = recoveringSession();
    recoveryStates = new Map();
    incidents = new Map();

    const opened = openDurableRecoveryState({
      sessionId: sessionRow.id,
      workspaceId: sessionRow.workspaceId,
      sessionStatus: TradingSessionStatus.RECOVERING,
      preRecoveryStatus: TradingSessionStatus.RUNNING,
      resumeIntent: TradingSessionStatus.RUNNING,
      recordedAt: at,
      prior: null,
    });
    expect(opened.ok).toBe(true);
    recoveryStates.set(sessionRow.id, opened.state);

    sessions = {
      create: vi.fn(),
      save: vi.fn(async (session: TradingSession) => {
        persistOrder.push('session');
        sessionRow = session;
        return session;
      }),
      saveIfVersion: vi.fn(),
      findById: vi.fn(async () => sessionRow),
      findByIdempotencyKey: vi.fn(),
      findByWorkspaceId: vi.fn(),
      findByStatuses: vi.fn(),
    };

    const stateRepo: RecoveryStateRepository = {
      saveRecoveryState: vi.fn(async (state) => {
        persistOrder.push('recoveryState');
        recoveryStates.set(state.sessionId, state);
      }),
      loadRecoveryState: vi.fn(async (sessionId) => recoveryStates.get(sessionId) ?? null),
      clearRecoveryState: vi.fn(),
    };

    const incidentRepo: RecoveryIncidentRepository = {
      saveIncident: vi.fn(async (incident) => {
        persistOrder.push('incident');
        incidents.set(incident.incidentId, incident);
      }),
      loadIncident: vi.fn(async (id) => incidents.get(id) ?? null),
      loadOpenIncidentBySession: vi.fn(async (sessionId) => {
        for (const incident of incidents.values()) {
          if (incident.sessionId === sessionId && incident.status === 'OPEN') return incident;
        }
        return null;
      }),
    };

    const transactions = {
      run: async <T>(work: (tx: TransactionContext) => Promise<T>): Promise<T> =>
        work(Object.freeze({}) as TransactionContext),
    };

    const logger = {
      child: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      }),
    };

    const progress = new RecoveryPhaseProgressService(stateRepo, logger as never);
    service = new RecoveryIncidentFailClosedService(
      sessions,
      incidentRepo,
      progress,
      transactions as never,
      logger as never,
    );
  });

  it('persists Incident → RecoveryState FAILED+incidentId → Session FAILED in order', async () => {
    const result = await service.failClosedOnAmbiguity({
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      reasonClass: 'reconciliation_ambiguity',
      failureReason: 'reconcile:orders_mismatch',
      recordedAt: at,
      fencingToken: 3,
    });

    expect(result.outcome).toBe('FAILED_CLOSED');
    expect(result.incident).not.toBeNull();
    expect(result.sessionStatus).toBe(TradingSessionStatus.FAILED);
    expect(result.recoveryPhase).toBe(RecoveryPhase.FAILED);
    expect(result.evaluationAdmitted).toBe(false);
    expect(result.signalIntentEmitted).toBe(false);

    expect(persistOrder).toEqual(['incident', 'recoveryState', 'session']);

    const state = recoveryStates.get('session-1')!;
    expect(state.phase).toBe(RecoveryPhase.FAILED);
    expect(state.incidentId).toBe(result.incident!.incidentId);
    expect(sessionRow.status).toBe(TradingSessionStatus.FAILED);
    expect(sessionRow.failureReason).toBe('reconcile:orders_mismatch');
  });

  it('never leaves FAILED Session without a persisted Incident', async () => {
    await service.failClosedOnAmbiguity({
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      reasonClass: 'checkpoint_corruption',
      failureReason: 'checkpoint:schema_mismatch',
      recordedAt: at,
    });

    expect(sessionRow.status).toBe(TradingSessionStatus.FAILED);
    expect(incidents.size).toBe(1);
    const incident = [...incidents.values()][0]!;
    expect(recoveryStates.get('session-1')!.incidentId).toBe(incident.incidentId);
  });

  it('is idempotent when already fail-closed with Incident', async () => {
    await service.failClosedOnAmbiguity({
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      reasonClass: 'reconciliation_ambiguity',
      failureReason: 'reconcile:first',
      recordedAt: at,
    });
    persistOrder = [];

    const second = await service.failClosedOnAmbiguity({
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      reasonClass: 'reconciliation_ambiguity',
      failureReason: 'reconcile:second',
      recordedAt: '2026-08-01T12:05:00.000Z',
    });

    expect(second.outcome).toBe('ALREADY_FAILED_CLOSED');
    expect(persistOrder).toEqual([]);
    expect(incidents.size).toBe(1);
  });

  it('does not admit evaluation or SignalIntent', async () => {
    const result = await service.failClosedOnAmbiguity({
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      reasonClass: 'lease_acquire_impossible',
      failureReason: 'lease_denied:owned_by_other',
      recordedAt: at,
    });
    expect(result.evaluationAdmitted).toBe(false);
    expect(result.signalIntentEmitted).toBe(false);
  });
});
