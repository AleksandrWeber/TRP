import type { FormEvent } from 'react';
import type {
  ConnectionCatalogView,
  ConnectionMetadataView,
  ConnectionProvider,
  ExchangeCapabilityState,
  ExchangeSessionCapability,
  OpenRouterConnectivityStatus,
  WorkspaceAiRequestHistoryView,
  WorkspaceAiRequestView,
  WorkspaceAiSessionView,
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
  aiRequestConnectionId: string | null;
  aiRequestPrompt: string;
  aiRequestResult: WorkspaceAiRequestView | null;
  aiSessions: WorkspaceAiSessionView[];
  aiSessionName: string;
  aiSessionRenameId: string | null;
  aiSessionRenameValue: string;
  openAiSessionId: string | null;
  aiRequestSessionId: string | null;
  aiHistoryOpen: boolean;
  aiHistoryEntries: WorkspaceAiRequestHistoryView[];
  aiHistoryFilterSessionId: string;
  aiHistoryFilterStatus: string;
  openAiHistoryId: string | null;
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
  onAiRequestConnectionId: (connectionId: string) => void;
  onAiRequestPrompt: (value: string) => void;
  onSubmitAiRequest: (event: FormEvent<HTMLFormElement>) => void;
  onAiSessionName: (value: string) => void;
  onCreateAiSession: (event: FormEvent<HTMLFormElement>) => void;
  onOpenAiSession: (sessionId: string) => void;
  onStartAiSessionRename: (session: WorkspaceAiSessionView) => void;
  onAiSessionRenameValue: (value: string) => void;
  onRenameAiSession: (event: FormEvent<HTMLFormElement>) => void;
  onCancelAiSessionRename: () => void;
  onCloseAiSession: (sessionId: string) => void;
  onAiRequestSessionId: (sessionId: string | null) => void;
  onOpenAiHistory: () => void;
  onAiHistoryFilterSessionId: (sessionId: string) => void;
  onAiHistoryFilterStatus: (status: string) => void;
  onApplyAiHistoryFilter: (event: FormEvent<HTMLFormElement>) => void;
  onOpenAiHistoryEntry: (historyId: string) => void;
  onNavigateToAiRequest: (entry: WorkspaceAiRequestHistoryView) => void;
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
  aiRequestConnectionId,
  aiRequestPrompt,
  aiRequestResult,
  aiSessions,
  aiSessionName,
  aiSessionRenameId,
  aiSessionRenameValue,
  openAiSessionId,
  aiRequestSessionId,
  aiHistoryOpen,
  aiHistoryEntries,
  aiHistoryFilterSessionId,
  aiHistoryFilterStatus,
  openAiHistoryId,
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
  onAiRequestConnectionId,
  onAiRequestPrompt,
  onSubmitAiRequest,
  onAiSessionName,
  onCreateAiSession,
  onOpenAiSession,
  onStartAiSessionRename,
  onAiSessionRenameValue,
  onRenameAiSession,
  onCancelAiSessionRename,
  onCloseAiSession,
  onAiRequestSessionId,
  onOpenAiHistory,
  onAiHistoryFilterSessionId,
  onAiHistoryFilterStatus,
  onApplyAiHistoryFilter,
  onOpenAiHistoryEntry,
  onNavigateToAiRequest,
}: ConnectionsViewProps) {
  const credentialProvider = catalog?.connectionTypes
    .flatMap((type) => type.providers)
    .find((providerItem) => providerItem.id === credentialConnection?.provider);
  const selectedExchange = catalog?.exchangeProviders.find((item) => item.id === provider);
  const openRouterConnections = connections.filter(
    (connection) => connection.provider === 'OPENROUTER',
  );
  const connectedOpenRouter = openRouterConnections.filter(
    (connection) => connection.openRouterConnectivity?.status === 'CONNECTED',
  );
  const openAiSessions = aiSessions.filter((session) => session.status === 'OPEN');
  const openedSession = aiSessions.find((session) => session.id === openAiSessionId) ?? null;
  const openedHistoryEntry = aiHistoryEntries.find((entry) => entry.id === openAiHistoryId) ?? null;

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
          product does not reconnect automatically. Verified capabilities describe what the
          authenticated session was observed to allow. They are not used. Connected does not
          indicate live trading, delivery, balances, orders, market data, or execution.
        </p>
        <p className="mt-2 max-w-3xl text-slate-400">
          AI Connectivity lets a workspace configure an OpenRouter API key, test connectivity,
          submit independent AI requests, organize those requests into Workspace AI Sessions, and
          review read-only Request History. Connected means OpenRouter accepted the workspace key. A
          successful request means only this response. A Session groups request identities. History
          is an operational record only. It is not conversation, chat, AI memory, or an AI Platform.
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded bg-red-950/50 p-3 text-red-200">
          {error}
        </p>
      ) : null}

      <section
        id="ai-connectivity"
        aria-labelledby="ai-connectivity-heading"
        className="rounded border border-white/10 p-5"
      >
        <h3 id="ai-connectivity-heading" className="text-lg font-medium">
          AI Connectivity
        </h3>
        <p className="mt-2 text-sm text-slate-400">
          Configure OpenRouter, save the API key, test the connection, submit independent AI
          requests, organize them in Workspace AI Sessions, and review Request History. This surface
          does not keep conversations, conversation continuation, prompt replay, or AI memory.
        </p>
        <ul className="mt-4 divide-y divide-white/10">
          {openRouterConnections.map((connection) => (
            <li
              key={`ai-${connection.id}`}
              className="flex items-center justify-between gap-4 py-4"
            >
              <div>
                <p className="font-medium">{connection.displayName}</p>
                <p className="text-sm text-slate-400">OpenRouter</p>
                {connection.openRouterConnectivity ? (
                  <div className="mt-1 text-sm text-slate-400">
                    <p>
                      Connection status:{' '}
                      {openRouterConnectivityLabel(connection.openRouterConnectivity.status)}
                    </p>
                    {connection.openRouterConnectivity.lastTestResult ? (
                      <p>
                        Last test:{' '}
                        {connection.openRouterConnectivity.lastTestResult.outcome === 'succeeded'
                          ? 'Succeeded'
                          : 'Failed'}{' '}
                        — {connection.openRouterConnectivity.lastTestResult.vendorVisibleMessage} (
                        {connection.openRouterConnectivity.lastTestResult.testedAt})
                      </p>
                    ) : (
                      <p>Last test: Not run</p>
                    )}
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {connection.status !== 'DISABLED' ? (
                  <button
                    type="button"
                    onClick={() => onStartCredentials(connection)}
                    className="text-sm text-sky-300 underline"
                  >
                    {connection.credentialsStored ? 'Replace API Key' : 'Save API Key'}
                  </button>
                ) : null}
                {connection.credentialsStored && canRunValidate(connection.status) ? (
                  <button
                    type="button"
                    onClick={() => onValidate(connection)}
                    disabled={saving}
                    className="text-sm text-sky-300 underline disabled:opacity-50"
                  >
                    Test Connection
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
              </div>
            </li>
          ))}
        </ul>
        {!loading && openRouterConnections.length === 0 ? (
          <p className="mt-3 text-slate-400">
            Create an OpenRouter connection below to configure AI Connectivity for this workspace.
          </p>
        ) : null}

        <form onSubmit={onCreateAiSession} className="mt-6 border-t border-white/10 pt-5">
          <h4 className="font-medium">Workspace AI Session</h4>
          <p className="mt-2 text-sm text-slate-400">
            Create a Session to group independent AI request identities for operations. A Session
            does not remember previous requests for the model, does not create conversational AI,
            and does not implement AI memory.
          </p>
          <label className="mt-4 block text-sm">
            Session name
            <input
              value={aiSessionName}
              onChange={(event) => onAiSessionName(event.target.value)}
              maxLength={120}
              required
              className="mt-1 w-full rounded border border-white/20 bg-slate-950 px-3 py-2"
              placeholder="Operational session name"
            />
          </label>
          <button
            type="submit"
            disabled={saving || !aiSessionName.trim()}
            className="mt-4 rounded bg-sky-500 px-4 py-2 font-medium text-slate-950 disabled:opacity-50"
          >
            Create Session
          </button>
        </form>

        <ul className="mt-4 divide-y divide-white/10">
          {aiSessions.map((session) => (
            <li key={session.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div>
                <p className="font-medium">{session.displayName}</p>
                <p className="text-sm text-slate-400">
                  Status: {session.status === 'OPEN' ? 'Open' : 'Closed'} · Requests:{' '}
                  {session.requests.length}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onOpenAiSession(session.id)}
                  className="text-sm text-sky-300 underline"
                >
                  Open Session
                </button>
                {session.status === 'OPEN' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onStartAiSessionRename(session)}
                      className="text-sm text-sky-300 underline"
                    >
                      Rename Session
                    </button>
                    <button
                      type="button"
                      onClick={() => onCloseAiSession(session.id)}
                      disabled={saving}
                      className="text-sm text-sky-300 underline disabled:opacity-50"
                    >
                      Close Session
                    </button>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
        {!loading && aiSessions.length === 0 ? (
          <p className="mt-3 text-slate-400">No Workspace AI Sessions yet.</p>
        ) : null}

        {aiSessionRenameId ? (
          <form onSubmit={onRenameAiSession} className="mt-4 rounded border border-white/10 p-4">
            <label className="block text-sm">
              Rename Session
              <input
                value={aiSessionRenameValue}
                onChange={(event) => onAiSessionRenameValue(event.target.value)}
                maxLength={120}
                required
                className="mt-1 w-full rounded border border-white/20 bg-slate-950 px-3 py-2"
              />
            </label>
            <div className="mt-3 flex gap-3">
              <button
                type="submit"
                disabled={saving || !aiSessionRenameValue.trim()}
                className="rounded bg-sky-500 px-3 py-1.5 text-sm font-medium text-slate-950 disabled:opacity-50"
              >
                Save name
              </button>
              <button
                type="button"
                onClick={onCancelAiSessionRename}
                className="text-sm text-slate-300 underline"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        {openedSession ? (
          <div className="mt-4 rounded border border-white/10 p-4" aria-live="polite">
            <h5 className="font-medium">Opened Session: {openedSession.displayName}</h5>
            <p className="mt-1 text-sm text-slate-400">
              Status: {openedSession.status === 'OPEN' ? 'Open' : 'Closed'}. Requests below are
              membership identities only. Prompt bodies and model responses are not shown here.
            </p>
            {openedSession.requests.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">
                No requests grouped in this Session yet.
              </p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {openedSession.requests.map((membership) => (
                  <li key={membership.requestId} className="rounded border border-white/5 p-3">
                    <p>Request ID: {membership.requestId}</p>
                    <p className="text-slate-400">
                      Status: {membership.status} · Connection: {membership.connectionId}
                    </p>
                    <p className="text-xs text-slate-500">Requested at {membership.requestedAt}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        <form
          id="workspace-ai-request"
          onSubmit={onSubmitAiRequest}
          className="mt-6 border-t border-white/10 pt-5"
        >
          <h4 className="font-medium">Workspace AI Request</h4>
          <p className="mt-2 text-sm text-slate-400">
            Submit one AI request using the Connected OpenRouter key for this workspace. Optionally
            group the request identity under an open Session. The response is only for this request.
            The Session does not send previous requests to the model. History never influences this
            request.
          </p>
          <label className="mt-4 block text-sm">
            OpenRouter connection
            <select
              value={aiRequestConnectionId ?? ''}
              onChange={(event) => onAiRequestConnectionId(event.target.value)}
              className="mt-1 w-full rounded border border-white/20 bg-slate-950 px-3 py-2"
              required
            >
              <option value="" disabled>
                {connectedOpenRouter.length === 0
                  ? 'No Connected OpenRouter connection'
                  : 'Select connection'}
              </option>
              {connectedOpenRouter.map((connection) => (
                <option key={connection.id} value={connection.id}>
                  {connection.displayName}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-4 block text-sm">
            Session (optional grouping)
            <select
              value={aiRequestSessionId ?? ''}
              onChange={(event) =>
                onAiRequestSessionId(event.target.value ? event.target.value : null)
              }
              className="mt-1 w-full rounded border border-white/20 bg-slate-950 px-3 py-2"
            >
              <option value="">No Session</option>
              {openAiSessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.displayName}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-4 block text-sm">
            Request
            <textarea
              value={aiRequestPrompt}
              onChange={(event) => onAiRequestPrompt(event.target.value)}
              maxLength={4000}
              rows={4}
              required
              className="mt-1 w-full rounded border border-white/20 bg-slate-950 px-3 py-2"
              placeholder="Enter one AI request…"
            />
          </label>
          <button
            type="submit"
            disabled={saving || connectedOpenRouter.length === 0}
            className="mt-4 rounded bg-sky-500 px-4 py-2 font-medium text-slate-950 disabled:opacity-50"
          >
            Submit AI Request
          </button>
          {aiRequestResult ? (
            <div className="mt-4 rounded border border-white/10 p-4 text-sm" aria-live="polite">
              <p>Request status: {workspaceAiRequestStatusLabel(aiRequestResult.status)}</p>
              <p className="mt-1 text-slate-400">{aiRequestResult.vendorVisibleMessage}</p>
              {aiRequestResult.sessionId ? (
                <p className="mt-1 text-slate-400">Session ID: {aiRequestResult.sessionId}</p>
              ) : null}
              {aiRequestResult.model ? (
                <p className="mt-1 text-slate-400">Model: {aiRequestResult.model}</p>
              ) : null}
              {aiRequestResult.content ? (
                <pre className="mt-3 whitespace-pre-wrap text-slate-200">
                  {aiRequestResult.content}
                </pre>
              ) : null}
              <p className="mt-2 text-xs text-slate-500">
                Requested at {aiRequestResult.requestedAt}
              </p>
            </div>
          ) : null}
        </form>

        <div className="mt-6 border-t border-white/10 pt-5">
          <h4 className="font-medium">Workspace AI Request History</h4>
          <p className="mt-2 text-sm text-slate-400">
            Review a read-only operational record of independently executed AI requests that were
            grouped under a Session. History is not a conversation, does not reconstruct context,
            and does not influence future AI requests.
          </p>
          <button
            type="button"
            onClick={onOpenAiHistory}
            disabled={saving}
            className="mt-4 rounded bg-sky-500 px-4 py-2 font-medium text-slate-950 disabled:opacity-50"
          >
            Open History
          </button>

          {aiHistoryOpen ? (
            <div className="mt-4">
              <form
                onSubmit={onApplyAiHistoryFilter}
                className="grid gap-3 md:grid-cols-3 md:items-end"
              >
                <label className="block text-sm">
                  Filter by Session
                  <select
                    value={aiHistoryFilterSessionId}
                    onChange={(event) => onAiHistoryFilterSessionId(event.target.value)}
                    className="mt-1 w-full rounded border border-white/20 bg-slate-950 px-3 py-2"
                  >
                    <option value="">All Sessions</option>
                    {aiSessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.displayName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  Filter by Status
                  <select
                    value={aiHistoryFilterStatus}
                    onChange={(event) => onAiHistoryFilterStatus(event.target.value)}
                    className="mt-1 w-full rounded border border-white/20 bg-slate-950 px-3 py-2"
                  >
                    <option value="">All statuses</option>
                    <option value="SUCCEEDED">Succeeded</option>
                    <option value="FAILED">Failed</option>
                    <option value="UNAVAILABLE">Unavailable</option>
                  </select>
                </label>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded border border-sky-400 px-4 py-2 text-sm text-sky-200 disabled:opacity-50"
                >
                  Filter History
                </button>
              </form>

              <ul className="mt-4 divide-y divide-white/10">
                {aiHistoryEntries.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex flex-wrap items-center justify-between gap-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">Request {entry.requestId}</p>
                      <p className="text-slate-400">
                        Status: {entry.status} · Duration: {entry.durationMs} ms ·{' '}
                        {entry.executedAt}
                      </p>
                      {entry.model ? <p className="text-slate-400">Model: {entry.model}</p> : null}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => onOpenAiHistoryEntry(entry.id)}
                        className="text-sky-300 underline"
                      >
                        Open History Entry
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigateToAiRequest(entry)}
                        className="text-sky-300 underline"
                      >
                        Navigate to Request
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              {aiHistoryEntries.length === 0 ? (
                <p className="mt-3 text-slate-400">No history entries for the current filter.</p>
              ) : null}

              {openedHistoryEntry ? (
                <div className="mt-4 rounded border border-white/10 p-4 text-sm" aria-live="polite">
                  <h5 className="font-medium">History Entry</h5>
                  <p className="mt-2">History ID: {openedHistoryEntry.id}</p>
                  <p className="text-slate-400">Workspace: {openedHistoryEntry.workspaceId}</p>
                  <p className="text-slate-400">Session: {openedHistoryEntry.sessionId}</p>
                  <p className="text-slate-400">Request: {openedHistoryEntry.requestId}</p>
                  <p className="text-slate-400">Status: {openedHistoryEntry.status}</p>
                  <p className="text-slate-400">
                    Executed at: {openedHistoryEntry.executedAt} · Duration:{' '}
                    {openedHistoryEntry.durationMs} ms
                  </p>
                  {openedHistoryEntry.model ? (
                    <p className="text-slate-400">Model: {openedHistoryEntry.model}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-slate-500">
                    Read-only metadata. Prompt and response bodies are owned by AI Request, not
                    History. Viewing History does not change AI behaviour.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

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
                {connection.capabilities ? (
                  <div className="mt-1 text-sm text-slate-400">
                    <p>Verified capabilities</p>
                    {connection.capabilities.capabilities.map((item) => (
                      <p key={item.capability}>
                        {verifiedCapabilityLabel(item.capability)}:{' '}
                        {capabilityStateLabel(item.state)}
                      </p>
                    ))}
                    {connection.capabilities.verifiedAt ? (
                      <p>Verified at {connection.capabilities.verifiedAt}</p>
                    ) : null}
                    {connection.capabilities.capabilities.some(
                      (item) => item.state === 'UNAVAILABLE',
                    ) ? (
                      <p>Unavailable capability</p>
                    ) : null}
                    {connection.capabilities.verificationFailed ? <p>Verification failed</p> : null}
                  </div>
                ) : null}
                {connection.openRouterConnectivity ? (
                  <div className="mt-1 text-sm text-slate-400">
                    <p>
                      AI Connectivity:{' '}
                      {openRouterConnectivityLabel(connection.openRouterConnectivity.status)}
                    </p>
                    {connection.openRouterConnectivity.lastTestResult ? (
                      <p>
                        Last test result:{' '}
                        {connection.openRouterConnectivity.lastTestResult.vendorVisibleMessage}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded bg-slate-700 px-2 py-1 text-xs">
                  {connection.openRouterConnectivity
                    ? openRouterConnectivityLabel(connection.openRouterConnectivity.status)
                    : statusLabel(connection.status)}
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
                    {connection.provider === 'OPENROUTER'
                      ? connection.credentialsStored
                        ? 'Replace API Key'
                        : 'Save API Key'
                      : connection.credentialsStored
                        ? 'Replace credentials'
                        : 'Store credentials'}
                  </button>
                ) : null}
                {connection.credentialsStored && canRunValidate(connection.status) ? (
                  <button
                    type="button"
                    onClick={() => onValidate(connection)}
                    disabled={saving}
                    className="text-sm text-sky-300 underline disabled:opacity-50"
                  >
                    {connection.provider === 'OPENROUTER'
                      ? 'Test Connection'
                      : connection.status === 'DISCONNECTED'
                        ? 'Run Validate'
                        : 'Retry validation'}
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
            {credentialConnection.provider === 'OPENROUTER'
              ? credentialConnection.credentialsStored
                ? 'Replace OpenRouter API Key'
                : 'Save OpenRouter API Key'
              : credentialConnection.credentialsStored
                ? 'Replace credentials'
                : 'Store credentials'}
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            {credentialConnection.provider === 'OPENROUTER'
              ? 'The API key is stored securely and cannot be viewed after saving. Saving does not require editing .env or restarting the product. This does not execute prompts or open chat.'
              : 'Credentials are stored securely and cannot be viewed after saving. This does not validate or connect the provider.'}
          </p>
          {credentialProvider.credentialFields.map((field) => (
            <label key={field} className="mt-4 block text-sm">
              {credentialConnection.provider === 'OPENROUTER' && field === 'apiKey'
                ? 'OpenRouter API Key'
                : fieldLabel(field)}
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
              {credentialConnection.provider === 'OPENROUTER' ? 'Save API Key' : 'Save credentials'}
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

function openRouterConnectivityLabel(status: OpenRouterConnectivityStatus): string {
  switch (status) {
    case 'NOT_CONFIGURED':
      return 'Not Configured';
    case 'CONFIGURED':
      return 'Configured';
    case 'CONNECTED':
      return 'Connected';
    case 'CONNECTION_FAILED':
      return 'Connection Failed';
    case 'DISABLED':
      return 'Disabled';
  }
}

function workspaceAiRequestStatusLabel(status: WorkspaceAiRequestView['status']): string {
  switch (status) {
    case 'SUCCEEDED':
      return 'Succeeded';
    case 'FAILED':
      return 'Failed';
    case 'UNAVAILABLE':
      return 'Unavailable';
  }
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

function verifiedCapabilityLabel(capability: ExchangeSessionCapability): string {
  switch (capability) {
    case 'SPOT':
      return 'Spot Trading';
    case 'MARGIN':
      return 'Margin Trading';
    case 'FUTURES':
      return 'Futures';
    case 'TESTNET':
      return 'Testnet';
    case 'REST':
      return 'REST';
    case 'WEBSOCKET':
      return 'WebSocket';
    case 'WITHDRAW':
      return 'Withdraw';
    case 'DEPOSIT':
      return 'Deposit';
    default:
      return capability;
  }
}

function capabilityStateLabel(state: ExchangeCapabilityState): string {
  switch (state) {
    case 'SUPPORTED':
      return 'Supported';
    case 'UNSUPPORTED':
      return 'Unsupported';
    case 'UNAVAILABLE':
      return 'Unavailable';
    case 'VERIFICATION_FAILED':
      return 'Verification Failed';
    default:
      return 'Unknown';
  }
}
