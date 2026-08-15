import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { StrategyLibraryRecordView } from '../shared/api';
import {
  DEPLOYMENT_WIZARD_STEPS,
  PAPER_DEPLOYMENT_DEFAULTS,
  allowedSymbols,
  allowedTimeframes,
  pointComplete,
  type DeploymentWizardDraft,
  type DeploymentWizardStep,
} from './deployment-wizard';

export function DeploymentWizardView({
  step,
  draft,
  entries,
  loading,
  submitting,
  error,
  onSelect,
  onInstrument,
  onTimeframe,
  onNotes,
  onBack,
  onNext,
  onSubmit,
}: {
  step: DeploymentWizardStep;
  draft: DeploymentWizardDraft;
  entries: StrategyLibraryRecordView[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
  onSelect: (entry: StrategyLibraryRecordView) => void;
  onInstrument: (value: string) => void;
  onTimeframe: (value: string) => void;
  onNotes: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  const canNext =
    (step === 'version' && draft.entry !== null) || (step === 'point' && pointComplete(draft));

  return (
    <section className="space-y-6" data-testid="deployment-wizard">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Deployment</p>
        <h2 className="mt-1 text-2xl font-semibold">Create a Deployment</h2>
        <p className="mt-2 text-slate-400">
          Bind a certified Library version as an immutable paper Deployment. The Runtime Enforcement
          Gate must PASS. This does not start a Trading Session.
        </p>
      </div>

      <ol
        className="flex flex-wrap gap-2 text-xs uppercase tracking-wide"
        aria-label="Deployment progress"
      >
        {DEPLOYMENT_WIZARD_STEPS.map((item) => (
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

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {step === 'version' && (
        <Panel title="Select Library Version">
          {loading && <p className="text-sm text-slate-500">Loading Strategy Library…</p>}
          {!loading && entries.length === 0 && (
            <p className="text-sm text-slate-500" data-testid="deployment-empty-library">
              No certified Strategy Versions in this workspace.{' '}
              <Link to="/strategy-library/certify" className="text-sky-400 hover:text-sky-300">
                Certify a strategy
              </Link>
              .
            </p>
          )}
          <ul className="space-y-2">
            {entries.map((entry) => (
              <li key={entry.version.libraryEntryId}>
                <button
                  type="button"
                  data-testid="deployment-candidate"
                  onClick={() => onSelect(entry)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                    draft.entry?.version.libraryEntryId === entry.version.libraryEntryId
                      ? 'border-sky-400/50 bg-sky-500/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="font-medium">{entry.strategy.name}</span>
                  <span className="ml-2 text-slate-500">v{entry.version.version}</span>
                  <span className="ml-2 text-xs text-slate-500">{entry.membershipStatus}</span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {step === 'point' && draft.entry && (
        <Panel title="Envelope point">
          <p className="text-sm text-slate-400">
            Instrument and timeframe must stay inside the Library tactical envelope. The Gate checks
            this on create.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="text-slate-300">Instrument</span>
              <select
                value={draft.instrument}
                onChange={(event) => onInstrument(event.target.value)}
                data-testid="deployment-instrument"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
              >
                {allowedSymbols(draft.entry).map((symbol) => (
                  <option key={symbol} value={symbol}>
                    {symbol}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-slate-300">Timeframe</span>
              <select
                value={draft.timeframe}
                onChange={(event) => onTimeframe(event.target.value)}
                data-testid="deployment-timeframe"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
              >
                {allowedTimeframes(draft.entry).map((timeframe) => (
                  <option key={timeframe} value={timeframe}>
                    {timeframe}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Panel>
      )}

      {step === 'confirm' && draft.entry && (
        <Panel title="Confirm paper Deployment">
          <p className="text-sm text-amber-200">
            Create writes a draft Deployment. Approve is a separate step. Neither starts a session.
            There is no automatic deploy.
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <Fact label="Strategy" value={draft.entry.strategy.name} />
            <Fact label="Library Version" value={draft.entry.version.version} />
            <Fact label="Library entry" value={draft.entry.version.libraryEntryId} />
            <Fact label="Instrument" value={draft.instrument} />
            <Fact label="Timeframe" value={draft.timeframe} />
            <Fact label="Market data" value={PAPER_DEPLOYMENT_DEFAULTS.marketDataSourceId} />
            <Fact
              label="Paper execution"
              value={PAPER_DEPLOYMENT_DEFAULTS.paperExecutionConfigurationId}
            />
            <Fact
              label="Risk policy"
              value={`${PAPER_DEPLOYMENT_DEFAULTS.riskPolicyId} v${PAPER_DEPLOYMENT_DEFAULTS.riskPolicyVersion}`}
            />
          </dl>
          <label className="mt-4 block space-y-1 text-sm">
            <span className="text-slate-300">Notes (optional metadata)</span>
            <textarea
              value={draft.notes}
              onChange={(event) => onNotes(event.target.value)}
              rows={2}
              data-testid="deployment-notes"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            />
          </label>
          {submitting && (
            <p className="mt-3 text-sm text-slate-400" data-testid="deployment-progress">
              Creating Deployment and running Runtime Validation…
            </p>
          )}
        </Panel>
      )}

      <div className="flex flex-wrap gap-2">
        {step !== 'version' && (
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 disabled:opacity-50"
          >
            Back
          </button>
        )}
        {step !== 'confirm' && (
          <button
            type="button"
            onClick={onNext}
            disabled={!canNext}
            data-testid="wizard-next"
            className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black disabled:opacity-50"
          >
            Continue
          </button>
        )}
        {step === 'confirm' && (
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting || !draft.entry}
            data-testid="wizard-submit"
            className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black disabled:opacity-50"
          >
            Create Deployment
          </button>
        )}
        <Link to="/deployments" className="px-3 py-1.5 text-sm text-sky-400">
          Deployment list
        </Link>
        <Link to="/deployments/history" className="px-3 py-1.5 text-sm text-sky-400">
          Deployment history
        </Link>
      </div>
    </section>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-all text-sm text-slate-200">{value}</dd>
    </div>
  );
}
