import { Link } from 'react-router-dom';
import type { TradingSessionBotView } from '../shared/api';
import type { OrchestrationReferenceView } from './orchestration-reference';
import { sessionActionAvailability, type SessionLifecycleAction } from './session-commands';

export function SessionDetailView({
  session,
  loading,
  error,
  orchestration,
  commandsDisabled,
  onRequestAction,
}: {
  session: TradingSessionBotView | null;
  loading: boolean;
  error: string | null;
  orchestration: OrchestrationReferenceView | null;
  commandsDisabled: boolean;
  onRequestAction: (action: SessionLifecycleAction, sessionId: string) => void;
}) {
  if (loading) {
    return (
      <section data-testid="session-detail">
        <p className="text-sm text-slate-500">Loading session…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4" data-testid="session-detail">
        <BackLinks />
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="space-y-4" data-testid="session-detail">
        <BackLinks />
        <p className="text-sm text-slate-500">Trading session not found.</p>
      </section>
    );
  }

  const availability = sessionActionAvailability(session);
  const health = session.health;
  const runtime = session.runtimeStatus;
  const deploymentId = session.deploymentReference?.deploymentId ?? session.mission.deploymentId;

  return (
    <section className="space-y-6" data-testid="session-detail">
      <BackLinks />
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Paper session</p>
        <h2 className="mt-1 text-2xl font-semibold">{session.id}</h2>
        <p className="mt-2 text-slate-400">
          Bot id ≡ Trading Session id. Lifecycle commands wait for Trading Session confirmation.
          Paper only.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge label={session.status} />
        <Badge label={`Origin ${session.origin}`} />
        {health?.leasePresent ? <Badge label="Lease present" /> : <Badge label="No lease" />}
      </div>

      <dl className="grid gap-2 sm:grid-cols-2" data-testid="session-health">
        <Field label="Lifecycle" value={health?.lifecycleStatus ?? session.status} />
        <Field
          label="Failure reason"
          value={health?.failureReason ?? session.failureReason ?? '—'}
        />
        <Field label="Paper account" value={session.paperAccountId} />
        <Field label="Exchange Scope" value={session.exchangeScopeId} />
        <Field label="Lease owner" value={session.leaseOwnerId ?? '—'} />
        <Field label="Recorded at" value={session.recordedAt} />
      </dl>

      <div data-testid="session-runtime">
        <h3 className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Runtime status
        </h3>
        <dl className="mt-2 grid gap-2 sm:grid-cols-2">
          <Field label="Worker state" value={runtime?.workerState ?? 'IDLE'} />
          <Field label="Accepts ticks" value={runtime?.acceptsTicks ? 'yes' : 'no'} />
          <Field
            label="Runtime fence"
            value={runtime?.fencingToken != null ? String(runtime.fencingToken) : '—'}
          />
          <Field label="Evaluation enabled" value={runtime?.evaluationEnabled ? 'yes' : 'no'} />
        </dl>
      </div>

      <div data-testid="session-deployment-reference">
        <h3 className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Deployment reference
        </h3>
        <p className="mt-2 text-sm text-slate-300">
          <Link to={`/deployments/${deploymentId}`} className="text-sky-400 hover:text-sky-300">
            {deploymentId}
          </Link>
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Deployment remains the bind owner. Command Center does not approve or mutate it.
        </p>
      </div>

      <div data-testid="session-orchestration-reference">
        <h3 className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Orchestration reference
        </h3>
        {orchestration ? (
          <div className="mt-2 space-y-1 text-sm text-slate-300">
            <p>
              Handoff{' '}
              <Link
                to={`/orchestrator/runs/${orchestration.orchestrationRunId}`}
                className="text-sky-400 hover:text-sky-300"
              >
                {orchestration.sessionHandoffIntentId}
              </Link>
            </p>
            <p className="text-xs text-slate-500">Creates Session: false</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-400">
            No Session Handoff Intent is bound to this Deployment. Orchestrator remains coordination
            only.{' '}
            <Link to="/orchestrator" className="text-sky-400 hover:text-sky-300">
              Open Orchestrator
            </Link>
          </p>
        )}
      </div>

      <div data-testid="session-latest-report">
        <h3 className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Latest report
        </h3>
        {session.latestReport ? (
          <>
            <dl className="mt-2 grid gap-2 sm:grid-cols-2">
              <Field label="Report run" value={session.latestReport.reportRunId} />
              <Field label="Status" value={session.latestReport.status} />
              <Field
                label="Narrative"
                value={
                  session.latestReport.narrativeUnavailable
                    ? 'unavailable'
                    : session.latestReport.narrativeAttached
                      ? 'attached'
                      : 'not attached'
                }
              />
            </dl>
            <Link
              to={`/reporting/${session.latestReport.reportRunId}`}
              className="mt-2 inline-block text-sm text-sky-400 hover:text-sky-300"
              data-testid="session-open-report"
            >
              Open in Reporting
            </Link>
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-400">No report run for this session yet.</p>
        )}
        <p className="mt-1 text-xs text-slate-500">
          Reporting remains the report owner. This panel is a projection only.
        </p>
      </div>

      <div data-testid="session-delivery">
        <h3 className="text-sm font-medium uppercase tracking-wide text-slate-500">Delivery</h3>
        {session.delivery ? (
          <dl className="mt-2 grid gap-2 sm:grid-cols-2">
            <Field label="Delivery id" value={session.delivery.deliveryId} />
            <Field label="Outcome" value={session.delivery.outcome} />
            <Field
              label="Telegram adapter"
              value={session.delivery.telegramAdapterReached ? 'reached' : 'not reached'}
            />
            <Field
              label="Skip reasons"
              value={
                session.delivery.skipReasons.length > 0
                  ? session.delivery.skipReasons.join(', ')
                  : '—'
              }
            />
          </dl>
        ) : (
          <p className="mt-2 text-sm text-slate-400">No delivery recorded for this session yet.</p>
        )}
        <p className="mt-1 text-xs text-slate-500">
          Notification remains the delivery owner. Command Center does not send notifications.
        </p>
      </div>

      <div className="flex flex-wrap gap-2" data-testid="session-detail-actions">
        <ActionButton
          label="Start"
          testId="session-detail-start"
          disabled={commandsDisabled || availability.start !== 'available'}
          onClick={() => onRequestAction('start', session.id)}
        />
        <ActionButton
          label="Pause"
          testId="session-detail-pause"
          disabled={commandsDisabled || availability.pause !== 'available'}
          onClick={() => onRequestAction('pause', session.id)}
        />
        <ActionButton
          label="Resume"
          testId="session-detail-resume"
          disabled={commandsDisabled || availability.resume !== 'available'}
          onClick={() => onRequestAction('resume', session.id)}
        />
        <ActionButton
          label="Stop"
          testId="session-detail-stop"
          danger
          disabled={commandsDisabled || availability.stop !== 'available'}
          onClick={() => onRequestAction('stop', session.id)}
        />
      </div>
    </section>
  );
}

function BackLinks() {
  return (
    <p className="text-sm text-slate-500">
      <Link to="/command-center" className="text-sky-400 hover:text-sky-300">
        Command Center
      </Link>
    </p>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/15 px-2 py-0.5 text-xs uppercase text-slate-300">
      {label}
    </span>
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
