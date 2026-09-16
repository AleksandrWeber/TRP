/**
 * Holdable-type field contracts (V3-S03-c).
 * Well-formed fields only. Not a vendor handshake. No network.
 * Canonical types: v3-s03-product-scope.md holdable types.
 */

import { validateDiscordIncomingWebhookUrl } from '../../security-platform/discord-webhook-url-guard';
import { validateSlackIncomingWebhookUrl } from '../../security-platform/slack-webhook-url-guard';
import { validateTeamsIncomingWebhookUrl } from '../../security-platform/teams-webhook-url-guard';
import { HoldableSecretType } from './holdable-secret-type';
import { createSecretMaterial, type SecretFieldMap } from './secret-material';
import { VaultValidationError } from './vault-errors';

const REQUIRED_FIELDS: Readonly<Record<HoldableSecretType, readonly string[]>> = {
  [HoldableSecretType.Binance]: ['apiKey', 'apiSecret'],
  [HoldableSecretType.Bybit]: ['apiKey', 'apiSecret'],
  [HoldableSecretType.Okx]: ['apiKey', 'apiSecret', 'passphrase'],
  [HoldableSecretType.Telegram]: ['botToken'],
  [HoldableSecretType.Smtp]: ['host', 'port', 'username', 'password', 'sender'],
  [HoldableSecretType.SlackWebhook]: ['webhookUrl'],
  [HoldableSecretType.DiscordWebhook]: ['webhookUrl'],
  [HoldableSecretType.TeamsWebhook]: ['webhookUrl'],
  [HoldableSecretType.WebPushVapid]: ['publicKey', 'privateKey'],
  [HoldableSecretType.OpenRouter]: ['apiKey'],
};

/** Optional extras allowed only for Web Push VAPID (subject). */
const OPTIONAL_FIELDS: Readonly<Partial<Record<HoldableSecretType, readonly string[]>>> = {
  [HoldableSecretType.WebPushVapid]: ['subject'],
};

const SMTP_PORT = /^[0-9]{1,5}$/;
const VAPID_KEY = /^[A-Za-z0-9_-]{20,}$/;
const VAPID_SUBJECT = /^mailto:.+|https:.+/i;

export function requiredFieldsForType(type: HoldableSecretType): readonly string[] {
  return REQUIRED_FIELDS[type];
}

export function vaultValidationPerformsVendorIo(): false {
  return false;
}

export function validateHoldableSecretFields(
  type: HoldableSecretType,
  fields: Record<string, string>,
): SecretFieldMap {
  const material = createSecretMaterial(fields);
  const required = REQUIRED_FIELDS[type];
  const names = Object.keys(material);

  for (const name of required) {
    if (!(name in material)) {
      throw new VaultValidationError('Required credential fields are missing.');
    }
  }

  const optional = OPTIONAL_FIELDS[type] ?? [];
  const allowed = new Set([...required, ...optional]);
  if (names.some((name) => !allowed.has(name))) {
    throw new VaultValidationError('The credential could not be stored.');
  }

  if (type === HoldableSecretType.Smtp) {
    assertSmtpPort(material.port);
  }

  if (type === HoldableSecretType.SlackWebhook) {
    assertSlackWebhookUrl(material.webhookUrl);
  }

  if (type === HoldableSecretType.DiscordWebhook) {
    assertDiscordWebhookUrl(material.webhookUrl);
  }

  if (type === HoldableSecretType.TeamsWebhook) {
    assertTeamsWebhookUrl(material.webhookUrl);
  }

  if (type === HoldableSecretType.WebPushVapid) {
    assertWebPushVapidFields(material);
  }

  return material;
}

function assertSmtpPort(port: string | undefined): void {
  if (port === undefined || !SMTP_PORT.test(port)) {
    throw new VaultValidationError('Required credential fields are missing.');
  }
  const numeric = Number(port);
  if (!Number.isInteger(numeric) || numeric < 1 || numeric > 65535) {
    throw new VaultValidationError('Required credential fields are missing.');
  }
}

function assertSlackWebhookUrl(webhookUrl: string | undefined): void {
  if (webhookUrl === undefined) {
    throw new VaultValidationError('Required credential fields are missing.');
  }
  const guard = validateSlackIncomingWebhookUrl(webhookUrl);
  if (!guard.ok) {
    throw new VaultValidationError('The credential could not be stored.');
  }
}

function assertDiscordWebhookUrl(webhookUrl: string | undefined): void {
  if (webhookUrl === undefined) {
    throw new VaultValidationError('Required credential fields are missing.');
  }
  const guard = validateDiscordIncomingWebhookUrl(webhookUrl);
  if (!guard.ok) {
    throw new VaultValidationError('The credential could not be stored.');
  }
}

function assertTeamsWebhookUrl(webhookUrl: string | undefined): void {
  if (webhookUrl === undefined) {
    throw new VaultValidationError('Required credential fields are missing.');
  }
  const guard = validateTeamsIncomingWebhookUrl(webhookUrl);
  if (!guard.ok) {
    throw new VaultValidationError('The credential could not be stored.');
  }
}

function assertWebPushVapidFields(material: SecretFieldMap): void {
  const publicKey = material.publicKey;
  const privateKey = material.privateKey;
  if (publicKey === undefined || privateKey === undefined) {
    throw new VaultValidationError('Required credential fields are missing.');
  }
  if (!VAPID_KEY.test(publicKey) || !VAPID_KEY.test(privateKey)) {
    throw new VaultValidationError('The credential could not be stored.');
  }
  const subject = material.subject;
  if (subject !== undefined && !VAPID_SUBJECT.test(subject)) {
    throw new VaultValidationError('The credential could not be stored.');
  }
}
