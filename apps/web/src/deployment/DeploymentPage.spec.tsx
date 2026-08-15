import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { StrategyDeploymentView, StrategyLibraryRecordView } from '../shared/api';
import { DeploymentDetailView } from './DeploymentDetailView';
import { DeploymentListView } from './DeploymentListView';
import { DeploymentWizardView } from './DeploymentWizardView';
import type { DeploymentWizardDraft } from './deployment-wizard';

const entry: StrategyLibraryRecordView = {
  authorityClass: 'source_of_truth',
  membershipStatus: 'certified',
  strategy: {
    strategyFamilyId: 'fam-momentum',
    name: 'Momentum',
    description: null,
    registryRef: 'st-1',
    workspaceId: 'ws-1',
    createdAt: '2026-08-15T12:00:00.000Z',
  },
  version: {
    libraryEntryId: 'lib-entry-1',
    strategyFamilyId: 'fam-momentum',
    version: '1.0.0',
    contentHash: 'sha256:abc',
    market: 'crypto-spot',
    supportedExchangeScopeIds: ['binance-spot'],
    supportedTimeframes: ['1h'],
    supportedUniverse: { kind: 'symbols', symbols: ['BTCUSDT'] },
    workspaceId: 'ws-1',
    createdAt: '2026-08-15T12:00:00.000Z',
    immutable: true,
  },
  certification: null,
  eligibility: null,
  tacticalEnvelope: {
    envelopeVersion: 'env-1',
    allowedMarkets: ['crypto-spot'],
    allowedExchangeScopeIds: ['binance-spot'],
    allowedSymbols: ['BTCUSDT'],
    allowedTimeframes: ['1h'],
    riskPerTrade: { min: 0.25, max: 1, step: 0.25 },
    maxPositions: { min: 1, max: 3 },
    parameterLimits: {},
    executionConstraints: null,
    optionalFilters: [],
    provenanceRefs: [],
  },
  envelopeState: 'present',
};

const draft: DeploymentWizardDraft = {
  entry,
  instrument: 'BTCUSDT',
  timeframe: '1h',
  notes: '',
};

const deployment: StrategyDeploymentView = {
  id: 'dep-1',
  workspaceId: 'ws-1',
  exchangeScopeId: 'binance-spot',
  strategyId: 'st-1',
  strategyVersion: '1.0.0',
  libraryEntryId: 'lib-entry-1',
  experimentId: null,
  parameters: {},
  instrument: 'BTCUSDT',
  timeframe: '1h',
  marketDataSourceId: 'binance-spot',
  paperExecutionConfigurationId: 'paper-config-us167',
  riskPolicyId: 'm2-baseline-paper-risk',
  riskPolicyVersion: 1,
  configurationHash: 'abc',
  status: 'draft',
  version: 1,
  approvedAt: null,
  approvedByActorId: null,
  createdAt: '2026-08-15T16:00:00.000Z',
  recordedAt: '2026-08-15T16:00:00.000Z',
  actorId: 'trader-1',
  correlationId: null,
  metadata: { strategyName: 'Momentum', strategyFamilyId: 'fam-momentum' },
  enforcementAuthorization: {
    outcome: 'pass',
    validation: 'VALID',
    purpose: 'deployment_bind',
    libraryEntryId: 'lib-entry-1',
    certificationStatus: 'active',
    eligibilityOutcome: 'eligible',
    checkedAt: '2026-08-15T16:00:00.000Z',
    reasons: [],
  },
};

describe('Deployment UI (PC-03)', () => {
  it('renders the wizard version, point, and confirm steps without auto-deploy', () => {
    const versionHtml = renderToStaticMarkup(
      <MemoryRouter>
        <DeploymentWizardView
          step="version"
          draft={{ ...draft, entry: null }}
          entries={[entry]}
          loading={false}
          submitting={false}
          error={null}
          onSelect={() => undefined}
          onInstrument={() => undefined}
          onTimeframe={() => undefined}
          onNotes={() => undefined}
          onBack={() => undefined}
          onNext={() => undefined}
          onSubmit={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(versionHtml).toContain('Create a Deployment');
    expect(versionHtml).toContain('Momentum');
    expect(versionHtml).not.toContain('Coming Soon');
    expect(versionHtml).not.toContain('Start session');

    const confirmHtml = renderToStaticMarkup(
      <MemoryRouter>
        <DeploymentWizardView
          step="confirm"
          draft={draft}
          entries={[entry]}
          loading={false}
          submitting={true}
          error={null}
          onSelect={() => undefined}
          onInstrument={() => undefined}
          onTimeframe={() => undefined}
          onNotes={() => undefined}
          onBack={() => undefined}
          onNext={() => undefined}
          onSubmit={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(confirmHtml).toContain('Create Deployment');
    expect(confirmHtml).toContain('Creating Deployment and running Runtime Validation');
    expect(confirmHtml).toContain('There is no automatic deploy');
    expect(confirmHtml).not.toContain('Force');
  });

  it('renders list, history, status, runtime result, and library version', () => {
    const listHtml = renderToStaticMarkup(
      <MemoryRouter>
        <DeploymentListView items={[deployment]} loading={false} error={null} variant="list" />
      </MemoryRouter>,
    );
    expect(listHtml).toContain('Deployments');
    expect(listHtml).toContain('Draft');
    expect(listHtml).toContain('Gate PASS');
    expect(listHtml).toContain('href="/deployments/dep-1"');

    const historyHtml = renderToStaticMarkup(
      <MemoryRouter>
        <DeploymentListView items={[deployment]} loading={false} error={null} variant="history" />
      </MemoryRouter>,
    );
    expect(historyHtml).toContain('Deployment history');
    expect(historyHtml).toContain('data-testid="deployment-history"');
  });

  it('renders details with approve, metadata, and no session start', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <DeploymentDetailView
          record={deployment}
          loading={false}
          error={null}
          approving={false}
          onApprove={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(html).toContain('Draft');
    expect(html).toContain('Runtime Validation PASS');
    expect(html).toContain('v1.0.0');
    expect(html).toContain('Approve Deployment');
    expect(html).toContain('binance-spot');
    expect(html).not.toContain('Start session');
    expect(html).not.toContain('Coming Soon');
    expect(html).not.toContain('Force');
  });
});
