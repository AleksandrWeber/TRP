import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TradingSessionStatus } from '../domain/trading-session-status';
import {
  attachLease,
  createTradingSession,
  transitionSession,
  type TradingSession,
} from '../domain/trading-session';
import { createSessionLease } from '../domain/session-lease';
import type { RecoveryCandidate } from '../domain/startup-recovery-discovery';
import type { TradingSessionRepository } from '../persistence/trading-session.repository';
import {
  RecoveryLeaseAcquisitionService,
  resolveRecoveryRuntimeOwnerId,
} from './recovery-lease-acquisition.service';
import type { StartupRecoveryDiscoveryService } from './startup-recovery-discovery.service';

const now = '2026-07-30T12:00:00.000Z';
const earlier = '2026-07-30T11:59:00.000Z';

function runningSession(id = 'session-1'): TradingSession {
  const created = createTradingSession({
    id,
    workspaceId: 'ws-1',
    paperAccountId: 'account-1',
    deploymentId: 'deployment-1',
    origin: 'strategy',
    actorId: 'actor-1',
    idempotencyKey: `idem-${id}`,
    createdAt: earlier,
    recordedAt: earlier,
  });
  return transitionSession(
    transitionSession(created, TradingSessionStatus.STARTING, earlier),
    TradingSessionStatus.RUNNING,
    earlier,
  );
}

function candidateFor(session: TradingSession): RecoveryCandidate {
  return {
    sessionId: session.id,
    workspaceId: session.workspaceId,
    deploymentId: session.deploymentId,
    status: session.status,
    createdAt: session.createdAt,
  };
}

