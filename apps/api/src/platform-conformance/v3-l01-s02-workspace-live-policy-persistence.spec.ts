import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { V2_READINESS } from './v2-certification-checklist';
import { V2_COMPATIBILITY_MATRIX } from './v2-compatibility-matrix';
import {
  readV3L01S02MigrationSql,
  V3_L01_S02_ARCHITECTURE_CLAIMS,
  V3_L01_S02_DURABLE_COVERAGE,
  V3_L01_S02_EXPLICIT_OUT,
  V3_L01_S02_OWNER,
  V3_L01_S02_POLICY_STATES,
  V3_L01_S02_SLICE_ID,
  v3L01S02RequiredFilesExist,
  v3L01S02RepoRoot,
  v3L01S02V2AnchorsIntact,
} from './v3-l01-s02-workspace-live-policy-persistence';

describe('PROPOSED-V3-L01-S02 workspace live-policy persistence', () => {
  it('records PROPOSED slice id and workspace ownership', () => {
    expect(V3_L01_S02_SLICE_ID).toBe('PROPOSED-V3-L01-S02');
    expect(V3_L01_S02_OWNER).toBe('workspace');
    expect(V3_L01_S02_POLICY_STATES).toEqual(['PAPER', 'LIVE_POLICY_OPTED_IN']);
  });

  it('required persistence artifacts exist', () => {
    expect(v3L01S02RequiredFilesExist()).toBe(true);
  });

  it('T-03 migration creates satellite table and Paper-backfills existing workspaces', () => {
    const sql = readV3L01S02MigrationSql();
    expect(sql).toContain('CREATE TABLE "workspace_live_policy_states"');
    expect(sql).toContain("DEFAULT 'PAPER'");
    expect(sql).toMatch(/INSERT INTO "workspace_live_policy_states"/);
    expect(sql).toContain('SELECT "id", \'PAPER\'');
    expect(sql).toContain('FROM "workspace_records"');
    // No SQL value writes live opt-in (comments may mention the forbidden token).
    expect(sql).not.toMatch(/'[^\n']*LIVE_POLICY_OPTED_IN[^\n']*'/);
    expect(sql.toLowerCase()).not.toContain('live_capital');
  });

  it('Prisma schema declares WorkspaceLivePolicyState with Paper default', () => {
    const schema = readFileSync(join(v3L01S02RepoRoot(), 'apps/api/prisma/schema.prisma'), 'utf8');
    expect(schema).toContain('model WorkspaceLivePolicyState');
    expect(schema).toContain('@@map("workspace_live_policy_states")');
    expect(schema).toContain('@default("PAPER")');
    expect(schema).not.toMatch(/model WorkspaceRecord \{[^}]*policy/s);
  });

  it('T-09/T-12/T-13/T-14 architecture claims forbid S03/S04/L02–L05/API/credentials', () => {
    expect(V3_L01_S02_ARCHITECTURE_CLAIMS.publicAdminApi).toBe(false);
    expect(V3_L01_S02_ARCHITECTURE_CLAIMS.enablementAuthorization).toBe(false);
    expect(V3_L01_S02_ARCHITECTURE_CLAIMS.gateLiveAdmissionWiring).toBe(false);
    expect(V3_L01_S02_ARCHITECTURE_CLAIMS.killSwitchLiveWiring).toBe(false);
    expect(V3_L01_S02_ARCHITECTURE_CLAIMS.sessionLiveProductization).toBe(false);
    expect(V3_L01_S02_ARCHITECTURE_CLAIMS.liveAdapter).toBe(false);
    expect(V3_L01_S02_ARCHITECTURE_CLAIMS.credentialsOrVaultMutation).toBe(false);
    expect(V3_L01_S02_ARCHITECTURE_CLAIMS.l02ThroughL05).toBe(false);
    expect(V3_L01_S02_ARCHITECTURE_CLAIMS.booleanLiveOptInAsSoT).toBe(false);
    expect(V3_L01_S02_EXPLICIT_OUT).toEqual(
      expect.arrayContaining([
        'admin-enablement-api',
        'runtime-enforcement-gate-live-admission',
        'kill-switch-live-wiring',
        'session-live-productization',
        'l02',
        'l04',
        'credentials',
      ]),
    );
  });

  it('T-10 liveCapitalAuthorized remains false', () => {
    expect(V2_READINESS.liveCapitalAuthorized).toBe(false);
  });

  it('T-11 paperFreeze remains true on compatibility matrix', () => {
    for (const row of V2_COMPATIBILITY_MATRIX) {
      expect(row.paperFreeze).toBe(true);
    }
    expect(v3L01S02V2AnchorsIntact()).toBe(true);
  });

  it('coverage points at Workspace-owned satellite paths', () => {
    expect(V3_L01_S02_DURABLE_COVERAGE.prismaModel).toBe('WorkspaceLivePolicyState');
    expect(V3_L01_S02_DURABLE_COVERAGE.table).toBe('workspace_live_policy_states');
    expect(V3_L01_S02_ARCHITECTURE_CLAIMS.workspaceOwnedSatelliteTable).toBe(true);
    expect(V3_L01_S02_ARCHITECTURE_CLAIMS.paperCanonicalDefault).toBe(true);
    expect(V3_L01_S02_ARCHITECTURE_CLAIMS.explicitPaperBackfill).toBe(true);
    expect(V3_L01_S02_ARCHITECTURE_CLAIMS.persistenceDomainPortsOnly).toBe(true);
  });

  it('workspace create seeds Paper when persistence service is provided', async () => {
    const { WorkspaceDomainService } =
      await import('../modules/workspace/workspace-domain.service');
    const { InMemoryWorkspaceRepository } =
      await import('../modules/workspace/repositories/in-memory-workspace.repository');
    const { InMemoryWorkspaceLivePolicyStateRepository } =
      await import('../modules/workspace/live-policy/persistence/in-memory-workspace-live-policy-state.repository');
    const { WorkspaceLivePolicyPersistenceService } =
      await import('../modules/workspace/live-policy/workspace-live-policy-persistence.service');
    const { WorkspaceLivePolicy } =
      await import('../modules/workspace/live-policy/durable-workspace-live-policy-state');

    const livePolicyRepo = new InMemoryWorkspaceLivePolicyStateRepository();
    const livePolicy = new WorkspaceLivePolicyPersistenceService(livePolicyRepo);
    const service = new WorkspaceDomainService(new InMemoryWorkspaceRepository(), livePolicy);

    const workspace = await service.create({ name: 'Lab', ownerUserId: 'user-1' });
    const state = await livePolicy.loadState(workspace.id);
    expect(state?.policy).toBe(WorkspaceLivePolicy.PAPER);
  });
});
