import { useEffect, useState, type FormEvent } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import {
  api,
  type ConnectionCatalogView,
  type ConnectionMetadataView,
  type ConnectionProvider,
} from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';

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
    <section className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Workspace connections</p>
        <h2 className="mt-1 text-3xl font-semibold">Connections</h2>
        <p className="mt-2 max-w-3xl text-slate-400">
          Create provider metadata for this workspace. All connections remain Disconnected until a
          later product capability provides validation.
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded bg-red-950/50 p-3 text-red-200">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded border border-white/10 p-5">
          <h3 className="text-lg font-medium">Offered providers</h3>
          {loading ? <p className="mt-3 text-slate-400">Loading catalog…</p> : null}
          <div className="mt-4 space-y-4">
            {catalog?.connectionTypes.map((type) => (
              <div key={type.id}>
                <h4 className="font-medium">{type.displayName}</h4>
                <p className="mt-1 text-sm text-slate-400">
                  {type.providers.map((item) => item.displayName).join(' · ')}
                </p>
              </div>
            ))}
          </div>
        </section>

        <form onSubmit={create} className="rounded border border-white/10 p-5">
          <h3 className="text-lg font-medium">Create metadata entry</h3>
          <label className="mt-4 block text-sm">
            Display name
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={120}
              required
              className="mt-1 w-full rounded border border-white/20 bg-slate-950 px-3 py-2"
            />
          </label>
          <label className="mt-4 block text-sm">
            Provider
            <select
              value={provider}
              onChange={(event) => setProvider(event.target.value as ConnectionProvider)}
              className="mt-1 w-full rounded border border-white/20 bg-slate-950 px-3 py-2"
            >
              {catalog?.connectionTypes.flatMap((type) =>
                type.providers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {type.displayName} — {item.displayName}
                  </option>
                )),
              )}
            </select>
          </label>
          <button
            type="submit"
            disabled={saving}
            className="mt-5 rounded bg-sky-500 px-4 py-2 font-medium text-slate-950 disabled:opacity-50"
          >
            Create metadata
          </button>
        </form>
      </div>

      <section className="rounded border border-white/10 p-5">
        <h3 className="text-lg font-medium">Workspace metadata</h3>
        {loading ? <p className="mt-3 text-slate-400">Loading connections…</p> : null}
        {!loading && connections.length === 0 ? (
          <p className="mt-3 text-slate-400">No connection metadata has been created.</p>
        ) : null}
        <ul className="mt-4 divide-y divide-white/10">
          {connections.map((connection) => (
            <li key={connection.id} className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="font-medium">{connection.displayName}</p>
                <p className="text-sm text-slate-400">
                  {connection.connectionType} · {connection.provider}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded bg-slate-700 px-2 py-1 text-xs">Disconnected</span>
                <button
                  type="button"
                  onClick={() => {
                    setRenameId(connection.id);
                    setRenameValue(connection.displayName);
                  }}
                  className="text-sm text-sky-300 underline"
                >
                  Rename
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {renameId ? (
        <form onSubmit={rename} className="rounded border border-white/10 p-5">
          <h3 className="text-lg font-medium">Rename metadata</h3>
          <label className="mt-4 block text-sm">
            Display name
            <input
              autoFocus
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              maxLength={120}
              required
              className="mt-1 w-full rounded border border-white/20 bg-slate-950 px-3 py-2"
            />
          </label>
          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-sky-500 px-4 py-2 font-medium text-slate-950 disabled:opacity-50"
            >
              Save name
            </button>
            <button
              type="button"
              onClick={() => setRenameId(null)}
              className="rounded border border-white/20 px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
