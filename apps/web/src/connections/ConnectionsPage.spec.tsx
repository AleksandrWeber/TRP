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
        { id: 'BINANCE', displayName: 'Binance' },
        { id: 'BYBIT', displayName: 'Bybit' },
        { id: 'OKX', displayName: 'OKX' },
      ],
    },
    {
      id: 'NOTIFICATION',
      displayName: 'Notification',
      providers: [
        { id: 'TELEGRAM', displayName: 'Telegram' },
        { id: 'SMTP', displayName: 'SMTP' },
      ],
    },
    {
      id: 'AI',
      displayName: 'AI',
      providers: [{ id: 'OPENROUTER', displayName: 'OpenRouter' }],
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
  createdAt: '2026-08-17T16:00:00.000Z',
  updatedAt: '2026-08-17T16:00:00.000Z',
};

describe('Connections UI (W2-S01-a)', () => {
  it('renders the catalog, metadata creation, and disconnected status', () => {
    const html = renderToStaticMarkup(
      <ConnectionsView
        catalog={catalog}
        connections={[connection]}
        displayName=""
        provider="BINANCE"
        renameId={null}
        renameValue=""
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
    expect(html).not.toContain('>Connected<');
    expect(html).not.toContain('Validate');
    expect(html).not.toContain('API key');
    expect(html).not.toContain('password');
  });
});
