import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createTradingSession,
  transitionSession,
  type TradingSession,
} from '../domain/trading-session';
import { TradingSessionStatus } from '../domain/trading-session-status';
import type { TradingSessionRepository } from '../persistence/trading-session.repository';
import { StartupRecoveryDiscoveryService } from './startup-recovery-discovery.service';

const at = '2026-07-30T08:00:00.000Z';
const recordedAt = '2026-07-30T08:00:01.000Z';

function runningSession(id: string, createdAt = at): TradingSession {
  const created = createTradingSession({
    id,
    workspaceId: 'ws-1',
    paperAccountId: 'account-1',
    deploymentId: `deployment-${id}`,
    origin: 'strategy',
    actorId: 'actor-1',
    idempotencyKey: `idem-${id}`,
    createdAt,
    recordedAt: createdAt,
  });
  return transitionSession(
    transitionSession(created, TradingSessionStatus.STARTING, createdAt),
    TradingSessionStatus.RUNNING,
    createdAt,
  );
}

function stoppingSession(id: string): TradingSession {
  return transitionSession(runningSession(id), TradingSessionStatus.STOPPING, at);
}

function recoveringSession(id: string): TradingSession {
  return transitionSession(runningSession(id), TradingSessionStatus.RECOVERING, at);
}

describe('US240/US290 — StartupRecoveryDiscoveryService', () => {
  const findByStatuses = vi.fn();
  const findById = vi.fn();
  const saveIfVersion = vi.fn();
  const sessions: TradingSessionRepository = {
    create: vi.fn(),
    save: vi.fn(),
    findById,
    findByIdempotencyKey: vi.fn(),
    findByWorkspaceId: vi.fn(),
    findByStatuses,
    saveIfVersion,
  };
  const transactions = {
    run: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
  };
  const outbox = {
    append: vi.fn(async () => undefined),
  };
  const recoveryProgress = {
    load: vi.fn(async () => null),
    open: vi.fn(async () => null),
    recordFencingToken: vi.fn(async () => null),
    advance: vi.fn(async () => null),
    finalizeCompleted: vi.fn(async () => null),
  };

  let service: StartupRecoveryDiscoveryService;
  let info: ReturnType<typeof vi.fn>;

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
    saveIfVersion.mockImplementation(async (session) => session);
    service = new StartupRecoveryDiscoveryService(
      sessions,
      transactions as never,
      outbox as never,
      recoveryProgress as never,
      logger as never,
    );
  });

  it('discovers no candidate when repository returns none (AC-3)', async () => {
    findByStatuses.mockResolvedValue([]);
    const result = await service.discover(recordedAt);
    expect(result.outcome).toBe('no_recovery_required');
    expect(result.candidate).toBeNull();
    expect(result.recoveringOpen?.action).toBe('not_required');
    expect(service.getLastResult()).toEqual(result);
    expect(saveIfVersion).not.toHaveBeenCalled();
    expect(outbox.append).not.toHaveBeenCalled();
    expect(findByStatuses).toHaveBeenCalledWith([
      TradingSessionStatus.PAUSED,
      TradingSessionStatus.RECOVERING,
      TradingSessionStatus.RUNNING,
      TradingSessionStatus.STARTING,
      TradingSessionStatus.STOPPING,
    ]);
  });

  it('forces RUNNING candidate into RECOVERING with auditable Outbox event (AC-1, AC-7)', async () => {
    const session = runningSession('s-1');
    findByStatuses.mockResolvedValue([session]);
    findById.mockResolvedValue(session);

    const result = await service.discover(recordedAt);

    expect(result.outcome).toBe('recovery_candidate');
    expect(result.candidate?.sessionId).toBe('s-1');
    expect(result.candidate?.status).toBe(TradingSessionStatus.RECOVERING);
    expect(result.recoveringOpen?.action).toBe('forced');
    expect(result.recoveringOpen?.preRecoveryStatus).toBe(TradingSessionStatus.RUNNING);
    expect(result.recoveringOpen?.resumeIntent).toBe(TradingSessionStatus.RUNNING);
    expect(result.recoveringOpen?.evaluationAdmitted).toBe(false);
    expect(result.recoveringOpen?.signalIntentEmitted).toBe(false);
    expect(saveIfVersion).toHaveBeenCalledOnce();
    expect(saveIfVersion.mock.calls[0]?.[0].status).toBe(TradingSessionStatus.RECOVERING);
    expect(outbox.append).toHaveBeenCalledOnce();
    expect(outbox.append).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        eventType: 'TradingSessionRecovering',
        payload: expect.objectContaining({
          action: 'forced',
          preRecoveryStatus: TradingSessionStatus.RUNNING,
          resumeIntent: TradingSessionStatus.RUNNING,
          evaluationAdmitted: false,
          signalIntentEmitted: false,
        }),
      }),
      recordedAt,
    );
  });

  it('forces STOPPING → RECOVERING with resumeIntent STOPPED (AC-4)', async () => {
    const session = stoppingSession('s-stop');
    findByStatuses.mockResolvedValue([session]);
    findById.mockResolvedValue(session);

    const result = await service.discover(recordedAt);

    expect(result.recoveringOpen?.action).toBe('forced');
    expect(result.recoveringOpen?.preRecoveryStatus).toBe(TradingSessionStatus.STOPPING);
    expect(result.recoveringOpen?.resumeIntent).toBe(TradingSessionStatus.STOPPED);
    expect(result.candidate?.status).toBe(TradingSessionStatus.RECOVERING);
  });

  it('confirms already-RECOVERING without Session mutation (AC-2)', async () => {
    const session = recoveringSession('s-rec');
    findByStatuses.mockResolvedValue([session]);
    findById.mockResolvedValue(session);

    const result = await service.discover(recordedAt);

    expect(result.recoveringOpen?.action).toBe('confirmed');
    expect(result.recoveringOpen?.transitioned).toBe(false);
    expect(result.recoveringOpen?.resumeIntent).toBeNull();
    expect(saveIfVersion).not.toHaveBeenCalled();
    expect(outbox.append).toHaveBeenCalledOnce();
    expect(outbox.append).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        eventType: 'TradingSessionRecoveringConfirmed',
        payload: expect.objectContaining({
          action: 'confirmed',
          evaluationAdmitted: false,
          signalIntentEmitted: false,
        }),
      }),
      recordedAt,
    );
  });

  it('selects one deterministic candidate when multiple are eligible', async () => {
    const late = runningSession('s-late', '2026-07-30T12:00:00.000Z');
    const early = runningSession('s-early', '2026-07-30T08:00:00.000Z');
    findByStatuses.mockResolvedValue([late, early]);
    findById.mockResolvedValue(early);

    const result = await service.discover(recordedAt);
    expect(result.candidate?.sessionId).toBe('s-early');
    expect(result.eligibleCount).toBe(2);
    expect(result.eligibleSessionIds).toEqual(['s-early', 's-late']);
    expect(result.recoveringOpen?.action).toBe('forced');
  });

  it('onApplicationBootstrap runs discovery once', async () => {
    findByStatuses.mockResolvedValue([]);
    await service.onApplicationBootstrap();
    expect(findByStatuses).toHaveBeenCalledTimes(1);
    expect(service.getLastResult()?.outcome).toBe('no_recovery_required');
  });

  it('preserves prior resumeIntent across confirm re-discovery (AC-2 / FR-4)', async () => {
    const running = runningSession('s-1');
    findByStatuses.mockResolvedValue([running]);
    findById.mockResolvedValue(running);
    const first = await service.discover(recordedAt);
    expect(first.recoveringOpen?.resumeIntent).toBe(TradingSessionStatus.RUNNING);

    const recovering = first.recoveringOpen!.nextSession!;
    findByStatuses.mockResolvedValue([recovering]);
    findById.mockResolvedValue(recovering);
    const second = await service.discover(recordedAt);

    expect(second.recoveringOpen?.action).toBe('confirmed');
    expect(second.recoveringOpen?.resumeIntent).toBe(TradingSessionStatus.RUNNING);
    expect(second.recoveringOpen?.preRecoveryStatus).toBe(TradingSessionStatus.RUNNING);
  });
});
