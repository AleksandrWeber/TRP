import { useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type ReportRunListItemView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { ReportingHomeView } from './ReportingHomeView';
import {
  buildReportListQuery,
  type ReportKindFilter,
  type ReportModeFilter,
  type ReportStatusFilter,
} from './reporting';

export function ReportingHomePage() {
  const { activeWorkspace } = useWorkspace();
  const [items, setItems] = useState<ReportRunListItemView[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ReportStatusFilter>('all');
  const [kind, setKind] = useState<ReportKindFilter>('all');
  const [mode, setMode] = useState<ReportModeFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .listReportRuns(buildReportListQuery({ search, status, kind, mode }))
      .then((page) => {
        if (!cancelled) setItems(page.items);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load report runs.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, search, status, kind, mode]);

  return (
    <ReportingHomeView
      items={items}
      search={search}
      status={status}
      kind={kind}
      mode={mode}
      loading={loading}
      error={error}
      onSearch={setSearch}
      onStatus={setStatus}
      onKind={setKind}
      onMode={setMode}
    />
  );
}
