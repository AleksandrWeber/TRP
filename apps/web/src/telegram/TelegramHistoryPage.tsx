import { useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type NotificationDeliveryListItemView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { TelegramHistoryView } from './TelegramHistoryView';
import {
  buildDeliveryListQuery,
  type DeliveryOutcomeFilter,
  type NotificationTypeFilter,
} from '../notifications/notifications';

export function TelegramHistoryPage() {
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
      .listTelegramDeliveries(buildDeliveryListQuery({ search, outcome, type }))
      .then((page) => {
        if (!cancelled) setItems(page.items);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load Telegram deliveries.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, search, outcome, type]);

  return (
    <TelegramHistoryView
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
