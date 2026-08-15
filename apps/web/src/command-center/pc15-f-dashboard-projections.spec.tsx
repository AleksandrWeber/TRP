import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { SessionDetailView } from './SessionDetailView';
import type { TradingSessionBotView } from '../shared/api';

function readSrc(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), 'utf8');
}

const session: TradingSessionBotView = {
  id: 'session-1',
  tradingSessionId: 'session-1',
  workspaceId: 'ws-1',
  exchangeScopeId: 'exchange-scope:binance',
  paperAccountId: 'acct-1',
  status: 'running',
  state: 'running',
  mission: { deploymentId: 'dep-1' },
  origin: 'strategy',
  version: 2,
  failureReason: null,
  createdAt: '2026-08-15T12:00:00.000Z',
  recordedAt: '2026-08-15T12:00:01.000Z',
  actorId: 'user-1',
  correlationId: null,
  leaseOwnerId: 'user-1',
  fencingToken: 1,
  health: { lifecycleStatus: 'running', leasePresent: true, failureReason: null },
  runtimeStatus: {
    workerState: 'ARMED',
    acceptsTicks: true,
    fencingToken: 1,
    evaluationEnabled: true,
  },
  deploymentReference: { deploymentId: 'dep-1' },
  latestReport: {
    reportRunId: 'run-1',
    status: 'completed',
    tradingSessionId: 'session-1',
    narrativeAttached: true,
    narrativeUnavailable: false,
  },
  delivery: {
    deliveryId: 'del-1',
    reportRunId: 'run-1',
    outcome: 'skipped',
    telegramAdapterReached: false,
    skipReasons: ['channel-not-connected'],
  },
};

describe('PC-15 15-f — Dashboard and Command Center projections', () => {
  it('reuses existing session GET fields for report and delivery without a new resource', () => {
    const api = readSrc('../shared/api.ts');
    expect(api).toContain('latestReport?:');
    expect(api).toContain('delivery?:');
    expect(api).toContain("'/trading-sessions'");
    expect(api).not.toContain('/reports');
  });

  it('renders report and delivery projections on the existing session surfaces', () => {
    const detail = renderToStaticMarkup(
      <MemoryRouter>
        <SessionDetailView
          session={session}
          loading={false}
          error={null}
          orchestration={null}
          commandsDisabled={false}
          onRequestAction={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(detail).toContain('data-testid="session-latest-report"');
    expect(detail).toContain('run-1');
    expect(detail).toContain('data-testid="session-delivery"');
    expect(detail).toContain('skipped');
    expect(detail).not.toContain('Coming Soon');
    expect(detail).not.toMatch(/['"`]\/reports(?:\/|['"`?]|$)/);

    const inspector = readSrc('./panels/SessionDetailInspectorPanel.tsx');
    expect(inspector).toContain('cc-p7-report');
    expect(inspector).toContain('cc-p7-delivery');
    expect(inspector).not.toContain('Coming Soon');
  });

  it('loads Home paper sessions and runtime from existing APIs only', () => {
    const home = readSrc('../pages/HomePage.tsx');
    expect(home).toContain('listTradingSessions');
    expect(home).toContain('getRuntimeHealth');
    expect(home).toContain('Paper sessions');
    expect(home).toContain('Runtime');
    expect(home).not.toMatch(/['"`]\/reports(?:\/|['"`?]|$)/);
    expect(home).not.toContain('Coming Soon');
    expect(home).not.toContain('/production');
  });
});
