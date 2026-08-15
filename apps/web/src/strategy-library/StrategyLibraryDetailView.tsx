import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { StrategyLibraryEligibilityView, StrategyLibraryRecordView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import {
  eligibilityBadgeClass,
  envelopeBadgeClass,
  formatRiskPerTrade,
  formatUniverse,
  membershipBadgeClass,
  membershipLabel,
} from './library-browser';

export function StrategyLibraryDetailView({
  record,
  eligibility,
  error,
  loading,
}: {
  record: StrategyLibraryRecordView | null;
  eligibility: StrategyLibraryEligibilityView | null;
  error: string | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <section data-testid="strategy-library-detail">
        <p className="text-sm text-slate-500">Loading version…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4" data-testid="strategy-library-detail">
        <BackLink />
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      </section>
    );
  }

  if (!record) {
    return (
      <section className="space-y-4" data-testid="strategy-library-detail">
        <BackLink />
        <p className="text-sm text-slate-500">Library entry not found.</p>
      </section>
    );
  }

  const envelope = record.tacticalEnvelope;
  const liveOutcome = eligibility?.outcome ?? record.eligibility?.outcome ?? null;

  return (
    <section className="space-y-6" data-testid="strategy-library-detail">
      <div className="flex flex-wrap gap-3 text-sm">
        <BackLink />
        <Link
          to={`/runtime-validation?libraryEntryId=${encodeURIComponent(record.version.libraryEntryId)}`}
          data-testid="run-runtime-validation"
          className="text-sky-400 hover:text-sky-300"
        >
          Run Runtime Validation
        </Link>
        <Link
          to={`/deployments/new?libraryEntryId=${encodeURIComponent(record.version.libraryEntryId)}`}
          data-testid="create-deployment"
          className="text-sky-400 hover:text-sky-300"
        >
          Create Deployment
        </Link>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Immutable version</p>
        <h2 className="mt-1 text-2xl font-semibold">
          {record.strategy.name} <span className="text-slate-400">v{record.version.version}</span>
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Certified Library membership. This version cannot be edited.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge
          label={membershipLabel(record.membershipStatus)}
          className={membershipBadgeClass(record.membershipStatus)}
        />
        <Badge
          label={
            liveOutcome === 'eligible'
              ? 'Eligible'
              : liveOutcome === 'ineligible'
                ? 'Ineligible'
                : 'Eligibility unknown'
          }
          className={eligibilityBadgeClass(liveOutcome)}
        />
        <Badge
          label={record.envelopeState === 'present' ? 'Envelope present' : 'Envelope empty'}
          className={envelopeBadgeClass(record.envelopeState)}
        />
      </div>

      <dl className="grid gap-4 rounded-xl border border-white/10 bg-white/5 p-5 sm:grid-cols-2">
        <Fact label="Library entry" value={record.version.libraryEntryId} />
        <Fact label="Family" value={record.strategy.strategyFamilyId} />
        <Fact label="Content hash" value={record.version.contentHash} />
        <Fact label="Market" value={record.version.market} />
        <Fact label="Created" value={formatUtc(record.version.createdAt)} />
        <Fact label="Scopes" value={record.version.supportedExchangeScopeIds.join(', ')} />
        <Fact label="Timeframes" value={record.version.supportedTimeframes.join(', ')} />
        <Fact label="Universe" value={formatUniverse(record.version.supportedUniverse)} />
      </dl>

      <Panel title="Certification">
        {record.certification ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <Fact label="Status" value={record.certification.status} />
            <Fact label="Decision" value={record.certification.decision} />
            <Fact label="Certified at" value={formatUtc(record.certification.certifiedAt)} />
            <Fact label="Certified by" value={record.certification.certifiedBy} />
            <Fact
              label="Evidence"
              value={
                record.certification.evidence.length === 0
                  ? 'None'
                  : record.certification.evidence.map((item) => item.type).join(', ')
              }
            />
            {record.certification.notes && (
              <Fact label="Notes" value={record.certification.notes} />
            )}
          </dl>
        ) : (
          <p className="text-sm text-slate-500">Not certified.</p>
        )}
      </Panel>

      <Panel title="Eligibility">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Fact label="Live check" value={eligibility?.outcome ?? 'unavailable'} />
          <Fact
            label="Reasons"
            value={(eligibility?.reasons ?? record.eligibility?.reasons ?? []).join(', ') || '—'}
          />
          <Fact label="Stored outcome" value={record.eligibility?.outcome ?? 'none'} />
          <Fact
            label="Checked at"
            value={eligibility?.checkedAt ? formatUtc(eligibility.checkedAt) : '—'}
          />
        </dl>
      </Panel>

      <Panel title="Tactical envelope">
        {envelope ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <Fact label="Version" value={envelope.envelopeVersion} />
            <Fact label="Markets" value={envelope.allowedMarkets.join(', ')} />
            <Fact label="Scopes" value={envelope.allowedExchangeScopeIds.join(', ')} />
            <Fact label="Symbols" value={envelope.allowedSymbols.join(', ')} />
            <Fact label="Timeframes" value={envelope.allowedTimeframes.join(', ')} />
            <Fact label="Risk per trade" value={formatRiskPerTrade(envelope.riskPerTrade)} />
            <Fact
              label="Max positions"
              value={`${envelope.maxPositions.min}–${envelope.maxPositions.max}`}
            />
          </dl>
        ) : (
          <p className="text-sm text-slate-500">No envelope bound to this version.</p>
        )}
      </Panel>
    </section>
  );
}

function BackLink() {
  return (
    <Link to="/strategy-library" className="text-sm text-sky-400 hover:text-sky-300">
      Back to Strategy Library
    </Link>
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

function Badge({ label, className }: { label: string; className: string }) {
  return <span className={`rounded-full border px-2 py-0.5 text-xs ${className}`}>{label}</span>;
}
