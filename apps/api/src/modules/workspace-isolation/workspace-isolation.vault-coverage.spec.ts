import { describe, expect, it } from 'vitest';
import { AuthorizationDecisionService } from '../auth/authorization-decision.service';
import { Role } from '../identity/role';
import { HoldableSecretType } from '../secret-vault/holdable-secret-type';
import { InMemorySecretVaultRepository } from '../secret-vault/in-memory-secret-vault.repository';
import { SecretVaultService, type Clock } from '../secret-vault/secret-vault.service';
import { VaultAccessControl } from '../secret-vault/vault-access-control';
import { VaultIsolationError } from '../secret-vault/vault-errors';
import { staticWrappingKeySource } from '../secret-vault/wrapping-key';
import { createDualWorkspaceIsolationFixture } from './dual-workspace.fixture';
import { IsolationMatrixRowId } from './isolation-matrix-contract';
import { expectNoForeignPayload } from './negative-proof';

class FixedVaultClock implements Clock {
  nowIso(): string {
    return '2026-08-17T12:00:00.000Z';
  }
}

const VAULT_TEST_KEY = 'trp-s06-c-isolation-test-wrapping-key';
const secretFieldsA = { apiKey: 'workspace-a-key', apiSecret: 'workspace-a-secret' };
const secretFieldsB = { apiKey: 'workspace-b-key', apiSecret: 'workspace-b-secret' };

function vaultForFixture(
  fixture: Awaited<ReturnType<typeof createDualWorkspaceIsolationFixture>>,
): SecretVaultService {
  return new SecretVaultService(
    new InMemorySecretVaultRepository(),
    new FixedVaultClock(),
    staticWrappingKeySource(VAULT_TEST_KEY),
    new VaultAccessControl(fixture.access, new AuthorizationDecisionService()),
  );
}

describe('Workspace isolation Vault coverage (V3-S06-c)', () => {
  it(`[${IsolationMatrixRowId.VaultSecrets}] positive scope + regression: Workspace A lists only its own metadata`, async () => {
    const fixture = await createDualWorkspaceIsolationFixture();
    const vault = vaultForFixture(fixture);

    await vault.store({
      actorWorkspaceId: fixture.operatorAId,
      actorRole: Role.Trader,
      workspaceId: fixture.workspaceA.id,
      type: HoldableSecretType.Binance,
      fields: secretFieldsA,
    });
    await vault.store({
      actorWorkspaceId: fixture.operatorBId,
      actorRole: Role.Trader,
      workspaceId: fixture.workspaceB.id,
      type: HoldableSecretType.Binance,
      fields: secretFieldsB,
    });

    const workspaceASecrets = await vault.list(
      fixture.operatorAId,
      fixture.workspaceA.id,
      Role.Trader,
    );
    expect(workspaceASecrets).toHaveLength(1);
    expect(workspaceASecrets[0]).toMatchObject({ workspaceId: fixture.workspaceA.id });
    expectNoForeignPayload(workspaceASecrets, [
      fixture.workspaceB.id,
      secretFieldsB.apiKey,
      secretFieldsB.apiSecret,
    ]);
  });

  it(`[${IsolationMatrixRowId.VaultSecrets}] negative regression: Workspace A cannot operate Vault B`, async () => {
    const fixture = await createDualWorkspaceIsolationFixture();
    const vault = vaultForFixture(fixture);
    const workspaceBQuery = {
      actorWorkspaceId: fixture.operatorAId,
      actorRole: Role.Trader,
      workspaceId: fixture.workspaceB.id,
      type: HoldableSecretType.Binance,
    };

    await vault.store({
      actorWorkspaceId: fixture.operatorBId,
      actorRole: Role.Trader,
      workspaceId: fixture.workspaceB.id,
      type: HoldableSecretType.Binance,
      fields: secretFieldsB,
    });

    await expect(
      vault.list(fixture.operatorAId, fixture.workspaceB.id, Role.Trader),
    ).rejects.toBeInstanceOf(VaultIsolationError);
    await expect(vault.get(workspaceBQuery)).rejects.toBeInstanceOf(VaultIsolationError);
    await expect(vault.retrieve(workspaceBQuery)).rejects.toBeInstanceOf(VaultIsolationError);
    await expect(vault.store({ ...workspaceBQuery, fields: secretFieldsA })).rejects.toBeInstanceOf(
      VaultIsolationError,
    );
    await expect(
      vault.replace({ ...workspaceBQuery, fields: secretFieldsA }),
    ).rejects.toBeInstanceOf(VaultIsolationError);
    await expect(vault.revoke(workspaceBQuery)).rejects.toBeInstanceOf(VaultIsolationError);
    await expect(vault.delete(workspaceBQuery)).rejects.toBeInstanceOf(VaultIsolationError);
  });
});
