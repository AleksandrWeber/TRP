import { describe, expect, it } from 'vitest';
import { HoldableSecretType } from './holdable-secret-type';
import { InMemorySecretVaultRepository } from './in-memory-secret-vault.repository';
import { HostSecretName } from './secret-classification';
import { persistedFormContainsPlaintext, persistedFormContainsWrappingKey } from './secret-persist';
import { metadataContainsSecretFields } from './secret-record';
import { OperatorSecretLabel, SecretState } from './secret-state';
import { SecretVaultService, type Clock } from './secret-vault.service';
import {
  ProductCapability,
  capabilitiesWhenVaultUnavailable,
  wrappingKeyUnsetMustFailApiBoot,
} from './vault-failure';
import { VaultUnavailableError, VaultValidationError } from './vault-errors';
import { staticWrappingKeySource } from './wrapping-key';

class FixedClock implements Clock {
  nowIso(): string {
    return '2026-08-17T11:00:00.000Z';
  }
}

const WRAPPING_KEY = 'trp-host-vault-wrapping-key-v3-s03b';
const WRONG_WRAPPING_KEY = 'trp-host-vault-wrapping-key-WRONG!!';
const BINANCE_FIELDS = { apiKey: 'key-a', apiSecret: 'secret-a' };
const testAccess = { assertCanAccess: () => undefined };

function vaultWith(
  wrappingKey: string | null,
  repository = new InMemorySecretVaultRepository(),
): { service: SecretVaultService; repository: InMemorySecretVaultRepository } {
  return {
    service: new SecretVaultService(
      repository,
      new FixedClock(),
      staticWrappingKeySource(wrappingKey),
      testAccess,
    ),
    repository,
  };
}

describe('Secret Vault encryption foundation (V3-S03-b)', () => {
  it('stores ciphertext, not plaintext, and wrapping key is not in the record', async () => {
    const { service, repository } = vaultWith(WRAPPING_KEY);
    const stored = await service.store({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
      fields: BINANCE_FIELDS,
    });

    expect(stored.metadata.state).toBe(SecretState.Connected);
    expect(stored.metadata.operatorLabel).toBe(OperatorSecretLabel.Stored);
    expect(stored.metadata.operatorLabel.toLowerCase()).not.toContain('encrypt');
    expect(metadataContainsSecretFields(stored.metadata)).toBe(false);
    expect(JSON.stringify(stored.metadata)).not.toContain('key-a');
    expect(JSON.stringify(stored.metadata)).not.toContain('secret-a');

    const snapshot = repository.snapshot();
    expect(persistedFormContainsPlaintext(snapshot, BINANCE_FIELDS)).toBe(false);
    expect(persistedFormContainsWrappingKey(snapshot, WRAPPING_KEY)).toBe(false);
    expect(snapshot).not.toContain('"material"');
    expect(snapshot).toContain('"ciphertext"');

    const material = await service.retrieve({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
    });
    expect(material).toEqual(BINANCE_FIELDS);
    expect(service.vaultConnectedMeansProviderWorks()).toBe(false);
  });

  it('fails closed when the wrapping key is missing and does not fail API boot', async () => {
    expect(wrappingKeyUnsetMustFailApiBoot()).toBe(false);
    const { service } = vaultWith(null);
    await expect(
      service.store({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
        fields: BINANCE_FIELDS,
      }),
    ).rejects.toBeInstanceOf(VaultUnavailableError);
    expect(await service.list('ws-a', 'ws-a')).toEqual([]);

    const byCapability = Object.fromEntries(
      capabilitiesWhenVaultUnavailable().map((row) => [row.capability, row.continues]),
    );
    expect(byCapability[ProductCapability.PaperTrading]).toBe(true);
    expect(byCapability[ProductCapability.Authentication]).toBe(true);
    expect(byCapability[ProductCapability.Research]).toBe(true);
    expect(byCapability[ProductCapability.Integrations]).toBe(false);
  });

  it('fails closed on the wrong wrapping key; secret stays unavailable; paper continues', async () => {
    const repository = new InMemorySecretVaultRepository();
    const { service: writer } = vaultWith(WRAPPING_KEY, repository);
    await writer.store({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
      fields: BINANCE_FIELDS,
    });

    const { service: wrongKey } = vaultWith(WRONG_WRAPPING_KEY, repository);
    const metadata = await wrongKey.get({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
    });
    expect(metadata?.operatorLabel).toBe(OperatorSecretLabel.Stored);
    await expect(
      wrongKey.retrieve({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
      }),
    ).rejects.toBeInstanceOf(VaultUnavailableError);

    const { service: missingKey } = vaultWith(null, repository);
    await expect(
      missingKey.retrieve({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
      }),
    ).rejects.toBeInstanceOf(VaultUnavailableError);

    expect(wrappingKeyUnsetMustFailApiBoot()).toBe(false);
    expect(
      capabilitiesWhenVaultUnavailable().find(
        (row) => row.capability === ProductCapability.PaperTrading,
      )?.continues,
    ).toBe(true);
  });

  it('reloads ciphertext after a process snapshot and still refuses plaintext readback', async () => {
    const { service, repository } = vaultWith(WRAPPING_KEY);
    await service.store({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.OpenRouter,
      fields: { apiKey: 'operator-entered-key' },
    });
    const snapshot = repository.snapshot();
    expect(persistedFormContainsPlaintext(snapshot, { apiKey: 'operator-entered-key' })).toBe(
      false,
    );

    const restored = InMemorySecretVaultRepository.fromSnapshot(snapshot);
    const { service: restarted } = vaultWith(WRAPPING_KEY, restored);
    const listed = await restarted.list('ws-a', 'ws-a');
    expect(listed).toHaveLength(1);
    expect(listed[0]?.operatorLabel).toBe(OperatorSecretLabel.Stored);
    expect(JSON.stringify(listed)).not.toContain('operator-entered-key');
    expect(
      await restarted.retrieve({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.OpenRouter,
      }),
    ).toEqual({ apiKey: 'operator-entered-key' });

    const { service: wrongKey } = vaultWith(WRONG_WRAPPING_KEY, restored);
    await expect(
      wrongKey.retrieve({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.OpenRouter,
      }),
    ).rejects.toBeInstanceOf(VaultUnavailableError);
  });

  it('refuses to store the wrapping key as a Vault record', async () => {
    const { service } = vaultWith(WRAPPING_KEY);
    await expect(
      service.store({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HostSecretName.VaultWrappingKey,
        fields: { value: WRAPPING_KEY },
      }),
    ).rejects.toBeInstanceOf(VaultValidationError);
  });

  it('clears ciphertext on revoke so retrieve cannot decrypt leftover material', async () => {
    const { service, repository } = vaultWith(WRAPPING_KEY);
    await service.store({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Telegram,
      fields: { botToken: 'token-1' },
    });
    await service.revoke({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Telegram,
    });
    const snapshot = repository.snapshot();
    expect(snapshot).not.toContain('token-1');
    expect(JSON.parse(snapshot)[0]?.ciphertext).toBeNull();
  });
});
