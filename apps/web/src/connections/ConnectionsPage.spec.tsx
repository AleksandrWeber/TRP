import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ConnectionCatalogView, ConnectionMetadataView } from '../shared/api';
import { ConnectionsView, type ConnectionsViewProps } from './ConnectionsView';

const exchangeCapabilities = ['SPOT', 'FUTURES', 'TESTNET', 'MARGIN', 'WEBSOCKET', 'REST'] as const;

const catalog: ConnectionCatalogView = {
  connectionTypes: [
    {
      id: 'EXCHANGE',
      displayName: 'Exchange',
      providers: [
        {
          id: 'BINANCE',
          displayName: 'Binance',
          credentialFields: ['apiKey', 'apiSecret'],
          capabilities: [...exchangeCapabilities],
          availability: 'AVAILABLE',
          category: 'EXCHANGE',
        },
        {
          id: 'BYBIT',
          displayName: 'Bybit',
          credentialFields: ['apiKey', 'apiSecret'],
          capabilities: [...exchangeCapabilities],
          availability: 'AVAILABLE',
          category: 'EXCHANGE',
        },
        {
          id: 'OKX',
          displayName: 'OKX',
          credentialFields: ['apiKey', 'apiSecret', 'passphrase'],
          capabilities: [...exchangeCapabilities],
          availability: 'AVAILABLE',
          category: 'EXCHANGE',
        },
      ],
    },
    {
      id: 'NOTIFICATION',
      displayName: 'Notification',
      providers: [
        { id: 'TELEGRAM', displayName: 'Telegram', credentialFields: ['botToken'] },
        {
          id: 'SMTP',
          displayName: 'SMTP',
          credentialFields: ['host', 'port', 'username', 'password', 'sender'],
        },
      ],
    },
    {
      id: 'AI',
      displayName: 'AI',
      providers: [{ id: 'OPENROUTER', displayName: 'OpenRouter', credentialFields: ['apiKey'] }],
    },
  ],
  exchangeProviders: [
    {
      id: 'BINANCE',
      displayName: 'Binance',
      category: 'EXCHANGE',
      capabilities: [...exchangeCapabilities],
      availability: 'AVAILABLE',
    },
    {
      id: 'BYBIT',
      displayName: 'Bybit',
      category: 'EXCHANGE',
      capabilities: [...exchangeCapabilities],
      availability: 'AVAILABLE',
    },
    {
      id: 'OKX',
      displayName: 'OKX',
      category: 'EXCHANGE',
      capabilities: [...exchangeCapabilities],
      availability: 'AVAILABLE',
    },
  ],
};

const disconnectedSession = {
  state: 'DISCONNECTED' as const,
  health: null,
  reconnectRequired: false,
  reconnectAllowed: false,
  providerAvailability: 'UNKNOWN' as const,
};

const connection: ConnectionMetadataView = {
  id: 'connection-1',
  workspaceId: 'workspace-a',
  displayName: 'Primary Binance',
  provider: 'BINANCE',
  connectionType: 'EXCHANGE',
  status: 'DISCONNECTED',
  credentialsStored: true,
  exchangeProvider: catalog.exchangeProviders[0] ?? null,
  session: disconnectedSession,
  capabilities: null,
  openRouterConnectivity: null,
  createdAt: '2026-08-17T16:00:00.000Z',
  updatedAt: '2026-08-17T16:00:00.000Z',
};

