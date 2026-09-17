import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const API_SRC = join(process.cwd(), 'src');

describe('LiveAdmissionGatePortsModule — composition binding', () => {
  it('AppModule imports LiveAdmissionGatePortsModule before LiveAdmissionModule', () => {
    const source = readFileSync(join(API_SRC, 'app.module.ts'), 'utf8');
    expect(source).toMatch(/LiveAdmissionGatePortsModule/);
    const gateIdx = source.indexOf('LiveAdmissionGatePortsModule,');
    const admissionIdx = source.indexOf('LiveAdmissionModule,');
    expect(gateIdx).toBeGreaterThanOrEqual(0);
    expect(admissionIdx).toBeGreaterThan(gateIdx);
  });

  it('composition module binds real adapter to LIVE_ADMISSION_GATE_PORT', () => {
    const source = readFileSync(join(API_SRC, 'composition/live-admission-gate-ports.module.ts'), 'utf8');
    expect(source).toMatch(/LIVE_ADMISSION_GATE_PORT/);
    expect(source).toMatch(/RealLiveAdmissionGatePort/);
    expect(source).toMatch(/RuntimeEnforcementModule/);
  });

  it('LiveAdmissionModule does not import RuntimeEnforcementModule', () => {
    const source = readFileSync(
      join(API_SRC, 'modules/trading-session/live-admission/live-admission.module.ts'),
      'utf8',
    );
    expect(source).not.toMatch(/RuntimeEnforcementModule/);
    expect(source).not.toMatch(/runtime-enforcement/);
  });
});
