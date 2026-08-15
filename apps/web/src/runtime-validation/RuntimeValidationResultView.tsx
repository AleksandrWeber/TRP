import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { RuntimeValidationView as RuntimeValidationRecord } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import { runtimeValidationOutcomeLabel, runtimeValidationReasonLabel } from './runtime-validation';

export function RuntimeValidationResultView({
  record,
  loading,
  error,
}: {
  record: RuntimeValidationRecord | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <section data-testid="runtime-validation-result">
        <p className="text-sm text-slate-500">Loading validation result…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4" data-testid="runtime-validation-result">
        <BackLinks />
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      </section>
    );
  }

  if (!record) {
    return (
      <section className="space-y-4" data-testid="runtime-validation-result">
        <BackLinks />
        <p className="text-sm text-slate-500">Runtime validation not found.</p>
      </section>
    );
  }

  const passed = record.outcome === 'pass';

  return (
    <section className="space-y-6" data-testid="runtime-validation-result">
      <BackLinks />
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Validation result</p>
        <h2 className="mt-1 text-2xl font-semibold">
          {runtimeValidationOutcomeLabel(record.outcome)}
        </h2>
        <p className="mt-2 text-slate-400">
          {passed
            ? 'The Gate passed. This does not start a Trading Session. Create a Deployment to bind this version.'
            : 'The Gate failed. There is no override. Deployment stays blocked until the Gate PASSes.'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <span
          data-testid="validation-outcome"
          className={`rounded-full border px-2 py-0.5 text-xs ${
            passed
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
          }`}
        >
          {runtimeValidationOutcomeLabel(record.outcome)}
        </span>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-400">
          {record.validation}
        </span>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-400">
          Progress: {record.progress}
        </span>
      </div>

      {record.reasons.length > 0 && (
        <Panel title="Deterministic reasons">
          <ul className="list-disc space-y-1 pl-5 text-sm text-rose-200">
            {record.reasons.map((reason) => (
              <li key={reason}>{runtimeValidationReasonLabel(reason)}</li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel title="Read-only validation details">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Fact label="Validation id" value={record.validationId} />
          <Fact label="Strategy Version" value={record.strategyVersion ?? '—'} />
          <Fact label="Strategy" value={record.strategyName ?? '—'} />
          <Fact label="Family" value={record.strategyFamilyId ?? '—'} />
          <Fact label="Library entry" value={record.libraryEntryId ?? '—'} />
          <Fact label="Checked at" value={formatUtc(record.checkedAt)} />
          <Fact label="Purpose" value={record.purpose} />
          <Fact label="Exchange Scope" value={record.exchangeScopeId ?? '—'} />
          <Fact label="Certification" value={record.certificationStatus ?? '—'} />
          <Fact label="Eligibility" value={record.eligibilityOutcome ?? '—'} />
        </dl>
        {record.libraryEntryId && (
          <Link
            to={`/strategy-library/${record.libraryEntryId}`}
            className="mt-3 inline-block text-sm text-sky-400 hover:text-sky-300"
          >
            View Strategy Version
          </Link>
        )}
        {passed && record.libraryEntryId && (
          <Link
            to={`/deployments/new?libraryEntryId=${encodeURIComponent(record.libraryEntryId)}`}
            data-testid="create-deployment-from-validation"
            className="mt-3 ml-4 inline-block text-sm text-sky-400 hover:text-sky-300"
          >
            Create Deployment
          </Link>
        )}
      </Panel>
    </section>
  );
}

function BackLinks() {
  return (
    <div className="flex flex-wrap gap-3 text-sm">
      <Link to="/runtime-validation/history" className="text-sky-400 hover:text-sky-300">
        Validation history
      </Link>
      <Link to="/runtime-validation" className="text-sky-400 hover:text-sky-300">
        Run another validation
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