const viewProps: Omit<ConnectionsViewProps, 'connections' | 'provider'> = {
  catalog,
  displayName: '',
  renameId: null,
  renameValue: '',
  credentialConnection: connection,
  credentialValues: { apiKey: '', apiSecret: '' },
  loading: false,
  saving: false,
  error: null,
  onDisplayName: () => undefined,
  onProvider: () => undefined,
  onCreate: (event) => event.preventDefault(),
  onStartRename: () => undefined,
  onRenameValue: () => undefined,
  onRename: (event) => event.preventDefault(),
  onCancelRename: () => undefined,
  onStartCredentials: () => undefined,
  onCredentialValue: () => undefined,
  onStoreCredentials: (event) => event.preventDefault(),
  onCancelCredentials: () => undefined,
  onValidate: () => undefined,
  onDisconnect: () => undefined,
  onDisable: () => undefined,
  onRevoke: () => undefined,
  aiRequestConnectionId: null,
  aiRequestPrompt: '',
  aiRequestResult: null,
  onAiRequestConnectionId: () => undefined,
  onAiRequestPrompt: () => undefined,
  onSubmitAiRequest: (event) => event.preventDefault(),
  aiSessions: [],
  aiSessionName: '',
  aiSessionRenameId: null,
  aiSessionRenameValue: '',
  openAiSessionId: null,
  aiRequestSessionId: null,
  onAiSessionName: () => undefined,
  onCreateAiSession: (event) => event.preventDefault(),
  onOpenAiSession: () => undefined,
  onStartAiSessionRename: () => undefined,
  onAiSessionRenameValue: () => undefined,
  onRenameAiSession: (event) => event.preventDefault(),
  onCancelAiSessionRename: () => undefined,
  onCloseAiSession: () => undefined,
  onAiRequestSessionId: () => undefined,
  aiHistoryOpen: false,
  aiHistoryEntries: [],
  aiHistoryFilterSessionId: '',
  aiHistoryFilterStatus: '',
  openAiHistoryId: null,
  onOpenAiHistory: () => undefined,
  onAiHistoryFilterSessionId: () => undefined,
  onAiHistoryFilterStatus: () => undefined,
  onApplyAiHistoryFilter: (event) => event.preventDefault(),
  onOpenAiHistoryEntry: () => undefined,
  onNavigateToAiRequest: () => undefined,
};

describe('Connections UI (W2-S01-d)', () => {
  it('renders validation and lifecycle actions without exposing credentials', () => {
    const html = renderToStaticMarkup(
      <ConnectionsView
        {...viewProps}
        provider="BINANCE"
        connections={[
          connection,
          { ...connection, id: 'connection-2', status: 'PENDING_VALIDATION' },
          { ...connection, id: 'connection-3', status: 'CONNECTED' },
          { ...connection, id: 'connection-4', status: 'VALIDATION_FAILED' },
          { ...connection, id: 'connection-5', status: 'DISABLED' },
          { ...connection, id: 'connection-6', status: 'REVOKED', credentialsStored: false },
        ]}
      />,
    );

    expect(html).toContain('Connections');
    expect(html).toContain('Offered providers');
    expect(html).toContain('Exchange');
    expect(html).toContain('Binance');
    expect(html).toContain('Telegram');
    expect(html).toContain('OpenRouter');
    expect(html).toContain('Create metadata entry');
    expect(html).toContain('Primary Binance');
    expect(html).toContain('Disconnected');
    expect(html).toContain('Pending Validation');
    expect(html).toContain('Connected');
    expect(html).toContain('Validation Failed');
    expect(html).toContain('Disabled');
    expect(html).toContain('Revoked');
    expect(html).toContain('Run Validate');
    expect(html).toContain('Retry validation');
    expect(html).toContain('Credentials stored securely.');
    expect(html).toContain('Replace credentials');
    expect(html).toContain('Disconnect');
    expect(html).toContain('Disable');
    expect(html).toContain('Revoke');
    expect(html).toContain('type="password"');
    expect(html).not.toContain('Reveal');
    expect(html).not.toContain('Show Secret');
    expect(html).not.toContain('Copy Secret');
  });
});

