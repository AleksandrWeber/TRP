import { describe, expect, it } from 'vitest';
import { InMemoryWorkspaceRepository } from '../../modules/workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../../modules/workspace/workspace-access.service';
import { WorkspaceDomainService } from '../../modules/workspace/workspace-domain.service';
import { InMemoryStrategyLibraryReadAdapter } from '../../modules/strategy-library/adapters/in-memory-strategy-library-read.adapter';
import { createStrategy } from '../../modules/strategy-library/domain/strategy';
import { createStrategyCertification } from '../../modules/strategy-library/domain/strategy-certification';
import { createStrategyEligibility } from '../../modules/strategy-library/domain/strategy-eligibility';
import { createStrategyVersion } from '../../modules/strategy-library/domain/strategy-version';
import { InMemoryRuntimeValidationStore } from '../../modules/runtime-enforcement/in-memory-runtime-validation.store';
import { validateDeployment } from '../../modules/runtime-enforcement/domain/validate-deployment';
import { RuntimeEnforcementLibraryReadService } from '../../modules/runtime-enforcement/runtime-enforcement-library-read.service';
import { RuntimeValidationController } from '../../modules/runtime-enforcement/runtime-validation.controller';
import { RuntimeValidationService } from '../../modules/runtime-enforcement/runtime-validation.service';
import type { RuntimeEnforcementPort } from '../../modules/runtime-enforcement/ports/runtime-enforcement.port';
import type { AuthUser } from '../../modules/auth/jwt.strategy';
import { Role } from '../../modules/identity/role';

const OWNER: AuthUser = {
  userId: 'pc04-owner',
  email: 'pc04@example.com',
  displayName: 'PC-04',
  role: Role.Researcher,
};

const createdAt = '2026-08-15T12:00:00.000Z';

function seedEligible(adapter: InMemoryStrategyLibraryReadAdapter, workspaceId: string) {
  const strategy = createStrategy({
    strategyFamilyId: 'fam-momentum',
    name: 'Momentum',
    workspaceId,
    createdAt,
  });
  const version = createStrategyVersion({
    libraryEntryId: 'lib-entry-1',
    strategyFamilyId: 'fam-momentum',
    version: '1.0.0',
    contentHash: 'sha256:abc',
    market: 'crypto-spot',
    supportedExchangeScopeIds: ['binance-spot'],
    supportedTimeframes: ['1h'],
    supportedSymbols: ['BTCUSDT'],
    workspaceId,
    createdAt,
  });
  const certification = createStrategyCertification({
    certificationId: 'cert-1',
    strategyVersion: version,
    certifiedBy: OWNER.userId,
    certifiedAt: createdAt,
    evidence: [
      {
        evidenceId: 'ev-bt-1',
        type: 'backtesting',
        sourceRef: { owner: 'backtesting', id: 'bt-1' },
      },
      {
        evidenceId: 'ev-wf-1',
        type: 'walk-forward',
        sourceRef: { owner: 'walk-forward', id: 'wf-1' },
      },
    ],
    tacticalEnvelope: {
      envelopeVersion: 'env-1',
      allowedMarkets: ['crypto-spot'],
      allowedExchangeScopeIds: ['binance-spot'],
      allowedSymbols: ['BTCUSDT'],
      allowedTimeframes: ['1h'],
      riskPerTrade: { min: 0.25, max: 1, step: 0.25 },
      maxPositions: { min: 1, max: 3 },
    },
  });
  const eligibility = createStrategyEligibility({
    eligibilityId: 'elig-1',
    certification,
    rulesVersion: 'rules-v1',
    evaluatedAt: createdAt,
  });
  adapter.seedEntry({ strategy, version, certification, eligibility });
}

/**
 * PC-04: Runtime Validation HTTP over the existing Gate.
 * Library remains SoT. Deployment and Session stay unchanged.
 */
describe('PC-04 — Runtime Validation product', () => {
  it('runs validation, records PASS/FAIL, reasons, version, timestamp, and history', async () => {
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    const library = new InMemoryStrategyLibraryReadAdapter();
    const reads = new RuntimeEnforcementLibraryReadService(library, library);
    const gate: RuntimeEnforcementPort = {
      validateDeployment: (cmd) =>
        validateDeployment(cmd, {
          getByLibraryEntryId: (id) => reads.getByLibraryEntryId(id),
          getByFamilyVersion: (familyId, version) => reads.getByFamilyVersion(familyId, version),
          familyExistsInWorkspace: (workspaceId, strategyFamilyId) =>
            reads.familyExistsInWorkspace(workspaceId, strategyFamilyId),
        }),
    };
    const service = new RuntimeValidationService(gate, reads, new InMemoryRuntimeValidationStore());
    const access = new WorkspaceAccessService(workspaces);
    const controller = new RuntimeValidationController(service, access);
    const workspace = await workspaces.create({ name: 'Paper Lab', ownerUserId: OWNER.userId });

    const missing = controller.run({ user: OWNER }, workspace.id, {
      strategyFamilyId: 'fam-missing',
      strategyVersion: '1.0.0',
    });
    expect(missing.outcome).toBe('fail');
    expect(missing.reasons.length).toBeGreaterThan(0);

    seedEligible(library, workspace.id);
    const passed = controller.run({ user: OWNER }, workspace.id, {
      libraryEntryId: 'lib-entry-1',
    });
    expect(passed.outcome).toBe('pass');
    expect(passed.validation).toBe('VALID');
    expect(passed.strategyVersion).toBe('1.0.0');
    expect(passed.checkedAt).toBeTruthy();

    const history = controller.listHistory({ user: OWNER }, workspace.id, {});
    expect(history.items.map((item) => item.outcome)).toEqual(['pass', 'fail']);
    expect(history.items[0]?.strategyVersion).toBe('1.0.0');
  });
});
