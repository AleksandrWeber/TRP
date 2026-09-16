/**
 * Production Discord Incoming Webhook credential resolver (retrieve-at-send).
 *
 * Uses existing SecretVaultService.retrieve / get. Does not invent a Vault
 * principal, bypass ACL, persist the URL, or log secret material.
 */

import { Injectable } from '@nestjs/common';
import type { Role } from '../../identity/role';
import { HoldableSecretType } from '../../secret-vault/holdable-secret-type';
import { SecretPurpose } from '../../secret-vault/secret-purpose';
import { SecretState } from '../../secret-vault/secret-state';
import { SecretVaultService } from '../../secret-vault/secret-vault.service';
import {
  VaultIsolationError,
  VaultLifecycleError,
  VaultNotStoredError,
  VaultRevokedError,
  VaultUnavailableError,
} from '../../secret-vault/vault-errors';
import { validateDiscordIncomingWebhookUrl } from '../../../security-platform/discord-webhook-url-guard';
import type { DiscordWebhookNotificationErrorCode } from './discord-webhook-notification.errors';

export type DiscordWebhookCredentialResolveInput = Readonly<{
  workspaceId: string;
  actorUserId?: string;
  actorRole?: Role;
}>;

export type DiscordWebhookResolvedCredential = Readonly<{
  webhookUrl: string;
}>;

export type DiscordWebhookCredentialResolveResult =
  | Readonly<{ ok: true; credential: DiscordWebhookResolvedCredential }>
  | Readonly<{ ok: false; detail: DiscordWebhookNotificationErrorCode }>;

@Injectable()
export class DiscordWebhookCredentialResolver {
  constructor(private readonly vault: SecretVaultService) {}

  async isConfigured(input: DiscordWebhookCredentialResolveInput): Promise<boolean> {
    const workspaceId = input.workspaceId.trim();
    const actorUserId = input.actorUserId?.trim() ?? '';
    const actorRole = input.actorRole;
    if (!workspaceId || !actorUserId || actorRole === undefined) {
      return false;
    }
    try {
      const metadata = await this.vault.get({
        actorWorkspaceId: actorUserId,
        actorRole,
        workspaceId,
        type: HoldableSecretType.DiscordWebhook,
        purpose: SecretPurpose.Notification,
      });
      return metadata?.state === SecretState.Connected;
    } catch {
      return false;
    }
  }

  async resolve(
    input: DiscordWebhookCredentialResolveInput,
  ): Promise<DiscordWebhookCredentialResolveResult> {
    const workspaceId = input.workspaceId.trim();
    const actorUserId = input.actorUserId?.trim() ?? '';
    const actorRole = input.actorRole;
    if (!workspaceId || !actorUserId || actorRole === undefined) {
      return failClosed('discord_webhook_invalid_request');
    }

    try {
      const fields = await this.vault.retrieve({
        actorWorkspaceId: actorUserId,
        actorRole,
        workspaceId,
        type: HoldableSecretType.DiscordWebhook,
        purpose: SecretPurpose.Notification,
      });
      const webhookUrl = fields.webhookUrl?.trim() ?? '';
      if (!webhookUrl) {
        return failClosed('discord_webhook_not_configured');
      }
      const guard = validateDiscordIncomingWebhookUrl(webhookUrl);
      if (!guard.ok) {
        return failClosed('discord_webhook_blocked_url');
      }
      return Object.freeze({
        ok: true as const,
        credential: Object.freeze({ webhookUrl }),
      });
    } catch (error) {
      if (error instanceof VaultNotStoredError || error instanceof VaultRevokedError) {
        return failClosed('discord_webhook_not_configured');
      }
      if (
        error instanceof VaultIsolationError ||
        error instanceof VaultLifecycleError ||
        error instanceof VaultUnavailableError
      ) {
        return failClosed('discord_webhook_invalid_request');
      }
      return failClosed('discord_webhook_invalid_request');
    }
  }
}

function failClosed(
  detail: DiscordWebhookNotificationErrorCode,
): DiscordWebhookCredentialResolveResult {
  return Object.freeze({ ok: false as const, detail });
}
