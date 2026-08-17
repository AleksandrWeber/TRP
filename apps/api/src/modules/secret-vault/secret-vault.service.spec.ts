import { afterEach, describe, expect, it } from 'vitest';
import { HoldableSecretType } from './holdable-secret-type';
import { InMemorySecretVaultRepository } from './in-memory-secret-vault.repository';
import { HostSecretName } from './secret-classification';
import { SecretPurpose } from './secret-purpose';
import { metadataContainsSecretFields } from './secret-record';
import { OperatorSecretLabel, SecretState } from './secret-state';
import { SecretVaultService, type Clock } from './secret-vault.service';
import {
  VaultIsolationError,
  VaultNotStoredError,
  VaultRevokedError,
  VaultValidationError,
} from './vault-errors';
import { staticWrappingKeySource } from './wrapping-key';

class FixedClock implements Clock {
  nowIso(): string {
    return '2026-08-17T07:00:00.000Z';
  }
}

const TEST_WRAPPING_KEY = 'trp-host-vault-wrapping-key-v3-s03b';
const testAccess = {
  assertCanAccess: (actor: { userId: string }, workspaceId: string) => {
    if (actor.userId !== workspaceId) throw new VaultIsolationError();
  },
};

function vault(): SecretVaultService {
  return new SecretVaultService(
    new InMemorySecretVaultRepository(),
    new FixedClock(),
    staticWrappingKeySource(TEST_WRAPPING_KEY),
    testAccess,
  );
}

const BINANCE_FIELDS = { apiKey: 'key-a', apiSecret: 'secret-a' };
const SMTP_FIELDS = {
  host: 'smtp.example.com',
  port: '587',
  username: 'alerts',
  password: 'old-pass',
  sender: 'alerts@example.com',
};
const SMTP_REPLACEMENT = {
  ...SMTP_FIELDS,
  password: 'new-pass',
};

