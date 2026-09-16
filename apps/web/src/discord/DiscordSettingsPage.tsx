import { useCallback, useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import {
  api,
  type DiscordConnectionProductView,
  type DiscordDiagnosticsView,
  type DiscordTestProductView,
  type NotificationDeliveryListItemView,
} from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { DiscordSettingsView } from './DiscordSettingsView';

export function DiscordSettingsPage() {
  const { activeWorkspace } = useWorkspace();
  const [connection, setConnection] = useState<DiscordConnectionProductView | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiscordDiagnosticsView | null>(null);
  const [history, setHistory] = useState<NotificationDeliveryListItemView[]>([]);
  const [lastTest, setLastTest] = useState<DiscordTestProductView | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    return Promise.all([
      api.getDiscordConnection(),
      api.getDiscordDiagnostics(),
      api.listNotificationChannelDeliveries('discord', { limit: 20 }),
    ]).then(([nextConnection, nextDiagnostics, page]) => {
      setConnection(nextConnection);
      setDiagnostics(nextDiagnostics);
      setHistory(page.items);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setLastTest(null);
    refresh()
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load Discord connection.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, refresh]);

  function run(action: () => Promise<unknown>, fallback: string) {
    setActing(true);
    setError(null);
    action()
      .then(() => refresh())
      .catch((err: unknown) => {
        setError(toUserFacingError(err, fallback));
      })
      .finally(() => setActing(false));
  }

  return (
    <DiscordSettingsView
      connection={connection}
      diagnostics={diagnostics}
      history={history}
      lastTest={lastTest}
      loading={loading}
      acting={acting}
      error={error}
      onBind={() => run(() => api.bindDiscordChannel(), 'Could not bind Discord.')}
      onTest={() => {
        setActing(true);
        setError(null);
        api
          .sendDiscordTest()
          .then((result) => {
            setLastTest(result);
            return refresh();
          })
          .catch((err: unknown) => {
            setError(toUserFacingError(err, 'Could not send Discord test.'));
          })
          .finally(() => setActing(false));
      }}
      onDisconnect={() => run(() => api.disconnectDiscord(), 'Could not disconnect Discord.')}
    />
  );
}
