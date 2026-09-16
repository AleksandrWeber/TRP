/**
 * Production Web Push VAPID credential resolver (retrieve-at-send).
 *
 * Uses existing SecretVaultService.retrieve / get. Does not invent a Vault
 * principal, bypass ACL, persist keys, or log secret material.
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
import type { WebPushNotificationErrorCode } from './web-push-notification.errors';

export type WebPushVapidCredentialResolveInput = Readonly<{
  workspaceId: string;
  actorUserId?: string;
  actorRole?: Role;
}>;

export type WebPushVapidResolvedCredential = Readonly<{
  publicKey: string;
  privateKey: string;
  subject?: string;
}>;

export type WebPushVapidCredentialResolveResult =
  | Readonly<{ ok: true; credential: WebPushVapidResolvedCredential }>
  | Readonly<{ ok: false; detail: WebPushNotificationErrorCode }>;

@Injectable()
export class WebPushVapidCredentialResolver {
  constructor(private readonly vault: SecretVaultService) {}

  async isConfigured(input: WebPushVapidCredentialResolveInput): Promise<boolean> {
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
        type: HoldableSecretType.WebPushVapid,
        purpose: SecretPurpose.Notification,
      });
      return metadata?.state === SecretState.Connected;
    } catch {
      return false;
    }
  }

  /**
   * Returns ONLY the public VAPID key for PushManager.subscribe.
   * Never returns privateKey.
   */
  async resolvePublicKey(
    input: WebPushVapidCredentialResolveInput,
  ): Promise<
    Readonly<{ ok: true; publicKey: string } | { ok: false; detail: WebPushNotificationErrorCode }>
  > {
    const resolved = await this.resolve(input);
    if (!resolved.ok) return resolved;
    return Object.freeze({
      ok: true as const,
      publicKey: resolved.credential.publicKey,
    });
  }

  async resolve(
    input: WebPushVapidCredentialResolveInput,
  ): Promise<WebPushVapidCredentialResolveResult> {
    const workspaceId = input.workspaceId.trim();
    const actorUserId = input.actorUserId?.trim() ?? '';
    const actorRole = input.actorRole;
    if (!workspaceId || !actorUserId || actorRole === undefined) {
      return failClosed('web_push_invalid_request');
    }

    try {
      const fields = await this.vault.retrieve({
        actorWorkspaceId: actorUserId,
        actorRole,
        workspaceId,
        type: HoldableSecretType.WebPushVapid,
        purpose: SecretPurpose.Notification,
      });
      const publicKey = fields.publicKey?.trim() ?? '';
      const privateKey = fields.privateKey?.trim() ?? '';
      const subject = fields.subject?.trim() || undefined;
      if (!publicKey || !privateKey) {
        return failClosed('web_push_not_configured');
      }
      return Object.freeze({
        ok: true as const,
        credential: Object.freeze({
          publicKey,
          privateKey,
          ...(subject ? { subject } : {}),
        }),
      });
    } catch (error) {
      if (error instanceof VaultNotStoredError || error instanceof VaultRevokedError) {
        return failClosed('web_push_not_configured');
      }
      if (
        error instanceof VaultIsolationError ||
        error instanceof VaultLifecycleError ||
        error instanceof VaultUnavailableError
      ) {
        return failClosed('web_push_invalid_request');
      }
      return failClosed('web_push_invalid_request');
    }
  }
}

function failClosed(detail: WebPushNotificationErrorCode): WebPushVapidCredentialResolveResult {
  return Object.freeze({ ok: false as const, detail });
}
