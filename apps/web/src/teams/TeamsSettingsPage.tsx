import { useCallback, useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import {
  api,
  type TeamsConnectionProductView,
  type TeamsDiagnosticsView,
  type TeamsTestProductView,
  type NotificationDeliveryListItemView,
} from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { TeamsSettingsView } from './TeamsSettingsView';

export function TeamsSettingsPage() {
  const { activeWorkspace } = useWorkspace();
  const [connection, setConnection] = useState<TeamsConnectionProductView | null>(null);
  const [diagnostics, setDiagnostics] = useState<TeamsDiagnosticsView | null>(null);
  const [history, setHistory] = useState<NotificationDeliveryListItemView[]>([]);
  const [lastTest, setLastTest] = useState<TeamsTestProductView | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    return Promise.all([
      api.getTeamsConnection(),
      api.getTeamsDiagnostics(),
      api.listNotificationChannelDeliveries('teams', { limit: 20 }),
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
        if (!cancelled) setError(toUserFacingError(err, 'Could not load Teams connection.'));
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
    <TeamsSettingsView
      connection={connection}
      diagnostics={diagnostics}
      history={history}
      lastTest={lastTest}
      loading={loading}
      acting={acting}
      error={error}
      onBind={() => run(() => api.bindTeamsChannel(), 'Could not bind Teams.')}
      onTest={() => {
        setActing(true);
        setError(null);
        api
          .sendTeamsTest()
          .then((result) => {
            setLastTest(result);
            return refresh();
          })
          .catch((err: unknown) => {
            setError(toUserFacingError(err, 'Could not send Teams test.'));
          })
          .finally(() => setActing(false));
      }}
      onDisconnect={() => run(() => api.disconnectTeams(), 'Could not disconnect Teams.')}
    />
  );
}
