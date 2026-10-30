/**
 * FIV-CONN-04-D / P-D-02 — Canonical SYSTEM_JOB identity tests.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  FIV_CONN_04_D_SYSTEM_JOB_ACTOR_ID,
  FIV_CONN_04_D_SYSTEM_JOB_ACTOR_KIND,
  FivConn04DSystemJobIdentityError,
  assertCanonicalFivConn04DSystemJobActor,
  buildFivConn04DSystemJobActor,
} from './fiv-conn-04-d-system-job-identity';

const RATIFIED_ACTOR_ID = 'system-job:fiv-conn-04-migration-backfill';

describe('FIV-CONN-04-D P-D-02 system-job identity', () => {
  it('defines the exact ratified actorId character-for-character', () => {
    expect(FIV_CONN_04_D_SYSTEM_JOB_ACTOR_ID).toBe(RATIFIED_ACTOR_ID);
    expect(FIV_CONN_04_D_SYSTEM_JOB_ACTOR_ID).toHaveLength(RATIFIED_ACTOR_ID.length);
  });

  it('defines exact actorKind SYSTEM_JOB', () => {
    expect(FIV_CONN_04_D_SYSTEM_JOB_ACTOR_KIND).toBe('SYSTEM_JOB');
  });

  it('factory returns stable canonical identity across calls', () => {
    const a = buildFivConn04DSystemJobActor();
    const b = buildFivConn04DSystemJobActor();
    expect(a.actorId).toBe(RATIFIED_ACTOR_ID);
    expect(a.actorKind).toBe('SYSTEM_JOB');
    expect(b.actorId).toBe(a.actorId);
    expect(b.actorKind).toBe(a.actorKind);
  });

  it('factory preserves optional correlationId only', () => {
    const actor = buildFivConn04DSystemJobActor({ correlationId: 'corr-pd02' });
    expect(actor).toEqual({
      actorId: RATIFIED_ACTOR_ID,
      actorKind: 'SYSTEM_JOB',
      correlationId: 'corr-pd02',
    });
  });

  it('factory does not accept actorId / actorKind parameters (signature surface)', () => {
    expect(buildFivConn04DSystemJobActor.length).toBeLessThanOrEqual(1);
    const src = readFileSync(join(__dirname, 'fiv-conn-04-d-system-job-identity.ts'), 'utf8');
    expect(src).not.toMatch(/buildFivConn04DSystemJobActor\([^)]*actorId/);
    expect(src).not.toMatch(/buildFivConn04DSystemJobActor\([^)]*actorKind/);
    expect(src).not.toMatch(/process\.env/);
    expect(src).not.toMatch(/prisma|findUnique|SELECT/i);
  });

  it('assert fails closed on blank actorId', () => {
    expect(() =>
      assertCanonicalFivConn04DSystemJobActor({
        actorId: '',
        actorKind: 'SYSTEM_JOB',
      }),
    ).toThrow(FivConn04DSystemJobIdentityError);
  });

  it('assert fails closed on mismatched actorId', () => {
    expect(() =>
      assertCanonicalFivConn04DSystemJobActor({
        actorId: 'system-job:other',
        actorKind: 'SYSTEM_JOB',
      }),
    ).toThrow(FivConn04DSystemJobIdentityError);
  });

  it('assert fails closed on OPERATOR / user / Trading Runtime / domain-local kinds', () => {
    expect(() =>
      assertCanonicalFivConn04DSystemJobActor({
        actorId: RATIFIED_ACTOR_ID,
        actorKind: 'OPERATOR',
      }),
    ).toThrow(FivConn04DSystemJobIdentityError);

    expect(() =>
      assertCanonicalFivConn04DSystemJobActor({
        actorId: 'user-1',
        actorKind: 'CLIENT' as never,
      }),
    ).toThrow();

    expect(() =>
      assertCanonicalFivConn04DSystemJobActor({
        actorId: 'trading-runtime:default',
        actorKind: 'SYSTEM_JOB',
      }),
    ).toThrow(FivConn04DSystemJobIdentityError);
  });

  it('assert accepts only the exact ratified context', () => {
    expect(() =>
      assertCanonicalFivConn04DSystemJobActor({
        actorId: RATIFIED_ACTOR_ID,
        actorKind: 'SYSTEM_JOB',
      }),
    ).not.toThrow();
  });

  it('production identity literal appears in exactly one connections production .ts file', () => {
    const dir = __dirname;
    const productionHits: string[] = [];
    for (const name of readdirSync(dir)) {
      if (!name.endsWith('.ts')) continue;
      if (name.endsWith('.spec.ts')) continue;
      const src = readFileSync(join(dir, name), 'utf8');
      if (src.includes(RATIFIED_ACTOR_ID)) {
        productionHits.push(name);
      }
    }
    expect(productionHits).toEqual(['fiv-conn-04-d-system-job-identity.ts']);
  });
});
