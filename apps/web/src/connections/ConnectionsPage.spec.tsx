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