describe('Connections UI exchange catalog (W2-S02-a)', () => {
  it('renders supported exchanges, provider selection, and capabilities', () => {
    const html = renderToStaticMarkup(
      <ConnectionsView {...viewProps} provider="BINANCE" connections={[connection]} />,
    );

    expect(html).toContain('Supported exchanges');
    expect(html).toContain('Binance');
    expect(html).toContain('Bybit');
    expect(html).toContain('OKX');
    expect(html).toContain('Available');
    expect(html).toContain('Supports Spot');
    expect(html).toContain('Supports Futures');
    expect(html).toContain('Supports Testnet');
    expect(html).toContain('Supports Margin');
    expect(html).toContain('Supports WebSocket');
    expect(html).toContain('Supports REST');
    expect(html).toContain('Binance capabilities:');
    expect(html).not.toContain('Authenticate');
    expect(html).not.toContain('Live status');
    expect(html).not.toContain('Trading enabled');
    expect(html).not.toMatch(/>Connect</);
  });

  it('shows the selected provider capabilities when the operator chooses an exchange', () => {
    const html = renderToStaticMarkup(
      <ConnectionsView {...viewProps} provider="OKX" connections={[]} />,
    );

    expect(html).toContain('OKX capabilities:');
    expect(html).toContain('Supports Spot');
    expect(html).not.toContain('Binance capabilities:');
  });
});

describe('Connections UI exchange handshake (W2-S02-b)', () => {
  it('renders validate flow and handshake outcomes without secrets or provider payloads', () => {
    const html = renderToStaticMarkup(
      <ConnectionsView
        {...viewProps}
        provider="BINANCE"
        connections={[
          connection,
          { ...connection, id: 'pending', status: 'PENDING_VALIDATION' },
          { ...connection, id: 'connected', status: 'CONNECTED' },
          { ...connection, id: 'failed', status: 'VALIDATION_FAILED' },
          { ...connection, id: 'timeout', status: 'HANDSHAKE_TIMEOUT' },
          { ...connection, id: 'unavailable', status: 'PROVIDER_UNAVAILABLE' },
          { ...connection, id: 'auth-failed', status: 'AUTHENTICATION_FAILED' },
        ]}
      />,
    );

    expect(html).toContain('Run Validate');
    expect(html).toContain('Retry validation');
    expect(html).toContain('Pending Validation');
    expect(html).toContain('Connected');
    expect(html).toContain('Validation Failed');
    expect(html).toContain('Handshake Timeout');
    expect(html).toContain('Provider Unavailable');
    expect(html).toContain('Authentication Failed');
    expect(html).toContain('the exchange accepted authenticated communication');
    expect(html).not.toContain('Trading enabled');
    expect(html).not.toContain('apiKey');
    expect(html).not.toContain('apiSecret');
    expect(html).not.toContain('X-MBX-APIKEY');
    expect(html).not.toContain('stack');
    expect(html).not.toContain('/sapi/v1/account/apiRestrictions');
    expect(html).not.toContain('Invalid API-key');
  });
});

describe('Connections UI exchange session health (W2-S02-c)', () => {
  it('renders session state, health, reconnect, and provider availability without trading claims', () => {
    const html = renderToStaticMarkup(
      <ConnectionsView
        {...viewProps}
        provider="BINANCE"
        connections={[
          {
            ...connection,
            id: 'healthy',
            status: 'CONNECTED',
            session: {
              state: 'CONNECTED',
              health: 'HEALTHY',
              reconnectRequired: false,
              reconnectAllowed: false,
              providerAvailability: 'AVAILABLE',
            },
          },
          {
            ...connection,
            id: 'expired',
            status: 'SESSION_EXPIRED',
            session: {
              state: 'SESSION_EXPIRED',
              health: 'EXPIRED',
              reconnectRequired: true,
              reconnectAllowed: true,
              providerAvailability: 'UNKNOWN',
            },
          },
          {
            ...connection,
            id: 'lost',
            status: 'CONNECTION_LOST',
            session: {
              state: 'CONNECTION_LOST',
              health: 'CONNECTION_LOST',
              reconnectRequired: true,
              reconnectAllowed: true,
              providerAvailability: 'UNKNOWN',
            },
          },
          {
            ...connection,
            id: 'unavailable',
            status: 'PROVIDER_UNAVAILABLE',
            session: {
              state: 'PROVIDER_UNAVAILABLE',
              health: 'UNAVAILABLE',
              reconnectRequired: true,
              reconnectAllowed: true,
              providerAvailability: 'UNAVAILABLE',
            },
          },
        ]}
      />,
    );

    expect(html).toContain('Session Connected');
    expect(html).toContain('Health Healthy');
    expect(html).toContain('Reconnect not required');
    expect(html).toContain('Provider Available');
    expect(html).toContain('Session Expired');
    expect(html).toContain('Health Expired');
    expect(html).toContain('Reconnect required');
    expect(html).toContain('Connection Lost');
    expect(html).toContain('Health Connection Lost');
    expect(html).toContain('Health Unavailable');
    expect(html).toContain('Provider Unavailable');
    expect(html).toContain('does not reconnect automatically');
    expect(html).not.toContain('Trading enabled');
    expect(html).not.toContain('Balances available');
    expect(html).not.toContain('Market data available');
    expect(html).not.toContain('Execution ready');
    expect(html).not.toContain('apiKey');
    expect(html).not.toContain('apiSecret');
  });
});

