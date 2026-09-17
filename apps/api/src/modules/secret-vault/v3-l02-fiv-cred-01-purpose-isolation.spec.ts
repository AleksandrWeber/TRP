/**
 * V3-L02 FIV-CRED-01 — Credential model / Vault purpose isolation regression.
 * Verifies exact-purpose resolution for Trading vs TradingTestnet.
 * ZERO network / Binance / credential provisioning. Placeholder fields only.
 */

import { describe, expect, it } from 'vitest';
import {
  purposeForTradingEnvironment,
  tradingEnvironmentFromPurpose,
} from '../execution-adapter/live-venue-egress/trading-credential-environment';
import { HoldableSecretType } from './holdable-secret-type';
import { InMemorySecretVaultRepository } from './in-memory-secret-vault.repository';
import {
  defaultPurposeForType,
  isSecretPurpose,
  isTradingSecretPurpose,
  SecretPurpose,
} from './secret-purpose';
import { metadataContainsSecretFields } from './secret-record';
import { SecretVaultService, type Clock } from './secret-vault.service';
import { VaultIsolationError, VaultNotStoredError } from './vault-errors';
import { staticWrappingKeySource } from './wrapping-key';

class FixedClock implements Clock {
  nowIso(): string {
    return '2026-09-17T12:00:00.000Z';
  }
}

const TEST_WRAPPING_KEY = 'trp-host-vault-wrapping-key-fiv-cred-01';
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

/** Placeholders only — never real venue credentials. */
const LIVE_FIELDS = Object.freeze({
  apiKey: 'placeholder-live-api-key',
  apiSecret: 'placeholder-live-api-secret',
});
const TESTNET_FIELDS = Object.freeze({
  apiKey: 'placeholder-testnet-api-key',
  apiSecret: 'placeholder-testnet-api-secret',
});

