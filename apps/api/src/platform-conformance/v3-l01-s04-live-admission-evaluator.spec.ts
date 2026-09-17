/**
 * PROPOSED-V3-L01-S04 — Platform conformance specs.
 */

import { describe, expect, it } from 'vitest';
import { V2_READINESS } from './v2-certification-checklist';
import { V2_COMPATIBILITY_MATRIX } from './v2-compatibility-matrix';
import {
  V3_L01_S04_ARCHITECTURE_CLAIMS,
  V3_L01_S04_EXPLICIT_OUT,
  V3_L01_S04_OWNER,
  V3_L01_S04_SLICE_ID,
  v3L01S04HonestyHelpersRemainFalse,
  v3L01S04LiveCommandRemainsDenyAll,
  v3L01S04RequiredFilesExist,
  v3L01S04V2AnchorsIntact,
} from './v3-l01-s04-live-admission-evaluator';

describe('PROPOSED-V3-L01-S04 live admission conformance', () => {
  it('records slice id and owner', () => {
    expect(V3_L01_S04_SLICE_ID).toBe('PROPOSED-V3-L01-S04');
    expect(V3_L01_S04_OWNER).toBe('trading-session');
  });

  it('required implementation files exist', () => {
    expect(v3L01S04RequiredFilesExist()).toBe(true);
  });

  it('architecture claims: admission wiring without L02/C7 activation', () => {
    expect(V3_L01_S04_ARCHITECTURE_CLAIMS.liveAdmissionEvaluator).toBe(true);
    expect(V3_L01_S04_ARCHITECTURE_CLAIMS.gateLiveAdmissionWiring).toBe(true);
    expect(V3_L01_S04_ARCHITECTURE_CLAIMS.killSwitchLiveWiring).toBe(true);
    expect(V3_L01_S04_ARCHITECTURE_CLAIMS.liveCommandActivated).toBe(false);
    expect(V3_L01_S04_ARCHITECTURE_CLAIMS.liveCommandDenyAll).toBe(true);
    expect(V3_L01_S04_ARCHITECTURE_CLAIMS.secondGate).toBe(false);
    expect(V3_L01_S04_ARCHITECTURE_CLAIMS.secondKillSwitch).toBe(false);
    expect(V3_L01_S04_ARCHITECTURE_CLAIMS.exchangeIo).toBe(false);
    expect(V3_L01_S04_ARCHITECTURE_CLAIMS.l02ThroughL05).toBe(false);
    expect(V3_L01_S04_ARCHITECTURE_CLAIMS.securityAuditRuntimeAdmissionPersist).toBe(false);
  });

  it('T-36 LiveCommand remains deny-all', () => {
    expect(v3L01S04LiveCommandRemainsDenyAll()).toBe(true);
  });

  it('T-46 V2 liveCapitalAuthorized remains false', () => {
    expect(V2_READINESS.liveCapitalAuthorized).toBe(false);
    expect(v3L01S04V2AnchorsIntact()).toBe(true);
  });

  it('T-47 V2 paperFreeze remains true on compatibility matrix', () => {
    for (const row of V2_COMPATIBILITY_MATRIX) {
      expect(row.paperFreeze).toBe(true);
    }
  });

  it('T-45 honesty helpers remain truthful/false', () => {
    expect(v3L01S04HonestyHelpersRemainFalse()).toBe(true);
  });

  it('explicit-out includes L02–L05 and C7 activation', () => {
    expect(V3_L01_S04_EXPLICIT_OUT).toContain('l02');
    expect(V3_L01_S04_EXPLICIT_OUT).toContain('live-command-activation');
    expect(V3_L01_S04_EXPLICIT_OUT).toContain('s04-final-close');
  });
});
