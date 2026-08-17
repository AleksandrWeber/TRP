import { describe, expect, it } from 'vitest';
import { HoldableSecretType } from './holdable-secret-type';
import { InMemorySecretVaultRepository } from './in-memory-secret-vault.repository';
import { withTamperedPayload, withTamperedPayloadTag } from './secret-ciphertext';
import { metadataContainsSecretFields } from './secret-record';
import { OperatorSecretLabel, SecretState } from './secret-state';
import { SecretVaultService, type Clock } from './secret-vault.service';
import type { SecretSlot, SecretVaultRepository } from './secret-vault.repository';
import type { SecretVaultRecord } from './secret-record';
import { ProductCapability, capabilitiesWhenVaultUnavailable } from './vault-failure';
import {
  VaultLifecycleError,
  VaultNotStoredError,
  VaultRevokedError,
  VaultUnavailableError,
  VaultValidationError,
} from './vault-errors';
import { vaultValidationPerformsVendorIo } from './secret-validation';
import { staticWrappingKeySource } from './wrapping-key';
import type { SecurityAuditService } from '../security-audit/security-audit.service';
import type { SecurityAuditWrite } from '../security-audit/security-audit-record';
import type { TransactionContext } from '../../storage/prisma/prisma-transaction.service';

class MutableClock implements Clock {
  constructor(private iso: string) {}

  nowIso(): string {
    return this.iso;
  }

  set(iso: string): void {
    this.iso = iso;
  }
}

const WRAPPING_KEY = 'trp-host-vault-wrapping-key-v3-s03b';
const BINANCE_FIELDS = { apiKey: 'key-a', apiSecret: 'secret-a' };
const BINANCE_REPLACEMENT = { apiKey: 'key-b', apiSecret: 'secret-b' };
const BINANCE_REPLACEMENT_B = { apiKey: 'key-c', apiSecret: 'secret-c' };
const testAccess = { assertCanAccess: () => undefined };

class RollbackVaultRepository implements SecretVaultRepository {
  private delegate = new InMemorySecretVaultRepository();
  private rejectNextCompareAndSet = false;

  async compareAndSet(
    record: SecretVaultRecord,
    expectedRevision: number | null,
  ): Promise<boolean> {
    if (this.rejectNextCompareAndSet) {
      this.rejectNextCompareAndSet = false;
      return false;
    }
    return this.delegate.compareAndSet(record, expectedRevision);
  }

  findBySlot(slot: SecretSlot): Promise<SecretVaultRecord | null> {
    return this.delegate.findBySlot(slot);
  }

  listByWorkspaceId(workspaceId: string): Promise<SecretVaultRecord[]> {
    return this.delegate.listByWorkspaceId(workspaceId);
  }

  deleteIfRevision(slot: SecretSlot, expectedRevision: number): Promise<boolean> {
    return this.delegate.deleteIfRevision(slot, expectedRevision);
  }

  snapshot(): string {
    return this.delegate.snapshot();
  }

  restore(snapshot: string): void {
    this.delegate = InMemorySecretVaultRepository.fromSnapshot(snapshot);
  }

  rejectNextWrite(): void {
    this.rejectNextCompareAndSet = true;
  }
}

class SnapshotTransactionService {
  constructor(private readonly repository: RollbackVaultRepository) {}

  async run<T>(work: (transaction: TransactionContext) => Promise<T>): Promise<T> {
    const snapshot = this.repository.snapshot();
    try {
      return await work(Object.freeze({}) as TransactionContext);
    } catch (error) {
      this.repository.restore(snapshot);
      throw error;
    }
  }
}

class RecordingSecurityAuditService {
  readonly writes: SecurityAuditWrite[] = [];

  async record(write: SecurityAuditWrite): Promise<{ id: string }> {
    this.writes.push(write);
    return { id: `audit-${this.writes.length}` };
  }
}

class StaleOnceRepository implements SecretVaultRepository {
  private stale = true;

  constructor(private readonly delegate = new InMemorySecretVaultRepository()) {}

