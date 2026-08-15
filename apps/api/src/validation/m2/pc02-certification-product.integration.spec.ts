import { describe, expect, it } from 'vitest';
import { InMemoryWorkspaceRepository } from '../../modules/workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../../modules/workspace/workspace-access.service';
import { WorkspaceDomainService } from '../../modules/workspace/workspace-domain.service';
import { InMemoryStrategyLibraryCertificationAdapter } from '../../modules/strategy-library/adapters/in-memory-strategy-library-certification.adapter';
import { InMemoryStrategyLibraryReadAdapter } from '../../modules/strategy-library/adapters/in-memory-strategy-library-read.adapter';
import { StrategyLibraryCertificationController } from '../../modules/strategy-library/strategy-library-certification.controller';
import { StrategyLibraryController } from '../../modules/strategy-library/strategy-library.controller';
import type { AuthUser } from '../../modules/auth/jwt.strategy';
import { Role } from '../../modules/identity/role';
import type { CertifyStrategyVersionBodyDto } from '../dto/strategy-library.dto';

const OWNER: AuthUser = {
  userId: 'pc02-cert-owner',
  email: 'pc02@example.com',
  displayName: 'PC-02',
  role: Role.Researcher,
};

function body(): CertifyStrategyVersionBodyDto {
  return {
    family: { name: 'Momentum', registryRef: 'st-momentum' },
    version: {
      version: '1.0.0',
      contentHash: 'research:st-momentum:1.0.0',
      market: 'crypto-spot',
      supportedExchangeScopeIds: ['binance-spot'],
      supportedTimeframes: ['1h'],
      supportedSymbols: ['BTCUSDT'],
    },
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
  };
}

/**
 * PC-02: Certification HTTP over the existing Library SoT.
 * Lookup reflects certified membership immediately. Not /strategies.
 */
describe('PC-02 — Certification product', () => {
  it('certifies a candidate, records history/reasons, and updates Library lookup', () => {
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    const library = new InMemoryStrategyLibraryReadAdapter();
    const certification = new InMemoryStrategyLibraryCertificationAdapter(library);
    const access = new WorkspaceAccessService(workspaces);
    const certifyController = new StrategyLibraryCertificationController(certification, access);
    const lookupController = new StrategyLibraryController(library, library, access);

    return workspaces.create({ name: 'Paper Lab', ownerUserId: OWNER.userId }).then((workspace) => {
      const rejected = certifyController.certify({ user: OWNER }, workspace.id, {
        ...body(),
        evidence: [body().evidence[0]!],
      });
      expect(rejected.outcome).toBe('rejected');
      expect(rejected.reasons.length).toBeGreaterThan(0);

      const admitted = certifyController.certify({ user: OWNER }, workspace.id, body());
      expect(admitted.outcome).toBe('certified');
      expect(admitted.libraryEntryId).toBeTruthy();

      const listed = lookupController.list({ user: OWNER }, workspace.id, {});
      expect(listed.items).toHaveLength(1);
      expect(listed.items[0]?.membershipStatus).toBe('certified');
      expect(listed.items[0]?.version.libraryEntryId).toBe(admitted.libraryEntryId);
      expect(listed.items[0]?.certification?.certifiedBy).toBe(OWNER.userId);

      const history = certifyController.listHistory({ user: OWNER }, workspace.id, {});
      expect(history.items.map((item) => item.outcome)).toEqual(['certified', 'rejected']);
    });
  });
});
