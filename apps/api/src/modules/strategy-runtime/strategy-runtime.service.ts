import { Inject, Injectable } from '@nestjs/common';
import { StrategyDeploymentService, StrategyDeploymentStatus } from '../strategy-deployment';
import {
  createRuntimeContext,
  createRuntimeDiagnostics,
  type RuntimeContext,
  type RuntimeDiagnostics,
} from './domain/runtime-context';
import { evaluationRejectedLifecycle, type EvaluationResult } from './domain/evaluation-result';
import type { RuntimeLifecycleResult, RuntimeLifecycleSnapshot } from './domain/runtime-lifecycle';
import type { SignalIntent } from './domain/signal-intent';
import type { StrategyCheckpoint } from './domain/strategy-checkpoint';
import {
  admitClosedCandleTick,
  TickAdmissionStatus,
  type TickAdmissionResult,
} from './domain/tick-admission';
import type {
  AdmitTickCommand,
  LoadRuntimeContextQuery,
  StrategyRuntimePort,
} from './ports/strategy-runtime.port';
import { RuntimeEvaluationService, type EvaluateTickCommand } from './runtime-evaluation.service';
import {
  RuntimeLifecycleCoordinator,
  type RuntimeLifecycleCommand,
} from './runtime-lifecycle.coordinator';
import {
  SignalIntentService,
  type EmitSignalIntentCommand,
  type EmitSignalIntentResult,
} from './signal-intent.service';
import {
  StrategyCheckpointService,
  type SaveStrategyCheckpointCommand,
  type SaveStrategyCheckpointResult,
} from './strategy-checkpoint.service';

/**
 * Strategy Runtime application shell (US216–US220).
 * Composes Deployment + lifecycle + admission + evaluation behind
 * StrategyRuntimePort. No Orders, Risk, or Execution.
 */
@Injectable()
export class StrategyRuntimeService implements StrategyRuntimePort {
  constructor(
    @Inject(StrategyDeploymentService)
    private readonly deployments: StrategyDeploymentService,
    @Inject(SignalIntentService)
    private readonly signalIntents: SignalIntentService,
    @Inject(StrategyCheckpointService)
    private readonly checkpoints: StrategyCheckpointService,
    @Inject(RuntimeEvaluationService)
    private readonly evaluations: RuntimeEvaluationService,
    @Inject(RuntimeLifecycleCoordinator)
    private readonly lifecycle: RuntimeLifecycleCoordinator,
  ) {}

  async loadContext(query: LoadRuntimeContextQuery): Promise<RuntimeContext> {
    const workspaceId = required(query.workspaceId, 'workspace id');
    const sessionId = required(query.sessionId, 'session id');
    const deploymentId = required(query.deploymentId, 'deployment id');

    const deployment = await this.deployments.get(workspaceId, deploymentId);
    if (!deployment) {
      throw new Error('strategy deployment not found in workspace');
    }
    if (deployment.status !== StrategyDeploymentStatus.APPROVED) {
      throw new Error('runtime context requires an approved strategy deployment');
    }

    const checkpoint = await this.checkpoints.load(workspaceId, sessionId);
    return createRuntimeContext({
      workspaceId,
      sessionId,
      deployment,
      checkpoint,
    });
  }

  async getDiagnostics(workspaceId: string, sessionId: string): Promise<RuntimeDiagnostics> {
    const ws = required(workspaceId, 'workspace id');
    const sid = required(sessionId, 'session id');
    const checkpoint = await this.checkpoints.load(ws, sid);
    const snap = this.lifecycle.snapshot(ws, sid);
    return createRuntimeDiagnostics({
      workspaceId: ws,
      sessionId: sid,
      checkpoint,
      workerState: snap.state,
      acceptsTicks: snap.acceptsTicks,
    });
  }

  async getLifecycle(workspaceId: string, sessionId: string): Promise<RuntimeLifecycleSnapshot> {
    return this.lifecycle.snapshot(
      required(workspaceId, 'workspace id'),
      required(sessionId, 'session id'),
    );
  }

