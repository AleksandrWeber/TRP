import { describe, expect, it } from 'vitest';
import { InMemoryWorkspaceRepository } from '../../modules/workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../../modules/workspace/workspace-access.service';
import { WorkspaceDomainService } from '../../modules/workspace/workspace-domain.service';
import { InMemoryStrategyLibraryReadAdapter } from '../../modules/strategy-library/adapters/in-memory-strategy-library-read.adapter';
import { createStrategy } from '../../modules/strategy-library/domain/strategy';
import { createStrategyCertification } from '../../modules/strategy-library/domain/strategy-certification';
import { createStrategyEligibility } from '../../modules/strategy-library/domain/strategy-eligibility';
import { createStrategyVersion } from '../../modules/strategy-library/domain/strategy-version';
import { StrategyLibraryController } from '../../modules/strategy-library/strategy-library.controller';
import type { AuthUser } from '../../modules/auth/jwt.strategy';
import { Role } from '../../modules/identity/role';

const OWNER: AuthUser = {
  userId: 'pc01-library-owner',
  email: 'pc01@example.com',
  displayName: 'PC-01',
  role: Role.Researcher,
};

/**
 * PC-01: Lookup / Eligibility HTTP transport over the existing Library SoT.
 * Process-local adapter remains the store — not a new persistence domain.
 */
describe('PC-01 — Strategy Library product', () => {
  it('exposes certified lookup and eligibility without aliasing /strategies', async () => {
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    const library = new InMemoryStrategyLibraryReadAdapter();
    const controller = new StrategyLibraryController(
      library,
      library,
      new WorkspaceAccessService(workspaces),
    );
    const workspace = await workspaces.create({ name: 'Paper Lab', ownerUserId: OWNER.userId });

    const strategy = createStrategy({
      strategyFamilyId: 'fam-momentum',
      name: 'Momentum',
      workspaceId: workspace.id,
      createdAt: '2026-08-10T12:00:00.000Z',
    });
    const version = createStrategyVersion({
      libraryEntryId: 'lib-entry-1',
      strategyFamilyId: 'fam-momentum',
      version: '1.0.0',
      contentHash: 'sha256:abc',
      market: 'crypto-spot',
      supportedExchangeScopeIds: ['binance-spot'],
      supportedTimeframes: ['1h', '4h'],
      supportedSymbols: ['BTCUSDT', 'ETHUSDT'],
      workspaceId: workspace.id,
      createdAt: '2026-08-10T12:00:00.000Z',
    });
    const certification = createStrategyCertification({
      certificationId: 'cert-1',
      strategyVersion: version,
      certifiedBy: 'operator-alice',
      certifiedAt: '2026-08-10T13:00:00.000Z',
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
        allowedSymbols: ['BTCUSDT', 'ETHUSDT'],
        allowedTimeframes: ['1h', '4h'],
        riskPerTrade: { min: 0.25, max: 1, step: 0.25 },
        maxPositions: { min: 1, max: 3 },
      },
    });
    const eligibility = createStrategyEligibility({
      eligibilityId: 'elig-1',
      certification,
      rulesVersion: 'rules-v1',
      evaluatedAt: '2026-08-10T14:00:00.000Z',
    });
    library.seedEntry({ strategy, version, certification, eligibility });

    const listed = controller.list({ user: OWNER }, workspace.id, {});
    expect(listed.items).toHaveLength(1);
    expect(listed.items[0]?.membershipStatus).toBe('certified');
    expect(listed.items[0]?.eligibility?.outcome).toBe('eligible');
    expect(listed.items[0]?.envelopeState).toBe('present');

    const detail = controller.getByLibraryEntryId({ user: OWNER }, workspace.id, {
      libraryEntryId: 'lib-entry-1',
    });
    expect(detail.version.immutable).toBe(true);
    expect(detail.certification?.status).toBe('active');

    const decision = controller.checkEligibility(
      { user: OWNER },
      workspace.id,
      { libraryEntryId: 'lib-entry-1' },
      { purpose: 'selection' },
    );
    expect(decision.outcome).toBe('eligible');
  });
});
