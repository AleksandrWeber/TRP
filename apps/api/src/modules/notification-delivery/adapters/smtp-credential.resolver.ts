/**
 * Production Email SMTP credential resolver (retrieve-at-send).
 *
 * Uses existing SecretVaultService.retrieve. Does not invent a Vault principal,
 * bypass ACL, persist the password, or log secret material.
 */

import { Injectable } from '@nestjs/common';
import type { Role } from '../../identity/role';
import { HoldableSecretType } from '../../secret-vault/holdable-secret-type';
import { SecretPurpose } from '../../secret-vault/secret-purpose';
import { SecretVaultService } from '../../secret-vault/secret-vault.service';
import {
  VaultIsolationError,
  VaultLifecycleError,
  VaultNotStoredError,
  VaultRevokedError,
  VaultUnavailableError,
} from '../../secret-vault/vault-errors';
import type { SmtpNotificationErrorCode } from './smtp-notification.errors';

export type SmtpCredentialResolveInput = Readonly<{
  workspaceId: string;
  actorUserId?: string;
  actorRole?: Role;
}>;

export type SmtpResolvedCredential = Readonly<{
  host: string;
  port: string;
  username: string;
  password: string;
  sender: string;
}>;

export type SmtpCredentialResolveResult =
  | Readonly<{ ok: true; credential: SmtpResolvedCredential }>
  | Readonly<{ ok: false; detail: SmtpNotificationErrorCode }>;

@Injectable()
export class SmtpCredentialResolver {
  constructor(private readonly vault: SecretVaultService) {}

  async resolve(input: SmtpCredentialResolveInput): Promise<SmtpCredentialResolveResult> {
    const workspaceId = input.workspaceId.trim();
    const actorUserId = input.actorUserId?.trim() ?? '';
    const actorRole = input.actorRole;
    if (!workspaceId || !actorUserId || actorRole === undefined) {
      return failClosed('smtp_invalid_request');
    }

    try {
      const fields = await this.vault.retrieve({
        actorWorkspaceId: actorUserId,
        actorRole,
        workspaceId,
        type: HoldableSecretType.Smtp,
        purpose: SecretPurpose.Notification,
      });
      const host = fields.host?.trim() ?? '';
      const port = fields.port?.trim() ?? '';
      const username = fields.username?.trim() ?? '';
      const password = fields.password?.trim() ?? '';
      const sender = fields.sender?.trim() ?? '';
      if (!host || !port || !username || !password || !sender) {
        return failClosed('smtp_not_configured');
      }
      return Object.freeze({
        ok: true as const,
        credential: Object.freeze({ host, port, username, password, sender }),
      });
    } catch (error) {
      if (error instanceof VaultNotStoredError || error instanceof VaultRevokedError) {
        return failClosed('smtp_not_configured');
      }
      if (
        error instanceof VaultIsolationError ||
        error instanceof VaultLifecycleError ||
        error instanceof VaultUnavailableError
      ) {
        return failClosed('smtp_invalid_request');
      }
      return failClosed('smtp_invalid_request');
    }
  }
}

function failClosed(detail: SmtpNotificationErrorCode): SmtpCredentialResolveResult {
  return Object.freeze({ ok: false as const, detail });
}
