import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildCreateTradingSessionRequest } from './create-bot-wizard';
import { handoffCreatesSession, matchOrchestrationReference } from './orchestration-reference';
import type { OrchestrationRunDetailView, StrategyDeploymentView } from '../shared/api';

function readSrc(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), 'utf8');
}

const approved: StrategyDeploymentView = {
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
  status: 'approved',
  version: 1,
  approvedAt: '2026-08-15T16:00:00.000Z',
  approvedByActorId: 'trader-1',
  createdAt: '2026-08-15T16:00:00.000Z',
  recordedAt: '2026-08-15T16:00:00.000Z',
  actorId: 'trader-1',
  correlationId: null,
  metadata: {},
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

describe('PC-15 15-a — Orchestrator → Session wiring', () => {
  it('passes SessionHandoffIntent into existing Session create without a new screen', () => {
    const request = buildCreateTradingSessionRequest(
      { deployment: approved, currency: 'USDT', openingCapital: '100000' },
      'acct-1',
      'handoff-1',
    );
    expect(request.sessionHandoffIntentId).toBe('handoff-1');
    expect(request.origin).toBe('strategy');
    expect(request.deploymentId).toBe('dep-1');

    const wizard = readSrc('./CreateBotWizardPage.tsx');
    expect(wizard).toContain('loadOrchestrationReference');
    expect(wizard).toContain('sessionHandoffIntentId');
    expect(wizard).not.toContain('Coming Soon');
    expect(wizard).not.toContain('Start session from Orchestrator');
  });

  it('keeps createsSession false on the consumed handoff reference', () => {
    const details: OrchestrationRunDetailView[] = [
      {
        orchestrationRunId: 'run-1',
        workspaceId: 'ws-1',
        exchangeScopeId: 'binance-spot',
        marketSymbol: 'BTCUSDT',
        modeContext: 'paper',
        status: 'completed',
        marketStateId: 'ms-1',
        orchestrationPlanId: 'plan-1',
        selectionDecisionId: 'sel-1',
        sessionHandoffIntentId: 'handoff-1',
        objective: 'paper',
        rejectionReasons: [],
        requiresConfirmation: false,
        createdAt: '2026-08-15T16:00:00.000Z',
        updatedAt: '2026-08-15T16:00:00.000Z',
        authorityClass: 'orchestration_artifact',
        forcesTrade: false,
        approvesRisk: false,
        submitsOrders: false,
        ownsSessionLifecycle: false,
        selection: null,
        handoff: {
          sessionHandoffIntentId: 'handoff-1',
          orchestrationRunId: 'run-1',
          selectionDecisionId: 'sel-1',
          workspaceId: 'ws-1',
          deploymentBindRef: 'dep-1',
          enforcementDecisionRef: 'gate-1',
          status: 'proposed',
          proposedAt: '2026-08-15T16:00:00.000Z',
          authorityClass: 'orchestration_artifact',
          isOrder: false,
          isRiskDecision: false,
          createsSession: false,
        },
      },
    ];
    const reference = matchOrchestrationReference(details, 'dep-1');
    expect(reference?.createsSession).toBe(false);
    expect(handoffCreatesSession(details[0]?.handoff ?? null)).toBe(false);
  });

  it('does not add Orchestrator Session ownership or order controls', () => {
    const api = readSrc('../shared/api.ts');
    expect(api).toContain('sessionHandoffIntentId?: string');
    expect(api).toContain('consumed: true');
    expect(api).toContain('createsSession: false');
    const detail = readSrc('./SessionDetailPage.tsx');
    expect(detail).toContain('sessionHandoff');
    expect(detail).toContain('createsSession: false');
    expect(detail).not.toContain('submitOrder');
  });
});
