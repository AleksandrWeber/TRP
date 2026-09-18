/**
 * FIV-CONN-04-B-05 / B05-S2 — Secret / sensitive-key leakage regression (TEST-ONLY).
 *
 * Proves AC-B13 / SEC-B06 / ST-B26 / T-18 via:
 *   sanitizeMigrationGateAuditPayload + ConnectionMigrationGateAudit
 * Uses fake sensitive values only (IMPL-COND-B05-03). fenceGeneration is NOT a secret.
 */

import { describe, expect, it, vi } from 'vitest';
import { ConnectionMigrationGateAudit } from './connection-migration-gate-audit';
import {
  MIGRATION_GATE_AUDIT_EVENT_TYPE,
  MIGRATION_GATE_KEY_FIV_CONN_04,
  MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
  sanitizeMigrationGateAuditPayload,
} from './migration-gate';

/** Representative fake values — never real credentials (IMPL-COND-B05-03). */
const FAKE = Object.freeze({
  apiKey: 'FAKE_API_KEY_FOR_TEST_ONLY_0001',
  apiSecret: 'FAKE_API_SECRET_FOR_TEST_ONLY_0002',
  accessToken: 'FAKE_ACCESS_TOKEN_FOR_TEST_ONLY_0003',
  bearerToken: 'Bearer FAKE_BEARER_TOKEN_FOR_TEST_ONLY',
  password: 'FAKE_PASSWORD_FOR_TEST_ONLY',
  credential: 'FAKE_CREDENTIAL_BLOB_FOR_TEST_ONLY',
  vaultWrapping: 'FAKE_VAULT_WRAPPING_TOKEN_FOR_TEST_ONLY',
  vaultSecret: 'FAKE_VAULT_SECRET_MATERIAL_FOR_TEST_ONLY',
});

describe('FIV-CONN-04-B-05 B05-S2 secret / sensitive-key leakage', () => {
  describe('sanitizeMigrationGateAuditPayload (B05-AC08 / AC09)', () => {
    it('allows fenceGeneration and other safe metadata (fenceGeneration is not a secret)', () => {
      const result = sanitizeMigrationGateAuditPayload({
        gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
        purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
        fenceGeneration: 7,
        holderId: 'holder-safe',
        workspaceId: 'ws-safe',
        outcome: 'gate_acquired',
        result: 'acquired',
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.fenceGeneration).toBe(7);
      expect(result.value.gateKey).toBe(MIGRATION_GATE_KEY_FIV_CONN_04);
      expect(result.value).not.toHaveProperty('fencingToken');
      expect(JSON.stringify(result.value)).not.toMatch(/FAKE_/);
    });

    it.each([
      ['fencingToken', 1],
      ['password', FAKE.password],
      ['passwd', FAKE.password],
      ['token', FAKE.accessToken],
      ['accessToken', FAKE.accessToken],
      ['hash', 'FAKE_HASH'],
      ['secret', FAKE.apiSecret],
      ['apiSecret', FAKE.apiSecret],
      ['cookie', 'FAKE_COOKIE'],
      ['authorization', FAKE.bearerToken],
      ['credential', FAKE.credential],
      ['wrapping', FAKE.vaultWrapping],
      ['vaultSecret', FAKE.vaultSecret],
    ] as const)('rejects forbidden sensitive key %s before persist', (key, value) => {
      const result = sanitizeMigrationGateAuditPayload({
        gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
        fenceGeneration: 1,
        [key]: value,
      } as Record<string, unknown>);
      expect(result.ok).toBe(false);
    });

    it('drops non-allowlisted apiKey-style keys without persisting their values', () => {
      // Canonical sanitizer: unknown keys are dropped; forbidden-regex keys are rejected.
      // apiKey does not match FORBIDDEN_AUDIT_KEY, so it must be stripped, not stored.
      const result = sanitizeMigrationGateAuditPayload({
        gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
        fenceGeneration: 3,
        apiKey: FAKE.apiKey,
      } as Record<string, unknown>);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).not.toHaveProperty('apiKey');
      expect(JSON.stringify(result.value)).not.toContain(FAKE.apiKey);
      expect(result.value.fenceGeneration).toBe(3);
    });
  });

  describe('ConnectionMigrationGateAudit reject path (IMPL-COND-B05-03)', () => {
    it('does not call SecurityAuditService.record when fencingToken is present', async () => {
      const record = vi.fn(async () => ({ id: 'should-not-run' }));
      const audit = new ConnectionMigrationGateAudit({ record } as never);
      await expect(
        audit.record({
          outcome: 'gate_acquired',
          actorId: 'op-1',
          payload: {
            gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
            fencingToken: FAKE.accessToken,
          } as never,
        }),
      ).rejects.toThrow(/payload rejected/);
      expect(record).not.toHaveBeenCalled();
    });

    it.each([
      ['secret', FAKE.apiSecret],
      ['authorization', FAKE.bearerToken],
      ['wrapping', FAKE.vaultWrapping],
      ['credential', FAKE.credential],
      ['password', FAKE.password],
    ] as const)('does not call record when payload contains %s', async (key, value) => {
      const record = vi.fn(async () => ({ id: 'should-not-run' }));
      const audit = new ConnectionMigrationGateAudit({ record } as never);
      await expect(
        audit.record({
          outcome: 'lifecycle_mutation_blocked',
          actorId: 'user-1',
          workspaceId: 'ws-1',
          payload: {
            gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
            operation: 'CREDENTIAL_STORE',
            [key]: value,
          } as never,
        }),
      ).rejects.toThrow(/payload rejected/);
      expect(record).not.toHaveBeenCalled();
    });

    it('safe allow path retains fenceGeneration and omits forbidden keys/values', async () => {
      const record = vi.fn(async () => ({ id: 'ok' }));
      const audit = new ConnectionMigrationGateAudit({ record } as never);
      await audit.record({
        outcome: 'gate_acquired',
        actorId: 'op-safe',
        payload: {
          gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
          purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
          fenceGeneration: 9,
          holderId: 'holder-9',
          outcome: 'gate_acquired',
          result: 'acquired',
          // non-allowlisted unknown keys are dropped (not rejected)
          unrelatedNoise: FAKE.apiKey,
        },
      });
      expect(record).toHaveBeenCalledTimes(1);
      const [event] = record.mock.calls[0] ?? [];
      expect(event).toEqual(
        expect.objectContaining({
          eventType: MIGRATION_GATE_AUDIT_EVENT_TYPE,
          outcome: 'gate_acquired',
          payload: expect.objectContaining({
            fenceGeneration: 9,
            gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
            holderId: 'holder-9',
          }),
        }),
      );
      const payload = event.payload as Record<string, unknown>;
      expect(payload).not.toHaveProperty('fencingToken');
      expect(payload).not.toHaveProperty('unrelatedNoise');
      expect(payload).not.toHaveProperty('secret');
      expect(payload).not.toHaveProperty('apiKey');
      expect(JSON.stringify(payload)).not.toContain(FAKE.apiKey);
      expect(JSON.stringify(payload)).not.toContain(FAKE.accessToken);
    });
  });
});
