import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { KnowledgeLakeDetailView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import { buildProjectionExport, modeBadgeLabel } from './knowledge-lake';

export function KnowledgeLakeDetailView({
  record,
  loading,
  error,
  onExport,
}: {
  record: KnowledgeLakeDetailView | null;
  loading: boolean;
  error: string | null;
  onExport: (payload: string) => void;
}) {
  if (loading) {
    return (
      <section className="space-y-4" data-testid="knowledge-lake-detail">
        <BackLinks />
        <p className="text-sm text-slate-500">Loading entry…</p>
      </section>
    );
  }

  if (error || !record) {
    return (
      <section className="space-y-4" data-testid="knowledge-lake-detail">
        <BackLinks />
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error ?? 'Knowledge Lake entry not found.'}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6" data-testid="knowledge-lake-detail">
      <BackLinks />
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Knowledge Lake</p>
        <h2 className="mt-1 text-2xl font-semibold">{record.producer}</h2>
        <p className="mt-2 text-slate-400">
          Analytical copy. Not ledger Source of Truth. Knowledge Lake remains the warehouse owner.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Badge>{record.category}</Badge>
          <Badge>{modeBadgeLabel(record.mode)}</Badge>
          <Badge>projection</Badge>
        </div>
      </div>

      <Panel title="Entry details">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Fact label="Entry id" value={record.entryId} />
          <Fact label="Occurred" value={formatUtc(record.occurredAt)} />
          <Fact label="Admitted" value={formatUtc(record.admittedAt)} />
          <Fact label="Exchange scope" value={record.exchangeScopeId} />
          <Fact label="Trading session" value={record.tradingSessionId ?? '—'} />
          <Fact label="Correlation" value={record.correlationId ?? '—'} />
          <Fact label="Schema" value={record.schemaVersion} />
        </dl>
      </Panel>

      <Panel title="Metadata">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Fact label="Producer" value={record.producer} />
          <Fact label="Type" value={record.category} />
          <Fact label="Mode" value={modeBadgeLabel(record.mode)} />
          <Fact label="Workspace" value={record.workspaceId} />
          <Fact
            label="Source"
            value={record.sourceRef ? `${record.sourceRef.ownerType}:${record.sourceRef.id}` : '—'}
          />
        </dl>
      </Panel>

      <Panel title="Provenance">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Fact label="Ownership chain" value={record.provenance.ownershipChain.join(' → ')} />
          <Fact label="Mutates source" value={String(record.provenance.mutatesSource)} />
          <Fact label="Producer" value={record.provenance.producer} />
          <Fact label="Admitted at" value={formatUtc(record.provenance.admittedAt)} />
        </dl>
      </Panel>

      <Panel title="References">
        {record.references.length === 0 ? (
          <p className="text-sm text-slate-500">No source references on this projection.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {record.references.map((ref) => (
              <li key={`${ref.ownerType}:${ref.id}`}>
                {ref.ownerType} · {ref.id}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Relationship viewer">
        {record.relationships.length === 0 ? (
          <p className="text-sm text-slate-500">No related projections for this entry.</p>
        ) : (
          <ul className="space-y-2">
            {record.relationships.map((row) => (
              <li key={`${row.kind}:${row.relatedEntryId}`}>
                <Link
                  to={`/knowledge-lake/${row.relatedEntryId}`}
                  className="text-sky-400 hover:text-sky-300"
                >
                  {row.relatedEntryId}
                </Link>
                <span className="ml-2 text-sm text-slate-500">{row.reason}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Connected Reports">
        {record.connectedReports.length === 0 ? (
          <p className="text-sm text-slate-500">No ReportRuns cite this projection.</p>
        ) : (
          <ul className="space-y-2">
            {record.connectedReports.map((row) => (
              <li key={row.reportRunId}>
                <Link to={row.href} className="text-sky-400 hover:text-sky-300">
                  {row.name}
                </Link>
                <span className="ml-2 text-sm text-slate-500">{row.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Connected AI Narratives">
        {record.connectedNarratives.length === 0 ? (
          <p className="text-sm text-slate-500">
            No connected reports. Knowledge Lake does not author AI narratives.
          </p>
        ) : (
          <ul className="space-y-2">
            {record.connectedNarratives.map((row) => (
              <li key={row.reportRunId}>
                <Link to={row.href} className="text-sky-400 hover:text-sky-300">
                  Open narrative on Reporting
                </Link>
                <span className="ml-2 text-sm text-slate-500">reference only</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Connected Research">
        {record.connectedResearch.length === 0 ? (
          <p className="text-sm text-slate-500">
            No research source references on this projection.
          </p>
        ) : (
          <ul className="space-y-2">
            {record.connectedResearch.map((row) => (
              <li key={`${row.ownerType}:${row.id}`}>
                {row.href ? (
                  <Link to={row.href} className="text-sky-400 hover:text-sky-300">
                    {row.ownerType} · {row.id}
                  </Link>
                ) : (
                  <span>
                    {row.ownerType} · {row.id}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Connected Strategies">
        {record.connectedStrategies.length === 0 ? (
          <p className="text-sm text-slate-500">
            No Strategy Library reference on this projection.
          </p>
        ) : (
          <ul className="space-y-2">
            {record.connectedStrategies.map((row) => (
              <li key={row.libraryEntryId}>
                <Link to={row.href} className="text-sky-400 hover:text-sky-300">
                  {row.libraryEntryId}
                </Link>
                <span className="ml-2 text-sm text-slate-500">
                  {row.present ? 'library lookup' : 'cited only'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Connected Qualification / Profile / State">
        {record.connectedMarket.length === 0 ? (
          <p className="text-sm text-slate-500">
            No Qualification, Profile, or Market State references on this projection.
          </p>
        ) : (
          <ul className="space-y-2">
            {record.connectedMarket.map((row) => (
              <li key={`${row.kind}:${row.id}`}>
                {row.href ? (
                  <Link to={row.href} className="text-sky-400 hover:text-sky-300">
                    {row.kind} · {row.id}
                  </Link>
                ) : (
                  <span>
                    {row.kind} · {row.id}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Payload">
        <pre className="overflow-auto rounded-lg bg-black/30 p-3 text-xs text-slate-300">
          {JSON.stringify(record.payload, null, 2)}
        </pre>
      </Panel>

      <div>
        <button
          type="button"
          data-testid="knowledge-lake-export"
          onClick={() => onExport(buildProjectionExport(record))}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black"
        >
          Export projection (JSON)
        </button>
        <p className="mt-2 text-xs text-slate-500">
          Existing analytical projection only. Not a new export format and not a PDF engine.
        </p>
      </div>
    </section>
  );
}

function BackLinks() {
  return (
    <div className="flex flex-wrap gap-3 text-sm">
      <Link to="/knowledge-lake" className="text-sky-400 hover:text-sky-300">
        Knowledge Lake home
      </Link>
      <Link to="/knowledge-lake/history" className="text-sky-400 hover:text-sky-300">
        History
      </Link>
      <Link to="/research" className="text-sky-400 hover:text-sky-300">
        Research
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

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-300">
      {children}
    </span>
  );
}
