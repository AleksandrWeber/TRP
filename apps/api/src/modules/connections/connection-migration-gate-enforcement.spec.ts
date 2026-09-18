import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import {
  GATE_DENY_PUBLIC_MESSAGE,
  assertDenySetAllowed,
  observeOrUnknown,
} from './connection-migration-gate-enforcement';
import type { MigrationGateObservation } from './migration-gate';

function gateReturning(observation: MigrationGateObservation | 'fail') {
  if (observation === 'fail') {
    return {
      observe: async () => ({
        ok: false as const,
        reason: 'GATE_UNKNOWN' as const,
        observation: 'UNKNOWN' as const,
      }),
    };
  }
  return {
    observe: async () => ({ ok: true as const, observation }),
  };
}

function auditStub() {
  const events: Array<Record<string, unknown>> = [];
  return {
    events,
    record: async (input: Record<string, unknown>) => {
      events.push(input);
    },
  };
}

describe('connection-migration-gate-enforcement (FIV-CONN-04-B-03)', () => {
  it('observeOrUnknown maps observe failure to UNKNOWN', async () => {
    expect(await observeOrUnknown(gateReturning('fail') as never)).toBe('UNKNOWN');
    expect(
      await observeOrUnknown({
        observe: async () => {
          throw new Error('db down');
        },
      } as never),
    ).toBe('UNKNOWN');
  });

  it('ACTIVE denies store with audit and ConflictException; no GATE_ACTIVE reason', async () => {
    const audit = auditStub();
    await expect(
      assertDenySetAllowed({
        migrationGate: gateReturning('ACTIVE') as never,
        audit: audit as never,
        method: 'storeCredentials',
        workspaceId: 'ws-a',
        actorUserId: 'user-a',
        connectionId: 'c-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(audit.events).toHaveLength(1);
    expect(audit.events[0]).toMatchObject({
      outcome: 'lifecycle_mutation_blocked',
      actorId: 'user-a',
      workspaceId: 'ws-a',
      payload: expect.objectContaining({
        observation: 'ACTIVE',
        operation: 'CREDENTIAL_STORE',
        result: 'denied',
      }),
    });
    const payload = audit.events[0]?.payload as Record<string, unknown>;
    expect(payload.reasonCode).toBeUndefined();
    expect(JSON.stringify(audit.events[0])).not.toContain('GATE_ACTIVE');
  });

  for (const observation of [
    'INACTIVE',
    'EXPIRED',
    'OWNERSHIP_LOST',
    'CONTENTION_DENIED',
  ] as const) {
    it(`${observation} allows deny-set (B-01 isDenySetBlocked=false)`, async () => {
      const audit = auditStub();
      await expect(
        assertDenySetAllowed({
          migrationGate: gateReturning(observation) as never,
          audit: audit as never,
          method: 'revoke',
          workspaceId: 'ws-a',
          actorUserId: 'user-a',
          connectionId: 'c-1',
        }),
      ).resolves.toBeUndefined();
      expect(audit.events).toHaveLength(0);
    });
  }

  it('UNKNOWN denies with GATE_UNKNOWN reasonCode', async () => {
    const audit = auditStub();
    await expect(
      assertDenySetAllowed({
        migrationGate: gateReturning('UNKNOWN') as never,
        audit: audit as never,
        method: 'create',
        connectionType: 'EXCHANGE',
        workspaceId: 'ws-a',
        actorUserId: 'user-a',
      }),
    ).rejects.toMatchObject({ message: GATE_DENY_PUBLIC_MESSAGE });
    expect(audit.events[0]).toMatchObject({
      payload: expect.objectContaining({
        observation: 'UNKNOWN',
        reasonCode: 'GATE_UNKNOWN',
        operation: 'EXCHANGE_CREATE',
      }),
    });
  });

  it('audit failure fails closed (does not soft-pass)', async () => {
    const audit = {
      record: vi.fn(async () => {
        throw new Error('audit unavailable');
      }),
    };
    await expect(
      assertDenySetAllowed({
        migrationGate: gateReturning('ACTIVE') as never,
        audit: audit as never,
        method: 'replaceCredentials',
        workspaceId: 'ws-a',
        actorUserId: 'user-a',
        connectionId: 'c-1',
      }),
    ).rejects.toThrow(/audit unavailable/);
  });

  it('allow-classified methods skip gate deny', async () => {
    const audit = auditStub();
    await assertDenySetAllowed({
      migrationGate: gateReturning('ACTIVE') as never,
      audit: audit as never,
      method: 'rename',
      workspaceId: 'ws-a',
      actorUserId: 'user-a',
      connectionId: 'c-1',
    });
    expect(audit.events).toHaveLength(0);
  });
});
