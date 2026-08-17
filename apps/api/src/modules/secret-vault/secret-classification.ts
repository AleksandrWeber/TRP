/**
 * Secret Classification freeze (V3-S03-a).
 * Canonical policy: v3-s03-implementation-package.md §5.
 * Login passwords stay with Authentication. They are not Vault rows.
 */

import { HoldableSecretType, isHoldableSecretType } from './holdable-secret-type';

export const SecretOwner = {
  Customer: 'customer',
  Host: 'host',
} as const;

export type SecretOwner = (typeof SecretOwner)[keyof typeof SecretOwner];

export const RotationPolicy = {
  Yes: 'yes',
  Manual: 'manual',
} as const;

export type RotationPolicy = (typeof RotationPolicy)[keyof typeof RotationPolicy];

export const ReadBackPolicy = {
  No: 'no',
  NotApplicable: 'n_a',
} as const;

export type ReadBackPolicy = (typeof ReadBackPolicy)[keyof typeof ReadBackPolicy];

export const ExportPolicy = {
  No: 'no',
  NotApplicable: 'n_a',
} as const;

export type ExportPolicy = (typeof ExportPolicy)[keyof typeof ExportPolicy];

export type SecretClassificationRow = Readonly<{
  name: string;
  owner: SecretOwner;
  rotation: RotationPolicy;
  readBack: ReadBackPolicy;
  export: ExportPolicy;
}>;

const CUSTOMER_ROW = {
  owner: SecretOwner.Customer,
  rotation: RotationPolicy.Yes,
  readBack: ReadBackPolicy.No,
  export: ExportPolicy.No,
} as const;

const HOST_ROW = {
  owner: SecretOwner.Host,
  rotation: RotationPolicy.Manual,
  readBack: ReadBackPolicy.NotApplicable,
  export: ExportPolicy.NotApplicable,
} as const;

/** Host names that must never become Vault records. */
export const HostSecretName = {
  JwtSecret: 'JWT_SECRET',
  VaultWrappingKey: 'VAULT_WRAPPING_KEY',
  DatabaseUrl: 'DATABASE_URL',
  RedisQueue: 'REDIS_QUEUE',
  HostRecoveryMail: 'HOST_RECOVERY_MAIL',
} as const;

export type HostSecretName = (typeof HostSecretName)[keyof typeof HostSecretName];

const CUSTOMER_BY_TYPE: Readonly<Record<HoldableSecretType, SecretClassificationRow>> = {
  [HoldableSecretType.Binance]: { name: 'Binance API', ...CUSTOMER_ROW },
  [HoldableSecretType.Bybit]: { name: 'Bybit API', ...CUSTOMER_ROW },
  [HoldableSecretType.Okx]: { name: 'OKX API', ...CUSTOMER_ROW },
  [HoldableSecretType.Telegram]: { name: 'Telegram Bot', ...CUSTOMER_ROW },
  [HoldableSecretType.Smtp]: { name: 'SMTP (customer notification mail)', ...CUSTOMER_ROW },
  [HoldableSecretType.OpenRouter]: { name: 'OpenRouter', ...CUSTOMER_ROW },
};

const HOST_BY_NAME: Readonly<Record<HostSecretName, SecretClassificationRow>> = {
  [HostSecretName.JwtSecret]: { name: HostSecretName.JwtSecret, ...HOST_ROW },
  [HostSecretName.VaultWrappingKey]: { name: HostSecretName.VaultWrappingKey, ...HOST_ROW },
  [HostSecretName.DatabaseUrl]: { name: HostSecretName.DatabaseUrl, ...HOST_ROW },
  [HostSecretName.RedisQueue]: { name: HostSecretName.RedisQueue, ...HOST_ROW },
  [HostSecretName.HostRecoveryMail]: { name: HostSecretName.HostRecoveryMail, ...HOST_ROW },
};

export function classifyHoldableType(type: HoldableSecretType): SecretClassificationRow {
  return CUSTOMER_BY_TYPE[type];
}

export function classifyHostSecret(name: HostSecretName): SecretClassificationRow {
  return HOST_BY_NAME[name];
}

export function isHostSecretName(value: unknown): value is HostSecretName {
  return typeof value === 'string' && value in HOST_BY_NAME;
}

/** Customer vendor secrets may be stored. Host names and unknown types may not. */
export function isVaultStoreableType(value: unknown): value is HoldableSecretType {
  return isHoldableSecretType(value);
}

export function customerSecretsForbidReadBackAndExport(type: HoldableSecretType): boolean {
  const row = classifyHoldableType(type);
  return row.readBack === ReadBackPolicy.No && row.export === ExportPolicy.No;
}
