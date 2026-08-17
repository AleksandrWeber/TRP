import { HoldableSecretType, type HoldableSecretType as HoldableType } from '../secret-vault';
import type { ConnectionProvider } from './connection-catalog';

const PROVIDER_SECRET_TYPES: Readonly<Record<ConnectionProvider, HoldableType>> = {
  BINANCE: HoldableSecretType.Binance,
  BYBIT: HoldableSecretType.Bybit,
  OKX: HoldableSecretType.Okx,
  TELEGRAM: HoldableSecretType.Telegram,
  SMTP: HoldableSecretType.Smtp,
  OPENROUTER: HoldableSecretType.OpenRouter,
};

export function vaultSecretTypeForProvider(provider: ConnectionProvider): HoldableType {
  return PROVIDER_SECRET_TYPES[provider];
}