describe('US241 — RecoveryLeaseAcquisitionService', () => {
  const findById = vi.fn();
  const saveIfVersion = vi.fn();
  const save = vi.fn();
  const sessions: TradingSessionRepository = {
    create: vi.fn(),
    save,
    saveIfVersion,
    findById,
    findByIdempotencyKey: vi.fn(),
    findByStatuses: vi.fn(),
  };
  const transactions = {
    run: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
  };
  const discovery = {
    getLastResult: vi.fn(),
    discover: vi.fn(),
  };
  let info: ReturnType<typeof vi.fn>;
  const recoveryProgress = {
    load: vi.fn(async () => null),
    open: vi.fn(async () => null),
    recordFencingToken: vi.fn(async () => null),
    advance: vi.fn(async () => null),
    finalizeCompleted: vi.fn(async () => null),
  };
  const failClosed = {
    failClosedOnAmbiguity: vi.fn(async () => ({
      outcome: 'FAILED_CLOSED' as const,
      reason: 'test',
      incident: null,
      sessionId: 'session-1',
      workspaceId: 'ws-1',
      sessionStatus: null,
      recoveryPhase: null,
      evaluationAdmitted: false as const,
      signalIntentEmitted: false as const,
    })),
  };
  let service: RecoveryLeaseAcquisitionService;

  beforeEach(() => {
    vi.clearAllMocks();
    info = vi.fn();
    const logger = {
      info,
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn(),
    };
    logger.child.mockReturnValue(logger);
    service = new RecoveryLeaseAcquisitionService(
      sessions,
      transactions as never,
      discovery as unknown as StartupRecoveryDiscoveryService,
      recoveryProgress as never,
      failClosed as never,
      logger as never,
    );
  });

  it('acquires lease successfully for a candidate with missing lease', async () => {
    const session = runningSession();
    findById.mockResolvedValue(session);
    saveIfVersion.mockImplementation(async (next) => next);

    const result = await service.acquire({
      candidate: candidateFor(session),
      ownerId: 'runtime-a',
      nowIso: now,
      recordedAt: now,
    });

    expect(result.outcome).toBe('LEASE_ACQUIRED');
    expect(result.reason).toBe('missing_lease');
    expect(result.fencingToken).toBe(1);
    expect(saveIfVersion).toHaveBeenCalledTimes(1);
    expect(save).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith(
      'recovery_lease_acquisition',
      expect.objectContaining({ outcome: 'LEASE_ACQUIRED', ownerId: 'runtime-a' }),
    );
  });

  it('denies foreign active lease without writing', async () => {
    const lease = createSessionLease({
      ownerId: 'runtime-b',
      acquiredAt: earlier,
      expiresAt: '2026-07-30T12:00:30.000Z',
      previousToken: 1,
    });
    const session = attachLease(runningSession(), lease);
    findById.mockResolvedValue(session);

    const result = await service.acquire({
      candidate: candidateFor(session),
      ownerId: 'runtime-a',
      nowIso: now,
      recordedAt: now,
    });

    expect(result.outcome).toBe('LEASE_DENIED');
    expect(result.reason).toBe('active_foreign_lease');
    expect(saveIfVersion).not.toHaveBeenCalled();
    expect(transactions.run).not.toHaveBeenCalled();
  });

  it('denies on concurrent CAS version conflict', async () => {
    const session = runningSession();
    findById.mockResolvedValue(session);
    saveIfVersion.mockResolvedValue(null);

    const first = await service.acquire({
      candidate: candidateFor(session),
      ownerId: 'runtime-a',
      nowIso: now,
      recordedAt: now,
    });
    expect(first.outcome).toBe('LEASE_DENIED');
    expect(first.reason).toBe('version_conflict');

    // Second concurrent winner path would have succeeded if CAS returned session.
    saveIfVersion.mockImplementation(async (next) => next);
    const winner = await service.acquire({
      candidate: candidateFor(session),
      ownerId: 'runtime-b',
      nowIso: now,
      recordedAt: now,
    });
    expect(winner.outcome).toBe('LEASE_ACQUIRED');
    expect(winner.ownerId).toBe('runtime-b');
  });

  it('acquires when prior lease is expired', async () => {
    const lease = createSessionLease({
      ownerId: 'runtime-old',
      acquiredAt: earlier,
      expiresAt: '2026-07-30T11:59:30.000Z',
      previousToken: 2,
    });
    const session = attachLease(runningSession(), lease);
    findById.mockResolvedValue(session);
    saveIfVersion.mockImplementation(async (next) => next);

    const result = await service.acquire({
      candidate: candidateFor(session),
      ownerId: 'runtime-a',
      nowIso: now,
      recordedAt: now,
    });

    expect(result.outcome).toBe('LEASE_ACQUIRED');
    expect(result.reason).toBe('expired_lease');
    expect(result.fencingToken).toBe(session.lastFencingToken + 1);
  });

  it('bootstrap acquires only when discovery returned a candidate', async () => {
    discovery.getLastResult.mockReturnValue({
      outcome: 'recovery_candidate',
      eligibleCount: 1,
      candidate: candidateFor(runningSession()),
      eligibleSessionIds: ['session-1'],
      recoveringOpen: null,
    });
    findById.mockResolvedValue(runningSession());
    saveIfVersion.mockImplementation(async (next) => next);

    await service.onApplicationBootstrap();
    expect(saveIfVersion).toHaveBeenCalledTimes(1);
    expect(service.getLastResult()?.outcome).toBe('LEASE_ACQUIRED');
  });

  it('bootstrap skips acquisition when discovery requires no recovery', async () => {
    discovery.getLastResult.mockReturnValue({
      outcome: 'no_recovery_required',
      eligibleCount: 0,
      candidate: null,
      eligibleSessionIds: [],
      recoveringOpen: null,
    });
    await service.onApplicationBootstrap();
    expect(findById).not.toHaveBeenCalled();
    expect(service.getLastResult()).toBeNull();
  });

  it('resolveRecoveryRuntimeOwnerId prefers env override', () => {
    expect(resolveRecoveryRuntimeOwnerId({ TRP_RUNTIME_OWNER_ID: ' worker-9 ' })).toBe('worker-9');
  });
});
