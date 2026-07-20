import { describe, expect, it } from 'vitest';
import {
  archivePaperSession,
  createPaperSession,
  pausePaperSession,
  startPaperSession,
  stopPaperSession,
} from './paper-session';

const T0 = '2026-07-20T16:00:00.000Z';
const T1 = '2026-07-20T16:01:00.000Z';

describe('US208 PaperSession domain', () => {
  it('enforces lifecycle transitions', () => {
    const session = createPaperSession({
      id: 's1',
      workspaceId: 'ws',
      ownerId: 'owner',
      portfolioId: 'pf',
      portfolioWorkspaceKey: 'paper-session:s1',
      name: 'Test',
      initialBalance: '1000',
      createdAt: T0,
      updatedAt: T0,
    });
    expect(session.status).toBe('CREATED');

    const running = startPaperSession(session, T1);
    expect(running.status).toBe('RUNNING');
    expect(running.startedAt).toBe(T1);

    const paused = pausePaperSession(running, T1);
    expect(paused.status).toBe('PAUSED');

    const stopped = stopPaperSession(startPaperSession(paused, T1), T1);
    expect(stopped.status).toBe('STOPPED');

    expect(() => startPaperSession(stopped, T1)).toThrow(/cannot start/);
    expect(() => archivePaperSession(running, T1)).toThrow(/stop it first/);
  });

  it('rejects non-positive initial balance', () => {
    expect(() =>
      createPaperSession({
        id: 's1',
        workspaceId: 'ws',
        ownerId: 'owner',
        portfolioId: 'pf',
        portfolioWorkspaceKey: 'paper-session:s1',
        name: 'Bad',
        initialBalance: '0',
        createdAt: T0,
        updatedAt: T0,
      }),
    ).toThrow(/greater than zero/);
  });
});
