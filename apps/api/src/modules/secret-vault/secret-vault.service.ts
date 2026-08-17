import { Inject, Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  PrismaTransactionService,
  type TransactionContext,
} from '../../storage/prisma/prisma-transaction.service';
import type { Logger } from '../../logging/logger';
import { LOGGER } from '../../logging/logger.token';
import { NoOpLogger } from '../../logging/noop.logger';
import { SecurityAuditService } from '../security-audit/security-audit.service';
import { isHoldableSecretType, type HoldableSecretType } from './holdable-secret-type';
import type { SecretFieldMap } from './secret-material';
import { defaultPurposeForType, isSecretPurpose, type SecretPurpose } from './secret-purpose';
import {
  assertConnectedCiphertextPresent,
  assertMetadataIntegrity,
  toSecretVaultMetadata,
  type SecretVaultMetadata,
  type SecretVaultRecord,
} from './secret-record';
import {
  SecretState,
  transitionSecretState,
  vaultConnectedMeansProviderWorks,
} from './secret-state';
import { isHostSecretName } from './secret-classification';
import { Role } from '../identity/role';
import {
  VaultLifecycleError,
  VaultNotStoredError,
  VaultRevokedError,
  VaultUnavailableError,
  VaultValidationError,
} from './vault-errors';
import type { SecretSlot, SecretVaultRepository } from './secret-vault.repository';
import {
  SECRET_VAULT_CLOCK,
  SECRET_VAULT_REPOSITORY,
  VAULT_WRAPPING_KEY_SOURCE,
} from './secret-vault.repository.token';
import { wrapSecretFields, unwrapSecretFields } from './secret-envelope';
import { isSecretCiphertext } from './secret-ciphertext';
import { assertCiphertextOnlyPersist } from './secret-persist';
import { requireWrappingKey, type WrappingKeySource } from './wrapping-key';
import { validateHoldableSecretFields } from './secret-validation';
import { VaultAccessControl } from './vault-access-control';
import { recordVaultLifecycle, type VaultLifecycleOutcome } from './vault-events';

export type Clock = { nowIso(): string };

export const SYSTEM_CLOCK: Clock = {
  nowIso: () => new Date().toISOString(),
};

export type StoreSecretInput = Readonly<{
  actorWorkspaceId: string;
  /** Authenticated actor role; an absent/unknown role is denied in the runtime module. */
  actorRole?: Role;
  workspaceId: string;
  type: string;
  purpose?: string;
  fields: Record<string, string>;
}>;

export type WorkspaceScopedQuery = Readonly<{
  actorWorkspaceId: string;
  actorRole?: Role;
  workspaceId: string;
  type: string;
  purpose?: string;
}>;

export type StoreSecretResult = Readonly<{
  metadata: SecretVaultMetadata;
  lifecycle: readonly SecretState[];
}>;

export type ValidateSecretResult = Readonly<{
  type: HoldableSecretType;
  purpose: SecretPurpose;
}>;

const MAX_CONCURRENCY_RETRIES = 3;

/**
 * Credential Vault owner (V3-S03-c).
 * Owns secret lifecycle: create, validate, replace, revoke, delete, metadata, integrity.
 * Does not connect vendors. Does not persist plaintext.
 */
@Injectable()
export class SecretVaultService {
  private readonly logger: Logger;

  constructor(
    @Inject(SECRET_VAULT_REPOSITORY)
    private readonly repository: SecretVaultRepository,
    @Inject(SECRET_VAULT_CLOCK)
    private readonly clock: Clock,
    @Inject(VAULT_WRAPPING_KEY_SOURCE)
    private readonly wrappingKeySource: WrappingKeySource,
    @Inject(VaultAccessControl)
    private readonly accessControl: Pick<VaultAccessControl, 'assertCanAccess'>,
    @Optional() @Inject(LOGGER) logger?: Logger,
    @Optional() @Inject(SecurityAuditService) private readonly audit?: SecurityAuditService,
    @Optional()
    @Inject(PrismaTransactionService)
    private readonly transactions?: Pick<PrismaTransactionService, 'run'>,
  ) {
    this.logger = logger?.child(SecretVaultService.name) ?? new NoOpLogger();
  }

  /**
   * Create: Created → Validated → Connected.
   * Replace-by-store when a Connected or Revoked record already exists.
   */
  async store(input: StoreSecretInput): Promise<StoreSecretResult> {
    return this.persistValidated(input, { requireExisting: false });
  }

  /**
   * Replace: existing Connected or Revoked → Created → Validated → Connected.
   * Previous material becomes unreadable. Fails if nothing is stored.
   */
  async replace(input: StoreSecretInput): Promise<StoreSecretResult> {
    return this.persistValidated(input, { requireExisting: true });
  }

  /**
   * Validate well-formed fields for a holdable type. Does not persist. No vendor I/O.
   * Does not return secret material.
   */
  async validate(input: StoreSecretInput): Promise<ValidateSecretResult> {
    this.authorize(input);
    this.refuseHostOrEnvImport(input);
    const type = this.requireHoldableType(input.type);
    const purpose = this.resolvePurpose(type, input.purpose);
    validateHoldableSecretFields(type, input.fields);
    return { type, purpose };
  }

