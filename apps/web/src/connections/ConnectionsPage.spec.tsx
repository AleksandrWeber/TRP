import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ConnectionCatalogView, ConnectionMetadataView } from '../shared/api';
import { ConnectionsView } from './ConnectionsView';

const catalog: ConnectionCatalogView = {
  connectionTypes: [
    {
      id: 'EXCHANGE',
      displayName: 'Exchange',
      providers: [
        { id: 'BINANCE', displayName: 'Binance', credentialFields: ['apiKey', 'apiSecret'] },
        { id: 'BYBIT', displayName: 'Bybit', credentialFields: ['apiKey', 'apiSecret'] },
        { id: 'OKX', displayName: 'OKX', credentialFields: ['apiKey', 'apiSecret', 'passphrase'] },
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
};

const connection: ConnectionMetadataView = {
  id: 'connection-1',
  workspaceId: 'workspace-a',
  displayName: 'Primary Binance',
  provider: 'BINANCE',
  connectionType: 'EXCHANGE',
  status: 'DISCONNECTED',
  credentialsStored: true,
  createdAt: '2026-08-17T16:00:00.000Z',
  updatedAt: '2026-08-17T16:00:00.000Z',
};

describe('Connections UI (W2-S01-d)', () => {
  it('renders validation and lifecycle actions without exposing credentials', () => {
    const html = renderToStaticMarkup(
      <ConnectionsView
        catalog={catalog}
        connections={[
          connection,
          { ...connection, id: 'connection-2', status: 'PENDING_VALIDATION' },
          { ...connection, id: 'connection-3', status: 'CONNECTED' },
          { ...connection, id: 'connection-4', status: 'VALIDATION_FAILED' },
          { ...connection, id: 'connection-5', status: 'DISABLED' },
          { ...connection, id: 'connection-6', status: 'REVOKED', credentialsStored: false },
        ]}
        displayName=""
        provider="BINANCE"
        renameId={null}
        renameValue=""
        credentialConnection={connection}
        credentialValues={{ apiKey: '', apiSecret: '' }}
        loading={false}
        saving={false}
        error={null}
        onDisplayName={() => undefined}
        onProvider={() => undefined}
        onCreate={(event) => event.preventDefault()}
        onStartRename={() => undefined}
        onRenameValue={() => undefined}
        onRename={(event) => event.preventDefault()}
        onCancelRename={() => undefined}
        onStartCredentials={() => undefined}
        onCredentialValue={() => undefined}
        onStoreCredentials={(event) => event.preventDefault()}
        onCancelCredentials={() => undefined}
        onValidate={() => undefined}
        onDisconnect={() => undefined}
        onDisable={() => undefined}
        onRevoke={() => undefined}
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
