import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { V2_PLATFORM_MODULE_IDS } from './v2-platform-modules';
import { V2_RESIDUAL_ITEM_IDS } from './v2-residual-register';
import {
  W3_O01_A_ALLOWED_OWNERS,
  W3_O01_A_ANALYTICAL_INVENTORY,
  W3_O01_A_ARCHITECTURE_CLAIMS,
  W3_O01_A_DURABILITY_CLASSES,
  W3_O01_A_EXPLICIT_OUT,
  W3_O01_A_PORT_PERSISTENCE_FLAGS,
  W3_O01_A_REQUIRED_OWNERS,
  W3_O01_A_SLICE_ID,
  artifactIds,
  inventoryOwners,
  rowsClassifiedEphemeral,
  rowsRequiringSurvive,
} from './w3-o01-a-analytical-inventory';

const REPO_ROOT = join(__dirname, '../../../..');

describe('W3-O01-a analytical inventory — unit', () => {
  it('inventory completeness: every required owner has at least one artifact', () => {
    const owners = new Set(inventoryOwners());
    for (const owner of W3_O01_A_REQUIRED_OWNERS) {
      expect(owners.has(owner)).toBe(true);
    }
    expect(W3_O01_A_ANALYTICAL_INVENTORY.length).toBeGreaterThanOrEqual(
      W3_O01_A_REQUIRED_OWNERS.length,
    );
  });

  it('inventory completeness: artifact ids are unique and non-empty', () => {
    const ids = artifactIds();
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('inventory completeness: certified modules still declare persistence false', () => {
    for (const owner of W3_O01_A_ALLOWED_OWNERS) {
      expect(W3_O01_A_PORT_PERSISTENCE_FLAGS[owner]).toBe(false);
    }
  });

  it('ownership consistency: every artifact has exactly one allowed owner', () => {
    for (const row of W3_O01_A_ANALYTICAL_INVENTORY) {
      expect(W3_O01_A_ALLOWED_OWNERS).toContain(row.owner);
      expect(typeof row.owner).toBe('string');
    }
    const byArtifact = new Map<string, string>();
    for (const row of W3_O01_A_ANALYTICAL_INVENTORY) {
      expect(byArtifact.has(row.artifactId)).toBe(false);
      byArtifact.set(row.artifactId, row.owner);
    }
  });

  it('ownership consistency: inventory owners are existing V2 platform modules', () => {
    for (const owner of inventoryOwners()) {
      expect(V2_PLATFORM_MODULE_IDS).toContain(owner);
    }
  });

  it('classification consistency: every row has SURVIVE or EPHEMERAL', () => {
    for (const row of W3_O01_A_ANALYTICAL_INVENTORY) {
      expect(W3_O01_A_DURABILITY_CLASSES).toContain(row.requiredDurability);
    }
  });

  it('classification consistency: default is SURVIVE; EPHEMERAL requires honesty note', () => {
    expect(rowsRequiringSurvive().length).toBeGreaterThan(rowsClassifiedEphemeral().length);
    for (const row of rowsClassifiedEphemeral()) {
      expect(row.honestyNote.length).toBeGreaterThan(10);
      expect(row.honestyNote.toLowerCase()).toMatch(/ephemeral|honest|derived|seed/);
    }
  });

  it('classification consistency: operator-relied SURVIVE rows remain non-surviving today', () => {
    for (const row of rowsRequiringSurvive()) {
      if (!row.operatorRelied) continue;
      expect(row.restartSurvivability).toBe('does-not-survive-today');
      expect(row.futureSlice).toBe('W3-O01-b');
    }
  });
});

describe('W3-O01-a analytical inventory — integration / planning', () => {
  it('planning consistency: slice id and residual vocabulary remain debt-only', () => {
    expect(W3_O01_A_SLICE_ID).toBe('W3-O01-a');
    expect(V2_RESIDUAL_ITEM_IDS).toContain('durable-persistence-product');
    expect(W3_O01_A_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W3_O01_A_ARCHITECTURE_CLAIMS.newBoundedContext).toBe(false);
  });

  it('master plan consistency: inventory claims leave Master Plan / V2 / Wave 1–2 unchanged', () => {
    expect(W3_O01_A_ARCHITECTURE_CLAIMS.masterPlanModified).toBe(false);
    expect(W3_O01_A_ARCHITECTURE_CLAIMS.version2Redesigned).toBe(false);
    expect(W3_O01_A_ARCHITECTURE_CLAIMS.wave1Modified).toBe(false);
    expect(W3_O01_A_ARCHITECTURE_CLAIMS.wave2Modified).toBe(false);
    expect(existsSync(join(REPO_ROOT, 'docs/project/version-3/version-3-master-plan.md'))).toBe(
      true,
    );
  });

  it('architecture consistency: no second SoT / Lake / Outbox / Inbox / Ledger', () => {
    expect(W3_O01_A_ARCHITECTURE_CLAIMS.newSourceOfTruth).toBe(false);
    expect(W3_O01_A_ARCHITECTURE_CLAIMS.newKnowledgeLake).toBe(false);
    expect(W3_O01_A_ARCHITECTURE_CLAIMS.newOutbox).toBe(false);
    expect(W3_O01_A_ARCHITECTURE_CLAIMS.newInbox).toBe(false);
    expect(W3_O01_A_ARCHITECTURE_CLAIMS.newLedger).toBe(false);
    expect(W3_O01_A_ARCHITECTURE_CLAIMS.newEventStore).toBe(false);
    expect(W3_O01_A_ARCHITECTURE_CLAIMS.newProjectionStore).toBe(false);
    expect(W3_O01_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged).toBe(false);
    expect(W3_O01_A_EXPLICIT_OUT).toEqual(
      expect.arrayContaining([
        'second-knowledge-lake',
        'second-outbox',
        'notification-durable-queue',
        'kill-switch-product',
        'monitoring-health-product',
      ]),
    );
  });

  it('architecture consistency: store evidence files exist on disk', () => {
    for (const row of W3_O01_A_ANALYTICAL_INVENTORY) {
      expect(existsSync(join(REPO_ROOT, row.storeEvidence))).toBe(true);
      expect(existsSync(join(REPO_ROOT, row.portEvidence))).toBe(true);
    }
  });

  it('honest product: platform is not claimed restart-safe after inventory-only slice', () => {
    expect(W3_O01_A_ARCHITECTURE_CLAIMS.platformRestartSafe).toBe(false);
    expect(W3_O01_A_ARCHITECTURE_CLAIMS.customerVisibleDurability).toBe(false);
  });

  it('required reports exist for W3-O01-a', () => {
    const wave3 = join(REPO_ROOT, 'docs/project/version-3/wave-3');
    for (const name of [
      'w3-o01-a-analytical-inventory.md',
      'w3-o01-a-implementation-report.md',
      'w3-o01-a-architecture-review.md',
      'w3-o01-a-security-review.md',
      'w3-o01-a-product-review.md',
      'w3-o01-a-validation-report.md',
    ]) {
      expect(existsSync(join(wave3, name))).toBe(true);
    }
  });
});
