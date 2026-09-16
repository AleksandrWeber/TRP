/**
 * Production Microsoft Teams Incoming Webhook credential resolver (retrieve-at-send).
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
import { validateTeamsIncomingWebhookUrl } from '../../../security-platform/teams-webhook-url-guard';
import type { TeamsWebhookNotificationErrorCode } from './teams-webhook-notification.errors';

export type TeamsWebhookCredentialResolveInput = Readonly<{
  workspaceId: string;
  actorUserId?: string;
  actorRole?: Role;
}>;

export type TeamsWebhookResolvedCredential = Readonly<{
  webhookUrl: string;
}>;

export type TeamsWebhookCredentialResolveResult =
  | Readonly<{ ok: true; credential: TeamsWebhookResolvedCredential }>
  | Readonly<{ ok: false; detail: TeamsWebhookNotificationErrorCode }>;

@Injectable()
export class TeamsWebhookCredentialResolver {
  constructor(private readonly vault: SecretVaultService) {}

  async isConfigured(input: TeamsWebhookCredentialResolveInput): Promise<boolean> {
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
        type: HoldableSecretType.TeamsWebhook,
        purpose: SecretPurpose.Notification,
      });
      return metadata?.state === SecretState.Connected;
    } catch {
      return false;
    }
  }

  async resolve(
    input: TeamsWebhookCredentialResolveInput,
  ): Promise<TeamsWebhookCredentialResolveResult> {
    const workspaceId = input.workspaceId.trim();
    const actorUserId = input.actorUserId?.trim() ?? '';
    const actorRole = input.actorRole;
    if (!workspaceId || !actorUserId || actorRole === undefined) {
      return failClosed('teams_webhook_invalid_request');
    }

    try {
      const fields = await this.vault.retrieve({
        actorWorkspaceId: actorUserId,
        actorRole,
        workspaceId,
        type: HoldableSecretType.TeamsWebhook,
        purpose: SecretPurpose.Notification,
      });
      const webhookUrl = fields.webhookUrl?.trim() ?? '';
      if (!webhookUrl) {
        return failClosed('teams_webhook_not_configured');
      }
      const guard = validateTeamsIncomingWebhookUrl(webhookUrl);
      if (!guard.ok) {
        return failClosed('teams_webhook_blocked_url');
      }
      return Object.freeze({
        ok: true as const,
        credential: Object.freeze({ webhookUrl }),
      });
    } catch (error) {
      if (error instanceof VaultNotStoredError || error instanceof VaultRevokedError) {
        return failClosed('teams_webhook_not_configured');
      }
      if (
        error instanceof VaultIsolationError ||
        error instanceof VaultLifecycleError ||
        error instanceof VaultUnavailableError
      ) {
        return failClosed('teams_webhook_invalid_request');
      }
      return failClosed('teams_webhook_invalid_request');
    }
  }
}

function failClosed(
  detail: TeamsWebhookNotificationErrorCode,
): TeamsWebhookCredentialResolveResult {
  return Object.freeze({ ok: false as const, detail });
}
