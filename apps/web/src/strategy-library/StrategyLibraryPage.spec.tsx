import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { StrategyLibraryRecordView } from '../shared/api';
import { LibraryBrowserView } from './LibraryBrowserView';
import { StrategyLibraryDetailView } from './StrategyLibraryDetailView';
import { groupLibraryByFamily } from './library-browser';

const certified: StrategyLibraryRecordView = {
  authorityClass: 'source_of_truth',
  membershipStatus: 'certified',
  strategy: {
    strategyFamilyId: 'fam-momentum',
    name: 'Momentum',
    description: 'Trend follower',
    registryRef: null,
    workspaceId: 'ws-1',
    createdAt: '2026-08-10T12:00:00.000Z',
  },
  version: {
    libraryEntryId: 'lib-entry-1',
    strategyFamilyId: 'fam-momentum',
    version: '1.0.0',
    contentHash: 'sha256:abc',
    market: 'crypto-spot',
    supportedExchangeScopeIds: ['binance-spot'],
    supportedTimeframes: ['1h', '4h'],
    supportedUniverse: { kind: 'symbols', symbols: ['BTCUSDT', 'ETHUSDT'] },
    workspaceId: 'ws-1',
    createdAt: '2026-08-10T12:00:00.000Z',
    immutable: true,
  },
  certification: {
    certificationId: 'cert-1',
    status: 'active',
    decision: 'admitted',
    certifiedAt: '2026-08-10T13:00:00.000Z',
    certifiedBy: 'operator-alice',
    notes: null,
    contentHash: 'sha256:abc',
    evidence: [
      { evidenceId: 'ev-1', type: 'backtesting', sourceRef: { owner: 'backtesting', id: 'bt-1' } },
    ],
  },
  eligibility: {
    eligibilityId: 'elig-1',
    outcome: 'eligible',
    reasons: ['eligible'],
    rulesVersion: 'rules-v1',
    evaluatedAt: '2026-08-10T14:00:00.000Z',
  },
  tacticalEnvelope: {
    envelopeVersion: 'env-1',
    allowedMarkets: ['crypto-spot'],
    allowedExchangeScopeIds: ['binance-spot'],
    allowedSymbols: ['BTCUSDT', 'ETHUSDT'],
    allowedTimeframes: ['1h', '4h'],
    riskPerTrade: { min: 0.25, max: 1, step: 0.25 },
    maxPositions: { min: 1, max: 3 },
    parameterLimits: {},
    executionConstraints: null,
    optionalFilters: [],
    provenanceRefs: [],
  },
  envelopeState: 'present',
};

const deprecated: StrategyLibraryRecordView = {
  ...certified,
  membershipStatus: 'deprecated',
  version: { ...certified.version, libraryEntryId: 'lib-entry-0', version: '0.9.0' },
  certification: certified.certification
    ? { ...certified.certification, status: 'deprecated' }
    : null,
  eligibility: {
    eligibilityId: 'elig-0',
    outcome: 'ineligible',
    reasons: ['certification_deprecated'],
    rulesVersion: 'rules-v1',
    evaluatedAt: '2026-08-11T12:00:00.000Z',
  },
};

describe('Strategy Library UI (PC-01)', () => {
  it('renders empty library as a valid product state', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <LibraryBrowserView
          families={[]}
          search=""
          filter="certified"
          loading={false}
          error={null}
          onSearch={() => undefined}
          onFilter={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(html).toContain('Strategy Library');
    expect(html).toContain('No certified strategies in this workspace.');
    expect(html).toContain('Certify a strategy');
    expect(html).toContain('Certification history');
    expect(html).toContain('data-testid="library-search-input"');
    expect(html).not.toContain('Coming Soon');
    expect(html).not.toContain('Edit');
  });

  it('renders version history with certification, eligibility, and envelope badges', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <LibraryBrowserView
          families={groupLibraryByFamily([certified, deprecated])}
          search=""
          filter="all"
          loading={false}
          error={null}
          onSearch={() => undefined}
          onFilter={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(html).toContain('Momentum');
    expect(html).toContain('2 versions');
    expect(html).toContain('Certified');
    expect(html).toContain('Deprecated');
    expect(html).toContain('Eligible');
    expect(html).toContain('Envelope');
    expect(html).toContain('href="/strategy-library/lib-entry-1"');
  });

  it('inspects an immutable version without edit controls', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <StrategyLibraryDetailView
          record={certified}
          eligibility={{
            outcome: 'eligible',
            reasons: ['eligible'],
            status: 'certified',
            checkedAt: '2026-08-15T12:00:00.000Z',
            libraryEntryId: 'lib-entry-1',
            eligibilityId: 'elig-1',
          }}
          error={null}
          loading={false}
        />
      </MemoryRouter>,
    );
    expect(html).toContain('Immutable version');
    expect(html).toContain('This version cannot be edited');
    expect(html).toContain('sha256:abc');
    expect(html).toContain('operator-alice');
    expect(html).toContain('env-1');
    expect(html).toContain('BTCUSDT');
    expect(html).toContain('Eligible');
    expect(html).toContain('Create Deployment');
    expect(html).not.toContain('Save');
    expect(html).not.toContain('Certify');
  });
});