describe('Connections UI exchange capability verification (W2-S02-d)', () => {
  it('renders verified capability states without trading or market-data claims', () => {
    const html = renderToStaticMarkup(
      <ConnectionsView
        {...viewProps}
        provider="BINANCE"
        connections={[
          {
            ...connection,
            id: 'verified',
            status: 'CONNECTED',
            session: {
              state: 'CONNECTED',
              health: 'HEALTHY',
              reconnectRequired: false,
              reconnectAllowed: false,
              providerAvailability: 'AVAILABLE',
            },
            capabilities: {
              capabilities: [
                { capability: 'SPOT', state: 'SUPPORTED' },
                { capability: 'MARGIN', state: 'UNAVAILABLE' },
                { capability: 'FUTURES', state: 'UNKNOWN' },
                { capability: 'TESTNET', state: 'UNKNOWN' },
                { capability: 'REST', state: 'SUPPORTED' },
                { capability: 'WEBSOCKET', state: 'UNKNOWN' },
                { capability: 'WITHDRAW', state: 'UNAVAILABLE' },
                { capability: 'DEPOSIT', state: 'UNKNOWN' },
              ],
              verifiedAt: '2026-08-17T19:00:00.000Z',
              verificationFailed: false,
            },
          },
          {
            ...connection,
            id: 'failed-verification',
            status: 'CONNECTED',
            session: {
              state: 'CONNECTED',
              health: 'HEALTHY',
              reconnectRequired: false,
              reconnectAllowed: false,
              providerAvailability: 'AVAILABLE',
            },
            capabilities: {
              capabilities: [
                { capability: 'SPOT', state: 'VERIFICATION_FAILED' },
                { capability: 'REST', state: 'SUPPORTED' },
              ],
              verifiedAt: '2026-08-17T19:05:00.000Z',
              verificationFailed: true,
            },
          },
        ]}
      />,
    );

    expect(html).toContain('Verified capabilities');
    expect(html).toContain('Spot Trading: Supported');
    expect(html).toContain('Margin Trading: Unavailable');
    expect(html).toContain('Futures: Unknown');
    expect(html).toContain('Testnet: Unknown');
    expect(html).toContain('REST: Supported');
    expect(html).toContain('WebSocket: Unknown');
    expect(html).toContain('Withdraw: Unavailable');
    expect(html).toContain('Deposit: Unknown');
    expect(html).toContain('Verified at 2026-08-17T19:00:00.000Z');
    expect(html).toContain('Unavailable capability');
    expect(html).toContain('Verification failed');
    expect(html).toContain('They are not used');
    expect(html).not.toContain('Trading enabled');
    expect(html).not.toContain('Balances available');
    expect(html).not.toContain('Place order');
    expect(html).not.toContain('Market data available');
    expect(html).not.toContain('apiKey');
    expect(html).not.toContain('apiSecret');
  });
});

