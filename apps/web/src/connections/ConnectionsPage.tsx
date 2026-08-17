import { useEffect, useState, type FormEvent } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import {
  api,
  type ConnectionCatalogView,
  type ConnectionMetadataView,
  type ConnectionProvider,
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [catalogView, connectionViews] = await Promise.all([
      api.getConnectionCatalog(),
      api.listConnections(),
    ]);
    setCatalog(catalogView);
    setConnections(connectionViews);
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

  return (
    <ConnectionsView
      catalog={catalog}
      connections={connections}
      displayName={displayName}
      provider={provider}
      renameId={renameId}
      renameValue={renameValue}
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
    />
  );
}
