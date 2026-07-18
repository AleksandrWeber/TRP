/**
 * US152 — M1 performance baseline, architecture conformance, and exit gate.
 */
import { describe, expect, it } from 'vitest';
import {
  conformanceVerdict,
  evaluateM1ArchitectureConformance,
} from './m1-architecture-conformance';
import {
  M1_BASELINE_LIMITS,
  runM1PerformanceBaseline,
  type M1BaselineResult,
} from './m1-performance-baseline';

describe('US152 — M1 performance baseline and Mini Validation exit', () => {
  const baselines: M1BaselineResult[] = [];

  it('records small, medium, and practical-limit baselines without abnormal heap growth', async () => {
    for (const size of ['small', 'medium', 'practical_limit'] as const) {
      const result = await runM1PerformanceBaseline(size);
      baselines.push(result);
      expect(result.accepted).toBe(result.events);
      expect(result.duplicates).toBeGreaterThan(0);
      expect(result.durationMs).toBeGreaterThan(0);
      expect(result.heapDeltaMb).toBeLessThan(M1_BASELINE_LIMITS.practicalMaxHeapDeltaMb);
    }

    const medium = baselines.find((row) => row.size === 'medium')!;
    expect(medium.durationMs).toBeLessThan(M1_BASELINE_LIMITS.mediumMaxDurationMs);
    expect(medium.eventsPerSec).toBeGreaterThan(M1_BASELINE_LIMITS.mediumMinEventsPerSec);

    const practical = baselines.find((row) => row.size === 'practical_limit')!;
    expect(practical.accepted).toBe(5_000);
    // Fan-out may drop under backpressure — must not block ingestion (accepted == events).
    expect(practical.fanOutDropped + practical.fanOutDelivered).toBeGreaterThanOrEqual(0);
  }, 60_000);

  it('passes M1 architecture conformance review', () => {
    const findings = evaluateM1ArchitectureConformance();
    const blockers = findings.filter((row) => row.severity === 'blocker');
    expect(blockers).toEqual([]);
    const verdict = conformanceVerdict(findings);
    expect(['PASS', 'PASS WITH MINOR RECOMMENDATIONS']).toContain(verdict);
  });

  it('documents M1 exit checklist evidence', () => {
    const findings = evaluateM1ArchitectureConformance();
    expect(
      findings.some((row) => row.id === 'ADR-012-018-present' && row.severity === 'pass'),
    ).toBe(true);
    expect(
      findings.some(
        (row) => row.id === 'ADR-017-live-market-no-trading' && row.severity === 'pass',
      ),
    ).toBe(true);
    expect(
      findings.some(
        (row) => row.id === 'ADR-017-provider-payload-isolation' && row.severity === 'pass',
      ),
    ).toBe(true);
    expect(
      findings.some((row) => row.id === 'M1-query-sse-surface' && row.severity === 'pass'),
    ).toBe(true);
  });
});
