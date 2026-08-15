import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type {
  QualificationRunDetailView,
  QualificationTargetDetailView,
  QualificationWorkspaceView,
} from '../shared/api';
import { QualificationHistoryView } from './QualificationHistoryView';
import { emptyQualificationDraft, QualificationHomeView } from './QualificationHomeView';
import { QualificationRunView } from './QualificationRunView';
import { QualificationTargetView } from './QualificationTargetView';

const flags = {
  authorityClass: 'research_artifact' as const,
  forcesTrade: false as const,
  authorizesSession: false as const,
  isMarketProfile: false as const,
  isMarketState: false as const,
  isRiskEngine: false as const,
  isExecutionEngine: false as const,
  isTradingSession: false as const,
  scoresMarket: false as const,
  calculatesConfidence: false as const,
};

const actions = {
  canRequest: false,
  canConfirm: false,
  canCancel: false,
  canComplete: false,
  canFail: false,
  canRequalify: true,
};

const targetItem = {
  targetId: 'qual-tgt:ws-1:scope-binance:BTCUSDT',
  workspaceId: 'ws-1',
  exchangeScopeId: 'scope-binance',
  marketSymbol: 'BTCUSDT',
  displayName: 'BTCUSDT',
  lifecycleState: 'qualified',
  latestRunStatus: 'completed',
  confidenceLevel: 'medium' as string | null,
  healthStatus: 'healthy' as string | null,
  runCount: 1,
  updatedAt: '2026-08-15T20:02:00.000Z',
  ...flags,
};

const workspace: QualificationWorkspaceView = {
  workspaceId: 'ws-1',
  targetCount: 1,
  qualifiedCount: 1,
  qualifyingCount: 0,
  pendingConfirmCount: 0,
  failedCount: 0,
  runCount: 1,
  targets: [targetItem],
  recentRuns: [
    {
      qualificationRunId: 'qual-run:1',
      workspaceId: 'ws-1',
      targetId: targetItem.targetId,
      exchangeScopeId: 'scope-binance',
      marketSymbol: 'BTCUSDT',
      status: 'completed',
      modeContext: 'paper',
      createdAt: '2026-08-15T20:00:00.000Z',
      completedAt: '2026-08-15T20:02:00.000Z',
      ...flags,
    },
  ],
  ...flags,
};

const detail: QualificationTargetDetailView = {
  targetId: targetItem.targetId,
  workspaceId: 'ws-1',
  exchangeScopeId: 'scope-binance',
  marketSymbol: 'BTCUSDT',
  displayName: 'BTCUSDT',
  current: targetItem,
  lifecycle: {
    targetId: targetItem.targetId,
    workspaceId: 'ws-1',
    state: 'qualified',
    activeRunId: null,
    latestCompletedRunId: 'qual-run:1',
    latestProfileId: null,
    updatedAt: '2026-08-15T20:02:00.000Z',
    actions,
    ...flags,
  },
  confidence: {
    targetId: targetItem.targetId,
    workspaceId: 'ws-1',
    level: 'medium',
    score: null,
    rationaleSummary: 'Caller-supplied snapshot',
    sourceRunId: 'qual-run:1',
    asOf: '2026-08-15T20:02:00.000Z',
    staleLabel: 'as of 2026-08-15T20:02:00.000Z',
    ...flags,
  },
  health: {
    targetId: targetItem.targetId,
    workspaceId: 'ws-1',
    status: 'healthy',
    indicators: [{ key: 'data_freshness', value: 'ok', note: null }],
    sourceRunId: 'qual-run:1',
    asOf: '2026-08-15T20:02:00.000Z',
    ...flags,
  },
  runs: workspace.recentRuns,
  history: [
    {
      kind: 'lifecycle',
      at: '2026-08-15T20:02:00.000Z',
      summary: 'Lifecycle qualified',
      status: 'qualified',
      ...flags,
    },
  ],
  latestRun: null,
  ...flags,
};

