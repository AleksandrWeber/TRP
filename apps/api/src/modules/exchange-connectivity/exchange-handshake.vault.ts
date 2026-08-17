import { HoldableSecretType, type HoldableSecretType as HoldableType } from '../secret-vault';

const EXCHANGE_VAULT_TYPES: Readonly<Record<string, HoldableType>> = {
  BINANCE: HoldableSecretType.Binance,
  BYBIT: HoldableSecretType.Bybit,
  OKX: HoldableSecretType.Okx,
};

export function vaultSecretTypeForExchangeProvider(provider: string): HoldableType | null {
  return EXCHANGE_VAULT_TYPES[provider] ?? null;
}
