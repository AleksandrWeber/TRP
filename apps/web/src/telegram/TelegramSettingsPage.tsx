import { useCallback, useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import {
  api,
  type NotificationDeliveryListItemView,
  type TelegramConnectionProductView,
  type TelegramDiagnosticsView,
  type TelegramTestProductView,
} from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { TelegramSettingsView } from './TelegramSettingsView';

export function TelegramSettingsPage() {
  const { activeWorkspace } = useWorkspace();
  const [connection, setConnection] = useState<TelegramConnectionProductView | null>(null);
  const [diagnostics, setDiagnostics] = useState<TelegramDiagnosticsView | null>(null);
  const [history, setHistory] = useState<NotificationDeliveryListItemView[]>([]);
  const [lastTest, setLastTest] = useState<TelegramTestProductView | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    return Promise.all([
      api.getTelegramConnection(),
      api.getTelegramDiagnostics(),
      api.listTelegramDeliveries({ limit: 20 }),
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
        if (!cancelled) setError(toUserFacingError(err, 'Could not load Telegram connection.'));
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
    <TelegramSettingsView
      connection={connection}
      diagnostics={diagnostics}
      history={history}
      lastTest={lastTest}
      loading={loading}
      acting={acting}
      error={error}
      onConnect={() => run(() => api.connectTelegram(), 'Could not connect Telegram.')}
      onComplete={() =>
        run(() => api.completeTelegramConnect(), 'Could not complete Telegram bind.')
      }
      onVerify={() => run(() => api.verifyTelegramConnection(), 'Could not verify Telegram.')}
      onTest={() => {
        setActing(true);
        setError(null);
        api
          .sendTelegramTest()
          .then((result) => {
            setLastTest(result);
            return refresh();
          })
          .catch((err: unknown) => {
            setError(toUserFacingError(err, 'Could not send Telegram test.'));
          })
          .finally(() => setActing(false));
      }}
      onDisconnect={() => run(() => api.disconnectTelegram(), 'Could not disconnect Telegram.')}
    />
  );
}
