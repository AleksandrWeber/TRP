import { useCallback, useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import {
  api,
  type NotificationDeliveryListItemView,
  type SlackConnectionProductView,
  type SlackDiagnosticsView,
  type SlackTestProductView,
} from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { SlackSettingsView } from './SlackSettingsView';

export function SlackSettingsPage() {
  const { activeWorkspace } = useWorkspace();
  const [connection, setConnection] = useState<SlackConnectionProductView | null>(null);
  const [diagnostics, setDiagnostics] = useState<SlackDiagnosticsView | null>(null);
  const [history, setHistory] = useState<NotificationDeliveryListItemView[]>([]);
  const [lastTest, setLastTest] = useState<SlackTestProductView | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    return Promise.all([
      api.getSlackConnection(),
      api.getSlackDiagnostics(),
      api.listNotificationChannelDeliveries('slack', { limit: 20 }),
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
        if (!cancelled) setError(toUserFacingError(err, 'Could not load Slack connection.'));
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
    <SlackSettingsView
      connection={connection}
      diagnostics={diagnostics}
      history={history}
      lastTest={lastTest}
      loading={loading}
      acting={acting}
      error={error}
      onBind={() => run(() => api.bindSlackChannel(), 'Could not bind Slack.')}
      onTest={() => {
        setActing(true);
        setError(null);
        api
          .sendSlackTest()
          .then((result) => {
            setLastTest(result);
            return refresh();
          })
          .catch((err: unknown) => {
            setError(toUserFacingError(err, 'Could not send Slack test.'));
          })
          .finally(() => setActing(false));
      }}
      onDisconnect={() => run(() => api.disconnectSlack(), 'Could not disconnect Slack.')}
    />
  );
}
