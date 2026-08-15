import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type NotificationDeliveryListItemView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { NotificationChannelHistoryView } from './NotificationChannelHistoryView';
import {
  buildDeliveryListQuery,
  type DeliveryOutcomeFilter,
  type NotificationTypeFilter,
} from './notifications';

const CATALOG = new Set(['telegram', 'email', 'slack', 'discord', 'teams', 'push']);

export function NotificationChannelHistoryPage() {
  const { channelId } = useParams();
  const { activeWorkspace } = useWorkspace();
  const [items, setItems] = useState<NotificationDeliveryListItemView[]>([]);
  const [search, setSearch] = useState('');
  const [outcome, setOutcome] = useState<DeliveryOutcomeFilter>('all');
  const [type, setType] = useState<NotificationTypeFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!channelId || !CATALOG.has(channelId)) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .listNotificationChannelDeliveries(
        channelId,
        buildDeliveryListQuery({ search, outcome, type }),
      )
      .then((page) => {
        if (!cancelled) setItems(page.items);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load channel deliveries.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, channelId, search, outcome, type]);

  if (!channelId || !CATALOG.has(channelId)) {
    return <Navigate to="/notifications/channels" replace />;
  }

  return (
    <NotificationChannelHistoryView
      channelId={channelId}
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
