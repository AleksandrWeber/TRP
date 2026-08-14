import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';
import {
  EXCHANGE_SCOPE_CONSUMER_READ_PORT,
  EXCHANGE_SCOPE_SERVICE_PORT,
  type ExchangeScopeConsumerReadPort,
  type ExchangeScopeServicePort,
} from '../modules/exchange-scope/ports/exchange-scope.port';
import { ExchangeScopeModule } from '../modules/exchange-scope/exchange-scope.module';
import { InMemoryExchangeScopeStore } from '../modules/exchange-scope/adapters/in-memory-exchange-scope-store';
import { assertSameExchangeScope } from '../modules/exchange-scope/domain/trading-path-scope';
import { validateDeployment } from '../modules/runtime-enforcement/domain/validate-deployment';
import { RuntimeEnforcementRejectedError } from '../modules/runtime-enforcement/runtime-enforcement-rejected.error';
import { StrategyDeploymentStatus } from '../modules/strategy-deployment/domain/strategy-deployment';
import { StrategyDeploymentService } from '../modules/strategy-deployment/strategy-deployment.service';
import { bootOrchestratorScenario, E2E_AS_OF } from './v2-e2e-fixtures';

describe('RC-28 Epic 4 — fail-closed path', () => {
  it('Gate rejects missing identity and missing Library record without throwing', () => {
    const emptyReads = {
      getByLibraryEntryId: () => null,
      getByFamilyVersion: () => null,
      familyExistsInWorkspace: () => false,
    };
    const missingIdentity = validateDeployment(
      { workspaceId: 'ws-1', purpose: 'deployment_bind' },
      emptyReads,
      E2E_AS_OF,
    );
    expect(missingIdentity.outcome).toBe('fail');
    expect(missingIdentity.validation).toBe('INVALID');

    const missingRecord = validateDeployment(
      {
        workspaceId: 'ws-1',
        libraryEntryId: 'missing-entry',
        purpose: 'deployment_bind',
        requestedAt: E2E_AS_OF,
      },
      emptyReads,
      E2E_AS_OF,
    );
    expect(missingRecord.outcome).toBe('fail');
    expect(missingRecord.validation).toBe('INVALID');
  });

  it('Orchestrator does not emit Session handoff intent when Gate fails', async () => {
    const orch = await bootOrchestratorScenario();
    const requested = orch.service.requestOrchestrationRun({
      workspaceId: 'ws-1',
      exchangeScopeId: 'binance-spot',
      marketSymbol: 'BTCUSDT',
      modeContext: 'paper',
      requestedBy: 'op-1',
      asOf: E2E_AS_OF,
    });
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
    vi.spyOn(orch.gateConsumer, 'validateDeployment').mockReturnValue({
      outcome: 'fail',
      validation: 'INVALID',
      reasons: Object.freeze(['certification_not_active']),
      checkedAt: E2E_AS_OF,
      decisionRef: 'enf:mock-fail',
    });
    const handed = orch.service.emitSessionHandoff({
      workspaceId: 'ws-1',
      orchestrationRunId: requested.orchestrationRunId,
      selectionDecisionId: proposed.selectionDecisionId!,
      deploymentBindRef: 'deploy-ref-1',
      requestedBy: 'op-1',
      asOf: E2E_AS_OF,
    });
    expect(handed.outcome).toBe('rejected');
    expect(handed.sessionHandoffIntentId).toBeFalsy();
    expect(handed.submitsOrders).toBe(false);
    await orch.moduleRef.close();
  });

  it('Strategy Deployment bind fails closed on Gate reject and does not become Session/Orders', async () => {
    const enforcement = {
      validateDeployment: vi.fn(() =>
        Object.freeze({
          outcome: 'fail' as const,
          validation: 'INVALID' as const,
          reasons: Object.freeze(['certification_not_active']),
          checkedAt: E2E_AS_OF,
        }),
      ),
    };
    const repository = {
      create: vi.fn(),
      save: vi.fn(async (row: { status: string }) => row),
      findById: vi.fn(async () =>
        Object.freeze({
          id: 'dep-1',
          workspaceId: 'workspace-1',
          strategyId: 'strategy-1',
          strategyVersion: '1.0.0',
          instrument: 'BTCUSDT',
          timeframe: '1h',
          status: StrategyDeploymentStatus.DRAFT,
          version: 1,
          configurationHash: 'hash',
        }),
      ),
      findByIdempotencyKey: vi.fn(),
      listByWorkspace: vi.fn(),
    };
    const service = new StrategyDeploymentService(
      repository as never,
      { getById: vi.fn(async () => ({ id: 'strategy-1', status: 'active' })) } as never,
      { run: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({})) } as never,
      { append: vi.fn(async () => undefined) } as never,
      enforcement as never,
    );
    await expect(
      service.approve({
        workspaceId: 'workspace-1',
        deploymentId: 'dep-1',
        actorId: 'op-1',
        approvedAt: E2E_AS_OF,
        recordedAt: E2E_AS_OF,
      }),
    ).rejects.toBeInstanceOf(RuntimeEnforcementRejectedError);
    expect(enforcement.validateDeployment).toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects cross-exchange fund / capacity mixing (isolation scenario)', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ExchangeScopeModule],
    }).compile();
    const store = moduleRef.get(InMemoryExchangeScopeStore);
    store.clear();
    const service = moduleRef.get<ExchangeScopeServicePort>(EXCHANGE_SCOPE_SERVICE_PORT);
    const consumer = moduleRef.get<ExchangeScopeConsumerReadPort>(
      EXCHANGE_SCOPE_CONSUMER_READ_PORT,
    );
    for (const venue of [
      { code: 'binance', cap: 3 },
      { code: 'bybit', cap: 1 },
    ] as const) {
      service.registerExchangeScope({
        workspaceId: 'ws-iso',
        venueCode: venue.code,
        displayName: venue.code,
        requestedBy: 'iso',
        requestedAt: E2E_AS_OF,
        maxActiveSessions: venue.cap,
      });
      service.activateExchangeScope({
        workspaceId: 'ws-iso',
        exchangeScopeId: `exchange-scope:${venue.code}`,
        requestedBy: 'iso',
        asOf: E2E_AS_OF,
      });
      service.bindTradingAccount({
        workspaceId: 'ws-iso',
        exchangeScopeId: `exchange-scope:${venue.code}`,
        tradingAccountId: `acct-${venue.code}`,
        requestedBy: 'iso',
        asOf: E2E_AS_OF,
      });
    }
    const binance = consumer.listAccountBindingProjections({
      workspaceId: 'ws-iso',
      exchangeScopeId: 'exchange-scope:binance',
    });
    const bybit = consumer.listAccountBindingProjections({
      workspaceId: 'ws-iso',
      exchangeScopeId: 'exchange-scope:bybit',
    });
    expect(binance.map((row) => row.tradingAccountId)).toEqual(['acct-binance']);
    expect(bybit.map((row) => row.tradingAccountId)).toEqual(['acct-bybit']);
    expect(() =>
      assertSameExchangeScope('exchange-scope:binance', 'exchange-scope:bybit', 'funds'),
    ).toThrow(/mismatch/);
    await moduleRef.close();
  });
});
