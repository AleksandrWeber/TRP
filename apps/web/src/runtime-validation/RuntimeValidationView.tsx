import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { StrategyLibraryRecordView } from '../shared/api';

export function RuntimeValidationView({
  entries,
  selected,
  exchangeScopeId,
  loading,
  submitting,
  error,
  onSelect,
  onExchangeScope,
  onSubmit,
}: {
  entries: StrategyLibraryRecordView[];
  selected: StrategyLibraryRecordView | null;
  exchangeScopeId: string;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  onSelect: (entry: StrategyLibraryRecordView) => void;
  onExchangeScope: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <section className="space-y-6" data-testid="runtime-validation-page">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Runtime Validation</p>
        <h2 className="mt-1 text-2xl font-semibold">Validate a Strategy Version</h2>
        <p className="mt-2 text-slate-400">
          Run the fail-closed Runtime Enforcement Gate. This is a pre-check. It does not deploy,
          start a session, or override a FAIL.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <Panel title="Select Strategy Version">
        {loading && <p className="text-sm text-slate-500">Loading Strategy Library…</p>}
        {!loading && entries.length === 0 && (
          <p className="text-sm text-slate-500" data-testid="runtime-validation-empty">
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
                data-testid="validation-candidate"
                onClick={() => onSelect(entry)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                  selected?.version.libraryEntryId === entry.version.libraryEntryId
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

      <Panel title="Optional Exchange Scope">
        <p className="text-sm text-slate-400">
          If provided, the Gate checks the Library envelope allowlist. Leave blank to skip the scope
          check.
        </p>
        <label className="mt-3 block space-y-1 text-sm">
          <span className="text-slate-300">Exchange Scope id</span>
          <input
            value={exchangeScopeId}
            onChange={(event) => onExchangeScope(event.target.value)}
            placeholder="binance-spot"
            data-testid="validation-exchange-scope"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
          />
        </label>
      </Panel>

      {selected && (
        <Panel title="Read-only request">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Fact label="Library entry" value={selected.version.libraryEntryId} />
            <Fact label="Family" value={selected.strategy.strategyFamilyId} />
            <Fact label="Version" value={selected.version.version} />
            <Fact label="Purpose" value="deployment_bind (pre-check)" />
          </dl>
          {submitting && (
            <p className="mt-3 text-sm text-slate-400" data-testid="validation-progress">
              Running Runtime Validation…
            </p>
          )}
        </Panel>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || !selected}
          data-testid="validation-submit"
          className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black disabled:opacity-50"
        >
          Run validation
        </button>
        <Link to="/runtime-validation/history" className="px-3 py-1.5 text-sm text-sky-400">
          Validation history
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