  async list(
    actorWorkspaceId: string,
    workspaceId: string,
    actorRole?: Role,
  ): Promise<readonly SecretVaultMetadata[]> {
    this.authorize({ actorWorkspaceId, actorRole, workspaceId });
    const records = await this.repository.listByWorkspaceId(workspaceId);
    return records.map((record) => this.metadataFrom(record));
  }

  async get(query: WorkspaceScopedQuery): Promise<SecretVaultMetadata | null> {
    this.authorize(query);
    const record = await this.findSlot(query);
    if (!record) return null;
    return this.metadataFrom(record);
  }

  /**
   * Metadata update: refresh timestamps without changing state or ciphertext.
   * Secret fields cannot be written here. Does not decrypt.
   */
  async updateMetadata(query: WorkspaceScopedQuery): Promise<SecretVaultMetadata> {
    this.authorize(query);
    for (let attempt = 0; attempt < MAX_CONCURRENCY_RETRIES; attempt += 1) {
      const record = await this.requireStored(query);
      const updated: SecretVaultRecord = Object.freeze({
        ...record,
        revision: record.revision + 1,
        updatedAt: this.clock.nowIso(),
      });
      assertCiphertextOnlyPersist(updated);
      if (await this.repository.compareAndSet(updated, record.revision)) {
        return this.metadataFrom(updated);
      }
    }
    throw new VaultLifecycleError();
  }

  /**
   * Vault-owned retrieve. Not a customer API. Adapters are not wired in this package.
   * Decrypts in server memory only. Corrupted ciphertext fails closed: nothing returned.
   */
  async retrieve(query: WorkspaceScopedQuery): Promise<SecretFieldMap> {
    this.authorize(query);
    const record = await this.findSlot(query);
    if (!record) {
      throw new VaultNotStoredError();
    }
    if (record.state === SecretState.Revoked) {
      throw new VaultRevokedError();
    }
    if (record.state !== SecretState.Connected) {
      throw new VaultLifecycleError();
    }
    return this.unwrapOrFailClosed(record);
  }

  async revoke(query: WorkspaceScopedQuery): Promise<SecretVaultMetadata> {
    this.authorize(query);
    return this.runMandatoryAuditTransaction(async (transaction) => {
      for (let attempt = 0; attempt < MAX_CONCURRENCY_RETRIES; attempt += 1) {
        const record = await this.requireStored(query);
        this.requireTransition(record.state, SecretState.Revoked);
        const updated: SecretVaultRecord = Object.freeze({
          ...record,
          state: SecretState.Revoked,
          revision: record.revision + 1,
          ciphertext: null,
          updatedAt: this.clock.nowIso(),
        });
        if (await this.repository.compareAndSet(updated, record.revision, transaction)) {
          await this.emitVaultLifecycle(query, record.type, record.purpose, 'revoked', transaction);
          return this.metadataFrom(updated);
        }
      }
      throw new VaultLifecycleError();
    });
  }

  async delete(query: WorkspaceScopedQuery): Promise<void> {
    this.authorize(query);
    await this.runMandatoryAuditTransaction(async (transaction) => {
      for (let attempt = 0; attempt < MAX_CONCURRENCY_RETRIES; attempt += 1) {
        const record = await this.findSlot(query);
        if (!record) {
          throw new VaultNotStoredError();
        }
        if (record.state === SecretState.Connected) {
          this.requireTransition(SecretState.Connected, SecretState.Revoked);
          this.requireTransition(SecretState.Revoked, SecretState.Deleted);
        } else {
          this.requireTransition(record.state, SecretState.Deleted);
        }
        if (
          await this.repository.deleteIfRevision(
            this.slot(query, record.type, record.purpose),
            record.revision,
            transaction,
          )
        ) {
          await this.emitVaultLifecycle(query, record.type, record.purpose, 'deleted', transaction);
          return;
        }
      }
      throw new VaultLifecycleError();
    });
  }

  vaultConnectedMeansProviderWorks(): false {
    return vaultConnectedMeansProviderWorks();
  }

