import { describe, expect, it, vi } from 'vitest';
import { Role } from '../identity/role';
import { OpenRouterConnectivityAudit } from './openrouter-connectivity.audit';
import { OpenRouterConnectivityCache } from './openrouter-connectivity.cache';
import { OpenRouterConnectionTestService } from './openrouter-connection-test.service';
import { OpenRouterKeyResolution } from './openrouter-key-resolution';

describe('OpenRouterConnectionTestService (W2-S05-a)', () => {
  it('assigns Connected only after OpenRouter accepts the vaulted key', async () => {
    const cache = new OpenRouterConnectivityCache();
    const auditEvents: Array<{ outcome: string }> = [];
    const service = new OpenRouterConnectionTestService(
      {
        resolve: async () => ({ vaultSecretId: 'vault-or-1', apiKey: 'sk-or-valid' }),
      } as unknown as OpenRouterKeyResolution,
      {
        probeConnectivity: async () => 'authenticated',
      } as never,
      cache,
      {
        tested: async (event: { outcome: string }) => {
          auditEvents.push(event);
        },
      } as unknown as OpenRouterConnectivityAudit,
      1_000,
      { nowMs: () => Date.parse('2026-08-26T12:00:00.000Z') },
    );

    const result = await service.perform({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      actorRole: Role.Admin,
      connectionId: 'conn-1',
      vaultSecretId: 'vault-or-1',
    });

    expect(result.outcome).toBe('CONNECTED');
    expect(result.vendorVisibleMessage).toContain('accepted');
    expect(cache.get('workspace-a', 'conn-1')).toMatchObject({
      outcome: 'succeeded',
      failureReason: null,
      testedAt: '2026-08-26T12:00:00.000Z',
    });
    expect(auditEvents).toEqual([
      expect.objectContaining({ outcome: 'CONNECTED', connectionId: 'conn-1' }),
    ]);
  });

  it('maps authentication failure to an honest Connection Failed outcome', async () => {
    const cache = new OpenRouterConnectivityCache();
    const service = new OpenRouterConnectionTestService(
      {
        resolve: async () => ({ vaultSecretId: 'vault-or-1', apiKey: 'sk-or-bad' }),
      } as unknown as OpenRouterKeyResolution,
      {
        probeConnectivity: async () => 'authentication_failed',
      } as never,
      cache,
      { tested: async () => undefined } as unknown as OpenRouterConnectivityAudit,
    );

    const result = await service.perform({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      actorRole: Role.Admin,
      connectionId: 'conn-1',
      vaultSecretId: 'vault-or-1',
    });

    expect(result.outcome).toBe('AUTHENTICATION_FAILED');
    expect(cache.get('workspace-a', 'conn-1')?.outcome).toBe('failed');
    expect(cache.get('workspace-a', 'conn-1')?.failureReason).toBe('AUTHENTICATION_FAILED');
    expect(JSON.stringify(result)).not.toContain('sk-or-bad');
  });

  it('fails closed when the workspace key cannot be resolved', async () => {
    const service = new OpenRouterConnectionTestService(
      { resolve: async () => null } as unknown as OpenRouterKeyResolution,
      {
        probeConnectivity: async () => {
          throw new Error('probe must not run');
        },
      } as never,
      new OpenRouterConnectivityCache(),
      { tested: async () => undefined } as unknown as OpenRouterConnectivityAudit,
    );

    await expect(
      service.perform({
        workspaceId: 'workspace-a',
        actorUserId: 'user-a',
        actorRole: Role.Admin,
        connectionId: 'conn-1',
        vaultSecretId: 'vault-missing',
      }),
    ).resolves.toMatchObject({ outcome: 'VALIDATION_FAILED' });
  });

  it('never invokes prompt completion during a connectivity test', async () => {
    const complete = vi.fn();
    const service = new OpenRouterConnectionTestService(
      {
        resolve: async () => ({ vaultSecretId: 'vault-or-1', apiKey: 'sk-or-valid' }),
      } as unknown as OpenRouterKeyResolution,
      {
        probeConnectivity: async () => 'authenticated',
        complete,
      } as never,
      new OpenRouterConnectivityCache(),
      { tested: async () => undefined } as unknown as OpenRouterConnectivityAudit,
    );

    await service.perform({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      actorRole: Role.Admin,
      connectionId: 'conn-1',
      vaultSecretId: 'vault-or-1',
    });

    expect(complete).not.toHaveBeenCalled();
  });
});
