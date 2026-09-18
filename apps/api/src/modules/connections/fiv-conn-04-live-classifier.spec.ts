/**
 * FIV-CONN-04-C — Pure LIVE classifier facade tests (read-only; no Nest / no I/O).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SecretPurpose } from '../secret-vault/secret-purpose';
import { SecretState } from '../secret-vault/secret-state';
import {
  classifyFivConn04LiveConnection,
  isFivConn04EligibleLive,
  isFivConn04LiveVaultStateConnected,
  mapFivConn04AReasonToLiveDisposition,
  type FivConn04LiveConnectionInput,
  type FivConn04LiveSlotOccupancy,
  type FivConn04LiveVaultMetaInput,
} from './fiv-conn-04-live-classifier';

const WS = 'ws-c';
const OTHER_WS = 'ws-other';

const VACANT: FivConn04LiveSlotOccupancy = Object.freeze({ status: 'verified_vacant' });
const UNAVAILABLE: FivConn04LiveSlotOccupancy = Object.freeze({ status: 'unavailable' });

function exchangeNull(
  overrides: Partial<FivConn04LiveConnectionInput> = {},
): FivConn04LiveConnectionInput {
  return {
    id: 'conn-1',
    workspaceId: WS,
    provider: 'BINANCE',
    connectionType: 'EXCHANGE',
    environment: null,
    vaultSecretId: 'vault-1',
    status: 'DISCONNECTED',
    ...overrides,
  };
}

function liveMeta(
  overrides: Partial<FivConn04LiveVaultMetaInput> = {},
): FivConn04LiveVaultMetaInput {
  return {
    id: 'vault-1',
    workspaceId: WS,
    purpose: SecretPurpose.Trading,
    state: SecretState.Connected,
    ...overrides,
  };
}

describe('FIV-CONN-04-C live classifier (Option D facade)', () => {
  describe('POSITIVE — ELIGIBLE_LIVE', () => {
    it('1–9. EXCHANGE + NULL + exact Vault + Trading + Connected + vacant → ELIGIBLE_LIVE', () => {
      const row = classifyFivConn04LiveConnection(
        exchangeNull(),
        liveMeta({ purpose: SecretPurpose.Trading }),
        VACANT,
      );
      expect(row.disposition).toBe('ELIGIBLE_LIVE');
      expect(row.eligibleLive).toBe(true);
      expect(isFivConn04EligibleLive(row)).toBe(true);
      expect(row.vaultState).toBe(SecretState.Connected);
      expect(row.occupancyStatus).toBe('verified_vacant');
      expect(row.reasonCodeA).toBe('ELIGIBLE_LIVE');
    });

    it('5b. TradingLive + Connected + vacant → ELIGIBLE_LIVE', () => {
      const row = classifyFivConn04LiveConnection(
        exchangeNull(),
        liveMeta({ purpose: SecretPurpose.TradingLive }),
        VACANT,
      );
      expect(row.disposition).toBe('ELIGIBLE_LIVE');
      expect(row.eligibleLive).toBe(true);
    });
  });

  describe('VAULT NEGATIVE', () => {
    it('10. missing Vault metadata → never ELIGIBLE_LIVE', () => {
      const row = classifyFivConn04LiveConnection(exchangeNull(), null, VACANT);
      expect(row.disposition).toBe('BLOCKED_DANGLING_CREDENTIAL');
      expect(row.eligibleLive).toBe(false);
    });

    it('11. wrong Vault ID → never ELIGIBLE_LIVE', () => {
      const row = classifyFivConn04LiveConnection(
        exchangeNull({ vaultSecretId: 'vault-1' }),
        liveMeta({ id: 'sibling-vault-2' }),
        VACANT,
      );
      expect(row.disposition).toBe('BLOCKED_DANGLING_CREDENTIAL');
      expect(row.eligibleLive).toBe(false);
    });

    it('12. workspace mismatch → never ELIGIBLE_LIVE', () => {
      const row = classifyFivConn04LiveConnection(
        exchangeNull(),
        liveMeta({ workspaceId: OTHER_WS }),
        VACANT,
      );
      expect(row.disposition).toBe('BLOCKED_WORKSPACE_MISMATCH');
      expect(row.eligibleLive).toBe(false);
    });

    it('13. invalid purpose → never ELIGIBLE_LIVE', () => {
      const row = classifyFivConn04LiveConnection(
        exchangeNull(),
        liveMeta({ purpose: 'not-a-purpose' }),
        VACANT,
      );
      expect(row.disposition).toBe('BLOCKED_REVOKED_OR_INVALID');
      expect(row.eligibleLive).toBe(false);
    });

    it('14. Created state never produces ELIGIBLE_LIVE', () => {
      const row = classifyFivConn04LiveConnection(
        exchangeNull(),
        liveMeta({ state: SecretState.Created }),
        VACANT,
      );
      expect(row.disposition).not.toBe('ELIGIBLE_LIVE');
      expect(row.eligibleLive).toBe(false);
      expect(isFivConn04LiveVaultStateConnected(SecretState.Created)).toBe(false);
    });

    it('15. Validated state never produces ELIGIBLE_LIVE', () => {
      const row = classifyFivConn04LiveConnection(
        exchangeNull(),
        liveMeta({ state: SecretState.Validated }),
        VACANT,
      );
      expect(row.disposition).not.toBe('ELIGIBLE_LIVE');
      expect(row.eligibleLive).toBe(false);
      expect(isFivConn04LiveVaultStateConnected(SecretState.Validated)).toBe(false);
    });

    it('16. Deleted state never produces ELIGIBLE_LIVE', () => {
      const row = classifyFivConn04LiveConnection(
        exchangeNull(),
        liveMeta({ state: SecretState.Deleted }),
        VACANT,
      );
      expect(row.disposition).not.toBe('ELIGIBLE_LIVE');
      expect(row.eligibleLive).toBe(false);
      expect(isFivConn04LiveVaultStateConnected(SecretState.Deleted)).toBe(false);
    });

    it('17. Revoked state never produces ELIGIBLE_LIVE', () => {
      const row = classifyFivConn04LiveConnection(
        exchangeNull(),
        liveMeta({ state: SecretState.Revoked }),
        VACANT,
      );
      expect(row.disposition).not.toBe('ELIGIBLE_LIVE');
      expect(row.eligibleLive).toBe(false);
      expect(row.disposition).toBe('BLOCKED_REVOKED_OR_INVALID');
      expect(isFivConn04LiveVaultStateConnected(SecretState.Revoked)).toBe(false);
    });

    it('18. malformed metadata (non-trading purpose enum) → never ELIGIBLE_LIVE', () => {
      const row = classifyFivConn04LiveConnection(
        exchangeNull(),
        liveMeta({ purpose: SecretPurpose.Notification }),
        VACANT,
      );
      expect(row.eligibleLive).toBe(false);
      expect(row.disposition).toBe('BLOCKED_REVOKED_OR_INVALID');
    });

    it('19. contradictory metadata (id + workspace both wrong) → never ELIGIBLE_LIVE', () => {
      const row = classifyFivConn04LiveConnection(
        exchangeNull(),
        liveMeta({ id: 'other', workspaceId: OTHER_WS }),
        VACANT,
      );
      expect(row.eligibleLive).toBe(false);
      expect(row.disposition).toBe('BLOCKED_DANGLING_CREDENTIAL');
    });
  });

  describe('CONNECTION NEGATIVE', () => {
    it('20. NON-EXCHANGE → OUT_OF_SCOPE', () => {
      const row = classifyFivConn04LiveConnection(
        {
          id: 'n1',
          workspaceId: WS,
          provider: 'TELEGRAM',
          connectionType: 'NOTIFICATION',
          environment: null,
          vaultSecretId: null,
          status: 'DISCONNECTED',
        },
        null,
        VACANT,
      );
      expect(row.disposition).toBe('OUT_OF_SCOPE_NON_EXCHANGE');
      expect(row.eligibleLive).toBe(false);
    });

    it('21. populated environment → SKIP (never ELIGIBLE_LIVE)', () => {
      const live = classifyFivConn04LiveConnection(
        exchangeNull({ environment: 'live' }),
        liveMeta(),
        VACANT,
      );
      const testnet = classifyFivConn04LiveConnection(
        exchangeNull({ environment: 'testnet' }),
        liveMeta({ purpose: SecretPurpose.TradingTestnet }),
        VACANT,
      );
      expect(live.disposition).toBe('SKIP_ALREADY_LIVE');
      expect(testnet.disposition).toBe('SKIP_ALREADY_TESTNET');
      expect(live.eligibleLive).toBe(false);
      expect(testnet.eligibleLive).toBe(false);
    });

    it('22. Testnet/Demo purpose → never ELIGIBLE_LIVE', () => {
      const tn = classifyFivConn04LiveConnection(
        exchangeNull(),
        liveMeta({ purpose: SecretPurpose.TradingTestnet }),
        VACANT,
      );
      const demo = classifyFivConn04LiveConnection(
        exchangeNull(),
        liveMeta({ purpose: SecretPurpose.TradingDemo }),
        VACANT,
      );
      expect(tn.disposition).toBe('BLOCKED_PURPOSE_ENV_MISMATCH_FOR_LIVE');
      expect(demo.disposition).toBe('BLOCKED_DEMO_DEFERRED');
      expect(tn.eligibleLive).toBe(false);
      expect(demo.eligibleLive).toBe(false);
    });

    it('23. REVOKED connection → never ELIGIBLE_LIVE', () => {
      const row = classifyFivConn04LiveConnection(
        exchangeNull({ status: 'REVOKED' }),
        liveMeta(),
        VACANT,
      );
      expect(row.disposition).toBe('BLOCKED_REVOKED_OR_INVALID');
      expect(row.eligibleLive).toBe(false);
    });

    it('metadata-only EXCHANGE → BLOCKED_MISSING_CREDENTIAL', () => {
      const row = classifyFivConn04LiveConnection(
        exchangeNull({ vaultSecretId: null }),
        null,
        VACANT,
      );
      expect(row.disposition).toBe('BLOCKED_MISSING_CREDENTIAL');
      expect(row.eligibleLive).toBe(false);
    });
  });

  describe('STRATEGY-B / IMPL-REV-C-01', () => {
    it('24. occupied slot → never ELIGIBLE_LIVE', () => {
      const row = classifyFivConn04LiveConnection(exchangeNull(), liveMeta(), {
        status: 'occupied',
        occupantId: 'other-live',
      });
      expect(row.disposition).toBe('BLOCKED_STRATEGY_B_COLLISION');
      expect(row.eligibleLive).toBe(false);
      expect(row.occupancyStatus).toBe('occupied');
      expect(row.collidingConnectionId).toBe('other-live');
    });

    it('25. verified vacant slot → may be ELIGIBLE_LIVE', () => {
      const row = classifyFivConn04LiveConnection(exchangeNull(), liveMeta(), VACANT);
      expect(row.disposition).toBe('ELIGIBLE_LIVE');
      expect(row.occupancyStatus).toBe('verified_vacant');
    });

    it('26. occupancy unavailable/read failure → FAIL CLOSED (not vacant)', () => {
      const row = classifyFivConn04LiveConnection(exchangeNull(), liveMeta(), UNAVAILABLE);
      expect(row.disposition).toBe('BLOCKED_OCCUPANCY_UNAVAILABLE');
      expect(row.eligibleLive).toBe(false);
      expect(row.occupancyStatus).toBe('unavailable');
      expect(row.reasonCodeA).toBeNull();
      // Must not be treated as verified vacant → ELIGIBLE_LIVE
      expect(row.disposition).not.toBe('ELIGIBLE_LIVE');
    });

    it('IMPL-REV-C-01: unavailable must not equal verified_vacant semantics', () => {
      const vacant = classifyFivConn04LiveConnection(exchangeNull(), liveMeta(), VACANT);
      const unknown = classifyFivConn04LiveConnection(exchangeNull(), liveMeta(), UNAVAILABLE);
      expect(vacant.eligibleLive).toBe(true);
      expect(unknown.eligibleLive).toBe(false);
      expect(unknown.disposition).not.toBe(vacant.disposition);
    });
  });

  describe('DETERMINISM', () => {
    it('27. identical input repeated → identical result', () => {
      const a = classifyFivConn04LiveConnection(exchangeNull(), liveMeta(), VACANT);
      const b = classifyFivConn04LiveConnection(exchangeNull(), liveMeta(), VACANT);
      expect(a).toEqual(b);
    });
  });

  describe('SECURITY / READ-ONLY', () => {
    it('28. no secret payload required/accessed — result has only safe fields', () => {
      const row = classifyFivConn04LiveConnection(exchangeNull(), liveMeta(), VACANT);
      const keys = Object.keys(row);
      expect(keys).not.toContain('ciphertext');
      expect(keys).not.toContain('secret');
      expect(keys).not.toContain('apiKey');
      expect(keys).not.toContain('payload');
      expect(keys).not.toContain('decrypted');
    });

    it('29–31. C module source has no Prisma / Vault service / mutation imports', () => {
      const src = readFileSync(
        join(__dirname, 'fiv-conn-04-live-classifier.ts'),
        'utf8',
      );
      expect(src).not.toMatch(/SecretVaultService/);
      expect(src).not.toMatch(/PrismaService/);
      expect(src).not.toMatch(/prisma\./);
      expect(src).not.toMatch(/\.update\(/);
      expect(src).not.toMatch(/storeCredentials|replaceCredentials|revoke/);
      expect(src).toMatch(/classifyFivConn04AConnection/);
    });

    it('IPR-C-01: only Connected counts as live vault state helper', () => {
      expect(isFivConn04LiveVaultStateConnected(SecretState.Connected)).toBe(true);
      expect(isFivConn04LiveVaultStateConnected(SecretState.Created)).toBe(false);
      expect(isFivConn04LiveVaultStateConnected(SecretState.Validated)).toBe(false);
      expect(isFivConn04LiveVaultStateConnected(SecretState.Deleted)).toBe(false);
      expect(isFivConn04LiveVaultStateConnected(SecretState.Revoked)).toBe(false);
    });

    it('mapping: only A ELIGIBLE_LIVE maps to C ELIGIBLE_LIVE', () => {
      const eligible = classifyFivConn04LiveConnection(exchangeNull(), liveMeta(), VACANT);
      expect(eligible.disposition).toBe('ELIGIBLE_LIVE');
      expect(eligible.reasonCodeA).toBe('ELIGIBLE_LIVE');

      const dangling = classifyFivConn04LiveConnection(exchangeNull(), null, VACANT);
      expect(dangling.disposition).not.toBe('ELIGIBLE_LIVE');
      expect(dangling.reasonCodeA).toBe('DANGLING_VAULT_BINDING');
      expect(
        mapFivConn04AReasonToLiveDisposition({
          classification: 'DEFECTIVE_BINDING',
          reasonCode: 'DANGLING_VAULT_BINDING',
          connectionId: 'c',
          workspaceId: WS,
          provider: 'BINANCE',
          connectionType: 'EXCHANGE',
          currentEnvironment: null,
          vaultSecretId: 'vault-1',
          vaultPurpose: null,
          vaultState: null,
          purposeEnvironmentClass: null,
          strategyBCollision: false,
          collidingConnectionId: null,
        }),
      ).toBe('BLOCKED_DANGLING_CREDENTIAL');
    });
  });
});
