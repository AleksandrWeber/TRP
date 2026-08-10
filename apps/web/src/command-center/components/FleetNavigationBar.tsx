import type { FleetNavigationState, FleetSortField } from '../fleet-navigation';

type Props = {
  navigation: FleetNavigationState;
  exchangeOptions: readonly string[];
  statusOptions: readonly string[];
  selectedCount: number;
  onChange: (next: FleetNavigationState) => void;
  onClearSelection: () => void;
};

/**
 * Client-side search / filter / sort toolbar for Command Center fleet panels.
 * Preferences are session-local only (not persisted).
 */
export function FleetNavigationBar({
  navigation,
  exchangeOptions,
  statusOptions,
  selectedCount,
  onChange,
  onClearSelection,
}: Props) {
  return (
    <div
      className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
      data-testid="cc-fleet-navigation"
    >
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[12rem] flex-1 text-xs text-slate-500">
          Search
          <input
            value={navigation.search}
            onChange={(event) => onChange({ ...navigation, search: event.target.value })}
            placeholder="Bot, session, or exchange scope"
            className="mt-1 w-full rounded border border-white/15 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
            data-testid="cc-fleet-search"
          />
        </label>

        <label className="text-xs text-slate-500">
          Exchange
          <select
            value={navigation.exchangeFilter}
            onChange={(event) => onChange({ ...navigation, exchangeFilter: event.target.value })}
            className="mt-1 block min-w-[10rem] rounded border border-white/15 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
            data-testid="cc-fleet-filter-exchange"
          >
            <option value="">All exchanges</option>
            {exchangeOptions.map((scope) => (
              <option key={scope} value={scope}>
                {scope}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-slate-500">
          Status
          <select
            value={navigation.statusFilter}
            onChange={(event) => onChange({ ...navigation, statusFilter: event.target.value })}
            className="mt-1 block min-w-[8rem] rounded border border-white/15 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
            data-testid="cc-fleet-filter-status"
          >
            <option value="">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-slate-500">
          Sort by
          <select
            value={navigation.sortField}
            onChange={(event) =>
              onChange({
                ...navigation,
                sortField: event.target.value as FleetSortField,
              })
            }
            className="mt-1 block min-w-[8rem] rounded border border-white/15 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
            data-testid="cc-fleet-sort-field"
          >
            <option value="name">Name</option>
            <option value="status">Status</option>
            <option value="exchange">Exchange</option>
          </select>
        </label>

        <button
          type="button"
          onClick={() =>
            onChange({
              ...navigation,
              sortDirection: navigation.sortDirection === 'asc' ? 'desc' : 'asc',
            })
          }
          className="rounded border border-white/15 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
          data-testid="cc-fleet-sort-direction"
          aria-label={`Sort ${navigation.sortDirection === 'asc' ? 'ascending' : 'descending'}`}
        >
          {navigation.sortDirection === 'asc' ? 'Asc' : 'Desc'}
        </button>

        <button
          type="button"
          onClick={() =>
            onChange({
              ...navigation,
              search: '',
              exchangeFilter: '',
              statusFilter: '',
            })
          }
          className="rounded border border-white/15 px-3 py-2 text-sm text-slate-400 hover:bg-white/5 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
          data-testid="cc-fleet-clear-filters"
        >
          Clear filters
        </button>

        {selectedCount > 0 ? (
          <button
            type="button"
            onClick={onClearSelection}
            className="rounded border border-sky-500/30 px-3 py-2 text-sm text-sky-200 hover:bg-sky-500/10 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
            data-testid="cc-fleet-clear-selection"
          >
            Clear selection ({selectedCount})
          </button>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-slate-600">
        Search, filters, and sorting are client-side over projections. Multi-select is UI-only — no
        bulk commands.
      </p>
    </div>
  );
}