describe('SecretVaultService (V3-S03-c)', () => {
  const previousOpenRouter = process.env.OPENROUTER_API_KEY;

  afterEach(() => {
    if (previousOpenRouter === undefined) {
      delete process.env.OPENROUTER_API_KEY;
    } else {
      process.env.OPENROUTER_API_KEY = previousOpenRouter;
    }
  });

  it('stores workspace-scoped metadata plus secret material owned by Vault', async () => {
    const service = vault();
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
    expect(stored.metadata.workspaceId).toBe('ws-a');
    expect(stored.metadata.purpose).toBe(SecretPurpose.Trading);
    expect(metadataContainsSecretFields(stored.metadata)).toBe(false);
    expect(stored.metadata).not.toHaveProperty('material');
    expect(stored.metadata).not.toHaveProperty('apiKey');
    expect(JSON.stringify(stored.metadata)).not.toContain('key-a');
    expect(JSON.stringify(stored.metadata)).not.toContain('secret-a');

    const material = await service.retrieve({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
    });
    expect(material).toEqual(BINANCE_FIELDS);
    expect(service.vaultConnectedMeansProviderWorks()).toBe(false);
  });

  it('denies a foreign workspace for list, get, retrieve, revoke, and delete', async () => {
    const service = vault();
    await service.store({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
      fields: BINANCE_FIELDS,
    });

    await expect(service.list('ws-b', 'ws-a')).rejects.toBeInstanceOf(VaultIsolationError);
    await expect(
      service.get({
        actorWorkspaceId: 'ws-b',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
      }),
    ).rejects.toBeInstanceOf(VaultIsolationError);
    await expect(
      service.retrieve({
        actorWorkspaceId: 'ws-b',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
      }),
    ).rejects.toBeInstanceOf(VaultIsolationError);
    await expect(
      service.revoke({
        actorWorkspaceId: 'ws-b',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
      }),
    ).rejects.toBeInstanceOf(VaultIsolationError);
    await expect(
      service.delete({
        actorWorkspaceId: 'ws-b',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
      }),
    ).rejects.toBeInstanceOf(VaultIsolationError);

    expect(await service.list('ws-b', 'ws-b')).toEqual([]);
  });

  it('rejects incomplete material and does not show Connected', async () => {
    const service = vault();
    await expect(
      service.store({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
        fields: {},
      }),
    ).rejects.toBeInstanceOf(VaultValidationError);
    await expect(
      service.store({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
        fields: { apiKey: '   ' },
      }),
    ).rejects.toBeInstanceOf(VaultValidationError);

    expect(await service.list('ws-a', 'ws-a')).toEqual([]);
  });

  it('rejects host secrets and public-market-data purpose', async () => {
    const service = vault();
    await expect(
      service.store({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HostSecretName.JwtSecret,
        fields: { value: 'n' },
      }),
    ).rejects.toBeInstanceOf(VaultValidationError);
    await expect(
      service.store({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
        purpose: 'public_market_data',
        fields: BINANCE_FIELDS,
      }),
    ).rejects.toBeInstanceOf(VaultValidationError);
  });

  it('does not auto-import OPENROUTER_API_KEY from env', async () => {
    process.env.OPENROUTER_API_KEY = 'env-should-not-be-imported';
    const service = vault();

    await expect(
      service.store({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.OpenRouter,
        fields: {},
      }),
    ).rejects.toBeInstanceOf(VaultValidationError);

    const stored = await service.store({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.OpenRouter,
      fields: { apiKey: 'operator-entered-key' },
    });
    expect(stored.metadata.type).toBe(HoldableSecretType.OpenRouter);
    const material = await service.retrieve({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.OpenRouter,
    });
    expect(material).toEqual({ apiKey: 'operator-entered-key' });
    expect(material).not.toEqual({ apiKey: 'env-should-not-be-imported' });
  });

  it('revokes so retrieve fails, then deletes so the type is not stored', async () => {
    const service = vault();
    await service.store({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Telegram,
      fields: { botToken: 'token-1' },
    });

    const revoked = await service.revoke({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Telegram,
    });
    expect(revoked.state).toBe(SecretState.Revoked);
    expect(revoked.operatorLabel).toBe(OperatorSecretLabel.Revoked);
    await expect(
      service.retrieve({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Telegram,
      }),
    ).rejects.toBeInstanceOf(VaultRevokedError);

    await service.delete({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Telegram,
    });
    expect(
      await service.get({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Telegram,
      }),
    ).toBeNull();
    await expect(
      service.retrieve({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Telegram,
      }),
    ).rejects.toBeInstanceOf(VaultNotStoredError);
  });

  it('replaces previous material so the old secret is unreadable', async () => {
    const service = vault();
    await service.store({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Smtp,
      fields: SMTP_FIELDS,
    });
    await service.store({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Smtp,
      fields: SMTP_REPLACEMENT,
    });

    const listed = await service.list('ws-a', 'ws-a');
    expect(listed).toHaveLength(1);
    expect(listed[0]?.state).toBe(SecretState.Connected);
    const material = await service.retrieve({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Smtp,
    });
    expect(material).toEqual(SMTP_REPLACEMENT);
  });

  it('keeps one active secret per type and purpose in a workspace', async () => {
    const service = vault();
    await service.store({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Binance,
      fields: BINANCE_FIELDS,
    });
    await service.store({
      actorWorkspaceId: 'ws-a',
      workspaceId: 'ws-a',
      type: HoldableSecretType.Bybit,
      fields: BINANCE_FIELDS,
    });
    await service.store({
      actorWorkspaceId: 'ws-b',
      workspaceId: 'ws-b',
      type: HoldableSecretType.Binance,
      fields: { apiKey: 'b', apiSecret: 'b' },
    });

    expect(await service.list('ws-a', 'ws-a')).toHaveLength(2);
    expect(await service.list('ws-b', 'ws-b')).toHaveLength(1);
  });
});
