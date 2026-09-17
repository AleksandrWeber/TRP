import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { V2_READINESS } from './v2-certification-checklist';
import { V2_COMPATIBILITY_MATRIX } from './v2-compatibility-matrix';
import { isClassifiedSecurityAuditEvent } from '../modules/security-audit/security-audit-classification';
import {
  V3_L01_S03_API,
  V3_L01_S03_ARCHITECTURE_CLAIMS,
  V3_L01_S03_AUDIT_EVENT,
  V3_L01_S03_COVERAGE,
  V3_L01_S03_EXPLICIT_OUT,
  V3_L01_S03_OWNER,
  V3_L01_S03_SLICE_ID,
  v3L01S03AdminAllowsRoleAdmin,
  v3L01S03LiveCommandRemainsDenyAll,
  v3L01S03RequiredFilesExist,
  v3L01S03RepoRoot,
  v3L01S03V2AnchorsIntact,
} from './v3-l01-s03-workspace-live-policy-admin-enablement';

describe('PROPOSED-V3-L01-S03 workspace live-policy Admin enablement', () => {
  it('records PROPOSED slice id and workspace ownership', () => {
    expect(V3_L01_S03_SLICE_ID).toBe('PROPOSED-V3-L01-S03');
    expect(V3_L01_S03_OWNER).toBe('workspace');
  });

  it('required S03 artifacts exist', () => {
    expect(v3L01S03RequiredFilesExist()).toBe(true);
  });

  it('T-26 LiveCommand remains deny-all and is not bound to enablement', () => {
    expect(v3L01S03LiveCommandRemainsDenyAll()).toBe(true);
    expect(V3_L01_S03_ARCHITECTURE_CLAIMS.liveCommandBoundToEnablement).toBe(false);
    expect(V3_L01_S03_ARCHITECTURE_CLAIMS.liveCommandDenyAll).toBe(true);
    expect(v3L01S03AdminAllowsRoleAdmin()).toBe(true);
  });

  it('T-23/T-24/T-25/T-27 architecture claims forbid Gate/KS/Session/credentials/L02–L05', () => {
    expect(V3_L01_S03_ARCHITECTURE_CLAIMS.gateLiveAdmissionWiring).toBe(false);
    expect(V3_L01_S03_ARCHITECTURE_CLAIMS.killSwitchLiveWiring).toBe(false);
    expect(V3_L01_S03_ARCHITECTURE_CLAIMS.sessionLiveProductization).toBe(false);
    expect(V3_L01_S03_ARCHITECTURE_CLAIMS.credentialsOrVaultMutation).toBe(false);
    expect(V3_L01_S03_ARCHITECTURE_CLAIMS.liveAdapter).toBe(false);
    expect(V3_L01_S03_ARCHITECTURE_CLAIMS.l02ThroughL05).toBe(false);
    expect(V3_L01_S03_ARCHITECTURE_CLAIMS.mfa).toBe(false);
    expect(V3_L01_S03_EXPLICIT_OUT).toEqual(
      expect.arrayContaining([
        'gate-admission',
        'kill-switch-live-wiring',
        'session-live-productization',
        'credentials',
        'l02',
        'l04',
        'fiv',
      ]),
    );
  });

  it('T-28 liveCapitalAuthorized remains false', () => {
    expect(V2_READINESS.liveCapitalAuthorized).toBe(false);
  });

  it('T-29 paperFreeze remains true on compatibility matrix', () => {
    for (const row of V2_COMPATIBILITY_MATRIX) {
      expect(row.paperFreeze).toBe(true);
    }
    expect(v3L01S03V2AnchorsIntact()).toBe(true);
  });

  it('T-32 consumes S02 SoT — no second policy store', () => {
    expect(V3_L01_S03_ARCHITECTURE_CLAIMS.consumesS02SoT).toBe(true);
    expect(V3_L01_S03_ARCHITECTURE_CLAIMS.secondPolicyStore).toBe(false);
    const schema = readFileSync(join(v3L01S03RepoRoot(), 'apps/api/prisma/schema.prisma'), 'utf8');
    const matches = schema.match(/model WorkspaceLivePolicyState/g) ?? [];
    expect(matches).toHaveLength(1);
  });

  it('API shape matches PO-S03-02 (enable/disable only; no GET)', () => {
    expect(V3_L01_S03_API.enable).toContain('/live-policy/enable');
    expect(V3_L01_S03_API.disable).toContain('/live-policy/disable');
    expect(V3_L01_S03_API.getEndpoint).toBe(false);
    expect(V3_L01_S03_ARCHITECTURE_CLAIMS.getEndpoint).toBe(false);
    const controller = readFileSync(
      join(v3L01S03RepoRoot(), V3_L01_S03_COVERAGE.controller),
      'utf8',
    );
    expect(controller).toContain("@Post('enable')");
    expect(controller).toContain("@Post('disable')");
    expect(controller).not.toMatch(/@Get\(/);
    expect(controller).toContain('PermissionClass.RoleAdmin');
  });

  it('audit event is classified in Security Audit catalog', () => {
    expect(isClassifiedSecurityAuditEvent(V3_L01_S03_AUDIT_EVENT)).toBe(true);
    expect(V3_L01_S03_ARCHITECTURE_CLAIMS.enablementAudit).toBe(true);
  });
});
