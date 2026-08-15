import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { MarketProfileTargetDetailView, MarketProfileWorkspaceView } from '../shared/api';
import { MarketProfileHistoryView } from './MarketProfileHistoryView';
import { MarketProfileHomeView } from './MarketProfileHomeView';
import { MarketProfileTargetView } from './MarketProfileTargetView';
import { MarketProfileVersionView } from './MarketProfileVersionView';

const flags = {
  authorityClass: 'research_artifact' as const,
  forcesTrade: false as const,
  authorizesSession: false as const,
  isMarketQualification: false as const,
  isMarketState: false as const,
  isRiskEngine: false as const,
  isExecutionEngine: false as const,
  isTradingSession: false as const,
  calculatesProfile: false as const,
  scoresMarket: false as const,
};

const targetId = 'qual-tgt:ws-1:scope-binance:BTCUSDT';

const versionItem = {
  marketProfileId: 'mkt-profile:a:v2',
  workspaceId: 'ws-1',
  targetId,
  exchangeScopeId: 'scope-binance',
  marketSymbol: 'BTCUSDT',
  version: 2,
  qualificationRunId: 'qual-run:2',
  publishedAt: '2026-08-15T21:00:00.000Z',
  publishedBy: 'pipeline-1',
  confidenceLevel: 'high' as string | null,
  isLatest: true,
  ...flags,
};

const workspace: MarketProfileWorkspaceView = {
  workspaceId: 'ws-1',
  targetCount: 1,
  versionCount: 2,
  latestCount: 1,
  latest: [
    {
      marketProfileId: versionItem.marketProfileId,
      workspaceId: 'ws-1',
      targetId,
      exchangeScopeId: 'scope-binance',
      marketSymbol: 'BTCUSDT',
      displayName: 'BTCUSDT',
      version: 2,
      versionCount: 2,
      qualificationRunId: 'qual-run:2',
      publishedAt: versionItem.publishedAt,
      publishedBy: 'pipeline-1',
      confidenceLevel: 'high',
      isLatest: true,
      ...flags,
    },
  ],
  recentVersions: [versionItem],
  ...flags,
};

const detail: MarketProfileTargetDetailView = {
  targetId,
  workspaceId: 'ws-1',
  exchangeScopeId: 'scope-binance',
  marketSymbol: 'BTCUSDT',
  displayName: 'BTCUSDT',
  currentPublishedVersion: 2,
  latest: {
    marketProfileId: versionItem.marketProfileId,
    workspaceId: 'ws-1',
    targetId,
    exchangeScopeId: 'scope-binance',
    marketSymbol: 'BTCUSDT',
    displayName: 'BTCUSDT',
    version: 2,
    isLatest: true,
    isCurrentPublished: true,
    currentPublishedVersion: 2,
    metadata: {
      marketProfileId: versionItem.marketProfileId,
      workspaceId: 'ws-1',
      targetId,
      exchangeScopeId: 'scope-binance',
      marketSymbol: 'BTCUSDT',
      version: 2,
      publishedAt: versionItem.publishedAt,
      publishedBy: 'pipeline-1',
      qualificationRunId: 'qual-run:2',
      confidenceLevel: 'high',
      confidenceScore: 0.7,
      confidenceSourceRunId: 'qual-run:2',
      rationaleSummary: 'caller-supplied only',
      ...flags,
    },
    publishedSource: {
      qualificationRunId: 'qual-run:2',
      sourceRunId: 'qual-run:2',
      publishedAt: versionItem.publishedAt,
      publishedBy: 'pipeline-1',
      targetId,
      exchangeScopeId: 'scope-binance',
      marketSymbol: 'BTCUSDT',
      ...flags,
    },
    dimensions: {
      marketProfileId: versionItem.marketProfileId,
      version: 2,
      volatility: {
        kind: 'volatility',
        regimeLabel: 'moderate',
        windowSummary: 'caller-supplied window',
        notes: null,
        metrics: [{ key: 'realized_range', value: '0.02' }],
      },
      liquidity: {
        kind: 'liquidity',
        regimeLabel: 'moderate',
        windowSummary: 'caller-supplied window',
        notes: null,
        metrics: [{ key: 'volume_level', value: '1' }],
      },
      trend: {
        kind: 'trend',
        regimeLabel: 'low',
        windowSummary: 'caller-supplied window',
        notes: null,
        metrics: [{ key: 'directional_bias', value: '0' }],
      },
      structure: {
        kind: 'structure',
        regimeLabel: null,
        windowSummary: null,
        notes: null,
        metrics: [{ key: 'symbol_status', value: 'active' }],
      },
      ...flags,
    },
    versions: [versionItem],
    ...flags,
  },
  versions: [versionItem],
  ...flags,
};

function readSrc(relative: string): string {
  return readFileSync(resolve(__dirname, relative), 'utf8');
}

describe('PC-09 Market Profile product path', () => {
  it('registers profile home, history, target, and version routes', () => {
    const app = readSrc('../app/App.tsx');
    expect(app).toContain('path="market-profile"');
    expect(app).toContain('path="market-profile/history"');
    expect(app).toContain('path="market-profile/targets/:targetId"');
    expect(app).toContain('path="market-profile/targets/:targetId/versions/:version"');
    expect(app).toContain('MarketProfileHomePage');
  });

  it('exposes Profile query ports over /market-profiles, not a publish or trade API', () => {
    const api = readSrc('../shared/api.ts');
    expect(api).toContain('/market-profiles/workspace');
    expect(api).toContain('/market-profiles/history');
    expect(api).toContain('getLatestMarketProfile');
    expect(api).toContain('compareMarketProfileVersions');
    expect(api).not.toContain("'/market-profiles/publish'");
  });

  it('renders home, target, history, and version without Trade now or scoring', () => {
    const home = renderToStaticMarkup(
      <MemoryRouter>
        <MarketProfileHomeView workspace={workspace} loading={false} error={null} />
      </MemoryRouter>,
    );
    expect(home).toContain('Latest Profile');
    expect(home).toContain('never forces a trade');
    expect(home).not.toContain('Trade now');
    expect(home).not.toContain('Coming Soon');

    const target = renderToStaticMarkup(
      <MemoryRouter>
        <MarketProfileTargetView
          record={detail}
          tab="source"
          fromVersion={1}
          toVersion={2}
          compared={null}
          comparing={false}
          loading={false}
          error={null}
          onTab={() => undefined}
          onFromVersion={() => undefined}
          onToVersion={() => undefined}
          onCompare={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(target).toContain('does not calculate dimensions');
    expect(target).toContain('Published from Qualification');

    const history = renderToStaticMarkup(
      <MemoryRouter>
        <MarketProfileHistoryView
          items={[...workspace.recentVersions]}
          loading={false}
          error={null}
        />
      </MemoryRouter>,
    );
    expect(history).toContain('Version history');

    const versionHtml = renderToStaticMarkup(
      <MemoryRouter>
        <MarketProfileVersionView record={detail.latest} loading={false} error={null} />
      </MemoryRouter>,
    );
    expect(versionHtml).toContain('Current published version');
    expect(versionHtml).not.toContain('Trade now');
  });
});
