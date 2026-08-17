import {
  listExchangeProviders,
  lookupExchangeProvider,
  type ExchangeProviderMetadata,
} from '../exchange-connectivity';

export const CONNECTION_TYPES = ['EXCHANGE', 'NOTIFICATION', 'AI'] as const;
export type ConnectionType = (typeof CONNECTION_TYPES)[number];

export const CONNECTION_PROVIDERS = [
  {
    id: 'BINANCE',
    displayName: 'Binance',
    connectionType: 'EXCHANGE',
    credentialFields: ['apiKey', 'apiSecret'],
  },
  {
    id: 'BYBIT',
    displayName: 'Bybit',
    connectionType: 'EXCHANGE',
    credentialFields: ['apiKey', 'apiSecret'],
  },
  {
    id: 'OKX',
    displayName: 'OKX',
    connectionType: 'EXCHANGE',
    credentialFields: ['apiKey', 'apiSecret', 'passphrase'],
  },
  {
    id: 'TELEGRAM',
    displayName: 'Telegram',
    connectionType: 'NOTIFICATION',
    credentialFields: ['botToken'],
  },
  {
    id: 'SMTP',
    displayName: 'SMTP',
    connectionType: 'NOTIFICATION',
    credentialFields: ['host', 'port', 'username', 'password', 'sender'],
  },
  {
    id: 'OPENROUTER',
    displayName: 'OpenRouter',
    connectionType: 'AI',
    credentialFields: ['apiKey'],
  },
] as const satisfies readonly {
  id: string;
  displayName: string;
  connectionType: ConnectionType;
  credentialFields: readonly string[];
}[];

export type ConnectionProvider = (typeof CONNECTION_PROVIDERS)[number]['id'];

export type ConnectionCatalogView = {
  connectionTypes: readonly {
    id: ConnectionType;
    displayName: string;
    providers: readonly {
      id: ConnectionProvider;
      displayName: string;
      credentialFields: readonly string[];
      capabilities?: ExchangeProviderMetadata['capabilities'];
      availability?: ExchangeProviderMetadata['availability'];
      category?: ExchangeProviderMetadata['category'];
    }[];
  }[];
  exchangeProviders: readonly ExchangeProviderMetadata[];
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
        ({ id: providerId, displayName, credentialFields, connectionType }) => {
          const exchange =
            connectionType === 'EXCHANGE' ? lookupExchangeProvider(providerId) : null;
          return {
            id: providerId,
            displayName,
            credentialFields,
            ...(exchange
              ? {
                  capabilities: exchange.capabilities,
                  availability: exchange.availability,
                  category: exchange.category,
                }
              : {}),
          };
        },
      ),
    })),
    exchangeProviders: listExchangeProviders(),
  };
}

export function providerType(provider: string): ConnectionType | null {
  return (
    CONNECTION_PROVIDERS.find((candidate) => candidate.id === provider)?.connectionType ?? null
  );
}

export function credentialFieldsForProvider(provider: string): readonly string[] | null {
  return (
    CONNECTION_PROVIDERS.find((candidate) => candidate.id === provider)?.credentialFields ?? null
  );
}
