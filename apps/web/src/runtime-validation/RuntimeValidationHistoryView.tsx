import { Link } from 'react-router-dom';
import type { RuntimeValidationView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import { runtimeValidationOutcomeLabel, runtimeValidationReasonLabel } from './runtime-validation';

export function RuntimeValidationHistoryView({
  items,
  loading,
  error,
}: {
  items: RuntimeValidationView[];
  loading: boolean;
  error: string | null;
}) {
  return (
    <section className="space-y-6" data-testid="runtime-validation-history">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Runtime Validation</p>
        <h2 className="mt-1 text-2xl font-semibold">Validation history</h2>
        <p className="mt-2 text-slate-400">
          Gate results in this workspace. PASS / FAIL is owned by Runtime Enforcement. This list
          does not deploy.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link to="/runtime-validation" className="text-sky-400 hover:text-sky-300">
          Run validation
        </Link>
        <Link to="/strategy-library" className="text-sky-400 hover:text-sky-300">
          Strategy Library
        </Link>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading history…</p>}

      {!loading && items.length === 0 && (
        <p className="text-sm text-slate-500" data-testid="runtime-validation-history-empty">
          No Runtime Validation results in this workspace.
        </p>
      )}

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.validationId}>
            <Link
              to={`/runtime-validation/${item.validationId}`}
              data-testid="validation-history-link"
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-white/20"
            >
              <span>
                {item.strategyName ?? 'Strategy Version'}{' '}
                <span className="text-slate-500">v{item.strategyVersion ?? '—'}</span>
              </span>
              <span className="flex flex-wrap gap-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs ${
                    item.outcome === 'pass'
                      ? 'border-emerald-500/30 text-emerald-300'
                      : 'border-rose-500/30 text-rose-300'
                  }`}
                >
                  {runtimeValidationOutcomeLabel(item.outcome)}
                </span>
                <span className="text-xs text-slate-500">{formatUtc(item.checkedAt)}</span>
              </span>
            </Link>
            {item.reasons.length > 0 && (
              <p className="mt-1 px-3 text-xs text-rose-300">
                {item.reasons.map(runtimeValidationReasonLabel).join(' ')}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