describe('Connections UI OpenRouter connectivity (W2-S05-a)', () => {
  const openRouter: ConnectionMetadataView = {
    id: 'connection-or-1',
    workspaceId: 'workspace-a',
    displayName: 'Workspace OpenRouter',
    provider: 'OPENROUTER',
    connectionType: 'AI',
    status: 'DISCONNECTED',
    credentialsStored: true,
    exchangeProvider: null,
    session: null,
    capabilities: null,
    openRouterConnectivity: {
      status: 'CONFIGURED',
      lastTestResult: null,
    },
    createdAt: '2026-08-26T12:00:00.000Z',
    updatedAt: '2026-08-26T12:00:00.000Z',
  };

  it('renders AI Connectivity configure, test, and honest status', () => {
    const html = renderToStaticMarkup(
      <ConnectionsView
        {...viewProps}
        provider="OPENROUTER"
        credentialConnection={openRouter}
        credentialValues={{ apiKey: '' }}
        connections={[
          openRouter,
          {
            ...openRouter,
            id: 'connection-or-2',
            status: 'CONNECTED',
            openRouterConnectivity: {
              status: 'CONNECTED',
              lastTestResult: {
                outcome: 'succeeded',
                failureReason: null,
                vendorVisibleMessage: 'OpenRouter accepted the workspace API key.',
                testedAt: '2026-08-26T12:05:00.000Z',
              },
            },
          },
          {
            ...openRouter,
            id: 'connection-or-3',
            status: 'AUTHENTICATION_FAILED',
            openRouterConnectivity: {
              status: 'CONNECTION_FAILED',
              lastTestResult: {
                outcome: 'failed',
                failureReason: 'AUTHENTICATION_FAILED',
                vendorVisibleMessage: 'OpenRouter rejected the API key.',
                testedAt: '2026-08-26T12:06:00.000Z',
              },
            },
          },
        ]}
      />,
    );

    expect(html).toContain('AI Connectivity');
    expect(html).toContain('Configure OpenRouter');
    expect(html).toContain('Replace OpenRouter API Key');
    expect(html).toContain('Save API Key');
    expect(html).toContain('Test Connection');
    expect(html).toContain('Configured');
    expect(html).toContain('Connected');
    expect(html).toContain('Connection Failed');
    expect(html).toContain('OpenRouter accepted the workspace API key.');
    expect(html).toContain('OpenRouter rejected the API key.');
    expect(html).toContain('does not require editing .env');
    expect(html).toContain('Workspace AI Request');
    expect(html).toContain('Submit AI Request');
    expect(html).toContain(
      'does not keep conversations, conversation continuation, prompt replay, or AI memory',
    );
    expect(html).toContain('Workspace AI Session');
    expect(html).toContain('Create Session');
    expect(html).toContain('Workspace AI Request History');
    expect(html).toContain('Open History');
    expect(html).not.toContain('Knowledge Lake');
    expect(html).not.toContain('Start conversation');
  });

  it('submits one AI request and shows one response without conversation history', () => {
    const connected: ConnectionMetadataView = {
      ...openRouter,
      status: 'CONNECTED',
      openRouterConnectivity: {
        status: 'CONNECTED',
        lastTestResult: {
          outcome: 'succeeded',
          failureReason: null,
          vendorVisibleMessage: 'OpenRouter accepted the workspace API key.',
          testedAt: '2026-08-26T12:05:00.000Z',
        },
      },
    };
    const html = renderToStaticMarkup(
      <ConnectionsView
        {...viewProps}
        provider="OPENROUTER"
        credentialConnection={null}
        aiRequestConnectionId={connected.id}
        aiRequestPrompt="Summarize connectivity."
        aiRequestResult={{
          requestId: 'req-1',
          status: 'SUCCEEDED',
          content: 'One workspace response.',
          model: 'openai/gpt-4o-mini',
          failureReason: null,
          vendorVisibleMessage: 'OpenRouter returned a response for this request.',
          requestedAt: '2026-08-26T18:00:00.000Z',
          connectionId: connected.id,
          workspaceId: 'workspace-a',
          sessionId: null,
        }}
        connections={[connected]}
      />,
    );

    expect(html).toContain('Workspace AI Request');
    expect(html).toContain('Submit AI Request');
    expect(html).toContain('Request status: Succeeded');
    expect(html).toContain('One workspace response.');
    expect(html).toContain('does not send previous requests to the model');
    expect(html).not.toContain('Conversation history');
    expect(html).not.toContain('Chat history');
    expect(html).not.toContain('AI Agents');
    expect(html).not.toContain('Model comparison');
  });
});

