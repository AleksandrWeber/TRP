import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { StrategyDeploymentView, StrategyLibraryRecordView } from '../shared/api';
import { ErrorBanner, PageHeader } from '../shared/product-ui';
import {
  ORCHESTRATOR_WIZARD_STEPS,
  orchestrationProgressLabel,
  planComplete,
  selectionComplete,
  type OrchestratorProgress,
  type OrchestratorWizardDraft,
  type OrchestratorWizardStep,
} from './orchestration-wizard';

export function OrchestratorWizardView({
  step,
  draft,
  entries,
  deployments,
  loading,
  submitting,
  progress,
  error,
  onMarketSymbol,
  onExchangeScope,
  onObjective,
  onSelectEntry,
  onSelectDeployment,
  onTimeframe,
  onBack,
  onNext,
  onSubmit,
}: {
  step: OrchestratorWizardStep;
  draft: OrchestratorWizardDraft;
  entries: StrategyLibraryRecordView[];
  deployments: StrategyDeploymentView[];
  loading: boolean;
  submitting: boolean;
  progress: OrchestratorProgress | null;
  error: string | null;
  onMarketSymbol: (value: string) => void;
  onExchangeScope: (value: string) => void;
  onObjective: (value: string) => void;
  onSelectEntry: (entry: StrategyLibraryRecordView) => void;
  onSelectDeployment: (deployment: StrategyDeploymentView) => void;
  onTimeframe: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  const canNext =
    (step === 'plan' && planComplete(draft)) || (step === 'selection' && selectionComplete(draft));

  return (
    <section className="space-y-6" data-testid="orchestrator-wizard">
      <PageHeader
        productId="orchestrator"
        title="Request orchestration"
        description="Coordinate a certified paper selection and emit a Session Handoff Intent. Trading Orchestrator does not start a Trading Session, place orders, or approve risk."
        extraActions={[
          { to: '/orchestrator/plans', label: 'Plans' },
          { to: '/deployments', label: 'Deployment' },
        ]}
      />

      <ol
        className="flex flex-wrap gap-2 text-xs uppercase tracking-wide"
        aria-label="Orchestration progress"
      >
        {ORCHESTRATOR_WIZARD_STEPS.map((item) => (
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

      <ErrorBanner message={error} />

      {step === 'plan' && (
        <Panel title="Plan">
          <p className="text-sm text-slate-400">
            Describe the paper coordination target. This publishes an Orchestration Plan. It does
            not trade.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="text-slate-300">Market symbol</span>
              <input
                value={draft.marketSymbol}
                onChange={(event) => onMarketSymbol(event.target.value)}
                placeholder="BTCUSDT"
                data-testid="orchestrator-market-symbol"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-slate-300">Exchange Scope</span>
              <input
                value={draft.exchangeScopeId}
                onChange={(event) => onExchangeScope(event.target.value)}
                placeholder="binance-spot"
                data-testid="orchestrator-exchange-scope"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
              />
            </label>
          </div>
          <label className="mt-3 block space-y-1 text-sm">
            <span className="text-slate-300">Objective</span>
            <textarea
              value={draft.objective}
              onChange={(event) => onObjective(event.target.value)}
              data-testid="orchestrator-objective"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
              rows={3}
            />
          </label>
        </Panel>
      )}

      {step === 'selection' && (
        <>
          <Panel title="Certified Strategy Version">
            {loading && <p className="text-sm text-slate-500">Loading Strategy Library…</p>}
            {!loading && entries.length === 0 && (
              <p className="text-sm text-slate-500">
                No Strategy Versions in this workspace.{' '}
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
                    data-testid="orchestrator-library-candidate"
                    onClick={() => onSelectEntry(entry)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                      draft.entry?.version.libraryEntryId === entry.version.libraryEntryId
                        ? 'border-sky-400/50 bg-sky-500/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="font-medium">{entry.strategy.name}</span>
                    <span className="ml-2 text-slate-500">v{entry.version.version}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Approved Deployment">
            {!loading && deployments.length === 0 && (
              <p className="text-sm text-slate-500" data-testid="orchestrator-deployments-empty">
                No approved Deployments in this workspace.{' '}
                <Link to="/deployments/new" className="text-sky-400 hover:text-sky-300">
                  Create a Deployment
                </Link>
                . Orchestrator coordinates Deployments; it does not create them.
              </p>
            )}
            <ul className="space-y-2">
              {deployments.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    data-testid="orchestrator-deployment-candidate"
                    onClick={() => onSelectDeployment(item)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                      draft.deployment?.id === item.id
                        ? 'border-sky-400/50 bg-sky-500/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="font-medium">
                      {String(item.metadata.strategyName ?? 'Deployment')}
                    </span>
                    <span className="ml-2 text-slate-500">
                      {item.instrument} · {item.timeframe}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {draft.entry && (
              <label className="mt-4 block space-y-1 text-sm">
                <span className="text-slate-300">Timeframe</span>
                <input
                  value={draft.timeframe}
                  onChange={(event) => onTimeframe(event.target.value)}
                  data-testid="orchestrator-timeframe"
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                />
              </label>
            )}
          </Panel>
        </>
      )}

      {step === 'confirm' && (
        <Panel title="Confirm paper coordination">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Fact label="Market" value={draft.marketSymbol} />
            <Fact label="Exchange Scope" value={draft.exchangeScopeId} />
            <Fact
              label="Strategy"
              value={
                draft.entry ? `${draft.entry.strategy.name} v${draft.entry.version.version}` : '—'
              }
            />
            <Fact label="Deployment" value={draft.deployment?.id ?? '—'} />
            <Fact label="Mode" value="paper" />
            <Fact label="Creates Session" value="false" />
          </dl>
          <p className="mt-3 text-sm text-slate-400">{draft.objective}</p>
          {submitting && progress && (
            <p className="mt-3 text-sm text-slate-400" data-testid="orchestrator-progress">
              {orchestrationProgressLabel(progress)}
            </p>
          )}
        </Panel>
      )}

      <div className="flex flex-wrap gap-2">
        {step !== 'plan' && (
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Back
          </button>
        )}
        {step !== 'confirm' && (
          <button
            type="button"
            onClick={onNext}
            disabled={!canNext || submitting}
            data-testid="orchestrator-next"
            className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black disabled:opacity-50"
          >
            Next
          </button>
        )}
        {step === 'confirm' && (
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting || !selectionComplete(draft)}
            data-testid="orchestrator-submit"
            className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black disabled:opacity-50"
          >
            Emit handoff intent
          </button>
        )}
        <Link to="/orchestrator/plans" className="px-3 py-1.5 text-sm text-sky-400">
          Plans
        </Link>
        <Link to="/orchestrator/history" className="px-3 py-1.5 text-sm text-sky-400">
          History
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
