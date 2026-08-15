import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { MarketStateTargetDetailView, MarketStateWorkspaceView } from '../shared/api';
import { MarketStateHistoryView } from './MarketStateHistoryView';
import { MarketStateHomeView } from './MarketStateHomeView';
import { MarketStateTargetView } from './MarketStateTargetView';
import { MarketStateVersionView } from './MarketStateVersionView';

const flags = {
  authorityClass: 'market_state_artifact' as const,
  forcesTrade: false as const,
  isQualification: false as const,
  isProfile: false as const,
  authorizesRuntime: false as const,
  classifiesMarket: false as const,
  selectsStrategy: false as const,
  orchestrates: false as const,
};

const targetId = 'mkt-state:ws-1:scope-binance:BTCUSDT';

const versionItem = {
  marketStateId: `${targetId}:v2`,
  workspaceId: 'ws-1',
  targetId,
  exchangeScopeId: 'scope-binance',
  marketSymbol: 'BTCUSDT',
  version: 2,
  lifecycleStatus: 'active',
  regimeLabel: 'quiet',
  publishedAt: '2026-08-15T21:00:00.000Z',
  publishedBy: 'pipeline-1',
  isCurrent: true,
  ...flags,
};

const workspace: MarketStateWorkspaceView = {
  workspaceId: 'ws-1',
  targetCount: 1,
  versionCount: 2,
  currentCount: 1,
  current: [
    {
      marketStateId: versionItem.marketStateId,
      workspaceId: 'ws-1',
      targetId,
      exchangeScopeId: 'scope-binance',
      marketSymbol: 'BTCUSDT',
      displayName: 'BTCUSDT',
      version: 2,
      versionCount: 2,
      lifecycleStatus: 'active',
      regimeLabel: 'quiet',
      publishedAt: versionItem.publishedAt,
      publishedBy: 'pipeline-1',
      isCurrent: true,
      isStale: false,
      ...flags,
    },
  ],
  recentVersions: [versionItem],
  ...flags,
};

const detail: MarketStateTargetDetailView = {
  targetId,
  workspaceId: 'ws-1',
  exchangeScopeId: 'scope-binance',
  marketSymbol: 'BTCUSDT',
  displayName: 'BTCUSDT',
  currentVersion: 2,
  current: {
    marketStateId: versionItem.marketStateId,
    workspaceId: 'ws-1',
    targetId,
    exchangeScopeId: 'scope-binance',
    marketSymbol: 'BTCUSDT',
    displayName: 'BTCUSDT',
    version: 2,
    isCurrent: true,
    currentVersion: 2,
    lifecycle: {
      marketStateId: versionItem.marketStateId,
      targetId,
      status: 'active',
      updatedAt: versionItem.publishedAt,
      updatedBy: 'pipeline-1',
      reason: 'activated',
      isStale: false,
      ...flags,
    },
    snapshot: {
      regimeLabel: 'quiet',
      volatilityLabel: 'moderate',
      liquidityLabel: null,
      narrativeSummary: 'caller-supplied snapshot',
    },
    metadata: {
      marketStateId: versionItem.marketStateId,
      workspaceId: 'ws-1',
      targetId,
      exchangeScopeId: 'scope-binance',
      marketSymbol: 'BTCUSDT',
      version: 2,
      observationAsOf: versionItem.publishedAt,
      confidenceRef: 'run-1',
      profileRef: 'mp-1',
      inputSummary: 'qualification observed; profile v2',
      notes: null,
      publishedAt: versionItem.publishedAt,
      publishedBy: 'pipeline-1',
      ...flags,
    },
    qualification: {
      present: true,
      qualificationTargetId: 'qual-tgt:ws-1:scope-binance:BTCUSDT',
      lifecycleState: 'qualified',
      confidenceLevel: 'high',
      healthStatus: null,
      latestRunStatus: 'completed',
      sourceRunId: 'run-1',
      asOf: versionItem.publishedAt,
      ...flags,
    },
    profile: {
      present: true,
      marketProfileId: 'mp-1',
      profileTargetId: 'qual-tgt:ws-1:scope-binance:BTCUSDT',
      version: 2,
      qualificationRunId: 'run-1',
      confidenceLevel: 'high',
      publishedAt: versionItem.publishedAt,
      ...flags,
    },
    versions: [versionItem],
    transitions: [
      {
        marketStateId: versionItem.marketStateId,
        workspaceId: 'ws-1',
        targetId,
        exchangeScopeId: 'scope-binance',
        marketSymbol: 'BTCUSDT',
        fromVersion: 1,
        toVersion: 2,
        fromLifecycle: 'active',
        toLifecycle: 'active',
        transitionedAt: versionItem.publishedAt,
        ...flags,
      },
    ],
    ...flags,
  },
  versions: [versionItem],
  transitions: [
    {
      marketStateId: versionItem.marketStateId,
      workspaceId: 'ws-1',
      targetId,
      exchangeScopeId: 'scope-binance',
      marketSymbol: 'BTCUSDT',
      fromVersion: 1,
      toVersion: 2,
      fromLifecycle: 'active',
      toLifecycle: 'active',
      transitionedAt: versionItem.publishedAt,
      ...flags,
    },
  ],
  ...flags,
};

function readSrc(relative: string): string {
  return readFileSync(resolve(__dirname, relative), 'utf8');
}

describe('PC-10 Market State product path', () => {
  it('registers market state home, history, target, and version routes', () => {
    const app = readSrc('../app/App.tsx');
    expect(app).toContain('path="market-state"');
    expect(app).toContain('path="market-state/history"');
    expect(app).toContain('path="market-state/targets/:targetId"');
    expect(app).toContain('path="market-state/targets/:targetId/versions/:version"');
    expect(app).toContain('MarketStateHomePage');
  });

  it('exposes Market State query/refresh over /market-states, not classify or orchestrate', () => {
    const api = readSrc('../shared/api.ts');
    expect(api).toContain('/market-states/workspace');
    expect(api).toContain('/market-states/history');
    expect(api).toContain('getCurrentMarketState');
    expect(api).toContain('refreshMarketState');
    expect(api).not.toContain("'/market-states/classify'");
    expect(api).not.toContain('classifyMarketState');
  });

  it('renders home, target, history, and version without Trade now or classification', () => {
    const home = renderToStaticMarkup(
      <MemoryRouter>
        <MarketStateHomeView workspace={workspace} loading={false} error={null} />
      </MemoryRouter>,
    );
    expect(home).toContain('Current State');
    expect(home).toContain('never classifies on this page');
    expect(home).not.toContain('Trade now');
    expect(home).not.toContain('Coming Soon');

    const target = renderToStaticMarkup(
      <MemoryRouter>
        <MarketStateTargetView
          record={detail}
          tab="qualification"
          loading={false}
          refreshing={false}
          error={null}
          onTab={() => undefined}
          onRefresh={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(target).toContain('does not classify markets');
    expect(target).toContain('Current Qualification reference');
    expect(target).toContain('Refresh');

    const history = renderToStaticMarkup(
      <MemoryRouter>
        <MarketStateHistoryView
          items={[...workspace.recentVersions]}
          loading={false}
          error={null}
        />
      </MemoryRouter>,
    );
    expect(history).toContain('History');

    const versionHtml = renderToStaticMarkup(
      <MemoryRouter>
        <MarketStateVersionView record={detail.current} loading={false} error={null} />
      </MemoryRouter>,
    );
    expect(versionHtml).toContain('Current version');
    expect(versionHtml).not.toContain('Trade now');
  });
});
