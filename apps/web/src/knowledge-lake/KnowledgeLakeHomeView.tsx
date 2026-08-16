import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { KnowledgeLakeListItemView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import { EmptyState, ErrorBanner, LoadingState, PageHeader } from '../shared/product-ui';
import {
  KNOWLEDGE_LAKE_CATEGORY_FILTERS,
  KNOWLEDGE_LAKE_MODE_FILTERS,
  modeBadgeLabel,
  type KnowledgeLakeCategoryFilter,
  type KnowledgeLakeModeFilter,
} from './knowledge-lake';

export function KnowledgeLakeHomeView({
  items,
  search,
  producer,
  category,
  mode,
  libraryEntryId,
  reportRunId,
  occurredFrom,
  occurredTo,
  loading,
  error,
  onSearch,
  onProducer,
  onCategory,
  onMode,
  onLibraryEntryId,
  onReportRunId,
  onOccurredFrom,
  onOccurredTo,
}: {
  items: KnowledgeLakeListItemView[];
  search: string;
  producer: string;
  category: KnowledgeLakeCategoryFilter;
  mode: KnowledgeLakeModeFilter;
  libraryEntryId: string;
  reportRunId: string;
  occurredFrom: string;
  occurredTo: string;
  loading: boolean;
  error: string | null;
  onSearch: (value: string) => void;
  onProducer: (value: string) => void;
  onCategory: (value: KnowledgeLakeCategoryFilter) => void;
  onMode: (value: KnowledgeLakeModeFilter) => void;
  onLibraryEntryId: (value: string) => void;
  onReportRunId: (value: string) => void;
  onOccurredFrom: (value: string) => void;
  onOccurredTo: (value: string) => void;
}) {
  return (
    <section className="space-y-6" data-testid="knowledge-lake-home">
      <PageHeader
        productId="knowledge-lake"
        title="Analytical warehouse"
        description="Read-only projections admitted into Knowledge Lake. These are analytical copies, not the ledger Source of Truth, and not the Research Knowledge page."
        extraActions={[
          { to: '/knowledge-lake/history', label: 'Ingestion history' },
          { to: '/knowledge', label: 'Research Knowledge' },
          { to: '/research', label: 'Research' },
        ]}
      />

      <ErrorBanner message={error} />

      <div className="flex flex-wrap items-end gap-3">
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">Search</span>
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Text, producer, payload, source"
            data-testid="knowledge-lake-search"
            className="w-full min-w-[16rem] rounded-lg border border-white/10 bg-black/30 px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">Source</span>
          <input
            value={producer}
            onChange={(event) => onProducer(event.target.value)}
            placeholder="Producer"
            data-testid="knowledge-lake-filter-source"
            className="w-full min-w-[10rem] rounded-lg border border-white/10 bg-black/30 px-3 py-2"
          />
        </label>
        <FilterSelect
          label="Type"
          testId="knowledge-lake-filter-type"
          value={category}
          options={KNOWLEDGE_LAKE_CATEGORY_FILTERS}
          onChange={onCategory}
        />
        <FilterSelect
          label="Mode"
          testId="knowledge-lake-filter-mode"
          value={mode}
          options={KNOWLEDGE_LAKE_MODE_FILTERS}
          onChange={onMode}
        />
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">Strategy</span>
          <input
            value={libraryEntryId}
            onChange={(event) => onLibraryEntryId(event.target.value)}
            placeholder="Library entry id"
            data-testid="knowledge-lake-filter-strategy"
            className="w-full min-w-[10rem] rounded-lg border border-white/10 bg-black/30 px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">Report</span>
          <input
            value={reportRunId}
            onChange={(event) => onReportRunId(event.target.value)}
            placeholder="Report run id"
            data-testid="knowledge-lake-filter-report"
            className="w-full min-w-[10rem] rounded-lg border border-white/10 bg-black/30 px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">From</span>
          <input
            type="date"
            value={occurredFrom}
            onChange={(event) => onOccurredFrom(event.target.value)}
            data-testid="knowledge-lake-filter-from"
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">To</span>
          <input
            type="date"
            value={occurredTo}
            onChange={(event) => onOccurredTo(event.target.value)}
            data-testid="knowledge-lake-filter-to"
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
          />
        </label>
      </div>

      {loading && <LoadingState label="Loading Knowledge Lake…" />}
      {!loading && items.length === 0 && (
        <EmptyState
          testId="knowledge-lake-empty"
          title="No analytical facts in this workspace."
          description="Knowledge Lake stores projections only; this page does not ingest or edit knowledge."
          actionTo="/reporting"
          actionLabel="Open Reporting"
        />
      )}

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.entryId}>
            <Link
              to={`/knowledge-lake/${item.entryId}`}
              data-testid="knowledge-lake-entry-link"
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-white/20"
            >
              <span>
                {item.producer} <span className="text-slate-500">{item.entryId}</span>
              </span>
              <span className="flex flex-wrap gap-2">
                <Badge>{item.category}</Badge>
                <Badge>{modeBadgeLabel(item.mode)}</Badge>
                <span className="text-xs text-slate-500">{formatUtc(item.occurredAt)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FilterSelect<T extends string>({
  label,
  testId,
  value,
  options,
  onChange,
}: {
  label: string;
  testId: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-slate-400">{label}</span>
      <select
        value={value}
        data-testid={testId}
        onChange={(event) => onChange(event.target.value as T)}
        className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-300">
      {children}
    </span>
  );
}
