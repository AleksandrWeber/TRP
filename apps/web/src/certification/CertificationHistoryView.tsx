import { Link } from 'react-router-dom';
import type { CertificationAttemptView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import { certificationOutcomeLabel, certificationReasonLabel } from './certification-wizard';

export function CertificationHistoryView({
  items,
  loading,
  error,
}: {
  items: CertificationAttemptView[];
  loading: boolean;
  error: string | null;
}) {
  return (
    <section className="space-y-6" data-testid="certification-history">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Certification</p>
        <h2 className="mt-1 text-2xl font-semibold">Certification history</h2>
        <p className="mt-2 text-slate-400">
          Results of certify commands in this workspace. Library membership is updated only when an
          attempt is certified.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link to="/strategy-library/certify" className="text-sky-400 hover:text-sky-300">
          Certify a strategy
        </Link>
        <Link to="/strategy-library" className="text-sky-400 hover:text-sky-300">
          Strategy Library
        </Link>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading history…</p>}

      {!loading && items.length === 0 && (
        <p className="text-sm text-slate-500" data-testid="certification-history-empty">
          No certification attempts in this workspace.
        </p>
      )}

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.attemptId}>
            <Link
              to={`/strategy-library/certifications/${item.attemptId}`}
              data-testid="certification-attempt-link"
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-white/20"
            >
              <span>
                {item.metadata.name ?? 'Candidate'}{' '}
                <span className="text-slate-500">v{item.metadata.version ?? '—'}</span>
              </span>
              <span className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs">
                  {certificationOutcomeLabel(item.outcome)}
                </span>
                <span className="text-xs text-slate-500">{formatUtc(item.createdAt)}</span>
              </span>
            </Link>
            {item.reasons.length > 0 && (
              <p className="mt-1 px-3 text-xs text-rose-300">
                {item.reasons.map(certificationReasonLabel).join(' ')}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
