import { useCallback, useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useWorkspace } from '../app/WorkspaceContext';
import {
  api,
  type NotificationChannelDetailView as ChannelDetail,
  type NotificationChannelDiagnosticsView,
  type NotificationDeliveryListItemView,
} from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { TelegramSettingsPage } from '../telegram';
import { NotificationChannelDetailView } from './NotificationChannelDetailView';

const CATALOG = new Set(['telegram', 'email', 'slack', 'discord', 'teams', 'push']);

export function NotificationChannelDetailPage() {
  const { channelId } = useParams();
  if (!channelId || !CATALOG.has(channelId)) {
    return <Navigate to="/notifications/channels" replace />;
  }
  if (channelId === 'telegram') {
    return <TelegramSettingsPage />;
  }
  return <ReservedChannelPage channelId={channelId} />;
}

function ReservedChannelPage({ channelId }: { channelId: string }) {
  const { activeWorkspace } = useWorkspace();
  const [channel, setChannel] = useState<ChannelDetail | null>(null);
  const [diagnostics, setDiagnostics] = useState<NotificationChannelDiagnosticsView | null>(null);
  const [history, setHistory] = useState<NotificationDeliveryListItemView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    return Promise.all([
      api.getNotificationChannel(channelId),
      api.getNotificationChannelDiagnostics(channelId),
      api.listNotificationChannelDeliveries(channelId, { limit: 20 }),
    ]).then(([nextChannel, nextDiagnostics, page]) => {
      setChannel(nextChannel);
      setDiagnostics(nextDiagnostics);
      setHistory(page.items);
    });
  }, [channelId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    refresh()
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load channel.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, refresh]);

  return (
    <NotificationChannelDetailView
      channel={channel}
      diagnostics={diagnostics}
      history={history}
      loading={loading}
      error={error}
    />
  );
}
