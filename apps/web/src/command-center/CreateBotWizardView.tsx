import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { StrategyDeploymentView } from '../shared/api';
import {
  CREATE_BOT_WIZARD_STEPS,
  accountComplete,
  createBotProgressLabel,
  createBotReady,
  type CreateBotProgress,
  type CreateBotWizardDraft,
  type CreateBotWizardStep,
} from './create-bot-wizard';

export function CreateBotWizardView({
  step,
  draft,
  deployments,
  loading,
  submitting,
  progress,
  error,
  onSelectDeployment,
  onCurrency,
  onOpeningCapital,
  onBack,
  onNext,
  onSubmit,
}: {
  step: CreateBotWizardStep;
  draft: CreateBotWizardDraft;
  deployments: StrategyDeploymentView[];
  loading: boolean;
  submitting: boolean;
  progress: CreateBotProgress | null;
  error: string | null;
  onSelectDeployment: (deployment: StrategyDeploymentView) => void;
  onCurrency: (value: string) => void;
  onOpeningCapital: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  const canNext =
    (step === 'deployment' && Boolean(draft.deployment)) ||
    (step === 'account' && accountComplete(draft));

  return (
    <section className="space-y-6" data-testid="create-bot-wizard">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Command Center</p>
        <h2 className="mt-1 text-2xl font-semibold">Create paper bot</h2>
        <p className="mt-2 text-slate-400">
          Start a paper Trading Session from an approved Deployment. Command Center is command UI
          only. Trading Session remains the Session owner. After start, paper runtime reacts to
          market events. This does not authorize live trading.
        </p>
      </div>

      <ol
        className="flex flex-wrap gap-2 text-xs uppercase tracking-wide"
        aria-label="Create bot progress"
      >
        {CREATE_BOT_WIZARD_STEPS.map((item) => (
          <li
            key={item}
            data-testid={`wizard-step-${item}`}
            className={`rounded-full border px-3 py-1 ${
              item === step
                ? 'border-sky-400/50 bg-sky-500/10 text-sky-200'
                : 'border-white/10 text-slate-500'
            }`}
          >
            {item}
          </li>
        ))}
      </ol>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {step === 'deployment' && (
        <Panel title="Approved Deployment">
          <p className="text-sm text-slate-400">
            Bind uses the existing Session create command. Draft Deployments cannot start a session.
          </p>
          {loading ? <p className="mt-3 text-sm text-slate-500">Loading Deployments…</p> : null}
          {!loading && deployments.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              No approved Deployments.{' '}
              <Link to="/deployments" className="text-sky-400 hover:text-sky-300">
                Open Deployment
              </Link>
            </p>
          ) : null}
          <ul className="mt-4 space-y-2">
            {deployments.map((deployment) => {
              const selected = draft.deployment?.id === deployment.id;
              return (
                <li key={deployment.id}>
                  <button
                    type="button"
                    data-testid={`create-bot-deployment-${deployment.id}`}
                    onClick={() => onSelectDeployment(deployment)}
                    className={`w-full rounded-lg border px-3 py-3 text-left text-sm ${
                      selected
                        ? 'border-sky-500/40 bg-sky-500/10'
                        : 'border-white/10 hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className="font-medium text-slate-100">{deployment.id}</span>
                    <p className="mt-1 text-xs text-slate-500">
                      {deployment.instrument} · {deployment.timeframe} · {deployment.status}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      {step === 'account' && (
        <Panel title="Paper account">
          <p className="text-sm text-slate-400">
            Creates a durable paper account through the existing Paper Account owner, then binds the
            Session to it.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="text-slate-300">Currency</span>
              <input
                value={draft.currency}
                onChange={(event) => onCurrency(event.target.value)}
                data-testid="create-bot-currency"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-slate-300">Opening capital</span>
              <input
                value={draft.openingCapital}
                onChange={(event) => onOpeningCapital(event.target.value)}
                data-testid="create-bot-opening-capital"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
              />
            </label>
          </div>
        </Panel>
      )}

      {step === 'confirm' && (
        <Panel title="Confirm paper start">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <Field label="Deployment" value={draft.deployment?.id ?? '—'} />
            <Field label="Origin" value="strategy" />
            <Field label="Currency" value={draft.currency} />
            <Field label="Opening capital" value={draft.openingCapital} />
          </dl>
          <p className="mt-3 text-xs text-slate-500">
            Pause, resume, and stop remain Session commands after start. Orchestrator does not
            create this Session.
          </p>
        </Panel>
      )}

      {progress ? (
        <p className="text-sm text-sky-200" data-testid="create-bot-progress">
          {createBotProgressLabel(progress)}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {step !== 'deployment' ? (
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="rounded border border-white/15 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-40"
          >
            Back
          </button>
        ) : (
          <Link
            to="/command-center"
            className="rounded border border-white/15 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            Cancel
          </Link>
        )}
        {step !== 'confirm' ? (
          <button
            type="button"
            onClick={onNext}
            disabled={!canNext || submitting}
            data-testid="create-bot-next"
            className="rounded border border-sky-500/40 px-3 py-2 text-sm text-sky-200 hover:bg-sky-500/10 disabled:opacity-40"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={!createBotReady(draft) || submitting}
            data-testid="create-bot-submit"
            className="rounded border border-sky-500/40 px-3 py-2 text-sm text-sky-200 hover:bg-sky-500/10 disabled:opacity-40"
          >
            {submitting ? 'Starting…' : 'Create and start'}
          </button>
        )}
      </div>
    </section>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-sm font-medium uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
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