  private async persistValidated(
    input: StoreSecretInput,
    options: { requireExisting: boolean },
  ): Promise<StoreSecretResult> {
    this.authorize(input);
    this.refuseHostOrEnvImport(input);
    const type = this.requireHoldableType(input.type);
    const purpose = this.resolvePurpose(type, input.purpose);
    const lifecycle: SecretState[] = [SecretState.Created];
    const material = validateHoldableSecretFields(type, input.fields);
    lifecycle.push(this.requireTransition(SecretState.Created, SecretState.Validated));

    const slot: SecretSlot = {
      workspaceId: input.workspaceId,
      type,
      purpose,
    };
    const wrappingKey = requireWrappingKey(this.wrappingKeySource);
    lifecycle.push(this.requireTransition(SecretState.Validated, SecretState.Connected));

    return this.runMandatoryAuditTransaction(async (transaction) => {
      for (let attempt = 0; attempt < MAX_CONCURRENCY_RETRIES; attempt += 1) {
        const existing = await this.repository.findBySlot(slot);
        if (options.requireExisting && !existing) {
          throw new VaultNotStoredError();
        }
        if (existing) {
          this.requireTransition(existing.state, SecretState.Created);
        }
        const now = this.clock.nowIso();
        const record: SecretVaultRecord = Object.freeze({
          id: existing?.id ?? randomUUID(),
          workspaceId: input.workspaceId,
          type,
          purpose,
          state: SecretState.Connected,
          revision: existing ? existing.revision + 1 : 0,
          ciphertext: wrapSecretFields(material, wrappingKey, slot),
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        });
        assertCiphertextOnlyPersist(record);
        if (await this.repository.compareAndSet(record, existing?.revision ?? null, transaction)) {
          const outcome: VaultLifecycleOutcome = options.requireExisting
            ? 'replaced'
            : existing
              ? 'replaced'
              : 'created';
          await this.emitVaultLifecycle(input, type, purpose, outcome, transaction);
          return { metadata: this.metadataFrom(record), lifecycle };
        }
      }
      throw new VaultLifecycleError();
    });
  }

  private unwrapOrFailClosed(record: SecretVaultRecord): SecretFieldMap {
    try {
      assertConnectedCiphertextPresent(record);
      if (record.ciphertext === null || !isSecretCiphertext(record.ciphertext)) {
        throw new VaultUnavailableError('The credential cannot be used.');
      }
      return unwrapSecretFields(record.ciphertext, requireWrappingKey(this.wrappingKeySource), {
        workspaceId: record.workspaceId,
        type: record.type,
        purpose: record.purpose,
      });
    } catch (error) {
      if (
        error instanceof VaultUnavailableError ||
        error instanceof VaultRevokedError ||
        error instanceof VaultNotStoredError ||
        error instanceof VaultLifecycleError
      ) {
        throw error;
      }
      throw new VaultUnavailableError('The credential cannot be used.');
    }
  }

  private metadataFrom(record: SecretVaultRecord): SecretVaultMetadata {
    const metadata = toSecretVaultMetadata(record);
    assertMetadataIntegrity(metadata);
    return metadata;
  }

  private requireTransition(from: SecretState, to: SecretState): SecretState {
    try {
      return transitionSecretState(from, to);
    } catch {
      throw new VaultLifecycleError();
    }
  }

  private async findSlot(query: WorkspaceScopedQuery): Promise<SecretVaultRecord | null> {
    const type = this.requireHoldableType(query.type);
    const purpose = this.resolvePurpose(type, query.purpose);
    return this.repository.findBySlot({
      workspaceId: query.workspaceId,
      type,
      purpose,
    });
  }

  private async requireStored(query: WorkspaceScopedQuery): Promise<SecretVaultRecord> {
    const record = await this.findSlot(query);
    if (!record) {
      throw new VaultNotStoredError();
    }
    return record;
  }

  private slot(
    query: WorkspaceScopedQuery,
    type: HoldableSecretType,
    purpose: SecretPurpose,
  ): SecretSlot {
    return { workspaceId: query.workspaceId, type, purpose };
  }

  private requireHoldableType(type: string): HoldableSecretType {
    if (isHostSecretName(type) || !isHoldableSecretType(type)) {
      throw new VaultValidationError('This credential type cannot be stored in Vault.');
    }
    return type;
  }

  private resolvePurpose(type: HoldableSecretType, purpose: string | undefined): SecretPurpose {
    if (purpose === undefined) {
      return defaultPurposeForType(type);
    }
    if (purpose === 'public_market_data') {
      throw new VaultValidationError('Public market data does not store a trading secret.');
    }
    if (!isSecretPurpose(purpose)) {
      throw new VaultValidationError('This credential type cannot be stored in Vault.');
    }
    return purpose;
  }

  private authorize(input: {
    actorWorkspaceId: string;
    actorRole?: Role;
    workspaceId: string;
  }): void {
    this.accessControl.assertCanAccess(
      { userId: input.actorWorkspaceId, role: input.actorRole },
      input.workspaceId,
    );
  }

  private refuseHostOrEnvImport(input: StoreSecretInput): void {
    void input;
    // Vault never auto-imports process.env. Operators re-enter secrets.
  }

  private async emitVaultLifecycle(
    scope: Pick<WorkspaceScopedQuery, 'actorWorkspaceId' | 'workspaceId'>,
    type: HoldableSecretType,
    purpose: SecretPurpose,
    outcome: VaultLifecycleOutcome,
    transaction?: TransactionContext,
  ): Promise<void> {
    await recordVaultLifecycle(
      this.logger,
      {
        outcome,
        actorUserId: scope.actorWorkspaceId,
        workspaceId: scope.workspaceId,
        type,
        purpose,
      },
      this.audit,
      transaction,
    );
  }

  private async runMandatoryAuditTransaction<T>(
    work: (transaction?: TransactionContext) => Promise<T>,
  ): Promise<T> {
    if (!this.audit || !this.transactions) return work();
    return this.transactions.run((transaction) => work(transaction));
  }
}