  arm(command: RuntimeLifecycleCommand): Promise<RuntimeLifecycleResult> {
    return this.lifecycle.arm(command);
  }

  pause(command: RuntimeLifecycleCommand): Promise<RuntimeLifecycleResult> {
    return this.lifecycle.pause(command);
  }

  resume(command: RuntimeLifecycleCommand): Promise<RuntimeLifecycleResult> {
    return this.lifecycle.resume(command);
  }

  stop(command: RuntimeLifecycleCommand): Promise<RuntimeLifecycleResult> {
    return this.lifecycle.stop(command);
  }

  async admitTick(command: AdmitTickCommand): Promise<TickAdmissionResult> {
    const workspaceId = required(command.workspaceId, 'workspace id');
    const sessionId = required(command.sessionId, 'session id');
    const nowIso = required(command.nowIso, 'nowIso');

    if (!this.lifecycle.canAcceptWork(workspaceId, sessionId)) {
      const snap = this.lifecycle.snapshot(workspaceId, sessionId);
      return Object.freeze({
        status: TickAdmissionStatus.REJECTED_RUNTIME_NOT_ARMED,
        admitted: false,
        reason: `runtime worker state ${snap.state} does not accept ticks`,
        eventId: command.event.eventId?.trim() ? command.event.eventId.trim() : null,
        streamId: command.event.streamId?.trim() ? command.event.streamId.trim() : null,
        sequence:
          typeof command.event.sequence === 'number' && Number.isInteger(command.event.sequence)
            ? command.event.sequence
            : null,
      });
    }

    const checkpoint = await this.checkpoints.load(workspaceId, sessionId);
    return admitClosedCandleTick({
      event: command.event,
      lease: command.lease,
      checkpoint,
      expectedSessionId: sessionId,
      expectedWorkspaceId: workspaceId,
      nowIso,
    });
  }

  async evaluate(command: EvaluateTickCommand): Promise<EvaluationResult> {
    const workspaceId = required(command.workspaceId, 'workspace id');
    const sessionId = required(command.sessionId, 'session id');

    if (!this.lifecycle.canAcceptWork(workspaceId, sessionId)) {
      const snap = this.lifecycle.snapshot(workspaceId, sessionId);
      const checkpoint = await this.checkpoints.load(workspaceId, sessionId);
      return evaluationRejectedLifecycle({
        reason: `runtime worker state ${snap.state} does not accept evaluation`,
        eventId: command.event.eventId?.trim() ? command.event.eventId.trim() : null,
        checkpoint,
      });
    }

    try {
      return await this.lifecycle.runEvaluation(workspaceId, sessionId, () =>
        this.evaluations.evaluate(command),
      );
    } catch (error) {
      if (error instanceof Error && /does not accept evaluation while/.test(error.message)) {
        const snap = this.lifecycle.snapshot(workspaceId, sessionId);
        const checkpoint = await this.checkpoints.load(workspaceId, sessionId);
        return evaluationRejectedLifecycle({
          reason: `runtime worker state ${snap.state} does not accept evaluation`,
          eventId: command.event.eventId?.trim() ? command.event.eventId.trim() : null,
          checkpoint,
        });
      }
      throw error;
    }
  }

  emitSignalIntent(command: EmitSignalIntentCommand): Promise<EmitSignalIntentResult> {
    return this.signalIntents.emit(command);
  }

  listSignalIntents(workspaceId: string, sessionId: string): Promise<SignalIntent[]> {
    return this.signalIntents.listBySession(workspaceId, sessionId);
  }

  saveCheckpoint(command: SaveStrategyCheckpointCommand): Promise<SaveStrategyCheckpointResult> {
    return this.checkpoints.save(command);
  }

  loadCheckpoint(workspaceId: string, sessionId: string): Promise<StrategyCheckpoint | null> {
    return this.checkpoints.load(workspaceId, sessionId);
  }
}

function required(value: string, label: string): string {
  const result = value.trim();
  if (result === '') throw new Error(`${label} is required`);
  return result;
}
