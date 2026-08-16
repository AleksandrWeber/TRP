import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Strategy } from '../shared/api';
import { ErrorBanner, PageHeader } from '../shared/product-ui';
import {
  CERTIFICATION_WIZARD_STEPS,
  OPTIONAL_EVIDENCE_TYPES,
  REQUIRED_EVIDENCE_TYPES,
  evidenceChecklistComplete,
  type CertificationWizardDraft,
  type CertificationWizardStep,
  type EvidenceDraft,
} from './certification-wizard';

export function CertificationWizardView({
  step,
  draft,
  candidates,
  loading,
  submitting,
  error,
  onSelectCandidate,
  onVersion,
  onNotes,
  onEvidence,
  onBack,
  onNext,
  onSubmit,
}: {
  step: CertificationWizardStep;
  draft: CertificationWizardDraft;
  candidates: Strategy[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
  onSelectCandidate: (strategy: Strategy) => void;
  onVersion: (value: string) => void;
  onNotes: (value: string) => void;
  onEvidence: (evidence: EvidenceDraft[]) => void;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  const canNext =
    (step === 'candidate' && draft.candidate !== null) ||
    (step === 'evidence' && evidenceChecklistComplete(draft.evidence));

  return (
    <section className="space-y-6" data-testid="certification-wizard">
      <PageHeader
        productId="certification"
        title="Certify a strategy"
        description="Admit a research candidate into Strategy Library as an immutable certified version. This cannot be undone or hot-edited. Library remains the source of truth."
        extraActions={[{ to: '/strategies', label: 'Research strategies' }]}
      />

      <ol
        className="flex flex-wrap gap-2 text-xs uppercase tracking-wide"
        aria-label="Certification progress"
      >
        {CERTIFICATION_WIZARD_STEPS.map((item) => (
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

      {step === 'candidate' && (
        <Panel title="Select research candidate">
          {loading && <p className="text-sm text-slate-500">Loading research strategies…</p>}
          {!loading && candidates.length === 0 && (
            <p className="text-sm text-slate-500">
              No research strategies in this workspace.{' '}
              <Link to="/strategies" className="text-sky-400 hover:text-sky-300">
                Create one
              </Link>
              .
            </p>
          )}
          <ul className="space-y-2">
            {candidates.map((strategy) => (
              <li key={strategy.id}>
                <button
                  type="button"
                  data-testid="certify-candidate"
                  onClick={() => onSelectCandidate(strategy)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                    draft.candidate?.id === strategy.id
                      ? 'border-sky-400/50 bg-sky-500/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="font-medium">{strategy.name}</span>
                  <span className="ml-2 text-slate-500">
                    {strategy.tradingPair} · {strategy.timeframe}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {step === 'evidence' && (
        <Panel title="Evidence checklist">
          <p className="text-sm text-slate-400">
            Certification stores references only. Research keeps the evidence bodies. Backtesting
            and walk-forward are required.
          </p>
          <div className="mt-4 space-y-3">
            {[...REQUIRED_EVIDENCE_TYPES, ...OPTIONAL_EVIDENCE_TYPES].map((type) => {
              const current = draft.evidence.find((item) => item.type === type);
              const required = (REQUIRED_EVIDENCE_TYPES as readonly string[]).includes(type);
              return (
                <label key={type} className="block space-y-1 text-sm">
                  <span className="text-slate-300">
                    {type}
                    {required ? ' (required)' : ' (optional)'}
                  </span>
                  <input
                    value={current?.sourceId ?? ''}
                    onChange={(event) =>
                      onEvidence(upsertEvidence(draft.evidence, type, event.target.value))
                    }
                    placeholder={`${type} artifact id`}
                    data-testid={`evidence-${type}`}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                  />
                </label>
              );
            })}
          </div>
        </Panel>
      )}

      {step === 'confirm' && draft.candidate && (
        <Panel title="Confirm irreversible admit">
          <p className="text-sm text-amber-200">
            Certifying writes an immutable Library version. You cannot edit the certified algorithm
            or recertify this version in place.
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <Fact label="Candidate" value={draft.candidate.name} />
            <Fact label="Registry" value={draft.candidate.id} />
            <Fact
              label="Market"
              value={`${draft.candidate.tradingPair} · ${draft.candidate.timeframe}`}
            />
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Version</dt>
              <dd className="mt-1">
                <input
                  value={draft.version}
                  onChange={(event) => onVersion(event.target.value)}
                  data-testid="certify-version"
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                />
              </dd>
            </div>
          </dl>
          <label className="mt-4 block space-y-1 text-sm">
            <span className="text-slate-300">Notes (optional)</span>
            <textarea
              value={draft.notes}
              onChange={(event) => onNotes(event.target.value)}
              rows={2}
              data-testid="certify-notes"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            />
          </label>
          {submitting && (
            <p className="mt-3 text-sm text-slate-400" data-testid="certify-progress">
              Validating evidence and admitting into Strategy Library…
            </p>
          )}
        </Panel>
      )}

      <div className="flex flex-wrap gap-2">
        {step !== 'candidate' && (
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
            disabled={submitting || !draft.candidate}
            data-testid="wizard-submit"
            className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black disabled:opacity-50"
          >
            Certify into Library
          </button>
        )}
        <Link to="/strategy-library/certifications" className="px-3 py-1.5 text-sm text-sky-400">
          Certification history
        </Link>
      </div>
    </section>
  );
}

function upsertEvidence(
  existing: EvidenceDraft[],
  type: string,
  sourceId: string,
): EvidenceDraft[] {
  const next = existing.filter((item) => item.type !== type);
  if (sourceId.trim()) next.push({ type, sourceId });
  return next;
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
      <dd className="mt-1 text-sm text-slate-200">{value}</dd>
    </div>
  );
}
