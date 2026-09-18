/**
 * FIV-CONN-04-B-01 — Migration Gate Contract unit/contract tests.
 * Pure contract only — no Nest, Prisma, Vault, or external I/O.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  MIGRATION_GATE_AUDIT_EVENT_TYPE,
  MIGRATION_GATE_AUDIT_OUTCOMES,
  MIGRATION_GATE_KEY_FIV_CONN_04,
  MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS,
  MIGRATION_GATE_NO_SOFT_REACQUIRE,
  MIGRATION_GATE_OBSERVATIONS,
  MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
  assertAcquireInput,
  assertHeartbeatCeiling,
  assertMaxWindow,
  assertPrivilegedEnvironmentUpdateAllowed,
  classifyConnectionMutation,
  classifyGrantShape,
  computeAuthorizedUntilIso,
  contentionDeniedResult,
  isDenySetBlocked,
  isPrivilegedActorContext,
  observationToDenySetDecision,
  sanitizeMigrationGateAuditPayload,
  shouldBlockDenySetMutation,
  validateGrantAgainstClaims,
  type MigrationGateGrant,
} from './migration-gate';
import { MIGRATION_GATE_PORT, type MigrationGatePort } from './migration-gate.port';

const __dirname = dirname(fileURLToPath(import.meta.url));

const NOW = Date.parse('2026-09-18T12:00:00.000Z');
const ACQUIRED = '2026-09-18T10:00:00.000Z';
const EXPIRES = '2026-09-18T13:00:00.000Z'; // 3h TTL within 4h window from 10:00

function validGrant(overrides: Partial<MigrationGateGrant> = {}): MigrationGateGrant {
  return Object.freeze({
    gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
    purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
    holderId: 'job-1',
    fenceGeneration: 7,
    acquiredAt: ACQUIRED,
    expiresAt: EXPIRES,
    authorizedWindowMs: MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS,
    correlationId: 'corr-1',
    ...overrides,
  });
}

describe('FIV-CONN-04-B-01 Migration Gate Contract', () => {
  describe('identity and purpose', () => {
    it('1. GateKey = FIV-CONN-04', () => {
      expect(MIGRATION_GATE_KEY_FIV_CONN_04).toBe('FIV-CONN-04');
    });

    it('2. GatePurpose = FIV_CONN_04_MIGRATION_BACKFILL', () => {
      expect(MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL).toBe(
        'FIV_CONN_04_MIGRATION_BACKFILL',
      );
    });

    it('3. Global identity is not workspace/provider/connection scoped', () => {
      const grant = validGrant();
      expect(grant).not.toHaveProperty('workspaceId');
      expect(grant).not.toHaveProperty('provider');
      expect(grant).not.toHaveProperty('connectionId');
      expect(grant.gateKey).toBe('FIV-CONN-04');
    });
  });

  describe('state model', () => {
    it('4. State model contains approved observations', () => {
      expect([...MIGRATION_GATE_OBSERVATIONS]).toEqual([
        'INACTIVE',
        'ACTIVE',
        'EXPIRED',
        'OWNERSHIP_LOST',
        'CONTENTION_DENIED',
        'UNKNOWN',
      ]);
    });

    it('5. UNKNOWN => DENY for deny-set', () => {
      expect(isDenySetBlocked('UNKNOWN')).toBe(true);
      const decision = observationToDenySetDecision('UNKNOWN');
      expect(decision.ok).toBe(false);
      if (!decision.ok) {
        expect(decision.reason).toBe('GATE_UNKNOWN');
        expect(decision.observation).toBe('UNKNOWN');
      }
    });

    it('6. Missing state => UNKNOWN/DENY', () => {
      const missing = observationToDenySetDecision(null);
      expect(missing.ok).toBe(false);
      if (!missing.ok) {
        expect(missing.reason).toBe('GATE_UNKNOWN');
        expect(missing.observation).toBe('UNKNOWN');
      }
      const undef = observationToDenySetDecision(undefined);
      expect(undef.ok).toBe(false);
    });

    it('ACTIVE blocks deny-set; INACTIVE does not', () => {
      expect(isDenySetBlocked('ACTIVE')).toBe(true);
      expect(isDenySetBlocked('INACTIVE')).toBe(false);
      expect(observationToDenySetDecision('INACTIVE')).toEqual({
        ok: true,
        value: 'allow',
      });
      expect(observationToDenySetDecision('ACTIVE')).toEqual({
        ok: true,
        value: 'deny',
      });
    });
  });

  describe('grant shape and validation', () => {
    it('7. Malformed authority => DENY', () => {
      expect(classifyGrantShape(null).ok).toBe(false);
      expect(classifyGrantShape({}).ok).toBe(false);
      expect(classifyGrantShape(validGrant({ holderId: '' })).ok).toBe(false);
      expect(classifyGrantShape(validGrant({ fenceGeneration: -1 })).ok).toBe(false);
      expect(classifyGrantShape(validGrant({ acquiredAt: 'not-a-date' })).ok).toBe(false);
    });

    it('8. Wrong gateKey => DENY', () => {
      const result = classifyGrantShape({
        ...validGrant(),
        gateKey: 'OTHER-GATE',
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('GATE_KEY_MISMATCH');
    });

    it('9. Wrong purpose => DENY', () => {
      const result = classifyGrantShape({
        ...validGrant(),
        purpose: 'GENERIC_MAINTENANCE',
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('GATE_PURPOSE_MISMATCH');
    });

    it('10. Owner mismatch => DENY', () => {
      const result = validateGrantAgainstClaims({
        grant: validGrant(),
        expectedHolderId: 'other-job',
        expectedFenceGeneration: 7,
        observation: 'ACTIVE',
        nowMs: NOW,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe('GATE_OWNERSHIP_LOST');
        expect(result.observation).toBe('OWNERSHIP_LOST');
      }
    });

    it('11. Fencing mismatch => DENY', () => {
      const result = validateGrantAgainstClaims({
        grant: validGrant(),
        expectedHolderId: 'job-1',
        expectedFenceGeneration: 99,
        observation: 'ACTIVE',
        nowMs: NOW,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe('GATE_FENCE_MISMATCH');
      }
    });

    it('12. Expired grant => DENY', () => {
      const result = validateGrantAgainstClaims({
        grant: validGrant({
          expiresAt: '2026-09-18T11:00:00.000Z',
        }),
        expectedHolderId: 'job-1',
        expectedFenceGeneration: 7,
        observation: 'ACTIVE',
        nowMs: NOW,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('GATE_EXPIRED');
    });

    it('rejects fencingToken field on grant', () => {
      const result = classifyGrantShape({
        ...validGrant(),
        fencingToken: 'secret-token-value',
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('GATE_MALFORMED_GRANT');
    });

    it('valid grant shape passes and derives authorizedUntil', () => {
      const shaped = classifyGrantShape(validGrant());
      expect(shaped.ok).toBe(true);
      const until = computeAuthorizedUntilIso(validGrant());
      expect(until).toBe('2026-09-18T14:00:00.000Z');
    });
  });

  describe('contention / acquire contract', () => {
    it('13. Contention => immediate deterministic rejection', () => {
      const denied = contentionDeniedResult();
      expect(denied).toEqual({
        ok: false,
        reason: 'GATE_CONTENTION',
        observation: 'CONTENTION_DENIED',
      });
    });

    it('14. No soft re-acquire', () => {
      expect(MIGRATION_GATE_NO_SOFT_REACQUIRE).toBe(true);
    });

    it('acquire requires privileged actor and correct purpose', () => {
      expect(
        assertAcquireInput({
          purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
          actor: { actorId: 'op-1', actorKind: 'OPERATOR' },
        }).ok,
      ).toBe(true);
      expect(
        assertAcquireInput({
          purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
          actor: { actorId: '', actorKind: 'OPERATOR' },
        }).ok,
      ).toBe(false);
      expect(
        assertAcquireInput({
          purpose: 'OTHER',
          actor: { actorId: 'op-1', actorKind: 'SYSTEM_JOB' },
        }).ok,
      ).toBe(false);
      expect(isPrivilegedActorContext({ actorId: 'x', actorKind: 'CLIENT' })).toBe(false);
    });
  });

  describe('time / window helpers', () => {
    it('15. authorizedWindowMs <= 4h', () => {
      expect(MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS).toBe(4 * 60 * 60 * 1000);
      expect(
        assertMaxWindow({
          acquiredAt: ACQUIRED,
          expiresAt: EXPIRES,
          authorizedWindowMs: MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS + 1,
        }).ok,
      ).toBe(false);
      expect(
        classifyGrantShape(
          validGrant({ authorizedWindowMs: MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS + 1 }),
        ).ok,
      ).toBe(false);
    });

    it('16. heartbeat ceiling validation', () => {
      const grant = validGrant();
      const okBeat = assertHeartbeatCeiling({
        grant,
        proposedExpiresAt: '2026-09-18T13:30:00.000Z',
        nowMs: NOW,
      });
      expect(okBeat.ok).toBe(true);

      const overCeiling = assertHeartbeatCeiling({
        grant,
        proposedExpiresAt: '2026-09-18T15:00:00.000Z', // beyond 14:00
        nowMs: NOW,
      });
      expect(overCeiling.ok).toBe(false);
      if (!overCeiling.ok) expect(overCeiling.reason).toBe('GATE_MAX_WINDOW_EXCEEDED');

      const expiredGrant = validGrant({ expiresAt: '2026-09-18T11:00:00.000Z' });
      const resurrect = assertHeartbeatCeiling({
        grant: expiredGrant,
        proposedExpiresAt: '2026-09-18T13:00:00.000Z',
        nowMs: NOW,
      });
      expect(resurrect.ok).toBe(false);
      if (!resurrect.ok) expect(resurrect.reason).toBe('GATE_EXPIRED');
    });
  });

  describe('operation classification', () => {
    it('17. operation deny-set', () => {
      expect(classifyConnectionMutation({ method: 'storeCredentials' })).toEqual({
        kind: 'deny',
        operation: 'CREDENTIAL_STORE',
      });
      expect(classifyConnectionMutation({ method: 'replaceCredentials' })).toEqual({
        kind: 'deny',
        operation: 'CREDENTIAL_REPLACE',
      });
      expect(classifyConnectionMutation({ method: 'revoke' })).toEqual({
        kind: 'deny',
        operation: 'CREDENTIAL_REVOKE',
      });
      expect(classifyConnectionMutation({ method: 'create', connectionType: 'EXCHANGE' })).toEqual({
        kind: 'deny',
        operation: 'EXCHANGE_CREATE',
      });
    });

    it('18. operation allow-set', () => {
      expect(classifyConnectionMutation({ method: 'rename' })).toEqual({
        kind: 'allow',
        operation: 'RENAME',
      });
      expect(classifyConnectionMutation({ method: 'disconnect' })).toEqual({
        kind: 'allow',
        operation: 'DISCONNECT',
      });
      expect(classifyConnectionMutation({ method: 'disable' })).toEqual({
        kind: 'allow',
        operation: 'DISABLE',
      });
      expect(classifyConnectionMutation({ method: 'create', connectionType: 'WEBHOOK' })).toEqual({
        kind: 'allow',
        operation: 'NON_EXCHANGE_CREATE',
      });
      expect(classifyConnectionMutation({ method: 'list' })).toEqual({
        kind: 'allow',
        operation: 'READ',
      });
      expect(classifyConnectionMutation({ method: 'validate' })).toEqual({
        kind: 'allow',
        operation: 'VALIDATE',
      });
    });

    it('UNKNOWN blocks deny-set mutations; never ALLOW', () => {
      const store = classifyConnectionMutation({ method: 'storeCredentials' });
      const blocked = shouldBlockDenySetMutation('UNKNOWN', store);
      expect(blocked.ok).toBe(false);
      if (!blocked.ok) expect(blocked.reason).toBe('GATE_UNKNOWN');

      const rename = classifyConnectionMutation({ method: 'rename' });
      expect(shouldBlockDenySetMutation('UNKNOWN', rename)).toEqual({
        ok: true,
        value: 'pass',
      });
    });

    it('19. privileged environment-update contract', () => {
      expect(classifyConnectionMutation({ method: 'privilegedEnvironmentUpdate' })).toEqual({
        kind: 'privileged',
        operation: 'PRIVILEGED_ENVIRONMENT_UPDATE',
      });
      const allowed = assertPrivilegedEnvironmentUpdateAllowed({
        observation: 'ACTIVE',
        grant: validGrant(),
        expectedHolderId: 'job-1',
        expectedFenceGeneration: 7,
        nowMs: NOW,
      });
      expect(allowed.ok).toBe(true);

      const deniedUnknown = assertPrivilegedEnvironmentUpdateAllowed({
        observation: 'UNKNOWN',
        grant: validGrant(),
        expectedHolderId: 'job-1',
        expectedFenceGeneration: 7,
        nowMs: NOW,
      });
      expect(deniedUnknown.ok).toBe(false);
      if (!deniedUnknown.ok) expect(deniedUnknown.reason).toBe('GATE_UNKNOWN');
    });

    it('20. public environment-update remains denied', () => {
      expect(classifyConnectionMutation({ method: 'updateEnvironment' })).toEqual({
        kind: 'deny_public_environment_update',
      });
      const block = shouldBlockDenySetMutation(
        'INACTIVE',
        classifyConnectionMutation({ method: 'updateEnvironment' }),
      );
      expect(block).toEqual({ ok: true, value: 'block' });
    });
  });

  describe('client authority boundaries', () => {
    it('21. no client-authoritative fencing without expected fence match', () => {
      const clientClaim = validGrant({ fenceGeneration: 1 });
      const result = validateGrantAgainstClaims({
        grant: clientClaim,
        expectedHolderId: 'job-1',
        expectedFenceGeneration: 7,
        observation: 'ACTIVE',
        nowMs: NOW,
      });
      expect(result.ok).toBe(false);
    });

    it('22. no client-authoritative gate state — UNKNOWN observation denies', () => {
      const result = validateGrantAgainstClaims({
        grant: validGrant(),
        observation: 'UNKNOWN',
        nowMs: NOW,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.observation).toBe('UNKNOWN');
    });
  });

  describe('Model C / Strategy B / audit / isolation', () => {
    it('23–24. Model C and Strategy B not modified (no Vault/env inference in contract)', () => {
      const src = readFileSync(join(__dirname, 'migration-gate.ts'), 'utf8');
      expect(src).not.toMatch(/SecretPurpose|secret-vault|tradingEnvironmentFromPurpose/);
      expect(src).not.toMatch(/workspaceId\s*\+\s*provider\s*\+\s*environment/);
      expect(src).not.toMatch(/prisma|PrismaClient|@prisma/i);
      expect(src).not.toMatch(/fetch\(|axios|binance|testnet/i);
    });

    it('25. audit classification contains no secret/token payload', () => {
      expect(MIGRATION_GATE_AUDIT_EVENT_TYPE).toBe('connection.migration-gate');
      expect(MIGRATION_GATE_AUDIT_OUTCOMES).toContain('gate_acquired');
      expect(MIGRATION_GATE_AUDIT_OUTCOMES).toContain('gate_stale_reclaim');

      const bad = sanitizeMigrationGateAuditPayload({
        fencingToken: 'abc',
        gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
      });
      expect(bad.ok).toBe(false);

      const tokenKey = sanitizeMigrationGateAuditPayload({
        token: 'x',
        fenceGeneration: 1,
      });
      expect(tokenKey.ok).toBe(false);

      const good = sanitizeMigrationGateAuditPayload({
        gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
        fenceGeneration: 7,
        purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
        holderId: 'job-1',
        secret: 'should-be-rejected-by-key',
      });
      expect(good.ok).toBe(false);

      const clean = sanitizeMigrationGateAuditPayload({
        gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
        fenceGeneration: 7,
        purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
        holderId: 'job-1',
      });
      expect(clean.ok).toBe(true);
      if (clean.ok) {
        expect(clean.value).not.toHaveProperty('fencingToken');
        expect(clean.value.fenceGeneration).toBe(7);
      }
    });

    it('26. B-01 contract has no DB/Vault/external dependencies', () => {
      const portSrc = readFileSync(join(__dirname, 'migration-gate.port.ts'), 'utf8');
      const gateSrc = readFileSync(join(__dirname, 'migration-gate.ts'), 'utf8');
      // Import graph only — comments may name forbidden systems as non-scope.
      expect(portSrc).not.toMatch(/^import\s+.*(?:prisma|@nestjs|secret-vault|axios|node-fetch)/im);
      expect(gateSrc).not.toMatch(/^import\s+.*(?:prisma|@nestjs|secret-vault|axios|node-fetch)/im);
      expect(typeof MIGRATION_GATE_PORT).toBe('symbol');

      // Port is a type-only contract; compile-time shape check via assignability.
      const _shapeCheck: MigrationGatePort = {
        acquire: async () => contentionDeniedResult(),
        release: async () => ({
          ok: false,
          reason: 'GATE_OWNERSHIP_LOST',
          observation: 'OWNERSHIP_LOST',
        }),
        heartbeat: async () => ({
          ok: false,
          reason: 'GATE_EXPIRED',
          observation: 'EXPIRED',
        }),
        observe: async () => ({
          ok: false,
          reason: 'GATE_UNKNOWN',
          observation: 'UNKNOWN',
        }),
        validate: async () => ({
          ok: false,
          reason: 'GATE_UNKNOWN',
          observation: 'UNKNOWN',
        }),
      };
      expect(_shapeCheck).toBeDefined();
    });
  });
});
