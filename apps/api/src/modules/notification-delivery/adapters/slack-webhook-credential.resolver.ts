/**
 * Production Slack Incoming Webhook credential resolver (retrieve-at-send).
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
import { validateSlackIncomingWebhookUrl } from '../../../security-platform/slack-webhook-url-guard';
import type { SlackWebhookNotificationErrorCode } from './slack-webhook-notification.errors';

export type SlackWebhookCredentialResolveInput = Readonly<{
  workspaceId: string;
  actorUserId?: string;
  actorRole?: Role;
}>;

export type SlackWebhookResolvedCredential = Readonly<{
  webhookUrl: string;
}>;

export type SlackWebhookCredentialResolveResult =
  | Readonly<{ ok: true; credential: SlackWebhookResolvedCredential }>
  | Readonly<{ ok: false; detail: SlackWebhookNotificationErrorCode }>;

@Injectable()
export class SlackWebhookCredentialResolver {
  constructor(private readonly vault: SecretVaultService) {}

  async isConfigured(input: SlackWebhookCredentialResolveInput): Promise<boolean> {
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
        type: HoldableSecretType.SlackWebhook,
        purpose: SecretPurpose.Notification,
      });
      return metadata?.state === SecretState.Connected;
    } catch {
      return false;
    }
  }

  async resolve(
    input: SlackWebhookCredentialResolveInput,
  ): Promise<SlackWebhookCredentialResolveResult> {
    const workspaceId = input.workspaceId.trim();
    const actorUserId = input.actorUserId?.trim() ?? '';
    const actorRole = input.actorRole;
    if (!workspaceId || !actorUserId || actorRole === undefined) {
      return failClosed('slack_webhook_invalid_request');
    }

    try {
      const fields = await this.vault.retrieve({
        actorWorkspaceId: actorUserId,
        actorRole,
        workspaceId,
        type: HoldableSecretType.SlackWebhook,
        purpose: SecretPurpose.Notification,
      });
      const webhookUrl = fields.webhookUrl?.trim() ?? '';
      if (!webhookUrl) {
        return failClosed('slack_webhook_not_configured');
      }
      const guard = validateSlackIncomingWebhookUrl(webhookUrl);
      if (!guard.ok) {
        return failClosed('slack_webhook_blocked_url');
      }
      return Object.freeze({
        ok: true as const,
        credential: Object.freeze({ webhookUrl }),
      });
    } catch (error) {
      if (error instanceof VaultNotStoredError || error instanceof VaultRevokedError) {
        return failClosed('slack_webhook_not_configured');
      }
      if (
        error instanceof VaultIsolationError ||
        error instanceof VaultLifecycleError ||
        error instanceof VaultUnavailableError
      ) {
        return failClosed('slack_webhook_invalid_request');
      }
      return failClosed('slack_webhook_invalid_request');
    }
  }
}

function failClosed(
  detail: SlackWebhookNotificationErrorCode,
): SlackWebhookCredentialResolveResult {
  return Object.freeze({ ok: false as const, detail });
}
