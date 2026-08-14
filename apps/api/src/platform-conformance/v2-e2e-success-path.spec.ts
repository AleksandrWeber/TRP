import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { toBotView } from '../modules/bot-facade/domain/bot-view';
import { CanonicalOrderPathService } from '../modules/canonical-order-path/canonical-order-path.service';
import { createOrder } from '../modules/orders/domain/order';
import { createOrderIntent, OrderSide, OrderType } from '../modules/orders/domain/order-intent';
import { OrderStatus } from '../modules/orders/domain/order-status';
import { RiskDecisionStatus } from '../modules/risk';
import { createHistoricalWindow } from '../modules/reporting/domain/historical-window';
import { createReportDefinition } from '../modules/reporting/domain/report-definition';
import { validateDeployment } from '../modules/runtime-enforcement/domain/validate-deployment';
import { createTradingSession } from '../modules/trading-session/domain/trading-session';
import { V2_APPROVED_PORT_FILES } from './v2-authority-graph';
import { V2_WORKFLOW_CONTRACT_FILES } from './v2-workflow-graph';
import {
  bootNotificationScenario,
  bootOrchestratorScenario,
  bootProjectionScenario,
  E2E_AS_OF,
  e2eCertifiedRecord,
  e2eLibraryReads,
} from './v2-e2e-fixtures';
import { V2_E2E_SCENARIO_IDS, V2_E2E_SCENARIOS } from './v2-e2e-scenarios';

const API_ROOT = process.cwd();

