import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { CreateBotWizardView } from './CreateBotWizardView';
import { SessionDetailView } from './SessionDetailView';
import { INITIAL_CREATE_BOT_DRAFT } from './create-bot-wizard';
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
};

describe('PC-13 Command Center product path', () => {
  it('registers create-bot and session detail routes', () => {
    const app = readSrc('../app/App.tsx');
    expect(app).toContain('path="command-center/new"');
    expect(app).toContain('path="command-center/sessions/:sessionId"');
    expect(app).toContain('CreateBotWizardPage');
    expect(app).toContain('SessionDetailPage');
    expect(app).not.toContain('LiveTradingPage');
  });

  it('exposes existing Session create/start REST, not orders or live kill', () => {
    const api = readSrc('../shared/api.ts');
    expect(api).toContain("'/trading-sessions'");
    expect(api).toContain('`/trading-sessions/${id}/start`');
    expect(api).toContain("'/paper-accounts'");
    expect(api).toContain('createTradingSession');
    expect(api).toContain('startTradingSession');
    expect(api).not.toContain('/orders/submit');
  });

  it('keeps Command Center as paper operations without Coming Soon or Emergency Controls', () => {
    const layout = readSrc('../layout/AppLayout.tsx');
    const catalog = readSrc('../shared/product-ui/catalog.ts');
    const wizard = readSrc('./CreateBotWizardView.tsx');
    const detail = readSrc('./SessionDetailView.tsx');
    const workspace = readSrc('./components/CommandCenterWorkspace.tsx');
    expect(catalog).toContain("label: 'Command Center'");
    expect(layout).not.toContain('Coming Soon');
    expect(layout).not.toContain("label: 'Live Bots'");
    expect(wizard).not.toContain('Coming Soon');
    expect(wizard).toContain('does not authorize live trading');
    expect(detail).toContain('Creates Session: false');
    expect(workspace).not.toContain('EmergencyControlsPanel');
  });

  it('renders create wizard and session monitoring surfaces', () => {
    const wizard = renderToStaticMarkup(
      <MemoryRouter>
        <CreateBotWizardView
          step="deployment"
          draft={INITIAL_CREATE_BOT_DRAFT}
          deployments={[]}
          loading={false}
          submitting={false}
          progress={null}
          error={null}
          onSelectDeployment={() => undefined}
          onCurrency={() => undefined}
          onOpeningCapital={() => undefined}
          onBack={() => undefined}
          onNext={() => undefined}
          onSubmit={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(wizard).toContain('data-testid="create-bot-wizard"');
    expect(wizard).toContain('Create paper bot');

    const detail = renderToStaticMarkup(
      <MemoryRouter>
        <SessionDetailView
          session={session}
          loading={false}
          error={null}
          orchestration={{
            orchestrationRunId: 'run-1',
            sessionHandoffIntentId: 'handoff-1',
            createsSession: false,
          }}
          commandsDisabled={false}
          onRequestAction={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(detail).toContain('data-testid="session-health"');
    expect(detail).toContain('data-testid="session-runtime"');
    expect(detail).toContain('data-testid="session-deployment-reference"');
    expect(detail).toContain('data-testid="session-orchestration-reference"');
    expect(detail).toContain('data-testid="session-latest-report"');
    expect(detail).toContain('data-testid="session-delivery"');
    expect(detail).toContain('No report run for this session yet.');
    expect(detail).toContain('No delivery recorded for this session yet.');
    expect(detail).toContain('data-testid="session-detail-pause"');
    expect(detail).not.toContain('Emergency Stop');
    expect(detail).not.toContain('Coming Soon');
  });
});
