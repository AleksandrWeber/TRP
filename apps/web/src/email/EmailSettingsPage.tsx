import { useCallback, useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import {
  api,
  type EmailConnectionProductView,
  type EmailDiagnosticsView,
  type EmailTestProductView,
  type NotificationDeliveryListItemView,
} from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { EmailSettingsView } from './EmailSettingsView';

export function EmailSettingsPage() {
  const { activeWorkspace } = useWorkspace();
  const [connection, setConnection] = useState<EmailConnectionProductView | null>(null);
  const [diagnostics, setDiagnostics] = useState<EmailDiagnosticsView | null>(null);
  const [history, setHistory] = useState<NotificationDeliveryListItemView[]>([]);
  const [lastTest, setLastTest] = useState<EmailTestProductView | null>(null);
  const [recipientDraft, setRecipientDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    return Promise.all([
      api.getEmailConnection(),
      api.getEmailDiagnostics(),
      api.listNotificationChannelDeliveries('email', { limit: 20 }),
    ]).then(([nextConnection, nextDiagnostics, page]) => {
      setConnection(nextConnection);
      setDiagnostics(nextDiagnostics);
      setHistory(page.items);
      setRecipientDraft(nextConnection.recipient ?? '');
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setLastTest(null);
    refresh()
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load Email connection.'));
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
    <EmailSettingsView
      connection={connection}
      diagnostics={diagnostics}
      history={history}
      lastTest={lastTest}
      recipientDraft={recipientDraft}
      loading={loading}
      acting={acting}
      error={error}
      onRecipientDraft={setRecipientDraft}
      onBind={() => run(() => api.bindEmailRecipient(recipientDraft), 'Could not bind Email.')}
      onTest={() => {
        setActing(true);
        setError(null);
        api
          .sendEmailTest()
          .then((result) => {
            setLastTest(result);
            return refresh();
          })
          .catch((err: unknown) => {
            setError(toUserFacingError(err, 'Could not send Email test.'));
          })
          .finally(() => setActing(false));
      }}
      onDisconnect={() => run(() => api.disconnectEmail(), 'Could not disconnect Email.')}
    />
  );
}
