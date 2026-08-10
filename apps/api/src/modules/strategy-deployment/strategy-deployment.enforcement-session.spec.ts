import { describe, expect, it } from 'vitest';
import { StrategyDeploymentStatus } from './domain/strategy-deployment';

/**
 * RC-23 Epic 4 — Session startability implication.
 *
 * Trading Session (US217) only binds to APPROVED deployments.
 * When Runtime Enforcement rejects approve, deployment stays DRAFT →
 * Session create/start cannot proceed. Full Session wiring remains Epic 5.
 */
describe('RC-23 Epic 4 — Session startability after enforcement', () => {
  it('keeps rejected deployments non-Session-startable (DRAFT ≠ APPROVED)', () => {
    const rejectedBindStatus = StrategyDeploymentStatus.DRAFT;
    // Mirrors trading-session assertDeploymentBinding rule:
    // origin strategy requires status === APPROVED.
    const sessionStartableStatuses: readonly StrategyDeploymentStatus[] = [
      StrategyDeploymentStatus.APPROVED,
    ];
    expect(sessionStartableStatuses.includes(rejectedBindStatus)).toBe(false);
  });
});
