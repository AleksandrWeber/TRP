export const CONNECTION_TYPES = ['EXCHANGE', 'NOTIFICATION', 'AI'] as const;
export type ConnectionType = (typeof CONNECTION_TYPES)[number];

export const CONNECTION_PROVIDERS = [
  { id: 'BINANCE', displayName: 'Binance', connectionType: 'EXCHANGE' },
  { id: 'BYBIT', displayName: 'Bybit', connectionType: 'EXCHANGE' },
  { id: 'OKX', displayName: 'OKX', connectionType: 'EXCHANGE' },
  { id: 'TELEGRAM', displayName: 'Telegram', connectionType: 'NOTIFICATION' },
  { id: 'SMTP', displayName: 'SMTP', connectionType: 'NOTIFICATION' },
  { id: 'OPENROUTER', displayName: 'OpenRouter', connectionType: 'AI' },
] as const satisfies readonly {
  id: string;
  displayName: string;
  connectionType: ConnectionType;
}[];

export type ConnectionProvider = (typeof CONNECTION_PROVIDERS)[number]['id'];

export type ConnectionCatalogView = {
  connectionTypes: readonly {
    id: ConnectionType;
    displayName: string;
    providers: readonly { id: ConnectionProvider; displayName: string }[];
  }[];
};

const TYPE_DISPLAY_NAMES: Record<ConnectionType, string> = {
  EXCHANGE: 'Exchange',
  NOTIFICATION: 'Notification',
  AI: 'AI',
};

export function connectionCatalog(): ConnectionCatalogView {
  return {
    connectionTypes: CONNECTION_TYPES.map((id) => ({
      id,
      displayName: TYPE_DISPLAY_NAMES[id],
      providers: CONNECTION_PROVIDERS.filter((provider) => provider.connectionType === id).map(
        ({ id: providerId, displayName }) => ({ id: providerId, displayName }),
      ),
    })),
  };
}

export function providerType(provider: string): ConnectionType | null {
  return (
    CONNECTION_PROVIDERS.find((candidate) => candidate.id === provider)?.connectionType ?? null
  );
}
