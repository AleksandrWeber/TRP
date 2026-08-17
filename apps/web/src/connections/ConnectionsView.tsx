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
  onValidate: (connection: ConnectionMetadataView) => void;
  onDisconnect: (connection: ConnectionMetadataView) => void;
  onDisable: (connection: ConnectionMetadataView) => void;
  onRevoke: (connection: ConnectionMetadataView) => void;
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
  onValidate,
  onDisconnect,
  onDisable,
  onRevoke,
}: ConnectionsViewProps) {
  const credentialProvider = catalog?.connectionTypes
    .flatMap((type) => type.providers)
    .find((providerItem) => providerItem.id === credentialConnection?.provider);
  const selectedExchange = catalog?.exchangeProviders.find((item) => item.id === provider);

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Workspace connections</p>
        <h2 className="mt-1 text-3xl font-semibold">Connections</h2>
        <p className="mt-2 max-w-3xl text-slate-400">
          Store provider credentials and validate that the configured connection satisfies the
          current contract. Exchange connections run an authenticated handshake with the selected
          exchange. Connected means the exchange accepted authenticated communication. Connection
          health reflects only the observed authenticated session. Reconnect is advisory; the
          product does not reconnect automatically. Connected does not indicate live trading,
          delivery, balances, orders, market data, or execution.
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded bg-red-950/50 p-3 text-red-200">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded border border-white/10 p-5">
          <h3 className="text-lg font-medium">Supported exchanges</h3>
          {loading ? <p className="mt-3 text-slate-400">Loading catalog…</p> : null}
          <div className="mt-4 space-y-4">
            {catalog?.exchangeProviders.map((item) => (
              <div key={item.id}>
                <h4 className="font-medium">{item.displayName}</h4>
                <p className="mt-1 text-sm text-slate-400">
                  {item.availability === 'AVAILABLE' ? 'Available' : 'Unavailable'}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {item.capabilities.map(capabilityLabel).join(' · ')}
                </p>
              </div>
            ))}
          </div>
        </section>

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
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
          {selectedExchange ? (
            <p className="mt-3 text-sm text-slate-400">
              {selectedExchange.displayName} capabilities:{' '}
              {selectedExchange.capabilities.map(capabilityLabel).join(' · ')}
            </p>
          ) : null}
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
                {connection.exchangeProvider ? (
                  <p className="text-sm text-slate-400">
                    {connection.exchangeProvider.capabilities.map(capabilityLabel).join(' · ')}
                  </p>
                ) : null}
                {connection.session ? (
                  <p className="text-sm text-slate-400">
                    Session {sessionStateLabel(connection.session.state)} · Health{' '}
                    {healthLabel(connection.session.health)} ·{' '}
                    {connection.session.reconnectRequired
                      ? 'Reconnect required'
                      : 'Reconnect not required'}{' '}
                    · Provider {availabilityLabel(connection.session.providerAvailability)}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded bg-slate-700 px-2 py-1 text-xs">
                  {statusLabel(connection.status)}
                </span>
                <span className="text-xs text-slate-400">
                  {connection.credentialsStored
                    ? 'Credentials stored securely.'
                    : 'No credentials stored'}
                </span>
                {connection.status !== 'DISABLED' ? (
                  <button
                    type="button"
                    onClick={() => onStartCredentials(connection)}
                    className="text-sm text-sky-300 underline"
                  >
                    {connection.credentialsStored ? 'Replace credentials' : 'Store credentials'}
                  </button>
                ) : null}
                {connection.credentialsStored && canRunValidate(connection.status) ? (
                  <button
                    type="button"
                    onClick={() => onValidate(connection)}
                    disabled={saving}
                    className="text-sm text-sky-300 underline disabled:opacity-50"
                  >
                    {connection.status === 'DISCONNECTED' ? 'Run Validate' : 'Retry validation'}
                  </button>
                ) : null}
                {connection.status === 'CONNECTED' ||
                connection.status === 'SESSION_EXPIRED' ||
                connection.status === 'CONNECTION_LOST' ? (
                  <button
                    type="button"
                    onClick={() => onDisconnect(connection)}
                    disabled={saving}
                    className="text-sm text-sky-300 underline disabled:opacity-50"
                  >
                    Disconnect
                  </button>
                ) : null}
                {canDisable(connection.status) ? (
                  <button
                    type="button"
                    onClick={() => onDisable(connection)}
                    disabled={saving}
                    className="text-sm text-sky-300 underline disabled:opacity-50"
                  >
                    Disable
                  </button>
                ) : null}
                {connection.credentialsStored &&
                connection.status !== 'PENDING_VALIDATION' &&
                connection.status !== 'REVOKED' ? (
                  <button
                    type="button"
                    onClick={() => onRevoke(connection)}
                    disabled={saving}
                    className="text-sm text-sky-300 underline disabled:opacity-50"
                  >
                    Revoke
                  </button>
                ) : null}
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

function capabilityLabel(capability: string): string {
  switch (capability) {
    case 'SPOT':
      return 'Supports Spot';
    case 'FUTURES':
      return 'Supports Futures';
    case 'TESTNET':
      return 'Supports Testnet';
    case 'MARGIN':
      return 'Supports Margin';
    case 'WEBSOCKET':
      return 'Supports WebSocket';
    case 'REST':
      return 'Supports REST';
    default:
      return capability;
  }
}

function statusLabel(status: ConnectionMetadataView['status']): string {
  switch (status) {
    case 'PENDING_VALIDATION':
      return 'Pending Validation';
    case 'CONNECTED':
      return 'Connected';
    case 'VALIDATION_FAILED':
      return 'Validation Failed';
    case 'HANDSHAKE_TIMEOUT':
      return 'Handshake Timeout';
    case 'PROVIDER_UNAVAILABLE':
      return 'Provider Unavailable';
    case 'AUTHENTICATION_FAILED':
      return 'Authentication Failed';
    case 'SESSION_EXPIRED':
      return 'Session Expired';
    case 'CONNECTION_LOST':
      return 'Connection Lost';
    case 'DISABLED':
      return 'Disabled';
    case 'REVOKED':
      return 'Revoked';
    default:
      return 'Disconnected';
  }
}

function canRunValidate(status: ConnectionMetadataView['status']): boolean {
  return (
    status === 'DISCONNECTED' ||
    status === 'VALIDATION_FAILED' ||
    status === 'HANDSHAKE_TIMEOUT' ||
    status === 'PROVIDER_UNAVAILABLE' ||
    status === 'AUTHENTICATION_FAILED' ||
    status === 'SESSION_EXPIRED' ||
    status === 'CONNECTION_LOST'
  );
}

function canDisable(status: ConnectionMetadataView['status']): boolean {
  return (
    status === 'DISCONNECTED' ||
    status === 'CONNECTED' ||
    status === 'VALIDATION_FAILED' ||
    status === 'HANDSHAKE_TIMEOUT' ||
    status === 'PROVIDER_UNAVAILABLE' ||
    status === 'AUTHENTICATION_FAILED' ||
    status === 'SESSION_EXPIRED' ||
    status === 'CONNECTION_LOST'
  );
}

function sessionStateLabel(state: NonNullable<ConnectionMetadataView['session']>['state']): string {
  switch (state) {
    case 'PENDING_VALIDATION':
      return 'Pending Validation';
    case 'CONNECTED':
      return 'Connected';
    case 'SESSION_EXPIRED':
      return 'Session Expired';
    case 'CONNECTION_LOST':
      return 'Connection Lost';
    case 'PROVIDER_UNAVAILABLE':
      return 'Provider Unavailable';
    case 'VALIDATION_FAILED':
      return 'Validation Failed';
    case 'AUTHENTICATION_FAILED':
      return 'Authentication Failed';
    default:
      return 'Disconnected';
  }
}

function healthLabel(health: NonNullable<ConnectionMetadataView['session']>['health']): string {
  switch (health) {
    case 'HEALTHY':
      return 'Healthy';
    case 'UNAVAILABLE':
      return 'Unavailable';
    case 'EXPIRED':
      return 'Expired';
    case 'AUTHENTICATION_FAILED':
      return 'Authentication Failed';
    case 'CONNECTION_LOST':
      return 'Connection Lost';
    default:
      return 'Not observed';
  }
}

function availabilityLabel(
  availability: NonNullable<ConnectionMetadataView['session']>['providerAvailability'],
): string {
  switch (availability) {
    case 'AVAILABLE':
      return 'Available';
    case 'UNAVAILABLE':
      return 'Unavailable';
    default:
      return 'Unknown';
  }
}
