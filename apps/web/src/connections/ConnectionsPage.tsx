import { useEffect, useState, type FormEvent } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import {
  api,
  type ConnectionCatalogView,
  type ConnectionMetadataView,
  type ConnectionProvider,
  type WorkspaceAiRequestHistoryView,
  type WorkspaceAiRequestView,
  type WorkspaceAiSessionView,
} from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { ConnectionsView } from './ConnectionsView';

export function ConnectionsPage() {
  const { activeWorkspace } = useWorkspace();
  const [catalog, setCatalog] = useState<ConnectionCatalogView | null>(null);
  const [connections, setConnections] = useState<ConnectionMetadataView[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [provider, setProvider] = useState<ConnectionProvider>('BINANCE');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [credentialConnection, setCredentialConnection] = useState<ConnectionMetadataView | null>(
    null,
  );
  const [credentialValues, setCredentialValues] = useState<Record<string, string>>({});
  const [aiRequestConnectionId, setAiRequestConnectionId] = useState<string | null>(null);
  const [aiRequestPrompt, setAiRequestPrompt] = useState('');
  const [aiRequestResult, setAiRequestResult] = useState<WorkspaceAiRequestView | null>(null);
  const [aiSessions, setAiSessions] = useState<WorkspaceAiSessionView[]>([]);
  const [aiSessionName, setAiSessionName] = useState('');
  const [aiSessionRenameId, setAiSessionRenameId] = useState<string | null>(null);
  const [aiSessionRenameValue, setAiSessionRenameValue] = useState('');
  const [openAiSessionId, setOpenAiSessionId] = useState<string | null>(null);
  const [aiRequestSessionId, setAiRequestSessionId] = useState<string | null>(null);
  const [aiHistoryOpen, setAiHistoryOpen] = useState(false);
  const [aiHistoryEntries, setAiHistoryEntries] = useState<WorkspaceAiRequestHistoryView[]>([]);
  const [aiHistoryFilterSessionId, setAiHistoryFilterSessionId] = useState('');
  const [aiHistoryFilterStatus, setAiHistoryFilterStatus] = useState('');
  const [openAiHistoryId, setOpenAiHistoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [catalogView, connectionViews, sessionViews] = await Promise.all([
      api.getConnectionCatalog(),
      api.listConnections(),
      api.listWorkspaceAiSessions(),
    ]);
    setCatalog(catalogView);
    setConnections(connectionViews);
    setAiSessions(sessionViews);
    const connectedOpenRouter = connectionViews.find(
      (item) =>
        item.provider === 'OPENROUTER' && item.openRouterConnectivity?.status === 'CONNECTED',
    );
    if (connectedOpenRouter) {
      setAiRequestConnectionId((current) => current ?? connectedOpenRouter.id);
    }
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    load()
      .catch((reason: unknown) => {
        if (!cancelled) setError(toUserFacingError(reason, 'Could not load Connections.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!displayName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const created = await api.createConnection({ displayName: displayName.trim(), provider });
      setConnections((items) => [...items, created]);
      setDisplayName('');
    } catch (reason) {
      setError(toUserFacingError(reason, 'Could not create the connection metadata.'));
    } finally {
      setSaving(false);
    }
  }

  async function rename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!renameId || !renameValue.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const renamed = await api.renameConnection(renameId, renameValue.trim());
      setConnections((items) => items.map((item) => (item.id === renamed.id ? renamed : item)));
      setRenameId(null);
      setRenameValue('');
    } catch (reason) {
      setError(toUserFacingError(reason, 'Could not rename the connection metadata.'));
    } finally {
      setSaving(false);
    }
  }

  async function storeCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!credentialConnection) return;
    setSaving(true);
    setError(null);
    try {
      const saved = credentialConnection.credentialsStored
        ? await api.replaceConnectionCredentials(credentialConnection.id, credentialValues)
        : await api.storeConnectionCredentials(credentialConnection.id, credentialValues);
      setConnections((items) => items.map((item) => (item.id === saved.id ? saved : item)));
      setCredentialConnection(null);
      setCredentialValues({});
    } catch (reason) {
      setError(toUserFacingError(reason, 'Could not store credentials securely.'));
    } finally {
      setSaving(false);
    }
  }

  async function validate(connection: ConnectionMetadataView) {
    setSaving(true);
    setError(null);
    setConnections((items) =>
      items.map((item) =>
        item.id === connection.id ? { ...item, status: 'PENDING_VALIDATION' } : item,
      ),
    );
    try {
      const validated = await api.validateConnection(connection.id);
      setConnections((items) => items.map((item) => (item.id === validated.id ? validated : item)));
      if (
        validated.provider === 'OPENROUTER' &&
        validated.openRouterConnectivity?.status === 'CONNECTED'
      ) {
        setAiRequestConnectionId(validated.id);
      }
    } catch (reason) {
      setConnections((items) =>
        items.map((item) => (item.id === connection.id ? connection : item)),
      );
      setError(toUserFacingError(reason, 'Validation could not be completed.'));
    } finally {
      setSaving(false);
    }
  }

  async function lifecycle(
    connection: ConnectionMetadataView,
    action: 'disconnect' | 'disable' | 'revoke',
  ) {
    setSaving(true);
    setError(null);
    try {
      const updated =
        action === 'disconnect'
          ? await api.disconnectConnection(connection.id)
          : action === 'disable'
            ? await api.disableConnection(connection.id)
            : await api.revokeConnection(connection.id);
      setConnections((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      if (updated.provider === 'OPENROUTER') {
        setAiRequestResult(null);
      }
    } catch (reason) {
      setError(toUserFacingError(reason, `Could not ${action} the connection.`));
    } finally {
      setSaving(false);
    }
  }

  async function createAiSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!aiSessionName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const created = await api.createWorkspaceAiSession(aiSessionName.trim());
      setAiSessions((items) => [...items, created]);
      setAiSessionName('');
      setOpenAiSessionId(created.id);
      setAiRequestSessionId(created.id);
    } catch (reason) {
      setError(toUserFacingError(reason, 'Could not create the AI Session.'));
    } finally {
      setSaving(false);
    }
  }

  async function renameAiSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!aiSessionRenameId || !aiSessionRenameValue.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const renamed = await api.renameWorkspaceAiSession(
        aiSessionRenameId,
        aiSessionRenameValue.trim(),
      );
      setAiSessions((items) => items.map((item) => (item.id === renamed.id ? renamed : item)));
      setAiSessionRenameId(null);
      setAiSessionRenameValue('');
    } catch (reason) {
      setError(toUserFacingError(reason, 'Could not rename the AI Session.'));
    } finally {
      setSaving(false);
    }
  }

  async function closeAiSession(sessionId: string) {
    setSaving(true);
    setError(null);
    try {
      const closed = await api.closeWorkspaceAiSession(sessionId);
      setAiSessions((items) => items.map((item) => (item.id === closed.id ? closed : item)));
      if (aiRequestSessionId === sessionId) {
        setAiRequestSessionId(null);
      }
    } catch (reason) {
      setError(toUserFacingError(reason, 'Could not close the AI Session.'));
    } finally {
      setSaving(false);
    }
  }

  async function openAiSession(sessionId: string) {
    setSaving(true);
    setError(null);
    try {
      const session = await api.getWorkspaceAiSession(sessionId);
      setAiSessions((items) => {
        const exists = items.some((item) => item.id === session.id);
        return exists
          ? items.map((item) => (item.id === session.id ? session : item))
          : [...items, session];
      });
      setOpenAiSessionId(session.id);
    } catch (reason) {
      setError(toUserFacingError(reason, 'Could not open the AI Session.'));
    } finally {
      setSaving(false);
    }
  }

  async function submitAiRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!aiRequestConnectionId || !aiRequestPrompt.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const result = await api.executeWorkspaceAiRequest(
        aiRequestConnectionId,
        aiRequestPrompt.trim(),
        aiRequestSessionId,
      );
      setAiRequestResult(result);
      if (result.sessionId) {
        const session = await api.getWorkspaceAiSession(result.sessionId);
        setAiSessions((items) => items.map((item) => (item.id === session.id ? session : item)));
        setOpenAiSessionId(session.id);
        if (aiHistoryOpen) {
          const entries = await api.listWorkspaceAiRequestHistory(historyFilter());
          setAiHistoryEntries(entries);
        }
      }
      if (result.status !== 'SUCCEEDED') {
        setError(result.vendorVisibleMessage);
      }
    } catch (reason) {
      setError(toUserFacingError(reason, 'AI request could not be completed.'));
    } finally {
      setSaving(false);
    }
  }

  function historyFilter() {
    return {
      ...(aiHistoryFilterSessionId ? { sessionId: aiHistoryFilterSessionId } : {}),
      ...(aiHistoryFilterStatus ? { status: aiHistoryFilterStatus } : {}),
    };
  }

  async function openAiHistory() {
    setSaving(true);
    setError(null);
    try {
      const entries = await api.listWorkspaceAiRequestHistory(historyFilter());
      setAiHistoryEntries(entries);
      setAiHistoryOpen(true);
    } catch (reason) {
      setError(toUserFacingError(reason, 'Could not open AI Request History.'));
    } finally {
      setSaving(false);
    }
  }

  async function applyAiHistoryFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const entries = await api.listWorkspaceAiRequestHistory(historyFilter());
      setAiHistoryEntries(entries);
      setAiHistoryOpen(true);
      setOpenAiHistoryId(null);
    } catch (reason) {
      setError(toUserFacingError(reason, 'Could not filter AI Request History.'));
    } finally {
      setSaving(false);
    }
  }

  async function openAiHistoryEntry(historyId: string) {
    setSaving(true);
    setError(null);
    try {
      const entry = await api.getWorkspaceAiRequestHistoryEntry(historyId);
      setAiHistoryEntries((items) => {
        const exists = items.some((item) => item.id === entry.id);
        return exists
          ? items.map((item) => (item.id === entry.id ? entry : item))
          : [entry, ...items];
      });
      setOpenAiHistoryId(entry.id);
      setAiHistoryOpen(true);
    } catch (reason) {
      setError(toUserFacingError(reason, 'Could not open the History entry.'));
    } finally {
      setSaving(false);
    }
  }

  async function navigateToAiRequest(entry: WorkspaceAiRequestHistoryView) {
    setSaving(true);
    setError(null);
    try {
      setAiRequestConnectionId(entry.connectionId);
      setAiRequestSessionId(entry.sessionId);
      const last = await api.getWorkspaceAiRequest(entry.connectionId);
      if (last.status !== 'NONE' && 'requestId' in last && last.requestId === entry.requestId) {
        setAiRequestResult(last);
      } else {
        setAiRequestResult(null);
      }
      document.getElementById('workspace-ai-request')?.scrollIntoView({ behavior: 'smooth' });
    } catch (reason) {
      setError(toUserFacingError(reason, 'Could not navigate to the AI Request.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ConnectionsView
      catalog={catalog}
      connections={connections}
      displayName={displayName}
      provider={provider}
      renameId={renameId}
      renameValue={renameValue}
      credentialConnection={credentialConnection}
      credentialValues={credentialValues}
      aiRequestConnectionId={aiRequestConnectionId}
      aiRequestPrompt={aiRequestPrompt}
      aiRequestResult={aiRequestResult}
      aiSessions={aiSessions}
      aiSessionName={aiSessionName}
      aiSessionRenameId={aiSessionRenameId}
      aiSessionRenameValue={aiSessionRenameValue}
      openAiSessionId={openAiSessionId}
      aiRequestSessionId={aiRequestSessionId}
      aiHistoryOpen={aiHistoryOpen}
      aiHistoryEntries={aiHistoryEntries}
      aiHistoryFilterSessionId={aiHistoryFilterSessionId}
      aiHistoryFilterStatus={aiHistoryFilterStatus}
      openAiHistoryId={openAiHistoryId}
      loading={loading}
      saving={saving}
      error={error}
      onDisplayName={setDisplayName}
      onProvider={setProvider}
      onCreate={create}
      onStartRename={(connection) => {
        setRenameId(connection.id);
        setRenameValue(connection.displayName);
      }}
      onRenameValue={setRenameValue}
      onRename={rename}
      onCancelRename={() => setRenameId(null)}
      onStartCredentials={(connection) => {
        setCredentialConnection(connection);
        setCredentialValues({});
      }}
      onCredentialValue={(field, value) =>
        setCredentialValues((values) => ({ ...values, [field]: value }))
      }
      onStoreCredentials={storeCredentials}
      onCancelCredentials={() => {
        setCredentialConnection(null);
        setCredentialValues({});
      }}
      onValidate={validate}
      onDisconnect={(connection) => lifecycle(connection, 'disconnect')}
      onDisable={(connection) => lifecycle(connection, 'disable')}
      onRevoke={(connection) => lifecycle(connection, 'revoke')}
      onAiRequestConnectionId={setAiRequestConnectionId}
      onAiRequestPrompt={setAiRequestPrompt}
      onSubmitAiRequest={submitAiRequest}
      onAiSessionName={setAiSessionName}
      onCreateAiSession={createAiSession}
      onOpenAiSession={openAiSession}
      onStartAiSessionRename={(session) => {
        setAiSessionRenameId(session.id);
        setAiSessionRenameValue(session.displayName);
      }}
      onAiSessionRenameValue={setAiSessionRenameValue}
      onRenameAiSession={renameAiSession}
      onCancelAiSessionRename={() => setAiSessionRenameId(null)}
      onCloseAiSession={closeAiSession}
      onAiRequestSessionId={setAiRequestSessionId}
      onOpenAiHistory={openAiHistory}
      onAiHistoryFilterSessionId={setAiHistoryFilterSessionId}
      onAiHistoryFilterStatus={setAiHistoryFilterStatus}
      onApplyAiHistoryFilter={applyAiHistoryFilter}
      onOpenAiHistoryEntry={openAiHistoryEntry}
      onNavigateToAiRequest={navigateToAiRequest}
    />
  );
}
