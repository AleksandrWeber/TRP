import { describe, expect, it, vi } from 'vitest';
import { RuntimeWorkerState } from './domain/runtime-lifecycle';
import { RuntimeLifecycleCoordinator } from './runtime-lifecycle.coordinator';

const now = '2026-07-29T20:00:00.000Z';

describe('US220 — RuntimeLifecycleCoordinator', () => {
  it('arms, pauses to IDLE, and resumes to ARMED', async () => {
    const coordinator = new RuntimeLifecycleCoordinator();

    const armed = await coordinator.arm({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      fencingToken: 1,
      nowIso: now,
    });
    expect(armed.toState).toBe(RuntimeWorkerState.ARMED);
    expect(coordinator.canAcceptWork('workspace-1', 'session-1')).toBe(true);

    const paused = await coordinator.pause({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      fencingToken: 1,
      nowIso: now,
    });
    expect(paused.toState).toBe(RuntimeWorkerState.IDLE);
    expect(coordinator.canAcceptWork('workspace-1', 'session-1')).toBe(false);

    const resumed = await coordinator.resume({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      fencingToken: 1,
      nowIso: now,
    });
    expect(resumed.toState).toBe(RuntimeWorkerState.ARMED);
  });

  it('enables event admission without enabling evaluation', async () => {
    const coordinator = new RuntimeLifecycleCoordinator();

    const enabled = await coordinator.enableEventAdmission({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      fencingToken: 1,
      nowIso: now,
    });

    expect(enabled.toState).toBe(RuntimeWorkerState.EVENT_ADMISSION_ENABLED);
    expect(coordinator.canAcceptTicks('workspace-1', 'session-1')).toBe(true);
    expect(coordinator.canEvaluate('workspace-1', 'session-1')).toBe(false);
    await expect(
      coordinator.runEvaluation('workspace-1', 'session-1', async () => 'nope'),
    ).rejects.toThrow(/EVENT_ADMISSION_ENABLED/);
  });

  it('arms from EVENT_ADMISSION_ENABLED and then accepts evaluation', async () => {
    const coordinator = new RuntimeLifecycleCoordinator();

    await coordinator.enableEventAdmission({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      fencingToken: 1,
      nowIso: now,
    });
    const armed = await coordinator.arm({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      fencingToken: 1,
      nowIso: now,
      reason: 'recovery runtime armed',
    });

    expect(armed.fromState).toBe(RuntimeWorkerState.EVENT_ADMISSION_ENABLED);
    expect(armed.toState).toBe(RuntimeWorkerState.ARMED);
    expect(coordinator.canAcceptTicks('workspace-1', 'session-1')).toBe(true);
    expect(coordinator.canEvaluate('workspace-1', 'session-1')).toBe(true);
    await expect(
      coordinator.runEvaluation('workspace-1', 'session-1', async () => 'ok'),
    ).resolves.toBe('ok');
  });

  it('drains in-flight evaluation before pause settles IDLE', async () => {
    const coordinator = new RuntimeLifecycleCoordinator();
    await coordinator.arm({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      fencingToken: 2,
      nowIso: now,
    });

    let resolveEval!: () => void;
    const evalPromise = new Promise<string>((resolve) => {
      resolveEval = () => resolve('done');
    });

    const running = coordinator.runEvaluation('workspace-1', 'session-1', () => evalPromise);
    expect(coordinator.snapshot('workspace-1', 'session-1').state).toBe(
      RuntimeWorkerState.EVALUATING,
    );

    let pauseResolved = false;
    const pausing = coordinator
      .pause({
        workspaceId: 'workspace-1',
        sessionId: 'session-1',
        fencingToken: 2,
        nowIso: now,
      })
      .then((result) => {
        pauseResolved = true;
        return result;
      });

    await Promise.resolve();
    expect(pauseResolved).toBe(false);
    expect(coordinator.snapshot('workspace-1', 'session-1').state).toBe(
      RuntimeWorkerState.DRAINING,
    );

    resolveEval();
    const [evalResult, pauseResult] = await Promise.all([running, pausing]);
    expect(evalResult).toBe('done');
    expect(pauseResult.drained).toBe(true);
    expect(pauseResult.toState).toBe(RuntimeWorkerState.IDLE);
    expect(coordinator.canAcceptWork('workspace-1', 'session-1')).toBe(false);
  });

  it('stop is lease-aware and rejects stale fencing tokens', async () => {
    const coordinator = new RuntimeLifecycleCoordinator();
    await coordinator.arm({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      fencingToken: 3,
      nowIso: now,
    });

    await expect(
      coordinator.stop({
        workspaceId: 'workspace-1',
        sessionId: 'session-1',
        fencingToken: 2,
        nowIso: now,
      }),
    ).rejects.toThrow(/stale fencing token/);

    const stopped = await coordinator.stop({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      fencingToken: 3,
      nowIso: now,
    });
    expect(stopped.toState).toBe(RuntimeWorkerState.IDLE);
  });

  it('rejects concurrent evaluations', async () => {
    const coordinator = new RuntimeLifecycleCoordinator();
    await coordinator.arm({
      workspaceId: 'workspace-1',
      sessionId: 'session-1',
      fencingToken: 1,
      nowIso: now,
    });

    const gate = vi.fn();
    let release!: () => void;
    const blocked = new Promise<void>((resolve) => {
      release = resolve;
    });

    const first = coordinator.runEvaluation('workspace-1', 'session-1', async () => {
      gate();
      await blocked;
      return 'one';
    });

    await expect(
      coordinator.runEvaluation('workspace-1', 'session-1', async () => 'two'),
    ).rejects.toThrow(/does not accept evaluation while EVALUATING|in-flight evaluation/);

    release();
    await expect(first).resolves.toBe('one');
    expect(gate).toHaveBeenCalledOnce();
  });
});
