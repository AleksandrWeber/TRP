/**
 * US183 — M2 performance baseline, architecture conformance, and exit review.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  evaluateM2ArchitectureConformance,
  m2ConformanceVerdict,
} from './m2-architecture-conformance';
import {
  M2_BASELINE_LIMITS,
  runM2PerformanceBaseline,
  type M2BaselineResult,
} from './m2-performance-baseline';

describe('US183 — M2 performance baseline and release readiness', () => {
  const baselines: M2BaselineResult[] = [];

  it('records small, medium, and practical scenarios without abnormal memory or lag growth', async () => {
    for (const size of ['small', 'medium', 'practical_limit'] as const) {
      const result = await runM2PerformanceBaseline(size);
      baselines.push(result);
      console.info(`M2_BASELINE ${JSON.stringify(result)}`);
      expect(result.deterministicFills).toBe(result.events);
      expect(result.durationMs).toBeGreaterThan(0);
      expect(result.p95TransactionMs).toBeLessThan(M2_BASELINE_LIMITS.transactionP95Ms);
    }

    const medium = baselines.find((baseline) => baseline.size === 'medium')!;
    expect(medium.durationMs).toBeLessThan(M2_BASELINE_LIMITS.mediumMaxDurationMs);
    expect(medium.eventsPerSec).toBeGreaterThan(M2_BASELINE_LIMITS.mediumMinEventsPerSec);

    const practical = baselines.find((baseline) => baseline.size === 'practical_limit')!;
    expect(practical.events).toBe(5_000);
    expect(practical.heapDeltaMb).toBeLessThan(M2_BASELINE_LIMITS.practicalMaxHeapDeltaMb);
    expect(practical.maxConsumerLagMs).toBeLessThan(M2_BASELINE_LIMITS.practicalMaxConsumerLagMs);
  }, 60_000);

  it('has no M2 architecture blockers and records minor pre-M3 recommendations', () => {
    const findings = evaluateM2ArchitectureConformance();
    expect(findings.filter((finding) => finding.severity === 'blocker')).toEqual([]);
    expect(m2ConformanceVerdict(findings)).toBe('PASS WITH MINOR RECOMMENDATIONS');
    expect(
      findings.some(
        (finding) => finding.id === 'ADR-015-ledger-append-only' && finding.severity === 'pass',
      ),
    ).toBe(true);
    expect(
      findings.some(
        (finding) =>
          finding.id === 'ADR-015-portfolio-projection-only' && finding.severity === 'pass',
      ),
    ).toBe(true);
    expect(
      findings.some(
        (finding) =>
          finding.id === 'ADR-016-reconciliation-fail-closed' && finding.severity === 'pass',
      ),
    ).toBe(true);
  });

  it('has complete US179–US183 evidence and synchronized release documents', () => {
    const evidence = [
      'src/validation/m2/us179-contract-state-authorization.spec.ts',
      'src/validation/m2/us180-postgres-atomicity.integration.spec.ts',
      'src/validation/m2/us181-deterministic-accounting-replay.spec.ts',
      'src/validation/m2/us182-failure-reconciliation.integration.spec.ts',
      'src/validation/m2/us183-m2-baseline-release.spec.ts',
      'src/validation/m2/m2-architecture-conformance.ts',
      'src/validation/m2/m2-performance-baseline.ts',
      '../../docs/adr/ADR-012-execution-architecture.md',
      '../../docs/adr/ADR-013-event-processing-model.md',
      '../../docs/adr/ADR-014-runtime-lifecycle.md',
      '../../docs/adr/ADR-015-accounting-model.md',
      '../../docs/adr/ADR-016-risk-safety-model.md',
      '../../docs/adr/ADR-017-module-boundaries.md',
      '../../docs/adr/ADR-018-architectural-invariants.md',
      '../../docs/project/project-status.md',
      '../../docs/project/technical-debt.md',
      '../../CHANGELOG.md',
    ];
    expect(evidence.filter((path) => !existsSync(join(process.cwd(), path)))).toEqual([]);
  });
});
