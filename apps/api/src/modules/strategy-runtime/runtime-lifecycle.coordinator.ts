import { Injectable } from '@nestjs/common';
import {
  createLifecycleSnapshot,
  RuntimeWorkerState,
  type RuntimeLifecycleResult,
  type RuntimeLifecycleSnapshot,
  type RuntimeWorkerState as WorkerState,
} from './domain/runtime-lifecycle';

type WorkerSlot = {
  workspaceId: string;
  sessionId: string;
  state: WorkerState;
  fencingToken: number | null;
  inFlight: Promise<unknown> | null;
  drainRequested: boolean;
};

export type RuntimeLifecycleCommand = Readonly<{
  workspaceId: string;
  sessionId: string;
  fencingToken: number;
  nowIso: string;
  reason?: string;
}>;

/**
 * In-memory Runtime worker lifecycle coordinator (US220).
 * Gates tick admission / evaluation and drains in-flight evaluation on
 * pause/stop. Does not own Session persistence or checkpoint writes.
 */
@Injectable()
export class RuntimeLifecycleCoordinator {
  private readonly workers = new Map<string, WorkerSlot>();

  snapshot(workspaceId: string, sessionId: string): RuntimeLifecycleSnapshot {
    const slot = this.slot(workspaceId, sessionId);
    return createLifecycleSnapshot({
      workspaceId: slot.workspaceId,
      sessionId: slot.sessionId,
      state: slot.state,
      fencingToken: slot.fencingToken,
    });
  }

  /**
   * Arm Runtime after Session reaches RUNNING with a valid lease fence.
   */
  async arm(command: RuntimeLifecycleCommand): Promise<RuntimeLifecycleResult> {
    const slot = this.slot(command.workspaceId, command.sessionId);
    const fromState = slot.state;
    if (fromState === RuntimeWorkerState.EVALUATING || fromState === RuntimeWorkerState.DRAINING) {
      throw new Error(`cannot arm runtime while ${fromState}`);
    }
    slot.fencingToken = positiveToken(command.fencingToken);
    slot.drainRequested = false;
    slot.state = RuntimeWorkerState.ARMED;
    return result(slot, fromState, false, command.reason ?? 'runtime armed');
  }

  /**
   * Resume after Session returns to RUNNING — same as arm when IDLE.
   */
  async resume(command: RuntimeLifecycleCommand): Promise<RuntimeLifecycleResult> {
    return this.arm({
      ...command,
      reason: command.reason ?? 'runtime resumed',
    });
  }

  /**
   * Pause: stop accepting ticks, drain in-flight evaluation, settle IDLE.
   */
  async pause(command: RuntimeLifecycleCommand): Promise<RuntimeLifecycleResult> {
    return this.drainToIdle(command, command.reason ?? 'runtime paused');
  }

  /**
   * Stop: lease-aware shutdown — drain in-flight work, settle IDLE.
   */
  async stop(command: RuntimeLifecycleCommand): Promise<RuntimeLifecycleResult> {
    return this.drainToIdle(command, command.reason ?? 'runtime stopped');
  }

  /**
   * True when new ticks may be admitted / evaluated.
   */
  canAcceptWork(workspaceId: string, sessionId: string): boolean {
    return this.slot(workspaceId, sessionId).state === RuntimeWorkerState.ARMED;
  }

  /**
   * Run evaluation under lifecycle critical section.
   * Ensures pause/stop can await the in-flight promise and settle IDLE.
   */
  async runEvaluation<T>(
    workspaceId: string,
    sessionId: string,
    work: () => Promise<T>,
  ): Promise<T> {
    const slot = this.slot(workspaceId, sessionId);
    if (slot.state !== RuntimeWorkerState.ARMED) {
      throw new Error(`runtime does not accept evaluation while ${slot.state}`);
    }
    if (slot.inFlight !== null) {
      throw new Error('runtime already has an in-flight evaluation');
    }

    slot.state = RuntimeWorkerState.EVALUATING;
    const promise = Promise.resolve()
      .then(work)
      .finally(() => {
        const current = this.slot(workspaceId, sessionId);
        if (current.inFlight === promise) {
          current.inFlight = null;
          if (current.drainRequested || current.state === RuntimeWorkerState.DRAINING) {
            current.state = RuntimeWorkerState.IDLE;
            current.drainRequested = false;
          } else if (current.state === RuntimeWorkerState.EVALUATING) {
            current.state = RuntimeWorkerState.ARMED;
          }
        }
      });
    slot.inFlight = promise;
    return promise;
  }

  private async drainToIdle(
    command: RuntimeLifecycleCommand,
    reason: string,
  ): Promise<RuntimeLifecycleResult> {
    const slot = this.slot(command.workspaceId, command.sessionId);
    const fromState = slot.state;
    assertFence(slot, command.fencingToken);

    if (fromState === RuntimeWorkerState.IDLE && slot.inFlight === null) {
      slot.fencingToken = positiveToken(command.fencingToken);
      return result(slot, fromState, false, reason);
    }

    const hadInFlight = slot.inFlight !== null;
    slot.drainRequested = true;
    if (hadInFlight) {
      slot.state = RuntimeWorkerState.DRAINING;
      await slot.inFlight;
    }

    slot.inFlight = null;
    slot.drainRequested = false;
    slot.state = RuntimeWorkerState.IDLE;
    slot.fencingToken = positiveToken(command.fencingToken);
    return result(slot, fromState, hadInFlight, reason);
  }

  private slot(workspaceId: string, sessionId: string): WorkerSlot {
    const key = workerKey(workspaceId, sessionId);
    const existing = this.workers.get(key);
    if (existing) return existing;
    const created: WorkerSlot = {
      workspaceId: required(workspaceId, 'workspace id'),
      sessionId: required(sessionId, 'session id'),
      state: RuntimeWorkerState.IDLE,
      fencingToken: null,
      inFlight: null,
      drainRequested: false,
    };
    this.workers.set(key, created);
    return created;
  }
}

function workerKey(workspaceId: string, sessionId: string): string {
  return `${required(workspaceId, 'workspace id')}::${required(sessionId, 'session id')}`;
}

function assertFence(slot: WorkerSlot, fencingToken: number): void {
  const token = positiveToken(fencingToken);
  if (slot.fencingToken !== null && slot.fencingToken !== token) {
    throw new Error('stale fencing token rejected by runtime lifecycle');
  }
}

function positiveToken(value: number): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error('fencing token must be a positive integer');
  }
  return value;
}

function result(
  slot: WorkerSlot,
  fromState: WorkerState,
  drained: boolean,
  reason: string,
): RuntimeLifecycleResult {
  return Object.freeze({
    workspaceId: slot.workspaceId,
    sessionId: slot.sessionId,
    fromState,
    toState: slot.state,
    drained,
    reason,
  });
}

function required(value: string, label: string): string {
  const result = value.trim();
  if (result === '') throw new Error(`${label} is required`);
  return result;
}
