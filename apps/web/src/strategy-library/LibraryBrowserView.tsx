import { Link } from 'react-router-dom';
import type { LibraryMembershipStatus, StrategyLibraryRecordView } from '../shared/api';
import { EmptyState, ErrorBanner, LoadingState, PageHeader } from '../shared/product-ui';
import {
  eligibilityBadgeClass,
  envelopeBadgeClass,
  membershipBadgeClass,
  membershipLabel,
  type LibraryFamilyGroup,
} from './library-browser';

export const MEMBERSHIP_FILTERS: { id: 'all' | LibraryMembershipStatus; label: string }[] = [
  { id: 'certified', label: 'Certified' },
  { id: 'deprecated', label: 'Deprecated' },
  { id: 'archived', label: 'Archived' },
  { id: 'uncertified', label: 'Uncertified' },
  { id: 'all', label: 'All' },
];

export function LibraryBrowserView({
  families,
  search,
  filter,
  loading,
  error,
  onSearch,
  onFilter,
}: {
  families: LibraryFamilyGroup[];
  search: string;
  filter: 'all' | LibraryMembershipStatus;
  loading: boolean;
  error: string | null;
  onSearch: (value: string) => void;
  onFilter: (value: 'all' | LibraryMembershipStatus) => void;
}) {
  return (
    <section className="space-y-6" data-testid="strategy-library-page">
      <PageHeader
        productId="strategy-library"
        title="Strategy Library"
        description="Certified strategy membership for this workspace. Versions are immutable. This is not the research strategy editor."
        extraActions={[
          {
            to: '/strategy-library/certify',
            label: 'Certify a strategy',
            testId: 'library-certify-link',
          },
          { to: '/strategy-library/certifications', label: 'Certification history' },
          { to: '/deployments', label: 'Deployment' },
        ]}
      />

      <ErrorBanner message={error} />

      <div className="flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="library-search">
          Search library
        </label>
        <input
          id="library-search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search name, family, version, or id"
          data-testid="library-search-input"
          className="w-full max-w-md rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Membership filter">
          {MEMBERSHIP_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onFilter(item.id)}
              data-testid={`library-filter-${item.id}`}
              className={`rounded-full border px-3 py-1 text-xs ${
                filter === item.id
                  ? 'border-sky-400/50 bg-sky-500/10 text-sky-200'
                  : 'border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <LoadingState label="Loading library…" />}

      {!loading && families.length === 0 && (
        <EmptyState
          testId="library-empty"
          title="No certified strategies in this workspace."
          description="Admit a research candidate into Strategy Library as an immutable certified version."
          actionTo="/strategy-library/certify"
          actionLabel="Certify a strategy"
        />
      )}

      <div className="space-y-4">
        {families.map((family) => (
          <article
            key={family.strategyFamilyId}
            className="rounded-xl border border-white/10 bg-white/5 p-5"
            data-testid="library-family"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-lg font-medium">{family.name}</h3>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {family.versions.length} version{family.versions.length === 1 ? '' : 's'}
              </p>
            </div>
            <p className="mt-1 text-xs text-slate-500">{family.strategyFamilyId}</p>
            <ul className="mt-4 space-y-2">
              {family.versions.map((record) => (
                <LibraryVersionRow key={record.version.libraryEntryId} record={record} />
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

export function LibraryVersionRow({ record }: { record: StrategyLibraryRecordView }) {
  return (
    <li>
      <Link
        to={`/strategy-library/${record.version.libraryEntryId}`}
        data-testid="library-version-link"
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/5 px-3 py-2 text-sm hover:border-white/20"
      >
        <span>
          v{record.version.version}
          <span className="ml-2 text-slate-500">{record.version.libraryEntryId}</span>
        </span>
        <span className="flex flex-wrap gap-2">
          <Badge
            label={membershipLabel(record.membershipStatus)}
            className={membershipBadgeClass(record.membershipStatus)}
          />
          <Badge
            label={record.eligibility?.outcome === 'eligible' ? 'Eligible' : 'Eligibility'}
            className={eligibilityBadgeClass(record.eligibility?.outcome)}
          />
          <Badge
            label={record.envelopeState === 'present' ? 'Envelope' : 'No envelope'}
            className={envelopeBadgeClass(record.envelopeState)}
          />
        </span>
      </Link>
    </li>
  );
}

function Badge({ label, className }: { label: string; className: string }) {
  return <span className={`rounded-full border px-2 py-0.5 text-xs ${className}`}>{label}</span>;
}
