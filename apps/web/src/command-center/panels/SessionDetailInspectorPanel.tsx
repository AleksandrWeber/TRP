import { Link } from 'react-router-dom';
import type { TradingSessionBotView } from '../../shared/api';
import { OpsPanelFrame } from '../components/OpsPanelFrame';
import type { OrchestrationReferenceView } from '../orchestration-reference';
import { sessionActionAvailability, type SessionLifecycleAction } from '../session-commands';
import type { OpsPanelProps } from '../types';

type Props = OpsPanelProps & {
  session?: TradingSessionBotView | null;
  orchestration?: OrchestrationReferenceView | null;
  onClearSelection?: () => void;
  onRequestAction?: (action: SessionLifecycleAction, sessionId: string) => void;
  commandsDisabled?: boolean;
};

export function SessionDetailInspectorPanel({
  presentation = 'empty',
  errorMessage,
  session = null,
  orchestration = null,
  onClearSelection,
  onRequestAction,
  commandsDisabled = false,
}: Props) {
  const availability = session ? sessionActionAvailability(session) : null;
  const deploymentId = session?.deploymentReference?.deploymentId ?? session?.mission.deploymentId;
  const health = session?.health;
  const runtime = session?.runtimeStatus;

  return (
    <OpsPanelFrame
      panelId="P7"
      title="Session / Bot Detail"
      presentation={presentation}
      placeholderMessage="Session detail inspector is not connected yet."
      emptyTitle="Select a bot/session"
      emptyDescription="Detail opens on selection from Bot Overview or Active Sessions. Progressive disclosure only."
      errorMessage={errorMessage}
      skeletonRows={5}
    >
      {session ? (
        <div className="space-y-3 text-sm" data-testid="cc-p7-content">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-base font-medium text-slate-100">{session.id}</p>
              <p className="mt-1 text-xs text-slate-500">
                Bot id ≡ Trading Session id · commands wait for backend confirmation
              </p>
            </div>
            {onClearSelection ? (
              <button
                type="button"
                onClick={onClearSelection}
                className="text-xs text-slate-400 hover:text-slate-200 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
                data-testid="cc-p7-clear"
              >
                Clear selection
              </button>
            ) : null}
          </div>
          <dl className="grid gap-2 sm:grid-cols-2">
            <Field label="Lifecycle status" value={health?.lifecycleStatus ?? session.status} />
            <Field label="Health lease" value={health?.leasePresent ? 'present' : 'missing'} />
            <Field label="Runtime worker" value={runtime?.workerState ?? 'IDLE'} />
            <Field label="Accepts ticks" value={runtime?.acceptsTicks ? 'yes' : 'no'} />
            <Field label="Exchange Scope" value={session.exchangeScopeId} />
            <Field label="Paper account" value={session.paperAccountId} />
            <Field label="Origin" value={session.origin} />
            <Field
              label="Failure reason"
              value={health?.failureReason ?? session.failureReason ?? '—'}
            />
            <Field label="Recorded at" value={session.recordedAt} />
          </dl>
          <p className="text-xs text-slate-400" data-testid="cc-p7-deployment">
            Deployment reference{' '}
            <Link to={`/deployments/${deploymentId}`} className="text-sky-400 hover:text-sky-300">
              {deploymentId}
            </Link>
          </p>
          <p className="text-xs text-slate-400" data-testid="cc-p7-orchestration">
            {orchestration ? (
              <>
                Orchestration handoff{' '}
                <Link
                  to={`/orchestrator/runs/${orchestration.orchestrationRunId}`}
                  className="text-sky-400 hover:text-sky-300"
                >
                  {orchestration.sessionHandoffIntentId}
                </Link>
                <span className="ml-2 text-slate-500">createsSession: false</span>
              </>
            ) : (
              <>
                No orchestration handoff for this Deployment.{' '}
                <Link to="/orchestrator" className="text-sky-400 hover:text-sky-300">
                  Open Orchestrator
                </Link>
              </>
            )}
          </p>
          <p className="text-xs text-slate-400" data-testid="cc-p7-report">
            {session.latestReport ? (
              <>
                Latest report{' '}
                <Link
                  to={`/reporting/${session.latestReport.reportRunId}`}
                  className="text-sky-400 hover:text-sky-300"
                >
                  {session.latestReport.reportRunId}
                </Link>
                {` · ${session.latestReport.status}`}
                {session.latestReport.narrativeUnavailable
                  ? ' · narrative unavailable'
                  : session.latestReport.narrativeAttached
                    ? ' · narrative attached'
                    : ''}
              </>
            ) : (
              'No report run for this session yet.'
            )}
          </p>
          <p className="text-xs text-slate-400" data-testid="cc-p7-delivery">
            {session.delivery
              ? `Delivery ${session.delivery.outcome}${
                  session.delivery.telegramAdapterReached ? ' · Telegram adapter reached' : ''
                }`
              : 'No delivery recorded for this session yet.'}
          </p>
          <div className="flex flex-wrap gap-2" data-testid="cc-p7-actions">
            <ActionButton
              label="Start"
              testId="cc-p7-start"
              disabled={commandsDisabled || availability?.start !== 'available'}
              onClick={() => onRequestAction?.('start', session.id)}
            />
            <ActionButton
              label="Pause"
              testId="cc-p7-pause"
              disabled={commandsDisabled || availability?.pause !== 'available'}
              onClick={() => onRequestAction?.('pause', session.id)}
            />
            <ActionButton
              label="Resume"
              testId="cc-p7-resume"
              disabled={commandsDisabled || availability?.resume !== 'available'}
              onClick={() => onRequestAction?.('resume', session.id)}
            />
            <ActionButton
              label="Stop"
              testId="cc-p7-stop"
              danger
              disabled={commandsDisabled || availability?.stop !== 'available'}
              onClick={() => onRequestAction?.('stop', session.id)}
            />
            <Link
              to={`/command-center/sessions/${session.id}`}
              className="rounded border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
              data-testid="cc-p7-monitor"
            >
              Monitor
            </Link>
          </div>
        </div>
      ) : null}
    </OpsPanelFrame>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/10 px-3 py-2">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 break-all text-slate-200">{value}</dd>
    </div>
  );
}

function ActionButton({
  label,
  testId,
  onClick,
  disabled,
  danger = false,
}: {
  label: string;
  testId: string;
  onClick: () => void;
  disabled: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      className={`rounded border px-3 py-1.5 text-xs focus:outline focus:outline-2 focus:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? 'border-red-500/40 text-red-200 hover:bg-red-500/10 focus:outline-red-400'
          : 'border-white/15 text-slate-300 hover:bg-white/5 focus:outline-sky-400'
      }`}
    >
      {label}
    </button>
  );
}
