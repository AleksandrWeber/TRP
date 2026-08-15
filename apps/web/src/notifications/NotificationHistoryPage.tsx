import { useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type NotificationDeliveryListItemView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { NotificationHistoryView } from './NotificationHistoryView';
import {
  buildDeliveryListQuery,
  type DeliveryOutcomeFilter,
  type NotificationTypeFilter,
} from './notifications';

export function NotificationHistoryPage() {
  const { activeWorkspace } = useWorkspace();
  const [items, setItems] = useState<NotificationDeliveryListItemView[]>([]);
  const [search, setSearch] = useState('');
  const [outcome, setOutcome] = useState<DeliveryOutcomeFilter>('all');
  const [type, setType] = useState<NotificationTypeFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .listNotificationDeliveries(buildDeliveryListQuery({ search, outcome, type }))
      .then((page) => {
        if (!cancelled) setItems(page.items);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load delivery history.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, search, outcome, type]);

  return (
    <NotificationHistoryView
      items={items}
      search={search}
      outcome={outcome}
      type={type}
      loading={loading}
      error={error}
      onSearch={setSearch}
      onOutcome={setOutcome}
      onType={setType}
    />
  );
}
