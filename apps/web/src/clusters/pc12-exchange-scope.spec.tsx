import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { ExchangeScopeDetailView, ExchangeScopeWorkspaceView } from '../shared/api';
import { ClusterDetailView, draftFromDetail } from './ClusterDetailView';
import { ClusterHomeView, emptyClusterDraft } from './ClusterHomeView';

const flags = {
  authorityClass: 'exchange_scope_artifact' as const,
  isRuntime: false as const,
  isTradingSession: false as const,
  isRiskEngine: false as const,
  isExecutionEngine: false as const,
  isStrategyLibrary: false as const,
  approvesRisk: false as const,
  submitsOrders: false as const,
  liveVenueAdapter: false as const,
  venueApiUsed: false as const,
  liveCapital: false as const,
  mutable: false as const,
};

const item = {
  exchangeScopeId: 'exchange-scope:binance',
  workspaceId: 'ws-1',
  venueCode: 'binance',
  displayName: 'Binance paper',
  lifecycleStatus: 'active',
  isActive: true,
  version: 1,
  maxActiveSessions: 2,
  modeContext: 'paper',
  modeContextIsLabelOnly: false,
  blocksNewSessionCapacity: false,
  ...flags,
};

const workspace: ExchangeScopeWorkspaceView = {
  workspaceId: 'ws-1',
  scopeCount: 1,
  activeCount: 1,
  suspendedCount: 0,
  createdCount: 0,
  archivedCount: 0,
  currentActive: [item],
  scopes: [item],
  venues: [
    {
      venueCode: 'binance',
      label: 'Binance',
      offered: true,
      liveAdapter: false,
      venueApiUsed: false,
    },
    { venueCode: 'bybit', label: 'Bybit', offered: true, liveAdapter: false, venueApiUsed: false },
    {
      venueCode: 'kraken',
      label: 'Kraken',
      offered: true,
      liveAdapter: false,
      venueApiUsed: false,
    },
    { venueCode: 'okx', label: 'OKX', offered: true, liveAdapter: false, venueApiUsed: false },
  ],
  inventsBalances: false,
  inventsFills: false,
  inventsRiskApprovals: false,
  ...flags,
};

const detail: ExchangeScopeDetailView = {
  exchangeScopeId: item.exchangeScopeId,
  workspaceId: 'ws-1',
  venueCode: 'binance',
  displayName: 'Binance paper',
  lifecycle: {
    exchangeScopeId: item.exchangeScopeId,
    workspaceId: 'ws-1',
    status: 'active',
    isActive: true,
    updatedAt: '2026-08-15T20:01:00.000Z',
    updatedBy: 'op-1',
    reason: 'activate exchange scope',
    blocksNewSessionCapacity: false,
    authorizesRuntime: false,
    executesActions: false,
    actions: {
      canActivate: false,
      canSuspend: true,
      canArchive: true,
      canRename: true,
      canUpdateConfig: true,
      canPublishPolicy: true,
      canBind: true,
    },
    ...flags,
  },
  current: item,
  config: {
    exchangeScopeId: item.exchangeScopeId,
    version: 1,
    maxActiveSessions: 2,
    symbolAllowlist: ['BTCUSDT'],
    strategyAllowlist: [],
    modeContext: 'paper',
    modeContextIsLabelOnly: false,
    updatedAt: '2026-08-15T20:00:00.000Z',
    updatedBy: 'op-1',
    ...flags,
  },
  versions: [
    {
      exchangeScopeId: item.exchangeScopeId,
      version: 1,
      displayName: 'Binance paper',
      lifecycleStatus: 'active',
      publishedAt: '2026-08-15T20:00:00.000Z',
      publishedBy: 'op-1',
      maxActiveSessions: 2,
      modeContext: 'paper',
      inputSummary: 'registered isolation scope',
      ...flags,
    },
  ],
  policies: [
    {
      exchangeRiskPolicyId: 'erp-1',
      exchangeScopeId: item.exchangeScopeId,
      workspaceId: 'ws-1',
      policyVersion: 1,
      maxExposureLabel: 'paper-cap',
      maxOrderNotionalLabel: 'paper-order',
      notes: 'policy input only',
      publishedAt: '2026-08-15T20:03:00.000Z',
      publishedBy: 'op-1',
      authorityClass: 'exchange_policy_input',
      isRiskDecision: false,
      approvesRisk: false,
      isRiskEngine: false,
      liveVenueAdapter: false,
      venueApiUsed: false,
      mutable: false,
    },
  ],
  currentPolicy: {
    exchangeRiskPolicyId: 'erp-1',
    exchangeScopeId: item.exchangeScopeId,
    workspaceId: 'ws-1',
    policyVersion: 1,
    maxExposureLabel: 'paper-cap',
    maxOrderNotionalLabel: 'paper-order',
    notes: 'policy input only',
    publishedAt: '2026-08-15T20:03:00.000Z',
    publishedBy: 'op-1',
    authorityClass: 'exchange_policy_input',
    isRiskDecision: false,
    approvesRisk: false,
    isRiskEngine: false,
    liveVenueAdapter: false,
    venueApiUsed: false,
    mutable: false,
  },
  bindings: [
    {
      tradingAccountBindingId: 'tab-1',
      exchangeScopeId: item.exchangeScopeId,
      workspaceId: 'ws-1',
      tradingAccountId: 'paper-account-1',
      status: 'bound',
      boundAt: '2026-08-15T20:04:00.000Z',
      boundBy: 'op-1',
      ownsLedger: false,
      movesBalances: false,
      ...flags,
    },
  ],
  adapterContext: null,
  metadata: {
    exchangeScopeId: item.exchangeScopeId,
    workspaceId: 'ws-1',
    asOf: '2026-08-15T20:00:00.000Z',
    inputSummary: 'registered isolation scope',
    adapterContextRef: null,
    policyRef: null,
    ownsStrategyLibrary: false,
    ownsRuntimeEnforcement: false,
    ownsTradingSession: false,
    ownsRiskDecisions: false,
    ownsOrders: false,
    ownsExecution: false,
    ownsAccounting: false,
    ...flags,
  },
  history: [
    {
      kind: 'policy',
      at: '2026-08-15T20:03:00.000Z',
      by: 'op-1',
      summary: 'Policy input v1',
      policyVersion: 1,
      ...flags,
    },
  ],
  activeStatus: {
    isActive: true,
    lifecycleStatus: 'active',
    blocksNewSessionCapacity: false,
  },
  ...flags,
};

