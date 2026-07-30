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

describe('US240 — StartupRecoveryDiscoveryService', () => {
  const findByStatuses = vi.fn();
  const sessions: TradingSessionRepository = {
    create: vi.fn(),
    save: vi.fn(),
    findById: vi.fn(),
    findByIdempotencyKey: vi.fn(),
    findByStatuses,
    saveIfVersion: vi.fn(),
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
    service = new StartupRecoveryDiscoveryService(sessions, logger as never);
  });

  it('discovers no candidate when repository returns none', async () => {
    findByStatuses.mockResolvedValue([]);
    const result = await service.discover();
    expect(result.outcome).toBe('no_recovery_required');
    expect(result.candidate).toBeNull();
    expect(service.getLastResult()).toEqual(result);
    expect(info).toHaveBeenCalledWith('startup_recovery_discovery', {
      outcome: 'no_recovery_required',
      eligibleCount: 0,
      candidateSessionId: null,
      eligibleSessionIds: [],
    });
    expect(findByStatuses).toHaveBeenCalledWith([
      TradingSessionStatus.PAUSED,
      TradingSessionStatus.RECOVERING,
      TradingSessionStatus.RUNNING,
      TradingSessionStatus.STARTING,
      TradingSessionStatus.STOPPING,
    ]);
  });

  it('discovers a single candidate without mutating Sessions', async () => {
    const session = runningSession('s-1');
    findByStatuses.mockResolvedValue([session]);
    const result = await service.discover();
    expect(result.outcome).toBe('recovery_candidate');
    expect(result.candidate?.sessionId).toBe('s-1');
    expect(sessions.save).not.toHaveBeenCalled();
    expect(sessions.create).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith(
      'startup_recovery_discovery',
      expect.objectContaining({
        outcome: 'recovery_candidate',
        eligibleCount: 1,
        candidateSessionId: 's-1',
      }),
    );
  });

  it('selects one deterministic candidate when multiple are eligible', async () => {
    findByStatuses.mockResolvedValue([
      runningSession('s-late', '2026-07-30T12:00:00.000Z'),
      runningSession('s-early', '2026-07-30T08:00:00.000Z'),
    ]);
    const result = await service.discover();
    expect(result.candidate?.sessionId).toBe('s-early');
    expect(result.eligibleCount).toBe(2);
    expect(result.eligibleSessionIds).toEqual(['s-early', 's-late']);
  });

  it('returns no_recovery_required for terminal-only persistence results', async () => {
    // Repository is queried with eligible statuses only; empty means terminals only.
    findByStatuses.mockResolvedValue([]);
    const result = await service.discover();
    expect(result.outcome).toBe('no_recovery_required');
  });

  it('onApplicationBootstrap runs discovery once', async () => {
    findByStatuses.mockResolvedValue([]);
    await service.onApplicationBootstrap();
    expect(findByStatuses).toHaveBeenCalledTimes(1);
    expect(service.getLastResult()?.outcome).toBe('no_recovery_required');
  });
});
