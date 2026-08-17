import type { FormEvent } from 'react';
import type {
  ConnectionCatalogView,
  ConnectionMetadataView,
  ConnectionProvider,
} from '../shared/api';

export type ConnectionsViewProps = {
  catalog: ConnectionCatalogView | null;
  connections: ConnectionMetadataView[];
  displayName: string;
  provider: ConnectionProvider;
  renameId: string | null;
  renameValue: string;
  credentialConnection: ConnectionMetadataView | null;
  credentialValues: Record<string, string>;
  loading: boolean;
  saving: boolean;
  error: string | null;
  onDisplayName: (value: string) => void;
  onProvider: (value: ConnectionProvider) => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
  onStartRename: (connection: ConnectionMetadataView) => void;
  onRenameValue: (value: string) => void;
  onRename: (event: FormEvent<HTMLFormElement>) => void;
  onCancelRename: () => void;
  onStartCredentials: (connection: ConnectionMetadataView) => void;
  onCredentialValue: (field: string, value: string) => void;
  onStoreCredentials: (event: FormEvent<HTMLFormElement>) => void;
  onCancelCredentials: () => void;
};

export function ConnectionsView({
  catalog,
  connections,
  displayName,
  provider,
  renameId,
  renameValue,
  credentialConnection,
  credentialValues,
  loading,
  saving,
  error,
  onDisplayName,
  onProvider,
  onCreate,
  onStartRename,
  onRenameValue,
  onRename,
  onCancelRename,
  onStartCredentials,
  onCredentialValue,
  onStoreCredentials,
  onCancelCredentials,
}: ConnectionsViewProps) {
  const credentialProvider = catalog?.connectionTypes
    .flatMap((type) => type.providers)
    .find((providerItem) => providerItem.id === credentialConnection?.provider);

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

        <form onSubmit={onCreate} className="rounded border border-white/10 p-5">
          <h3 className="text-lg font-medium">Create metadata entry</h3>
          <label className="mt-4 block text-sm">
            Display name
            <input
              value={displayName}
              onChange={(event) => onDisplayName(event.target.value)}
              maxLength={120}
              required
              className="mt-1 w-full rounded border border-white/20 bg-slate-950 px-3 py-2"
            />
          </label>
          <label className="mt-4 block text-sm">
            Provider
            <select
              value={provider}
              onChange={(event) => onProvider(event.target.value as ConnectionProvider)}
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
                <span className="text-xs text-slate-400">
                  {connection.credentialsStored
                    ? 'Credentials stored securely.'
                    : 'No credentials stored'}
                </span>
                <button
                  type="button"
                  onClick={() => onStartCredentials(connection)}
                  className="text-sm text-sky-300 underline"
                >
                  {connection.credentialsStored ? 'Replace credentials' : 'Store credentials'}
                </button>
                <button
                  type="button"
                  onClick={() => onStartRename(connection)}
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
        <form onSubmit={onRename} className="rounded border border-white/10 p-5">
          <h3 className="text-lg font-medium">Rename metadata</h3>
          <label className="mt-4 block text-sm">
            Display name
            <input
              autoFocus
              value={renameValue}
              onChange={(event) => onRenameValue(event.target.value)}
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
              onClick={onCancelRename}
              className="rounded border border-white/20 px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {credentialConnection && credentialProvider ? (
        <form onSubmit={onStoreCredentials} className="rounded border border-white/10 p-5">
          <h3 className="text-lg font-medium">
            {credentialConnection.credentialsStored ? 'Replace credentials' : 'Store credentials'}
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            Credentials are stored securely and cannot be viewed after saving. This does not
            validate or connect the provider.
          </p>
          {credentialProvider.credentialFields.map((field) => (
            <label key={field} className="mt-4 block text-sm">
              {fieldLabel(field)}
              <input
                type="password"
                value={credentialValues[field] ?? ''}
                onChange={(event) => onCredentialValue(field, event.target.value)}
                autoComplete="off"
                required
                className="mt-1 w-full rounded border border-white/20 bg-slate-950 px-3 py-2"
              />
            </label>
          ))}
          <div className="mt-5 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-sky-500 px-4 py-2 font-medium text-slate-950 disabled:opacity-50"
            >
              Save credentials
            </button>
            <button
              type="button"
              onClick={onCancelCredentials}
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

function fieldLabel(field: string): string {
  return field.replace(/([A-Z])/g, ' $1').replace(/^./, (value) => value.toUpperCase());
}