describe('PC-12 Exchange Scope Cluster UI', () => {
  it('shows workspace scopes, venue catalog, and create without live adapters', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ClusterHomeView
          workspace={workspace}
          draft={emptyClusterDraft(workspace.venues)}
          loading={false}
          creating={false}
          error={null}
          onDraft={() => undefined}
          onCreate={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(html).toContain('Exchange Scope');
    expect(html).toContain('Binance paper');
    expect(html).toContain('Current active Cluster');
    expect(html).toContain('Scope browser');
    expect(html).toContain('Create Cluster');
    expect(html).toContain('not a live exchange');
    expect(html).not.toContain('Connect');
    expect(html).not.toContain('Live Bots');
  });

  it('shows existing bindings, policies, lifecycle, history, and metadata', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ClusterDetailView
          record={detail}
          tab="bindings"
          draft={draftFromDetail(detail)}
          loading={false}
          busy={false}
          error={null}
          onTab={() => undefined}
          onDraft={() => undefined}
          onRename={() => undefined}
          onActivate={() => undefined}
          onSuspend={() => undefined}
          onArchive={() => undefined}
          onSaveConfig={() => undefined}
          onPublishPolicy={() => undefined}
          onBind={() => undefined}
          onUnbind={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(html).toContain('paper-account-1');
    expect(html).toContain('Venue APIs are not used');
    expect(html).toContain('data-testid="cluster-bind"');

    const lifecycle = renderToStaticMarkup(
      <MemoryRouter>
        <ClusterDetailView
          record={detail}
          tab="lifecycle"
          draft={draftFromDetail(detail)}
          loading={false}
          busy={false}
          error={null}
          onTab={() => undefined}
          onDraft={() => undefined}
          onRename={() => undefined}
          onActivate={() => undefined}
          onSuspend={() => undefined}
          onArchive={() => undefined}
          onSaveConfig={() => undefined}
          onPublishPolicy={() => undefined}
          onBind={() => undefined}
          onUnbind={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(lifecycle).toContain('data-testid="cluster-suspend"');
    expect(lifecycle).toContain('data-testid="cluster-archive"');
    expect(lifecycle).not.toContain('data-testid="cluster-activate"');

    const history = renderToStaticMarkup(
      <MemoryRouter>
        <ClusterDetailView
          record={detail}
          tab="history"
          draft={draftFromDetail(detail)}
          loading={false}
          busy={false}
          error={null}
          onTab={() => undefined}
          onDraft={() => undefined}
          onRename={() => undefined}
          onActivate={() => undefined}
          onSuspend={() => undefined}
          onArchive={() => undefined}
          onSaveConfig={() => undefined}
          onPublishPolicy={() => undefined}
          onBind={() => undefined}
          onUnbind={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(history).toContain('Policy input v1');
  });
});
