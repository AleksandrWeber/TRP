import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { AiAnalyticsDetailView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import { kindLabel } from './ai-analytics';

export function AiAnalyticsDetailView({
  record,
  loading,
  error,
}: {
  record: AiAnalyticsDetailView | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <section className="space-y-4" data-testid="ai-analytics-detail">
        <BackLinks />
        <p className="text-sm text-slate-500">Loading analysis…</p>
      </section>
    );
  }

  if (error || !record) {
    return (
      <section className="space-y-4" data-testid="ai-analytics-detail">
        <BackLinks />
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error ?? 'AI analysis not found.'}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6" data-testid="ai-analytics-detail">
      <BackLinks />
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">AI Analytics</p>
        <h2 className="mt-1 text-2xl font-semibold">{kindLabel(record.kind)}</h2>
        <p className="mt-2 text-slate-400">
          Explanation, not an order. AI owns analysis only. Source of Truth wins on conflict.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Badge>{record.kind}</Badge>
          <Badge>narrative</Badge>
          <Badge>not Source of Truth</Badge>
        </div>
      </div>

      <Panel title="Narrative details">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Fact label="Analysis id" value={record.analysisId} />
          <Fact label="Created" value={formatUtc(record.createdAt)} />
          <Fact label="Report run" value={record.reportRunId ?? '—'} />
          <Fact label="Modes" value={record.modesCovered.join(', ') || '—'} />
        </dl>
        <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-sm text-slate-200">
          {record.text}
        </pre>
        <p className="mt-3 text-xs text-slate-500">{record.disclaimer}</p>
      </Panel>

      <Panel title="Recommendations">
        <ul className="space-y-2 text-sm">
          {record.recommendations.map((row) => (
            <li key={row.recommendationId}>
              {row.href ? (
                <Link to={row.href} className="text-sky-400 hover:text-sky-300">
                  {row.text}
                </Link>
              ) : (
                <span>{row.text}</span>
              )}
              <span className="ml-2 text-xs text-slate-500">
                forcesTrade={String(row.forcesTrade)}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Insights">
        <ul className="space-y-2 text-sm">
          {record.insights.map((row) => (
            <li key={row.insightId}>
              <span className="text-slate-500">{row.kind}:</span> {row.text}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Reasoning">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Fact label="Provider" value={record.reasoning.provider} />
          <Fact label="Model" value={record.reasoning.modelId} />
          <Fact label="Template" value={record.reasoning.templateVersion} />
          <Fact label="Method" value={record.reasoning.method} />
          <Fact label="Owns facts" value={String(record.reasoning.ownsFacts)} />
          <Fact label="Owns reports" value={String(record.reasoning.ownsReports)} />
        </dl>
      </Panel>

      <Panel title="Source viewer">
        {record.sources.length === 0 ? (
          <p className="text-sm text-slate-500">No source references on this narrative.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {record.sources.map((ref) => (
              <li key={`${ref.ownerType}:${ref.id}`}>
                {ref.href ? (
                  <Link to={ref.href} className="text-sky-400 hover:text-sky-300">
                    {ref.ownerType} · {ref.id}
                  </Link>
                ) : (
                  <span>
                    {ref.ownerType} · {ref.id}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Provenance">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Fact label="Ownership chain" value={record.provenance.ownershipChain.join(' → ')} />
          <Fact label="Mutates source" value={String(record.provenance.mutatesSource)} />
          <Fact label="Source of Truth" value={String(record.provenance.sourceOfTruth)} />
          <Fact label="Forces trade" value={String(record.provenance.forcesTrade)} />
        </dl>
      </Panel>

      <Panel title="Knowledge references">
        {record.knowledgeRefs.length === 0 ? (
          <p className="text-sm text-slate-500">No Knowledge Lake citations on this analysis.</p>
        ) : (
          <ul className="space-y-2">
            {record.knowledgeRefs.map((row) => (
              <li key={row.entryId}>
                <Link to={row.href} className="text-sky-400 hover:text-sky-300">
                  {row.entryId}
                </Link>
                <span className="ml-2 text-sm text-slate-500">
                  {row.present ? 'warehouse lookup' : 'cited only'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Report references">
        {record.reportRefs.length === 0 ? (
          <p className="text-sm text-slate-500">No ReportRun attached. AI does not own reports.</p>
        ) : (
          <ul className="space-y-2">
            {record.reportRefs.map((row) => (
              <li key={row.reportRunId}>
                <Link to={row.href} className="text-sky-400 hover:text-sky-300">
                  {row.name}
                </Link>
                <span className="ml-2 text-sm text-slate-500">
                  {row.status} · ownsReport={String(row.ownsReport)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Strategy references">
        {record.strategyRefs.length === 0 ? (
          <p className="text-sm text-slate-500">
            No Strategy Library citation. AI does not edit strategies.
          </p>
        ) : (
          <ul className="space-y-2">
            {record.strategyRefs.map((row) => (
              <li key={row.libraryEntryId}>
                <Link to={row.href} className="text-sky-400 hover:text-sky-300">
                  {row.libraryEntryId}
                </Link>
                <span className="ml-2 text-sm text-slate-500">
                  {row.present ? 'library lookup' : 'cited only'} · ownsStrategy=
                  {String(row.ownsStrategy)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Market / session references">
        {record.marketRefs.length === 0 ? (
          <p className="text-sm text-slate-500">
            No Qualification, Profile, Market State, Deployment, or Session citations.
          </p>
        ) : (
          <ul className="space-y-2">
            {record.marketRefs.map((row) => (
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

      {record.comparison && (
        <Panel title="Comparison view">
          <p className="text-sm text-slate-500">
            Side-by-side narratives over existing reports. Comparison does not own either report and
            does not force trades.
          </p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <Fact label="Left report" value={record.comparison.leftReportRunId} />
            <Fact label="Right report" value={record.comparison.rightReportRunId} />
          </dl>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <pre className="whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-xs text-slate-300">
              {record.comparison.leftText}
            </pre>
            <pre className="whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-xs text-slate-300">
              {record.comparison.rightText}
            </pre>
          </div>
          {record.comparison.slices.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm">
              {record.comparison.slices.map((slice) => (
                <li key={slice.metricKey}>
                  {slice.metricKey}: {String(slice.leftValue)} → {String(slice.rightValue)} (delta{' '}
                  {String(slice.delta)})
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}
    </section>
  );
}

function BackLinks() {
  return (
    <div className="flex flex-wrap gap-3 text-sm">
      <Link to="/ai-analytics" className="text-sky-400 hover:text-sky-300">
        AI Analytics home
      </Link>
      <Link to="/ai-analytics/history" className="text-sky-400 hover:text-sky-300">
        History
      </Link>
      <Link to="/research" className="text-sky-400 hover:text-sky-300">
        Research
      </Link>
      <Link to="/ai" className="text-sky-400 hover:text-sky-300">
        AI gateway
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