const run: QualificationRunDetailView = {
  qualificationRunId: 'qual-run:1',
  workspaceId: 'ws-1',
  targetId: targetItem.targetId,
  exchangeScopeId: 'scope-binance',
  marketSymbol: 'BTCUSDT',
  displayName: 'BTCUSDT',
  status: 'requested',
  modeContext: 'paper',
  requestedBy: 'op-1',
  confirmedBy: null,
  createdAt: '2026-08-15T20:00:00.000Z',
  completedAt: null,
  rejectionReasons: [],
  inputSummary: {
    observationCount: 0,
    researchRefCount: 0,
    liveMarketDataRefs: [],
    researchOutputRefs: [],
  },
  lifecycle: detail.lifecycle,
  confidence: null,
  health: null,
  actions: { ...actions, canConfirm: true, canCancel: true, canFail: true, canRequalify: false },
  ...flags,
};

function readSrc(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), 'utf8');
}

describe('PC-08 Qualification product path', () => {
  it('registers qualification home, history, target, and run routes', () => {
    const app = readSrc('../app/App.tsx');
    expect(app).toContain('path="qualification"');
    expect(app).toContain('path="qualification/history"');
    expect(app).toContain('path="qualification/runs/:qualificationRunId"');
    expect(app).toContain('path="qualification/targets/:targetId"');
    expect(app).toContain('QualificationHomePage');
  });

  it('exposes Qualification ports over /qualification, not a trade API', () => {
    const api = readSrc('../shared/api.ts');
    expect(api).toContain('/qualification/workspace');
    expect(api).toContain('/qualification/runs');
    expect(api).toContain('requestQualificationRun');
    expect(api).toContain('confirmQualificationRun');
    expect(api).not.toContain("'/qualification/score'");
  });

  it('renders home, target, history, and run without Trade now or scoring', () => {
    const home = renderToStaticMarkup(
      <MemoryRouter>
        <QualificationHomeView
          workspace={workspace}
          scopes={[
            {
              exchangeScopeId: 'scope-binance',
              workspaceId: 'ws-1',
              venueCode: 'binance',
              displayName: 'Binance paper',
              lifecycleStatus: 'active',
              isActive: true,
              version: 1,
              maxActiveSessions: 1,
              modeContext: 'paper',
              modeContextIsLabelOnly: false,
              blocksNewSessionCapacity: false,
              authorityClass: 'exchange_scope_artifact',
              isRuntime: false,
              isTradingSession: false,
              isRiskEngine: false,
              isExecutionEngine: false,
              isStrategyLibrary: false,
              approvesRisk: false,
              submitsOrders: false,
              liveVenueAdapter: false,
              venueApiUsed: false,
              liveCapital: false,
              mutable: false,
            },
          ]}
          draft={emptyQualificationDraft([])}
          loading={false}
          requesting={false}
          error={null}
          onDraft={() => undefined}
          onRequest={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(home).toContain('Target browser');
    expect(home).toContain('never forces a trade');
    expect(home).not.toContain('Trade now');
    expect(home).not.toContain('Coming Soon');

    const target = renderToStaticMarkup(
      <MemoryRouter>
        <QualificationTargetView
          record={detail}
          tab="confidence"
          mode="paper"
          loading={false}
          busy={false}
          error={null}
          onTab={() => undefined}
          onMode={() => undefined}
          onRequalify={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(target).toContain('does not score');
    expect(target).toContain('Request requalification');

    const history = renderToStaticMarkup(
      <MemoryRouter>
        <QualificationHistoryView items={[...workspace.recentRuns]} loading={false} error={null} />
      </MemoryRouter>,
    );
    expect(history).toContain('Run history');

    const runHtml = renderToStaticMarkup(
      <MemoryRouter>
        <QualificationRunView
          record={run}
          failReason=""
          loading={false}
          busy={false}
          error={null}
          onFailReason={() => undefined}
          onConfirm={() => undefined}
          onCancel={() => undefined}
          onComplete={() => undefined}
          onFail={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(runHtml).toContain('Confirm run');
    expect(runHtml).toContain('does not score');
    expect(runHtml).not.toContain('Trade now');
  });
});