describe('Connections UI Workspace AI Session (W2-S05-c)', () => {
  const openSession = {
    id: 'session-1',
    workspaceId: 'workspace-a',
    displayName: 'Ops Session',
    status: 'OPEN' as const,
    createdBy: 'user-a',
    createdAt: '2026-08-26T19:00:00.000Z',
    closedAt: null,
    updatedAt: '2026-08-26T19:00:00.000Z',
    requests: [
      {
        requestId: 'req-1',
        connectionId: 'connection-or-1',
        status: 'SUCCEEDED',
        requestedAt: '2026-08-26T19:05:00.000Z',
      },
    ],
  };

  it('creates, opens, renames, and closes sessions without conversation UI', () => {
    const html = renderToStaticMarkup(
      <ConnectionsView
        {...viewProps}
        provider="OPENROUTER"
        aiSessions={[openSession]}
        aiSessionName="New Session"
        aiSessionRenameId={openSession.id}
        aiSessionRenameValue="Renamed Session"
        openAiSessionId={openSession.id}
        aiRequestSessionId={openSession.id}
        connections={[]}
      />,
    );

    expect(html).toContain('Workspace AI Session');
    expect(html).toContain('Create Session');
    expect(html).toContain('Open Session');
    expect(html).toContain('Rename Session');
    expect(html).toContain('Close Session');
    expect(html).toContain('Opened Session: Ops Session');
    expect(html).toContain('Request ID: req-1');
    expect(html).toContain('membership identities only');
    expect(html).toContain('does not create conversational AI');
    expect(html).toContain('does not implement AI memory');
    expect(html).not.toContain('Conversation history');
    expect(html).not.toContain('Prompt history');
    expect(html).not.toContain('AI Memory');
    expect(html).not.toContain('Knowledge Lake');
    expect(html).not.toContain('Agent execution');
    expect(html).not.toContain('Streaming');
    expect(html).not.toContain('Prompt continuation');
  });
});

describe('Connections UI Workspace AI Request History (W2-S05-d)', () => {
  const historyEntry = {
    id: 'hist-1',
    workspaceId: 'workspace-a',
    sessionId: 'session-1',
    requestId: 'req-1',
    connectionId: 'connection-or-1',
    executedAt: '2026-08-26T19:40:00.000Z',
    status: 'SUCCEEDED',
    model: 'openai/gpt-4o-mini',
    durationMs: 210,
  };

  it('lists, filters, and opens history without conversation or replay UI', () => {
    const html = renderToStaticMarkup(
      <ConnectionsView
        {...viewProps}
        provider="OPENROUTER"
        aiHistoryOpen
        aiHistoryEntries={[historyEntry]}
        aiHistoryFilterSessionId="session-1"
        aiHistoryFilterStatus="SUCCEEDED"
        openAiHistoryId={historyEntry.id}
        connections={[]}
      />,
    );

    expect(html).toContain('Workspace AI Request History');
    expect(html).toContain('Open History');
    expect(html).toContain('Filter History');
    expect(html).toContain('Open History Entry');
    expect(html).toContain('Navigate to Request');
    expect(html).toContain('History Entry');
    expect(html).toContain('History ID: hist-1');
    expect(html).toContain('Request: req-1');
    expect(html).toContain('Duration: 210 ms');
    expect(html).toContain('does not influence future AI requests');
    expect(html).toContain('Viewing History does not change AI behaviour');
    expect(html).toContain('prompt replay');
    expect(html).not.toContain('Continue conversation');
    expect(html).not.toContain('Prompt editing');
    expect(html).not.toContain('Knowledge Lake');
    expect(html).not.toContain('Agent execution');
    expect(html).not.toContain('Start streaming');
  });
});
