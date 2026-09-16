import { useCallback, useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import {
  api,
  type PushConnectionProductView,
  type PushDiagnosticsView,
  type PushTestProductView,
  type NotificationDeliveryListItemView,
} from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { PushSettingsView } from './PushSettingsView';
import { registerWebPushSubscription } from './register-web-push';

export function PushSettingsPage() {
  const { activeWorkspace } = useWorkspace();
  const [connection, setConnection] = useState<PushConnectionProductView | null>(null);
  const [diagnostics, setDiagnostics] = useState<PushDiagnosticsView | null>(null);
  const [history, setHistory] = useState<NotificationDeliveryListItemView[]>([]);
  const [lastTest, setLastTest] = useState<PushTestProductView | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    return Promise.all([
      api.getPushConnection(),
      api.getPushDiagnostics(),
      api.listNotificationChannelDeliveries('push', { limit: 20 }),
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
        if (!cancelled) setError(toUserFacingError(err, 'Could not load Push connection.'));
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
    <PushSettingsView
      connection={connection}
      diagnostics={diagnostics}
      history={history}
      lastTest={lastTest}
      loading={loading}
      acting={acting}
      error={error}
      onBind={() => run(() => api.bindPushChannel(), 'Could not bind Push.')}
      onRegister={() =>
        run(async () => {
          const { publicKey } = await api.getPushVapidPublicKey();
          const subscription = await registerWebPushSubscription(publicKey);
          await api.registerPushSubscription(subscription);
        }, 'Could not register browser push subscription.')
      }
      onTest={() => {
        setActing(true);
        setError(null);
        api
          .sendPushTest()
          .then((result) => {
            setLastTest(result);
            return refresh();
          })
          .catch((err: unknown) => {
            setError(toUserFacingError(err, 'Could not send Push test.'));
          })
          .finally(() => setActing(false));
      }}
      onDisconnect={() => run(() => api.disconnectPush(), 'Could not disconnect Push.')}
    />
  );
}