  async compareAndSet(
    record: SecretVaultRecord,
    expectedRevision: number | null,
  ): Promise<boolean> {
    if (expectedRevision !== null && this.stale) {
      this.stale = false;
      return false;
    }
    return this.delegate.compareAndSet(record, expectedRevision);
  }

  findBySlot(slot: SecretSlot): Promise<SecretVaultRecord | null> {
    return this.delegate.findBySlot(slot);
  }

  listByWorkspaceId(workspaceId: string): Promise<SecretVaultRecord[]> {
    return this.delegate.listByWorkspaceId(workspaceId);
  }

  deleteIfRevision(slot: SecretSlot, expectedRevision: number): Promise<boolean> {
    return this.delegate.deleteIfRevision(slot, expectedRevision);
  }
}

function vaultWith(
  repository = new InMemorySecretVaultRepository(),
  clock: Clock = new MutableClock('2026-08-17T12:00:00.000Z'),
): { service: SecretVaultService; repository: InMemorySecretVaultRepository; clock: Clock } {
  return {
    service: new SecretVaultService(
      repository,
      clock,
      staticWrappingKeySource(WRAPPING_KEY),
      testAccess,
    ),
    repository,
    clock,
  };
}

describe('Secret Vault lifecycle (V3-S03-c)', () => {
  it('creates through Created → Validated → Connected and does not return secret material', async () => {
    const { service } = vaultWith();
    const stored = await service.store({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
      fields: BINANCE_FIELDS,
    });

    expect(stored.lifecycle).toEqual([
      SecretState.Created,
      SecretState.Validated,
      SecretState.Connected,
    ]);
    expect(stored.metadata.state).toBe(SecretState.Connected);
    expect(stored.metadata.operatorLabel).toBe(OperatorSecretLabel.Stored);
    expect(metadataContainsSecretFields(stored.metadata)).toBe(false);
    expect(JSON.stringify(stored.metadata)).not.toContain('key-a');
    expect(service.vaultConnectedMeansProviderWorks()).toBe(false);
  });

  it('commits one vault lifecycle mutation with one mandatory audit append', async () => {
    const repository = new RollbackVaultRepository();
    const audit = new RecordingSecurityAuditService();
    const service = new SecretVaultService(
      repository,
      new MutableClock('2026-08-17T12:00:00.000Z'),
      staticWrappingKeySource(WRAPPING_KEY),
      testAccess,
      undefined,
      audit as unknown as SecurityAuditService,
      new SnapshotTransactionService(repository),
    );

    await service.store({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
      fields: BINANCE_FIELDS,
    });

    expect(await service.list('ws-a', 'ws-a')).toHaveLength(1);
    expect(audit.writes).toEqual([
      expect.objectContaining({ eventType: 'vault.lifecycle', outcome: 'created' }),
    ]);

    repository.rejectNextWrite();
    await service.replace({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
      fields: BINANCE_REPLACEMENT,
    });

    expect(await service.list('ws-a', 'ws-a')).toHaveLength(1);
    expect(audit.writes).toEqual([
      expect.objectContaining({ eventType: 'vault.lifecycle', outcome: 'created' }),
      expect.objectContaining({ eventType: 'vault.lifecycle', outcome: 'replaced' }),
    ]);
  });

  it('rolls back a vault lifecycle mutation when its mandatory audit append fails', async () => {
    const repository = new RollbackVaultRepository();
    const failingAudit = {
      record: async () => {
        throw new Error('audit append failed');
      },
    };
    const service = new SecretVaultService(
      repository,
      new MutableClock('2026-08-17T12:00:00.000Z'),
      staticWrappingKeySource(WRAPPING_KEY),
      testAccess,
      undefined,
      failingAudit as unknown as SecurityAuditService,
      new SnapshotTransactionService(repository),
    );

    await expect(
      service.store({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
        fields: BINANCE_FIELDS,
      }),
    ).rejects.toThrow('audit append failed');

    expect(await service.list('ws-a', 'ws-a')).toEqual([]);
  });

  it('validates well-formed fields without storing and without vendor I/O', async () => {
    const { service } = vaultWith();
    expect(vaultValidationPerformsVendorIo()).toBe(false);

    const accepted = await service.validate({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
      fields: BINANCE_FIELDS,
    });
    expect(accepted.type).toBe(HoldableSecretType.Binance);
    expect(accepted).not.toHaveProperty('fields');
    expect(accepted).not.toHaveProperty('apiKey');
    expect(await service.list('ws-a', 'ws-a')).toEqual([]);

    await expect(
      service.validate({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
        fields: { apiKey: 'key-a' },
      }),
    ).rejects.toBeInstanceOf(VaultValidationError);
    expect(await service.list('ws-a', 'ws-a')).toEqual([]);
  });

  it('rejects incomplete Binance material and does not show Connected', async () => {
    const { service } = vaultWith();
    await expect(
      service.store({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
        fields: { apiKey: 'key-a' },
      }),
    ).rejects.toBeInstanceOf(VaultValidationError);
    expect(await service.list('ws-a', 'ws-a')).toEqual([]);
  });

  it('leaves the previous secret in place when replacement validation fails', async () => {
    const { service } = vaultWith();
    await service.store({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
      fields: BINANCE_FIELDS,
    });
    await expect(
      service.replace({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
        fields: { apiKey: 'only-key' },
      }),
    ).rejects.toBeInstanceOf(VaultValidationError);

    const listed = await service.list('ws-a', 'ws-a');
    expect(listed).toHaveLength(1);
    expect(listed[0]?.state).toBe(SecretState.Connected);
    expect(
      await service.retrieve({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
      }),
    ).toEqual(BINANCE_FIELDS);
  });

  it('replaces so the previous material is unreadable and metadata identity is kept', async () => {
    const clock = new MutableClock('2026-08-17T12:00:00.000Z');
    const { service } = vaultWith(new InMemorySecretVaultRepository(), clock);
    const created = await service.store({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
      fields: BINANCE_FIELDS,
    });
    clock.set('2026-08-17T12:05:00.000Z');
    const replaced = await service.replace({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
      fields: BINANCE_REPLACEMENT,
    });

    expect(replaced.lifecycle).toEqual([
      SecretState.Created,
      SecretState.Validated,
      SecretState.Connected,
    ]);
    expect(replaced.metadata.id).toBe(created.metadata.id);
    expect(replaced.metadata.createdAt).toBe(created.metadata.createdAt);
    expect(replaced.metadata.updatedAt).toBe('2026-08-17T12:05:00.000Z');
    expect(replaced.metadata.state).toBe(SecretState.Connected);
    expect(metadataContainsSecretFields(replaced.metadata)).toBe(false);
    expect(JSON.stringify(replaced.metadata)).not.toContain('key-a');
    expect(JSON.stringify(replaced.metadata)).not.toContain('key-b');
    expect(
      await service.retrieve({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
      }),
    ).toEqual(BINANCE_REPLACEMENT);
    await expect(
      service.replace({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Telegram,
        fields: { botToken: 'token-1' },
      }),
    ).rejects.toBeInstanceOf(VaultNotStoredError);
  });

  it('updates metadata without changing ciphertext or exposing secrets', async () => {
    const clock = new MutableClock('2026-08-17T12:00:00.000Z');
    const { service } = vaultWith(new InMemorySecretVaultRepository(), clock);
    const stored = await service.store({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
      fields: BINANCE_FIELDS,
    });
    clock.set('2026-08-17T12:10:00.000Z');
    const updated = await service.updateMetadata({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
    });

    expect(updated.id).toBe(stored.metadata.id);
    expect(updated.state).toBe(SecretState.Connected);
    expect(updated.updatedAt).toBe('2026-08-17T12:10:00.000Z');
    expect(updated.createdAt).toBe(stored.metadata.createdAt);
    expect(metadataContainsSecretFields(updated)).toBe(false);
    expect(JSON.stringify(updated)).not.toContain('key-a');
    expect(
      await service.retrieve({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
      }),
    ).toEqual(BINANCE_FIELDS);
  });

  it('makes a revoked secret unavailable and keeps revoked metadata', async () => {
    const { service } = vaultWith();
    await service.store({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
      fields: BINANCE_FIELDS,
    });
    const revoked = await service.revoke({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
    });
    expect(revoked.state).toBe(SecretState.Revoked);
    expect(revoked.operatorLabel).toBe(OperatorSecretLabel.Revoked);
    expect(metadataContainsSecretFields(revoked)).toBe(false);

    await expect(
      service.retrieve({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
      }),
    ).rejects.toBeInstanceOf(VaultRevokedError);
    expect(
      await service.get({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
      }),
    ).toMatchObject({ state: SecretState.Revoked });
  });

  it('makes a deleted secret unavailable and returns nothing for get', async () => {
    const { service } = vaultWith();
    await service.store({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
      fields: BINANCE_FIELDS,
    });
    await service.delete({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
    });

    expect(
      await service.get({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
      }),
    ).toBeNull();
    expect(await service.list('ws-a', 'ws-a')).toEqual([]);
    await expect(
      service.retrieve({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
      }),
    ).rejects.toBeInstanceOf(VaultNotStoredError);
    await expect(
      service.revoke({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
      }),
    ).rejects.toBeInstanceOf(VaultNotStoredError);
    await expect(
      service.delete({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
      }),
    ).rejects.toBeInstanceOf(VaultNotStoredError);
  });

  it('rejects impossible transitions: revoke twice and revoke after delete', async () => {
    const { service } = vaultWith();
    await service.store({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
      fields: BINANCE_FIELDS,
    });
    await service.revoke({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
    });
    await expect(
      service.revoke({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
      }),
    ).rejects.toBeInstanceOf(VaultLifecycleError);

    await service.delete({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
    });
    await expect(
      service.revoke({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
      }),
    ).rejects.toBeInstanceOf(VaultNotStoredError);
  });

  it('allows replace after revoke so the type becomes Connected again', async () => {
    const { service } = vaultWith();
    await service.store({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
      fields: BINANCE_FIELDS,
    });
    await service.revoke({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
    });
    const replaced = await service.replace({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
      fields: BINANCE_REPLACEMENT,
    });
    expect(replaced.metadata.state).toBe(SecretState.Connected);
    expect(
      await service.retrieve({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
      }),
    ).toEqual(BINANCE_REPLACEMENT);
  });

  it('fails closed on corrupted ciphertext: integrity fails, nothing returned, paper continues', async () => {
    const repository = new InMemorySecretVaultRepository();
    const { service: writer } = vaultWith(repository);
    await writer.store({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
      fields: BINANCE_FIELDS,
    });

    const snapshot = JSON.parse(repository.snapshot()) as Array<{
      ciphertext: Parameters<typeof withTamperedPayload>[0];
    }>;
    snapshot[0]!.ciphertext = withTamperedPayload(snapshot[0]!.ciphertext);
    const corrupted = InMemorySecretVaultRepository.fromSnapshot(JSON.stringify(snapshot));
    const { service } = vaultWith(corrupted);

    const metadata = await service.get({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
    });
    expect(metadata?.state).toBe(SecretState.Connected);
    expect(metadataContainsSecretFields(metadata!)).toBe(false);

    let returned: unknown;
    try {
      returned = await service.retrieve({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
      });
      expect.unreachable('retrieve must not return material for corrupted ciphertext');
    } catch (error) {
      expect(error).toBeInstanceOf(VaultUnavailableError);
      expect(returned).toBeUndefined();
      expect(JSON.stringify(error)).not.toContain('key-a');
      expect(JSON.stringify(error)).not.toContain('secret-a');
    }

    const byCapability = Object.fromEntries(
      capabilitiesWhenVaultUnavailable().map((row) => [row.capability, row.continues]),
    );
    expect(byCapability[ProductCapability.PaperTrading]).toBe(true);
    expect(byCapability[ProductCapability.Authentication]).toBe(true);
    expect(byCapability[ProductCapability.Research]).toBe(true);
    expect(byCapability[ProductCapability.Integrations]).toBe(false);
  });

  it('fails closed when the ciphertext authentication tag is corrupted', async () => {
    const repository = new InMemorySecretVaultRepository();
    const { service: writer } = vaultWith(repository);
    await writer.store({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
      fields: BINANCE_FIELDS,
    });
    const snapshot = JSON.parse(repository.snapshot()) as Array<{
      ciphertext: Parameters<typeof withTamperedPayloadTag>[0];
    }>;
    snapshot[0]!.ciphertext = withTamperedPayloadTag(snapshot[0]!.ciphertext);
    const { service } = vaultWith(
      InMemorySecretVaultRepository.fromSnapshot(JSON.stringify(snapshot)),
    );

    await expect(
      service.retrieve({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
      }),
    ).rejects.toBeInstanceOf(VaultUnavailableError);
  });

  it('keeps a consistent final state when two replaces race on the same secret', async () => {
    const { service } = vaultWith();
    await service.store({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
      fields: BINANCE_FIELDS,
    });

    const [first, second] = await Promise.allSettled([
      service.replace({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
        fields: BINANCE_REPLACEMENT,
      }),
      service.replace({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
        fields: BINANCE_REPLACEMENT_B,
      }),
    ]);

    expect([first.status, second.status]).toContain('fulfilled');
    const listed = await service.list('ws-a', 'ws-a');
    expect(listed).toHaveLength(1);
    expect(listed[0]?.state).toBe(SecretState.Connected);

    const material = await service.retrieve({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
    });
    expect([BINANCE_REPLACEMENT, BINANCE_REPLACEMENT_B]).toContainEqual(material);
    expect(material).not.toEqual(BINANCE_FIELDS);
  });

  it('keeps a consistent final state when replace and delete race', async () => {
    const { service } = vaultWith();
    await service.store({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
      fields: BINANCE_FIELDS,
    });

    const [replace, remove] = await Promise.allSettled([
      service.replace({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
        fields: BINANCE_REPLACEMENT,
      }),
      service.delete({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
      }),
    ]);

    expect([replace.status, remove.status]).toContain('fulfilled');
    const current = await service.get({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
    });
    if (current === null) {
      await expect(
        service.retrieve({
          actorWorkspaceId: 'ws-a',
          workspaceId: 'ws-a',
          type: HoldableSecretType.Binance,
        }),
      ).rejects.toBeInstanceOf(VaultNotStoredError);
    } else {
      expect(current.state).toBe(SecretState.Connected);
      expect(
        await service.retrieve({
          actorWorkspaceId: 'ws-a',
          workspaceId: 'ws-a',
          type: HoldableSecretType.Binance,
        }),
      ).toEqual(BINANCE_REPLACEMENT);
    }
  });

  it('keeps a consistent final state when revoke and delete race', async () => {
    const { service } = vaultWith();
    await service.store({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
      fields: BINANCE_FIELDS,
    });

    const [revoke, remove] = await Promise.allSettled([
      service.revoke({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
      }),
      service.delete({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
      }),
    ]);

    expect([revoke.status, remove.status]).toContain('fulfilled');
    const current = await service.get({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
    });
    if (current === null) {
      await expect(
        service.retrieve({
          actorWorkspaceId: 'ws-a',
          workspaceId: 'ws-a',
          type: HoldableSecretType.Binance,
        }),
      ).rejects.toBeInstanceOf(VaultNotStoredError);
    } else {
      expect(current.state).toBe(SecretState.Revoked);
      await expect(
        service.retrieve({
          actorWorkspaceId: 'ws-a',
          workspaceId: 'ws-a',
          type: HoldableSecretType.Binance,
        }),
      ).rejects.toBeInstanceOf(VaultRevokedError);
    }
  });

  it('re-reads and retries a stale replace reference instead of overwriting blindly', async () => {
    const repository = new StaleOnceRepository();
    const service = new SecretVaultService(
      repository,
      new MutableClock('2026-08-17T12:00:00.000Z'),
      staticWrappingKeySource(WRAPPING_KEY),
      testAccess,
    );
    await service.store({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
      fields: BINANCE_FIELDS,
    });

    await service.replace({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
      fields: BINANCE_REPLACEMENT,
    });

    expect(
      await service.retrieve({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
      }),
    ).toEqual(BINANCE_REPLACEMENT);
  });
});
