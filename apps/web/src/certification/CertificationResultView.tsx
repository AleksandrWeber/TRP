import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { CertificationAttemptView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import { certificationOutcomeLabel, certificationReasonLabel } from './certification-wizard';

export function CertificationResultView({
  record,
  loading,
  error,
}: {
  record: CertificationAttemptView | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <section data-testid="certification-result">
        <p className="text-sm text-slate-500">Loading certification result…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4" data-testid="certification-result">
        <BackLinks />
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      </section>
    );
  }

  if (!record) {
    return (
      <section className="space-y-4" data-testid="certification-result">
        <BackLinks />
        <p className="text-sm text-slate-500">Certification attempt not found.</p>
      </section>
    );
  }

  const certified = record.outcome === 'certified';

  return (
    <section className="space-y-6" data-testid="certification-result">
      <BackLinks />
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Certification result</p>
        <h2 className="mt-1 text-2xl font-semibold">{certificationOutcomeLabel(record.outcome)}</h2>
        <p className="mt-2 text-slate-400">
          {certified
            ? 'The candidate is now an immutable certified version in Strategy Library.'
            : 'The candidate was not admitted. Library membership is unchanged.'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <span
          className={`rounded-full border px-2 py-0.5 text-xs ${
            certified
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
          }`}
        >
          {certificationOutcomeLabel(record.outcome)}
        </span>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-400">
          Progress: {record.progress}
        </span>
      </div>

      {record.reasons.length > 0 && (
        <Panel title="Failure reasons">
          <ul className="list-disc space-y-1 pl-5 text-sm text-rose-200">
            {record.reasons.map((reason) => (
              <li key={reason}>{certificationReasonLabel(reason)}</li>
            ))}
          </ul>
        </Panel>
      )}

      {certified && (
        <Panel title="Success summary">
          <p className="text-sm text-slate-300">
            Certified version {record.metadata.version} of {record.metadata.name}. Open Strategy
            Library to see the certification badge.
          </p>
          {record.libraryEntryId && (
            <Link
              to={`/strategy-library/${record.libraryEntryId}`}
              data-testid="view-library-entry"
              className="mt-3 inline-block text-sm text-sky-400 hover:text-sky-300"
            >
              View in Strategy Library
            </Link>
          )}
        </Panel>
      )}

      <Panel title="Certification metadata">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Fact label="Attempt" value={record.attemptId} />
          <Fact label="Certification id" value={record.certificationId ?? '—'} />
          <Fact label="Library entry" value={record.libraryEntryId ?? '—'} />
          <Fact label="Certified by" value={record.certifiedBy} />
          <Fact label="Created" value={formatUtc(record.createdAt)} />
          <Fact
            label="Certified at"
            value={record.certifiedAt ? formatUtc(record.certifiedAt) : '—'}
          />
          <Fact label="Family" value={record.metadata.strategyFamilyId ?? '—'} />
          <Fact label="Content hash" value={record.metadata.contentHash ?? '—'} />
          <Fact label="Registry ref" value={record.metadata.registryRef ?? '—'} />
          <Fact label="Evidence" value={record.metadata.evidenceTypes.join(', ') || 'None'} />
          <Fact label="Envelope" value={record.metadata.envelopeVersion ?? '—'} />
          {record.notes && <Fact label="Notes" value={record.notes} />}
        </dl>
      </Panel>
    </section>
  );
}

function BackLinks() {
  return (
    <div className="flex flex-wrap gap-3 text-sm">
      <Link to="/strategy-library/certifications" className="text-sky-400 hover:text-sky-300">
        Certification history
      </Link>
      <Link to="/strategy-library/certify" className="text-sky-400 hover:text-sky-300">
        Certify another
      </Link>
    </div>
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
