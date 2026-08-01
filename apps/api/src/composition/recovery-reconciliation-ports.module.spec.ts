import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const API_ROOT = join(process.cwd(), 'src');

describe('US291 — production reconciliation binding', () => {
  it('AppModule imports RecoveryReconciliationPortsModule before TradingSessionModule', () => {
    const source = readFileSync(join(API_ROOT, 'app.module.ts'), 'utf8');
    expect(source).toMatch(/RecoveryReconciliationPortsModule/);
    const recoveryIdx = source.indexOf('RecoveryReconciliationPortsModule,');
    const sessionIdx = source.indexOf('TradingSessionModule,');
    expect(recoveryIdx).toBeGreaterThan(-1);
    expect(sessionIdx).toBeGreaterThan(recoveryIdx);
  });

  it('composition module binds real adapter to RECOVERY_RECONCILIATION_PORTS', () => {
    const source = readFileSync(
      join(API_ROOT, 'composition/recovery-reconciliation-ports.module.ts'),
      'utf8',
    );
    expect(source).toMatch(/@Global\(\)/);
    expect(source).toMatch(/RealRecoveryReconciliationPorts/);
    expect(source).toMatch(/RECOVERY_RECONCILIATION_PORTS/);
    expect(source).toMatch(/useExisting:\s*RealRecoveryReconciliationPorts/);
    expect(source).not.toMatch(/StubRecoveryReconciliationPorts/);
  });
});
