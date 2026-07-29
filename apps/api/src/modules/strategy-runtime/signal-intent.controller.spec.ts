import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../auth/jwt.strategy';
import type { WorkspaceAccessService } from '../workspace';
import { SignalIntentDirection } from './domain/signal-intent';
import { SignalIntentController } from './signal-intent.controller';
import type { SignalIntentService } from './signal-intent.service';

const user = { userId: 'user-1' } as AuthUser;

describe('US214 — SignalIntentController', () => {
  const intents = {
    get: vi.fn(),
    listBySession: vi.fn(),
  };
  const workspaceAccess = {
    assertMember: vi.fn(),
  };

  const controller = new SignalIntentController(
    intents as unknown as SignalIntentService,
    workspaceAccess as unknown as WorkspaceAccessService,
  );

  it('returns a signal intent by id for a workspace member', async () => {
    intents.get.mockResolvedValue({
      id: 'si_abc',
      intentHash: 'hash',
      intentVersion: 1,
      workspaceId: 'workspace-1',
      deploymentId: 'deployment-1',
      sessionId: 'session-1',
      strategyVersion: '1.0.0',
      instrument: 'BTCUSDT',
      timeframe: '1h',
      direction: SignalIntentDirection.BUY,
      confidence: 0.5,
      marketCheckpoint: { streamId: 's', sequence: 1, eventId: 'e' },
      generatedAt: '2026-07-29T16:00:00.000Z',
      recordedAt: '2026-07-29T16:00:01.000Z',
      actorId: 'runtime-1',
      correlationId: null,
      metadata: {},
    });

    const view = await controller.getById({ user }, { id: 'si_abc' }, 'workspace-1');
    expect(view.id).toBe('si_abc');
    expect(workspaceAccess.assertMember).toHaveBeenCalledWith('workspace-1', user.userId);
  });

  it('lists intents for a session', async () => {
    intents.listBySession.mockResolvedValue([]);
    await expect(
      controller.listBySession({ user }, { sessionId: 'session-1' }, 'workspace-1'),
    ).resolves.toEqual([]);
    expect(intents.listBySession).toHaveBeenCalledWith('workspace-1', 'session-1');
  });

  it('throws NotFound when intent is missing', async () => {
    intents.get.mockResolvedValue(null);
    await expect(
      controller.getById({ user }, { id: 'missing' }, 'workspace-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