describe('RC-28 Epic 4 — successful end-to-end path', () => {
  it('catalogs eight representative scenarios on existing ports only', () => {
    expect(V2_E2E_SCENARIOS.map((row) => row.scenarioId)).toEqual([...V2_E2E_SCENARIO_IDS]);
    const knownPorts = new Set([
      ...Object.keys(V2_APPROVED_PORT_FILES),
      ...Object.keys(V2_WORKFLOW_CONTRACT_FILES),
      'CANONICAL_ORDER_PATH_PORT',
    ]);
    for (const scenario of V2_E2E_SCENARIOS) {
      expect(scenario.newApi).toBe(false);
      expect(scenario.ownershipTransfer).toBe(false);
      for (const token of scenario.ports) {
        expect(knownPorts.has(token), token).toBe(true);
      }
    }
  });

  it('certified strategy → Gate pass → Orchestrator handoff → paper Session → Lake → Report → AI → Notification → Command Center', async () => {
    const record = e2eCertifiedRecord();
    const gate = validateDeployment(
      {
        workspaceId: 'ws-1',
        libraryEntryId: 'lib-entry-1',
        purpose: 'deployment_bind',
        requestedAt: E2E_AS_OF,
      },
      e2eLibraryReads(record),
      E2E_AS_OF,
    );
    expect(gate.outcome).toBe('pass');
    expect(gate.validation).toBe('VALID');

    const orch = await bootOrchestratorScenario();
    const requested = orch.service.requestOrchestrationRun({
      workspaceId: 'ws-1',
      exchangeScopeId: 'binance-spot',
      marketSymbol: 'BTCUSDT',
      modeContext: 'paper',
      requestedBy: 'op-1',
      asOf: E2E_AS_OF,
    });
    expect(requested.outcome).toBe('accepted');
    expect(requested.submitsOrders).toBe(false);

    const proposed = orch.service.proposeSelection({
      workspaceId: 'ws-1',
      orchestrationRunId: requested.orchestrationRunId,
      libraryEntryId: 'lib-entry-1',
      strategyVersionId: '1.0.0',
      envelopeVersion: 'env-1',
      tacticPoint: { symbol: 'BTCUSDT', timeframe: '1h', riskPerTrade: 0.5 },
      proposedBy: 'op-1',
      asOf: E2E_AS_OF,
    });
    expect(proposed.outcome).toBe('proposed');

    const handed = orch.service.emitSessionHandoff({
      workspaceId: 'ws-1',
      orchestrationRunId: requested.orchestrationRunId,
      selectionDecisionId: proposed.selectionDecisionId!,
      deploymentBindRef: 'deploy-ref-1',
      requestedBy: 'op-1',
      asOf: E2E_AS_OF,
    });
    expect(handed.outcome).toBe('handed_off');
    const intent = orch.query.getSessionHandoffIntent({
      workspaceId: 'ws-1',
      sessionHandoffIntentId: handed.sessionHandoffIntentId!,
    });
    expect(intent?.createsSession).toBe(false);
    expect(intent?.isOrder).toBe(false);

    const session = createTradingSession({
      id: 'session-e2e-1',
      workspaceId: 'ws-1',
      paperAccountId: 'acct-1',
      exchangeScopeId: 'binance-spot',
      deploymentId: 'deploy-ref-1',
      origin: 'strategy',
      actorId: 'op-1',
      idempotencyKey: 'e2e-session-1',
      createdAt: E2E_AS_OF,
      recordedAt: E2E_AS_OF,
    });
    const bot = toBotView(session);
    expect(bot.id).toBe(session.id);
    expect(bot.mission.deploymentId).toBe('deploy-ref-1');

    const proposedOrder = createOrder(
      createOrderIntent({
        clientOrderId: 'si_cccccccccccccccccccccccccccccccc',
        idempotencyKey: 'signal-intent:' + 'e'.repeat(64),
        workspaceId: 'ws-1',
        paperAccountId: 'acct-1',
        tradingSessionId: session.id,
        sessionFencingToken: 1,
        mode: 'paper',
        origin: 'strategy',
        signalIntentId: 'si_cccccccccccccccccccccccccccccccc',
        signalIntentHash: 'e'.repeat(64),
        instrument: 'BTCUSDT',
        side: OrderSide.BUY,
        type: OrderType.MARKET,
        quantity: '0.1',
        marketCheckpoint: { streamId: 'binance:BTCUSDT:1m', sequence: 1, eventId: 'evt-1' },
        actorId: 'runtime-1',
        occurredAt: E2E_AS_OF,
        recordedAt: E2E_AS_OF,
      }),
    );
    expect(proposedOrder.intent.mode).toBe('paper');
    const states = [proposedOrder];
    const path = new CanonicalOrderPathService(
      {
        get: async () => states.at(-1)!,
        transition: async (command: { toStatus: OrderStatus }) => {
          const next = Object.freeze({
            ...states.at(-1)!,
            status: command.toStatus,
            version: states.at(-1)!.version + 1,
          });
          states.push(next as typeof proposedOrder);
          return next;
        },
      } as never,
      {
        evaluate: async () =>
          Object.freeze({
            id: 'risk-e2e',
            status: RiskDecisionStatus.APPROVED,
            workspaceId: 'ws-1',
            orderId: proposedOrder.id,
            intentHash: proposedOrder.intent.intentHash,
            policyId: 'm2-baseline-paper-risk',
            policyVersion: 1,
            policyHash: 'policy',
            inputHash: 'input',
            ruleResults: [],
            reasons: [],
            evaluatedAt: E2E_AS_OF,
            expiresAt: E2E_AS_OF,
            recordedAt: E2E_AS_OF,
            actorId: 'path',
            correlationId: null,
            input: {} as never,
          }),
      } as never,
      { reserveCash: async () => ({ id: 'res-e2e' }) } as never,
      { submit: async () => undefined } as never,
    );
    const advanced = await path.advanceToExecutable({
      workspaceId: 'ws-1',
      orderId: proposedOrder.id,
      actorId: 'path',
      evaluatedAt: E2E_AS_OF,
      recordedAt: E2E_AS_OF,
      requireStrategyOrigin: true,
      reservation: { currency: 'USDT', amount: '10' },
      risk: {
        account: {
          id: 'acct-1',
          workspaceId: 'ws-1',
          mode: 'paper',
          status: 'active',
          version: 1,
        },
        session: {
          id: session.id,
          workspaceId: 'ws-1',
          paperAccountId: 'acct-1',
          status: 'running',
          version: 1,
          fencingToken: 1,
          reconciled: true,
        },
        market: {
          workspaceId: 'ws-1',
          streamId: 'binance:BTCUSDT:1m',
          eventId: 'evt-1',
          sequence: 1,
          instrument: 'BTCUSDT',
          health: 'healthy',
          referencePrice: '100',
          occurredAt: E2E_AS_OF,
          projectionVersion: 1,
        },
        cash: {
          workspaceId: 'ws-1',
          paperAccountId: 'acct-1',
          currency: 'USDT',
          availableCash: '10000',
          version: 1,
          reconciled: true,
        },
        reservation: null,
        position: null,
        portfolio: {
          workspaceId: 'ws-1',
          paperAccountId: 'acct-1',
          checkpointId: 'pf-1',
          version: 1,
          reconciled: true,
        },
        duplicateIntent: false,
        unresolvedReconciliation: false,
      },
    });
    expect(advanced.outcome).toBe('executable');
    expect(advanced.order.intent.mode).toBe('paper');

    const projections = await bootProjectionScenario();
    const admitted = projections.lake.admit({
      eventId: 'evt-e2e-fill',
      occurredAt: E2E_AS_OF,
      producer: 'execution-engine',
      category: 'Trading',
      mode: 'paper',
      workspaceId: 'ws-1',
      tradingSessionId: session.id,
      payload: { kind: 'fill_marker', displayPnl: 4 },
      schemaVersion: '1',
    });
    expect(admitted.outcome).toBe('admitted');
    projections.reporting.registerDefinition(
      createReportDefinition({
        reportDefinitionId: 'def-e2e',
        workspaceId: 'ws-1',
        name: 'E2E Ops',
        kind: 'ops_daily',
        defaultModes: ['paper'],
        metricKeys: ['fact_count', 'display_pnl_projection'],
        createdAt: E2E_AS_OF,
      }),
    );
    const report = projections.reporting.requestReportRun({
      workspaceId: 'ws-1',
      reportDefinitionId: 'def-e2e',
      window: createHistoricalWindow({
        from: '2026-08-14T00:00:00.000Z',
        to: '2026-08-15T00:00:00.000Z',
      }),
      modes: ['paper'],
      requestedAt: E2E_AS_OF,
      reportRunId: 'run-e2e-1',
    });
    expect(report.outcome).toBe('completed');
    const narrative = projections.ai.generateNarrative({
      workspaceId: 'ws-1',
      reportRunId: 'run-e2e-1',
      requestedAt: E2E_AS_OF,
    });
    expect(narrative.authorityClass).toBe('narrative');

    const notify = await bootNotificationScenario();
    const connect = notify.service.connectTelegram({
      workspaceId: 'ws-1',
      userId: 'op-1',
      requestedAt: E2E_AS_OF,
    });
    notify.service.completeTelegramConnect({
      connectionToken: connect.connection.connectionToken!,
      chatId: 'chat-e2e',
      completedAt: E2E_AS_OF,
    });
    const delivered = notify.port.deliver({
      workspaceId: 'ws-1',
      userId: 'op-1',
      type: 'daily-report',
      subject: 'E2E report ready',
      body: narrative.text,
      reportRunId: 'run-e2e-1',
      requestedAt: E2E_AS_OF,
    });
    expect(delivered.outcome).toBe('delivered');
    expect(delivered.reportRunId).toBe('run-e2e-1');

    const commands = readFileSync(
      join(API_ROOT, '../web/src/command-center/session-commands.ts'),
      'utf8',
    );
    expect(commands).toMatch(/pauseTradingSession/);
    expect(commands).toMatch(/stopTradingSession/);
    expect(commands).not.toMatch(/submitOrder/);

    await orch.moduleRef.close();
    await projections.moduleRef.close();
    await notify.moduleRef.close();
  });
});
