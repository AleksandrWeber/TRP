import { useEffect, useMemo, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type LibraryMembershipStatus } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { LibraryBrowserView } from './LibraryBrowserView';
import { groupLibraryByFamily, libraryListQuery, type MembershipFilter } from './library-browser';

export function StrategyLibraryPage() {
  const { activeWorkspace } = useWorkspace();
  const [filter, setFilter] = useState<MembershipFilter>('certified');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [items, setItems] = useState<Awaited<ReturnType<typeof api.listStrategyLibrary>>['items']>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedSearch(search), 200);
    return () => window.clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .listStrategyLibrary(libraryListQuery(filter, debouncedSearch))
      .then((page) => {
        if (cancelled) return;
        setItems(page.items);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load Strategy Library.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, filter, debouncedSearch]);

  const families = useMemo(() => groupLibraryByFamily(items), [items]);

  return (
    <LibraryBrowserView
      families={families}
      search={search}
      filter={filter as LibraryMembershipStatus | 'all'}
      loading={loading}
      error={error}
      onSearch={setSearch}
      onFilter={setFilter}
    />
  );
}