describe('V3-L02 FIV-CRED-01 Vault purpose isolation', () => {
  describe('purpose taxonomy (AC-01, AC-02)', () => {
    it('preserves Trading and TradingTestnet as distinct first-class purposes', () => {
      expect(SecretPurpose.Trading).toBe('trading');
      expect(SecretPurpose.TradingTestnet).toBe('trading_testnet');
      expect(SecretPurpose.Trading).not.toBe(SecretPurpose.TradingTestnet);
      expect(isSecretPurpose(SecretPurpose.Trading)).toBe(true);
      expect(isSecretPurpose(SecretPurpose.TradingTestnet)).toBe(true);
      expect(isTradingSecretPurpose(SecretPurpose.Trading)).toBe(true);
      expect(isTradingSecretPurpose(SecretPurpose.TradingTestnet)).toBe(true);
      expect(defaultPurposeForType(HoldableSecretType.Binance)).toBe(SecretPurpose.Trading);
    });

    it('maps ENV1 purpose → environment without cross-purpose collapse', () => {
      expect(tradingEnvironmentFromPurpose(SecretPurpose.Trading)).toBe('live');
      expect(tradingEnvironmentFromPurpose(SecretPurpose.TradingLive)).toBe('live');
      expect(tradingEnvironmentFromPurpose(SecretPurpose.TradingTestnet)).toBe('testnet');
      expect(purposeForTradingEnvironment('live')).toBe(SecretPurpose.TradingLive);
      expect(purposeForTradingEnvironment('testnet')).toBe(SecretPurpose.TradingTestnet);
    });
  });

  describe('exact-purpose resolution (AC-03, AC-04, AC-07)', () => {
    it('Trading resolves exact Trading credential (LIVE regression)', async () => {
      const service = vault();
      const stored = await service.store({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
        purpose: SecretPurpose.Trading,
        fields: { ...LIVE_FIELDS },
      });
      expect(stored.metadata.purpose).toBe(SecretPurpose.Trading);
      expect(metadataContainsSecretFields(stored.metadata)).toBe(false);

      const material = await service.retrieve({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
        purpose: SecretPurpose.Trading,
      });
      expect(material).toEqual(LIVE_FIELDS);
    });

    it('TradingTestnet resolves exact TradingTestnet credential', async () => {
      const service = vault();
      const stored = await service.store({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
        purpose: SecretPurpose.TradingTestnet,
        fields: { ...TESTNET_FIELDS },
      });
      expect(stored.metadata.purpose).toBe(SecretPurpose.TradingTestnet);

      const material = await service.retrieve({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
        purpose: SecretPurpose.TradingTestnet,
      });
      expect(material).toEqual(TESTNET_FIELDS);
    });

    it('Trading and TradingTestnet coexist as distinct slots in one workspace', async () => {
      const service = vault();
      await service.store({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
        purpose: SecretPurpose.Trading,
        fields: { ...LIVE_FIELDS },
      });
      await service.store({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
        purpose: SecretPurpose.TradingTestnet,
        fields: { ...TESTNET_FIELDS },
      });

      const live = await service.retrieve({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
        purpose: SecretPurpose.Trading,
      });
      const testnet = await service.retrieve({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
        purpose: SecretPurpose.TradingTestnet,
      });
      expect(live).toEqual(LIVE_FIELDS);
      expect(testnet).toEqual(TESTNET_FIELDS);
      expect(live).not.toEqual(testnet);
    });

    it('TradingTestnet request cannot resolve Trading credential', async () => {
      const service = vault();
      await service.store({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
        purpose: SecretPurpose.Trading,
        fields: { ...LIVE_FIELDS },
      });

      await expect(
        service.retrieve({
          actorWorkspaceId: 'ws-a',
          workspaceId: 'ws-a',
          type: HoldableSecretType.Binance,
          purpose: SecretPurpose.TradingTestnet,
        }),
      ).rejects.toBeInstanceOf(VaultNotStoredError);
    });

    it('Trading request cannot resolve TradingTestnet credential', async () => {
      const service = vault();
      await service.store({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
        purpose: SecretPurpose.TradingTestnet,
        fields: { ...TESTNET_FIELDS },
      });

      await expect(
        service.retrieve({
          actorWorkspaceId: 'ws-a',
          workspaceId: 'ws-a',
          type: HoldableSecretType.Binance,
          purpose: SecretPurpose.Trading,
        }),
      ).rejects.toBeInstanceOf(VaultNotStoredError);
    });
  });

  describe('fail-closed missing credential (AC-06)', () => {
    it('missing exact TradingTestnet credential fails closed with no Trading fallback', async () => {
      const service = vault();
      await service.store({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
        purpose: SecretPurpose.Trading,
        fields: { ...LIVE_FIELDS },
      });

      await expect(
        service.get({
          actorWorkspaceId: 'ws-a',
          workspaceId: 'ws-a',
          type: HoldableSecretType.Binance,
          purpose: SecretPurpose.TradingTestnet,
        }),
      ).resolves.toBeNull();
      await expect(
        service.retrieve({
          actorWorkspaceId: 'ws-a',
          workspaceId: 'ws-a',
          type: HoldableSecretType.Binance,
          purpose: SecretPurpose.TradingTestnet,
        }),
      ).rejects.toBeInstanceOf(VaultNotStoredError);
    });

    it('missing exact Trading credential fails closed with no TradingTestnet fallback', async () => {
      const service = vault();
      await service.store({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
        purpose: SecretPurpose.TradingTestnet,
        fields: { ...TESTNET_FIELDS },
      });

      await expect(
        service.retrieve({
          actorWorkspaceId: 'ws-a',
          workspaceId: 'ws-a',
          type: HoldableSecretType.Binance,
          purpose: SecretPurpose.Trading,
        }),
      ).rejects.toBeInstanceOf(VaultNotStoredError);
    });
  });

  describe('workspace isolation (AC-05)', () => {
    it('same workspace Trading and TradingTestnet succeed; cross-workspace fails', async () => {
      const service = vault();
      await service.store({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
        purpose: SecretPurpose.Trading,
        fields: { ...LIVE_FIELDS },
      });
      await service.store({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
        purpose: SecretPurpose.TradingTestnet,
        fields: { ...TESTNET_FIELDS },
      });
      await service.store({
        actorWorkspaceId: 'ws-b',
        workspaceId: 'ws-b',
        type: HoldableSecretType.Binance,
        purpose: SecretPurpose.Trading,
        fields: {
          apiKey: 'placeholder-ws-b-live-api-key',
          apiSecret: 'placeholder-ws-b-live-api-secret',
        },
      });
      await service.store({
        actorWorkspaceId: 'ws-b',
        workspaceId: 'ws-b',
        type: HoldableSecretType.Binance,
        purpose: SecretPurpose.TradingTestnet,
        fields: {
          apiKey: 'placeholder-ws-b-testnet-api-key',
          apiSecret: 'placeholder-ws-b-testnet-api-secret',
        },
      });

      await expect(
        service.retrieve({
          actorWorkspaceId: 'ws-a',
          workspaceId: 'ws-a',
          type: HoldableSecretType.Binance,
          purpose: SecretPurpose.Trading,
        }),
      ).resolves.toEqual(LIVE_FIELDS);
      await expect(
        service.retrieve({
          actorWorkspaceId: 'ws-a',
          workspaceId: 'ws-a',
          type: HoldableSecretType.Binance,
          purpose: SecretPurpose.TradingTestnet,
        }),
      ).resolves.toEqual(TESTNET_FIELDS);

      await expect(
        service.retrieve({
          actorWorkspaceId: 'ws-a',
          workspaceId: 'ws-b',
          type: HoldableSecretType.Binance,
          purpose: SecretPurpose.Trading,
        }),
      ).rejects.toBeInstanceOf(VaultIsolationError);
      await expect(
        service.retrieve({
          actorWorkspaceId: 'ws-a',
          workspaceId: 'ws-b',
          type: HoldableSecretType.Binance,
          purpose: SecretPurpose.TradingTestnet,
        }),
      ).rejects.toBeInstanceOf(VaultIsolationError);
    });
  });

  describe('secret non-exposure (AC-08)', () => {
    it('metadata and errors never echo placeholder secret field values', async () => {
      const service = vault();
      const stored = await service.store({
        actorWorkspaceId: 'ws-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Binance,
        purpose: SecretPurpose.TradingTestnet,
        fields: { ...TESTNET_FIELDS },
      });

      expect(metadataContainsSecretFields(stored.metadata)).toBe(false);
      expect(JSON.stringify(stored.metadata)).not.toContain(TESTNET_FIELDS.apiKey);
      expect(JSON.stringify(stored.metadata)).not.toContain(TESTNET_FIELDS.apiSecret);

      try {
        await service.retrieve({
          actorWorkspaceId: 'ws-a',
          workspaceId: 'ws-a',
          type: HoldableSecretType.Binance,
          purpose: SecretPurpose.Trading,
        });
        expect.unreachable('expected fail-closed retrieve');
      } catch (error) {
        expect(error).toBeInstanceOf(VaultNotStoredError);
        expect(String(error)).not.toContain(TESTNET_FIELDS.apiKey);
        expect(String(error)).not.toContain(TESTNET_FIELDS.apiSecret);
        expect(String(error)).not.toContain(LIVE_FIELDS.apiKey);
      }
    });
  });
});
