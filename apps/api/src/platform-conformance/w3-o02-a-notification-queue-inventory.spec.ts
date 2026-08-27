import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OutboxStatus } from '../modules/event-processing/domain/outbox-status';
import { DELIVERY_OUTCOMES } from '../modules/notification-delivery/domain/delivery';
import {
  W3_O02_A_ALLOWED_OWNERS,
  W3_O02_A_ARCHITECTURE_CLAIMS,
  W3_O02_A_DISTINCTION_EVIDENCE,
  W3_O02_A_DOMAIN_CLASSES,
  W3_O02_A_EXPLICIT_OUT,
  W3_O02_A_NOTIFICATION_QUEUE_INVENTORY,
  W3_O02_A_QUEUE_OWNER,
  W3_O02_A_REQUIRED_SURFACE_KINDS,
  W3_O02_A_SLICE_ID,
  W3_O02_A_SURFACE_KINDS,
  rowsByKind,
  rowsEphemeral,
  rowsRequiringDurableQueue,
  rowsTd035,
  rowsTd045,
  rowsW3O01History,
  rowsWave5,
  surfaceIds,
} from './w3-o02-a-notification-queue-inventory';

const REPO_ROOT = join(__dirname, '../../../..');

describe('W3-O02-a notification queue inventory — unit', () => {
  it('inventory completeness: every required surface kind appears', () => {
    const kinds = new Set(W3_O02_A_NOTIFICATION_QUEUE_INVENTORY.map((row) => row.kind));
    for (const kind of W3_O02_A_REQUIRED_SURFACE_KINDS) {
      expect(kinds.has(kind)).toBe(true);
    }
    expect(W3_O02_A_SURFACE_KINDS).toEqual([...W3_O02_A_REQUIRED_SURFACE_KINDS]);
  });

  it('inventory completeness: surface ids are unique and non-empty', () => {
    const ids = surfaceIds();
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('inventory completeness: every row has required classification fields', () => {
    for (const row of W3_O02_A_NOTIFICATION_QUEUE_INVENTORY) {
      expect(W3_O02_A_ALLOWED_OWNERS).toContain(row.owner);
      expect(row.workspaceScope.length).toBeGreaterThan(0);
      expect(row.currentStorage.length).toBeGreaterThan(0);
      expect(['EPHEMERAL', 'DURABLE']).toContain(row.ephemeralOrDurable);
      expect(row.restartImpact.length).toBeGreaterThan(10);
      expect(row.honestyRequirement.length).toBeGreaterThan(10);
      expect(W3_O02_A_DOMAIN_CLASSES).toContain(row.domainClass);
      expect(row.futureW3O02Responsibility.length).toBeGreaterThan(0);
      expect(row.evidencePath.length).toBeGreaterThan(0);
    }
  });

  it('ownership consistency: durable-queue surfaces use notification-delivery owner only', () => {
    for (const row of rowsRequiringDurableQueue()) {
      if (row.domainClass !== 'notification-queue-td045') continue;
      if (
        row.kind === 'producing-path' &&
        (row.owner === 'product-flow' ||
          row.owner === 'strategy-trading-pipeline' ||
          row.owner === 'telegram-product')
      ) {
        // Producers may call into delivery; future persistence remains on queue owner.
        expect(row.futureW3O02Responsibility).toBe('W3-O02-b');
        continue;
      }
      expect(row.owner).toBe(W3_O02_A_QUEUE_OWNER);
    }
    expect(W3_O02_A_DISTINCTION_EVIDENCE.queueOwner).toBe('notification-delivery');
  });

  it('ownership consistency: every owner is in the allowed set', () => {
    for (const row of W3_O02_A_NOTIFICATION_QUEUE_INVENTORY) {
      expect(W3_O02_A_ALLOWED_OWNERS).toContain(row.owner);
    }
  });

  it('distinction consistency: queue ≠ DeliveryResult history', () => {
    const history = rowsW3O01History();
    expect(history.length).toBeGreaterThan(0);
    for (const row of history) {
      expect(row.requiresDurableQueue).toBe(false);
      expect(row.domainClass).toBe('notification-history-w3-o01');
      expect(row.honestyRequirement.toLowerCase()).toMatch(/history|o01|queue/);
    }
    expect(DELIVERY_OUTCOMES).toEqual(['delivered', 'skipped', 'failed']);
    expect(DELIVERY_OUTCOMES).not.toContain('pending');
    expect(DELIVERY_OUTCOMES).not.toContain('retryable');
  });

  it('distinction consistency: queue ≠ paper Outbox (TD-045 ≠ TD-035)', () => {
    const outbox = rowsTd035();
    expect(outbox.length).toBeGreaterThanOrEqual(3);
    for (const row of outbox) {
      expect(row.owner).toBe('event-processing');
      expect(row.requiresDurableQueue).toBe(false);
      expect(row.futureW3O02Responsibility).toBe('out-of-scope-td035');
    }
    expect(W3_O02_A_ARCHITECTURE_CLAIMS.td045MergedIntoTd035).toBe(false);
    expect(W3_O02_A_ARCHITECTURE_CLAIMS.newOutbox).toBe(false);
    expect(W3_O02_A_DISTINCTION_EVIDENCE.outboxStatuses).toEqual([
      OutboxStatus.PENDING,
      OutboxStatus.PUBLISHING,
      OutboxStatus.PUBLISHED,
      OutboxStatus.DEAD_LETTER,
    ]);
  });

  it('distinction consistency: queue ≠ Wave 5 transport', () => {
    const wave5 = rowsWave5();
    expect(wave5.length).toBeGreaterThan(0);
    for (const row of wave5) {
      expect(row.futureW3O02Responsibility).toBe('out-of-scope-wave-5');
      expect(row.requiresDurableQueue).toBe(false);
    }
    expect(W3_O02_A_ARCHITECTURE_CLAIMS.wave5TransportsClaimed).toBe(false);
    expect(W3_O02_A_DISTINCTION_EVIDENCE.reservedChannels.length).toBeGreaterThan(0);
  });

  it('honesty: pending/retryable/abandoned notification queue states are absent today', () => {
    for (const kind of ['pending-state', 'retryable-state', 'abandoned-state'] as const) {
      const td045 = rowsByKind(kind).filter(
        (row) => row.domainClass === 'notification-queue-td045',
      );
      expect(td045.length).toBeGreaterThan(0);
      for (const row of td045) {
        expect(row.existsToday).toBe(false);
        expect(row.currentStorage).toBe('absent-not-implemented');
        expect(row.requiresDurableQueue).toBe(true);
      }
    }
  });

  it('honesty: producing paths that require durable queue remain ephemeral today', () => {
    const producers = rowsByKind('producing-path').filter((row) => row.requiresDurableQueue);
    expect(producers.length).toBeGreaterThanOrEqual(4);
    for (const row of producers) {
      expect(row.ephemeralOrDurable).toBe('EPHEMERAL');
      expect(row.existsToday).toBe(true);
    }
    expect(rowsEphemeral().length).toBeGreaterThan(0);
    expect(rowsTd045().some((row) => row.requiresDurableQueue)).toBe(true);
  });
});

describe('W3-O02-a notification queue inventory — integration / planning', () => {
  it('planning consistency: slice id and architecture claims remain inventory-only', () => {
    expect(W3_O02_A_SLICE_ID).toBe('W3-O02-a');
    expect(W3_O02_A_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W3_O02_A_ARCHITECTURE_CLAIMS.newBoundedContext).toBe(false);
    expect(W3_O02_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged).toBe(false);
    expect(W3_O02_A_ARCHITECTURE_CLAIMS.queueDurableClaimed).toBe(false);
    expect(W3_O02_A_ARCHITECTURE_CLAIMS.customerVisibleQueueFeature).toBe(false);
    expect(W3_O02_A_ARCHITECTURE_CLAIMS.platformRestartSafeFromO02).toBe(false);
  });

  it('master plan consistency: inventory claims leave Master Plan / V2 / Wave 1–2 / O01 unchanged', () => {
    expect(W3_O02_A_ARCHITECTURE_CLAIMS.masterPlanModified).toBe(false);
    expect(W3_O02_A_ARCHITECTURE_CLAIMS.version2Redesigned).toBe(false);
    expect(W3_O02_A_ARCHITECTURE_CLAIMS.wave1Modified).toBe(false);
    expect(W3_O02_A_ARCHITECTURE_CLAIMS.wave2Modified).toBe(false);
    expect(W3_O02_A_ARCHITECTURE_CLAIMS.w3O01Redesigned).toBe(false);
    expect(existsSync(join(REPO_ROOT, 'docs/project/version-3/version-3-master-plan.md'))).toBe(
      true,
    );
  });

  it('architecture consistency: no second SoT / Lake / Outbox / Inbox / Ledger', () => {
    expect(W3_O02_A_ARCHITECTURE_CLAIMS.newSourceOfTruth).toBe(false);
    expect(W3_O02_A_ARCHITECTURE_CLAIMS.newKnowledgeLake).toBe(false);
    expect(W3_O02_A_ARCHITECTURE_CLAIMS.newOutbox).toBe(false);
    expect(W3_O02_A_ARCHITECTURE_CLAIMS.newInbox).toBe(false);
    expect(W3_O02_A_ARCHITECTURE_CLAIMS.newLedger).toBe(false);
    expect(W3_O02_A_ARCHITECTURE_CLAIMS.newEventStore).toBe(false);
    expect(W3_O02_A_ARCHITECTURE_CLAIMS.newProjectionStore).toBe(false);
    expect(W3_O02_A_EXPLICIT_OUT).toEqual(
      expect.arrayContaining([
        'second-outbox',
        'second-notification-domain',
        'queue-persistence-implementation',
        'restart-recovery-implementation',
        'wave-5-production-transports',
        'w3-o02-b',
      ]),
    );
  });

  it('architecture consistency: evidence paths exist on disk', () => {
    for (const row of W3_O02_A_NOTIFICATION_QUEUE_INVENTORY) {
      expect(existsSync(join(REPO_ROOT, row.evidencePath))).toBe(true);
    }
  });

  it('required reports exist for W3-O02-a', () => {
    const wave3 = join(REPO_ROOT, 'docs/project/version-3/wave-3');
    for (const name of [
      'w3-o02-a-notification-queue-inventory.md',
      'w3-o02-a-implementation-report.md',
      'w3-o02-a-architecture-review.md',
      'w3-o02-a-security-review.md',
      'w3-o02-a-product-review.md',
      'w3-o02-a-validation-report.md',
    ]) {
      expect(existsSync(join(wave3, name))).toBe(true);
    }
  });
});
