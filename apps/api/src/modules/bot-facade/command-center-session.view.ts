import type { SessionHandoffConsumeView, SessionOperatorProjection } from '../product-flow';
import type { RuntimeDiagnostics } from '../strategy-runtime';
import type { RuntimeLifecycleSnapshot } from '../strategy-runtime/domain/runtime-lifecycle';
import type { BotView } from './domain/bot-view';

/**
 * PC-13 — Command Center operations projection over an existing Bot / Session.
 * Not a second Session store. Runtime fields are consumer reads.
 */
export type SessionHealthView = Readonly<{
  lifecycleStatus: string;
  leasePresent: boolean;
  failureReason: string | null;
}>;

export type SessionRuntimeStatusView = Readonly<{
  workerState: string;
  acceptsTicks: boolean;
  fencingToken: number | null;
  evaluationEnabled: boolean;
}>;

export type SessionDeploymentReferenceView = Readonly<{
  deploymentId: string;
}>;

export type CommandCenterSessionView = BotView &
  Readonly<{
    health: SessionHealthView;
    runtimeStatus: SessionRuntimeStatusView;
    deploymentReference: SessionDeploymentReferenceView;
    sessionHandoff: SessionHandoffConsumeView | null;
    latestReport: SessionOperatorProjection['latestReport'];
    delivery: SessionOperatorProjection['delivery'];
  }>;

export function toSessionHealthView(bot: BotView): SessionHealthView {
  return Object.freeze({
    lifecycleStatus: bot.status,
    leasePresent: bot.leaseOwnerId !== null && bot.fencingToken !== null,
    failureReason: bot.failureReason,
  });
}

export function toSessionRuntimeStatusView(
  lifecycle: RuntimeLifecycleSnapshot | null,
  diagnostics: RuntimeDiagnostics | null,
): SessionRuntimeStatusView {
  return Object.freeze({
    workerState: lifecycle?.state ?? diagnostics?.workerState ?? 'IDLE',
    acceptsTicks: lifecycle?.acceptsTicks ?? diagnostics?.acceptsTicks ?? false,
    fencingToken: lifecycle?.fencingToken ?? null,
    evaluationEnabled: diagnostics?.evaluationEnabled ?? true,
  });
}

export function toCommandCenterSessionView(
  bot: BotView,
  lifecycle: RuntimeLifecycleSnapshot | null,
  diagnostics: RuntimeDiagnostics | null,
  sessionHandoff: SessionHandoffConsumeView | null = null,
  operatorProjection: SessionOperatorProjection | null = null,
): CommandCenterSessionView {
  return Object.freeze({
    ...bot,
    health: toSessionHealthView(bot),
    runtimeStatus: toSessionRuntimeStatusView(lifecycle, diagnostics),
    deploymentReference: Object.freeze({ deploymentId: bot.mission.deploymentId }),
    sessionHandoff,
    latestReport: operatorProjection?.latestReport ?? null,
    delivery: operatorProjection?.delivery ?? null,
  });
}
