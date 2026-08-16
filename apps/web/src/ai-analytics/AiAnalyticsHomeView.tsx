import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { AiAnalyticsKind, AiAnalyticsListItemView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import { EmptyState, ErrorBanner, LoadingState, PageHeader } from '../shared/product-ui';
import { AI_ANALYTICS_GENERATE_KINDS, AI_ANALYTICS_KIND_FILTERS, kindLabel } from './ai-analytics';

export function AiAnalyticsHomeView({
  items,
  search,
  kind,
  reportRunId,
  libraryEntryId,
  generateKind,
  generateReportRunId,
  generateFocus,
  compareReportRunId,
  compareLibraryEntryId,
  generating,
  loading,
  error,
  onSearch,
  onKind,
  onReportRunId,
  onLibraryEntryId,
  onGenerateKind,
  onGenerateReportRunId,
  onGenerateFocus,
  onCompareReportRunId,
  onCompareLibraryEntryId,
  onGenerate,
}: {
  items: AiAnalyticsListItemView[];
  search: string;
  kind: 'all' | AiAnalyticsKind;
  reportRunId: string;
  libraryEntryId: string;
  generateKind: AiAnalyticsKind;
  generateReportRunId: string;
  generateFocus: string;
  compareReportRunId: string;
  compareLibraryEntryId: string;
  generating: boolean;
  loading: boolean;
  error: string | null;
  onSearch: (value: string) => void;
  onKind: (value: 'all' | AiAnalyticsKind) => void;
  onReportRunId: (value: string) => void;
  onLibraryEntryId: (value: string) => void;
  onGenerateKind: (value: AiAnalyticsKind) => void;
  onGenerateReportRunId: (value: string) => void;
  onGenerateFocus: (value: string) => void;
  onCompareReportRunId: (value: string) => void;
  onCompareLibraryEntryId: (value: string) => void;
  onGenerate: () => void;
}) {
  return (
    <section className="space-y-6" data-testid="ai-analytics-home">
      <PageHeader
        productId="ai-analytics"
        title="Analyses from existing data"
        description="Narrative and analysis only. AI Analytics does not own facts, reports, knowledge, or strategies, and it never authorizes trades. This is not the OpenRouter AI gateway."
        extraActions={[
          { to: '/reporting', label: 'Reporting' },
          { to: '/ai', label: 'AI gateway' },
        ]}
      />

      <ErrorBanner message={error} />

      <form
        className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-5"
        data-testid="ai-analytics-generate"
        onSubmit={(event) => {
          event.preventDefault();
          onGenerate();
        }}
      >
        <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">
          Generate from existing data
        </h3>
        <p className="text-sm text-slate-500">
          Uses an existing ReportRun. No manual authoring, no new storage, and no trading decisions.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block space-y-1 text-sm">
            <span className="text-slate-400">Kind</span>
            <select
              value={generateKind}
              data-testid="ai-analytics-generate-kind"
              onChange={(event) => onGenerateKind(event.target.value as AiAnalyticsKind)}
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            >
              {AI_ANALYTICS_GENERATE_KINDS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-slate-400">Report run</span>
            <input
              value={generateReportRunId}
              onChange={(event) => onGenerateReportRunId(event.target.value)}
              placeholder="Report run id"
              data-testid="ai-analytics-generate-report"
              className="w-full min-w-[12rem] rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-slate-400">Compare report</span>
            <input
              value={compareReportRunId}
              onChange={(event) => onCompareReportRunId(event.target.value)}
              placeholder="Optional second report"
              data-testid="ai-analytics-compare-report"
              className="w-full min-w-[12rem] rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-slate-400">Compare strategy</span>
            <input
              value={compareLibraryEntryId}
              onChange={(event) => onCompareLibraryEntryId(event.target.value)}
              placeholder="Optional library entry"
              data-testid="ai-analytics-compare-strategy"
              className="w-full min-w-[12rem] rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-slate-400">Focus</span>
            <input
              value={generateFocus}
              onChange={(event) => onGenerateFocus(event.target.value)}
              placeholder="Optional focus"
              className="w-full min-w-[12rem] rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            />
          </label>
          <button
            type="submit"
            disabled={generating}
            data-testid="ai-analytics-generate-submit"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            {generating ? 'Generating…' : 'Generate analysis'}
          </button>
        </div>
      </form>

      <div className="flex flex-wrap items-end gap-3">
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">Search</span>
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Text, kind, report"
            data-testid="ai-analytics-search"
            className="w-full min-w-[16rem] rounded-lg border border-white/10 bg-black/30 px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">Kind</span>
          <select
            value={kind}
            data-testid="ai-analytics-filter-kind"
            onChange={(event) => onKind(event.target.value as 'all' | AiAnalyticsKind)}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
          >
            {AI_ANALYTICS_KIND_FILTERS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">Report</span>
          <input
            value={reportRunId}
            onChange={(event) => onReportRunId(event.target.value)}
            placeholder="Report run id"
            data-testid="ai-analytics-filter-report"
            className="w-full min-w-[10rem] rounded-lg border border-white/10 bg-black/30 px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">Strategy</span>
          <input
            value={libraryEntryId}
            onChange={(event) => onLibraryEntryId(event.target.value)}
            placeholder="Library entry id"
            data-testid="ai-analytics-filter-strategy"
            className="w-full min-w-[10rem] rounded-lg border border-white/10 bg-black/30 px-3 py-2"
          />
        </label>
      </div>

      {loading && <LoadingState label="Loading AI Analytics…" />}
      {!loading && items.length === 0 && (
        <EmptyState
          testId="ai-analytics-empty"
          title="No analyses in this workspace."
          description="Generate from an existing ReportRun. AI Analytics does not author facts or store a new warehouse."
          actionTo="/reporting"
          actionLabel="Open Reporting"
        />
      )}

      <ul className="space-y-2" data-testid="ai-analytics-browser">
        {items.map((item) => (
          <li key={`${item.analysisId}-${item.kind}`}>
            <Link
              to={`/ai-analytics/${item.analysisId}`}
              data-testid="ai-analytics-entry-link"
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-white/20"
            >
              <span>
                {kindLabel(item.kind)} <span className="text-slate-500">{item.analysisId}</span>
              </span>
              <span className="flex flex-wrap gap-2">
                <Badge>{item.kind}</Badge>
                <Badge>narrative</Badge>
                <span className="text-xs text-slate-500">{formatUtc(item.createdAt)}</span>
              </span>
            </Link>
            <p className="mt-1 text-xs text-slate-500">{item.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-300">
      {children}
    </span>
  );
}
