/**
 * Holdable-type field contracts (V3-S03-c).
 * Well-formed fields only. Not a vendor handshake. No network.
 * Canonical types: v3-s03-product-scope.md holdable types.
 */

import { validateSlackIncomingWebhookUrl } from '../../security-platform/slack-webhook-url-guard';
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
  [HoldableSecretType.OpenRouter]: ['apiKey'],
};

const SMTP_PORT = /^[0-9]{1,5}$/;

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

  if (names.some((name) => !required.includes(name))) {
    throw new VaultValidationError('The credential could not be stored.');
  }

  if (type === HoldableSecretType.Smtp) {
    assertSmtpPort(material.port);
  }

  if (type === HoldableSecretType.SlackWebhook) {
    assertSlackWebhookUrl(material.webhookUrl);
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
