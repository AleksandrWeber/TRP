import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { StrategyDeploymentView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import {
  deploymentGateReasonLabel,
  deploymentStatusLabel,
  gateOutcomeLabel,
} from './deployment-wizard';

export function DeploymentDetailView({
  record,
  loading,
  error,
  approving,
  onApprove,
}: {
  record: StrategyDeploymentView | null;
  loading: boolean;
  error: string | null;
  approving: boolean;
  onApprove: () => void;
}) {
  if (loading) {
    return (
      <section data-testid="deployment-detail">
        <p className="text-sm text-slate-500">Loading Deployment…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4" data-testid="deployment-detail">
        <BackLinks />
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      </section>
    );
  }

  if (!record) {
    return (
      <section className="space-y-4" data-testid="deployment-detail">
        <BackLinks />
        <p className="text-sm text-slate-500">Deployment not found.</p>
      </section>
    );
  }

  const approved = record.status === 'approved';
  const gate = record.enforcementAuthorization;
  const passed = gate?.outcome === 'pass';

  return (
    <section className="space-y-6" data-testid="deployment-detail">
      <BackLinks />
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Deployment details</p>
        <h2 className="mt-1 text-2xl font-semibold">
          {String(record.metadata.strategyName ?? 'Deployment')}{' '}
          <span className="text-slate-400">v{record.strategyVersion}</span>
        </h2>
        <p className="mt-2 text-slate-400">
          Paper Deployment workflow. Approve freezes configuration. This does not start a Trading
          Session.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <span
          data-testid="deployment-status"
          className={`rounded-full border px-2 py-0.5 text-xs ${
            approved
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-sky-500/30 bg-sky-500/10 text-sky-200'
          }`}
        >
          {deploymentStatusLabel(record.status)}
        </span>
        <span
          data-testid="deployment-gate"
          className={`rounded-full border px-2 py-0.5 text-xs ${
            passed
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-white/10 text-slate-400'
          }`}
        >
          Runtime Validation {gateOutcomeLabel(gate)}
        </span>
      </div>

      <Panel title="Library Version">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Fact label="Version" value={record.strategyVersion} />
          <Fact label="Library entry" value={record.libraryEntryId ?? '—'} />
          <Fact
            label="Family"
            value={String(record.metadata.strategyFamilyId ?? record.strategyId)}
          />
          <Fact label="Research registry" value={record.strategyId} />
        </dl>
        {record.libraryEntryId && (
          <Link
            to={`/strategy-library/${record.libraryEntryId}`}
            className="mt-3 inline-block text-sm text-sky-400 hover:text-sky-300"
          >
            View Strategy Version
          </Link>
        )}
        {approved && (
          <Link
            to={`/orchestrator?deploymentId=${record.id}${
              record.libraryEntryId ? `&libraryEntryId=${record.libraryEntryId}` : ''
            }`}
            data-testid="orchestrate-deployment-link"
            className="mt-3 ml-4 inline-block text-sm text-sky-400 hover:text-sky-300"
          >
            Orchestrate this Deployment
          </Link>
        )}
      </Panel>

      <Panel title="Runtime Validation result">
        {gate ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <Fact label="Outcome" value={gateOutcomeLabel(gate)} />
            <Fact label="Validation" value={gate.validation} />
            <Fact label="Checked at" value={formatUtc(gate.checkedAt)} />
            <Fact label="Certification" value={gate.certificationStatus ?? '—'} />
            <Fact label="Eligibility" value={gate.eligibilityOutcome ?? '—'} />
            <Fact label="Purpose" value={gate.purpose} />
          </dl>
        ) : (
          <p className="text-sm text-slate-500">No Gate stamp on this Deployment.</p>
        )}
        {gate && gate.reasons.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-rose-200">
            {gate.reasons.map((reason) => (
              <li key={reason}>{deploymentGateReasonLabel(reason)}</li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Deployment metadata">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Fact label="Deployment id" value={record.id} />
          <Fact label="Status" value={deploymentStatusLabel(record.status)} />
          <Fact label="Instrument" value={record.instrument} />
          <Fact label="Timeframe" value={record.timeframe} />
          <Fact label="Exchange Scope" value={record.exchangeScopeId} />
          <Fact label="Configuration hash" value={record.configurationHash} />
          <Fact label="Market data" value={record.marketDataSourceId} />
          <Fact label="Paper execution" value={record.paperExecutionConfigurationId} />
          <Fact label="Risk policy" value={`${record.riskPolicyId} v${record.riskPolicyVersion}`} />
          <Fact label="Created" value={formatUtc(record.createdAt)} />
          <Fact label="Recorded" value={formatUtc(record.recordedAt)} />
          <Fact
            label="Approved at"
            value={record.approvedAt ? formatUtc(record.approvedAt) : '—'}
          />
          <Fact label="Approved by" value={record.approvedByActorId ?? '—'} />
          {typeof record.metadata.notes === 'string' && record.metadata.notes && (
            <Fact label="Notes" value={record.metadata.notes} />
          )}
        </dl>
      </Panel>

      {!approved && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onApprove}
            disabled={approving}
            data-testid="approve-deployment"
            className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black disabled:opacity-50"
          >
            Approve Deployment
          </button>
          {approving && (
            <p className="px-3 py-1.5 text-sm text-slate-400" data-testid="approve-progress">
              Approving and re-checking the Gate…
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function BackLinks() {
  return (
    <div className="flex flex-wrap gap-3 text-sm">
      <Link to="/deployments" className="text-sky-400 hover:text-sky-300">
        Deployment list
      </Link>
      <Link to="/deployments/history" className="text-sky-400 hover:text-sky-300">
        Deployment history
      </Link>
      <Link to="/deployments/new" className="text-sky-400 hover:text-sky-300">
        Create another
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
