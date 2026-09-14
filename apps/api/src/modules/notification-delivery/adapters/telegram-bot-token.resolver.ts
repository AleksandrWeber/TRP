/**
 * REM-01-s2 — Telegram bot token resolver (retrieve-at-send).
 *
 * Uses existing SecretVaultService.retrieve. Does not invent a Vault principal,
 * bypass ACL, persist the token, or log secret material.
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
import type { TelegramBotApiErrorCode } from './telegram-bot-api.errors';

export type TelegramBotTokenResolveInput = Readonly<{
  workspaceId: string;
  actorUserId?: string;
  actorRole?: Role;
}>;

export type TelegramBotTokenResolveResult =
  | Readonly<{ ok: true; botToken: string }>
  | Readonly<{ ok: false; detail: TelegramBotApiErrorCode }>;

@Injectable()
export class TelegramBotTokenResolver {
  constructor(private readonly vault: SecretVaultService) {}

  async resolve(input: TelegramBotTokenResolveInput): Promise<TelegramBotTokenResolveResult> {
    const workspaceId = input.workspaceId.trim();
    const actorUserId = input.actorUserId?.trim() ?? '';
    const actorRole = input.actorRole;
    if (!workspaceId || !actorUserId || actorRole === undefined) {
      return failClosed();
    }

    try {
      const fields = await this.vault.retrieve({
        actorWorkspaceId: actorUserId,
        actorRole,
        workspaceId,
        type: HoldableSecretType.Telegram,
        purpose: SecretPurpose.Notification,
      });
      const botToken = fields.botToken?.trim() ?? '';
      if (!botToken) {
        return failClosed();
      }
      return Object.freeze({ ok: true as const, botToken });
    } catch (error) {
      if (
        error instanceof VaultIsolationError ||
        error instanceof VaultNotStoredError ||
        error instanceof VaultRevokedError ||
        error instanceof VaultLifecycleError ||
        error instanceof VaultUnavailableError
      ) {
        return failClosed();
      }
      return failClosed();
    }
  }
}

function failClosed(): TelegramBotTokenResolveResult {
  return Object.freeze({ ok: false as const, detail: 'telegram_invalid_request' });
}
