import { ExecutionContext, type Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import { AppController } from '../../app.controller';
import { MetricsController } from '../../metrics/metrics.controller';
import { Role } from '../identity/role';
import { AiAnalyticsProductController } from '../ai-analytics-product/ai-analytics.controller';
import { AiController } from '../ai/ai.controller';
import { ExchangeScopeQueryController } from '../bot-facade/exchange-scope-query.controller';
import { TradingSessionCommandController } from '../bot-facade/trading-session-command.controller';
import { TradingSessionQueryController } from '../bot-facade/trading-session-query.controller';
import { CampaignExportController } from '../campaign-export/campaign-export.controller';
import { CampaignImportController } from '../campaign-import/campaign-import.controller';
import { CampaignHistoryController } from '../campaign-persistence/campaign-history.controller';
import { CrossCampaignAnalysisController } from '../cross-campaign-analysis/cross-campaign-analysis.controller';
import { DatasetsController } from '../datasets/datasets.controller';
import { EvaluationSchedulerController } from '../evaluation-scheduler/evaluation-scheduler.controller';
import { EventsController } from '../events/events.controller';
import { ExchangeAdapterController } from '../exchange-adapter/exchange-adapter.controller';
import { ExchangeScopeProductController } from '../exchange-scope-product/exchange-scope.controller';
import { ExperimentsController } from '../experiments/experiments.controller';
import { HealthController } from '../health/health.controller';
import { RuntimeHealthController } from '../health/runtime-health.controller';
import { HistoricalResearchController } from '../historical-research/historical-research.controller';
import { InsightController } from '../insight/insight.controller';
import { JobController } from '../jobs/job.controller';
import { KnowledgeLakeProductController } from '../knowledge-lake-product/knowledge-lake.controller';
import { KnowledgeController } from '../knowledge/knowledge.controller';
import { MarketDataQueryController } from '../live-market-data/api/market-data-query.controller';
import { MarketProjectionSseController } from '../live-market-data/api/market-projection-sse.controller';
import { LiveTradingController } from '../live-trading-engine/live-trading.controller';
import { MarketDataDomainController } from '../market-data-domain/market-data-domain.controller';
import { MarketProfileProductController } from '../market-profile-product/market-profile.controller';
import { MarketStateProductController } from '../market-state-product/market-state.controller';
import {
  NotificationChannelsController,
  NotificationDeliveriesController,
  NotificationPreferencesController,
  NotificationRoutingController,
  NotificationSettingsController,
} from '../notification-product/notification.controller';
import { OrderController } from '../order-engine/order.controller';
import { OrdersController } from '../orders/orders.controller';
import { PaperAccountController } from '../paper-account/paper-account.controller';
import { PaperTradingController as PaperTradingEngineController } from '../paper-trading-engine/paper-trading.controller';
import { PaperTradingExecutorController } from '../paper-trading-executor/paper-trading-executor.controller';
import { PaperTradingController as ManualPaperTradingController } from '../paper-trading/paper-trading.controller';
import { PortfolioController } from '../portfolio-engine/portfolio.controller';
import { PositionController } from '../position-engine/position.controller';
import { AccountingQueryController } from '../positions/accounting-query.controller';
import { ProductionController } from '../production/production.controller';
import { QualificationProductController } from '../qualification-product/qualification.controller';
import { RecommendationController } from '../recommendation/recommendation.controller';
import {
  ReportingDefinitionController,
  ReportingRunController,
} from '../reporting-product/reporting.controller';
import { ResearchAnalysisController } from '../research-analysis/research-analysis.controller';
import { CampaignController } from '../research-campaign/campaign.controller';
import { ResearchCampaignController } from '../research-campaign/research-campaign.controller';
import { ResearchControlCenterController } from '../research-control-center/research-control-center.controller';
import { ResearchReportController } from '../research-report/research-report.controller';
import { RiskController } from '../risk-engine/risk.controller';
import { RuntimeValidationController } from '../runtime-enforcement/runtime-validation.controller';
import { SignalEngineController } from '../signal-engine/signal-engine.controller';
import { StrategiesController } from '../strategies/strategies.controller';
import { StrategyDeploymentController } from '../strategy-deployment/strategy-deployment.controller';
import { StrategyLibraryCertificationController } from '../strategy-library/strategy-library-certification.controller';
import { StrategyLibraryController } from '../strategy-library/strategy-library.controller';
import { SignalIntentController } from '../strategy-runtime/signal-intent.controller';
import { TelegramController } from '../telegram-product/telegram.controller';
import { TradingOrchestratorController } from '../trading-orchestrator/trading-orchestrator.controller';
import { WorkflowController } from '../workflow/workflow.controller';
import { WorkspaceController } from '../workspace/workspace.controller';
import { AuthController } from './auth.controller';
import { collectControllerHandlers, isHandlerClassified } from './surface-coverage';
import { PermissionClass } from './permission-catalog';
import { RolesGuard } from './roles.guard';
import type { AuthUser } from './jwt.strategy';
import { PeopleController } from '../identity/people.controller';

const CUSTOMER_CONTROLLERS: readonly Type<object>[] = [
  AppController,
  MetricsController,
  AuthController,
  AiAnalyticsProductController,
  AiController,
  ExchangeScopeQueryController,
  TradingSessionCommandController,
  TradingSessionQueryController,
  CampaignExportController,
  CampaignImportController,
  CampaignHistoryController,
  CrossCampaignAnalysisController,
  DatasetsController,
  EvaluationSchedulerController,
  EventsController,
  ExchangeAdapterController,
  ExchangeScopeProductController,
  ExperimentsController,
  HealthController,
  RuntimeHealthController,
  HistoricalResearchController,
  InsightController,
  JobController,
  KnowledgeLakeProductController,
  KnowledgeController,
  MarketDataQueryController,
  MarketProjectionSseController,
  LiveTradingController,
  MarketDataDomainController,
  MarketProfileProductController,
  MarketStateProductController,
  NotificationSettingsController,
  NotificationPreferencesController,
  NotificationChannelsController,
  NotificationRoutingController,
  NotificationDeliveriesController,
  OrderController,
  OrdersController,
  PaperAccountController,
  PaperTradingEngineController,
  PaperTradingExecutorController,
  ManualPaperTradingController,
  PortfolioController,
  PositionController,
  AccountingQueryController,
  ProductionController,
  QualificationProductController,
  RecommendationController,
  ReportingRunController,
  ReportingDefinitionController,
  ResearchAnalysisController,
  CampaignController,
  ResearchCampaignController,
  ResearchControlCenterController,
  ResearchReportController,
  RiskController,
  RuntimeValidationController,
  SignalEngineController,
  StrategiesController,
  StrategyDeploymentController,
  StrategyLibraryCertificationController,
  StrategyLibraryController,
  SignalIntentController,
  TelegramController,
  TradingOrchestratorController,
  WorkflowController,
  WorkspaceController,
  PeopleController,
];

const PUBLIC_HANDLERS = new Set([
  'AppController.getRoot',
  'MetricsController.scrape',
  'HealthController.getHealth',
  'RuntimeHealthController.getHealth',
  'AuthController.register',
  'AuthController.login',
  'AuthController.refresh',
  'AuthController.logout',
  'AuthController.csrf',
  'AuthController.recovery',
  'AuthController.forgotPassword',
  'AuthController.resetPassword',
]);

function user(role: Role): AuthUser {
  return { userId: 'user-1', email: 'op@trp.local', displayName: 'Operator', role };
}

function contextFor(
  controller: Type<object>,
  handler: string,
  caller?: AuthUser,
): ExecutionContext {
  return {
    getHandler: () => (controller.prototype as Record<string, unknown>)[handler],
    getClass: () => controller,
    switchToHttp: () => ({
      getRequest: () => ({ user: caller }),
    }),
  } as unknown as ExecutionContext;
}

describe('HTTP surface coverage (V3-S02-b)', () => {
  it('classifies every customer HTTP handler as @Public or @RequirePermission', () => {
    const handlers = CUSTOMER_CONTROLLERS.flatMap((controller) =>
      collectControllerHandlers(controller),
    );
    expect(handlers.length).toBeGreaterThan(80);

    const unclassified = handlers.filter((handler) => !isHandlerClassified(handler));
    expect(unclassified).toEqual([]);

    const publicHandlers = handlers.filter((handler) => handler.public);
    expect(
      publicHandlers.map((handler) => `${handler.controller}.${handler.handler}`).sort(),
    ).toEqual([...PUBLIC_HANDLERS].sort());
  });

  it('keeps live mutations on C7 and research certify on C4', () => {
    const liveStart = collectControllerHandlers(LiveTradingController).find(
      (handler) => handler.handler === 'start',
    );
    const certify = collectControllerHandlers(StrategyLibraryCertificationController).find(
      (handler) => handler.handler === 'certify',
    );
    const paperCreate = collectControllerHandlers(TradingSessionCommandController).find(
      (handler) => handler.handler === 'create',
    );
    expect(liveStart?.permission).toBe(PermissionClass.LiveCommand);
    expect(certify?.permission).toBe(PermissionClass.Research);
    expect(paperCreate?.permission).toBe(PermissionClass.PaperCommand);
  });

  it('classifies People list and role assignment as C6', () => {
    const handlers = collectControllerHandlers(PeopleController);
    expect(handlers.map((handler) => handler.handler).sort()).toEqual(['assignRole', 'list']);
    expect(handlers.every((handler) => handler.permission === PermissionClass.RoleAdmin)).toBe(
      true,
    );
    expect(handlers.every((handler) => handler.public === false)).toBe(true);
  });
});

describe('Surface coverage walkthrough (V3-S02-b)', () => {
  const guard = new RolesGuard(new Reflector());

  it('blocks Reader on research certify and paper session create', () => {
    expect(
      guard.canActivate(
        contextFor(StrategyLibraryCertificationController, 'certify', user(Role.Reader)),
      ),
    ).toBe(false);
    expect(
      guard.canActivate(contextFor(TradingSessionCommandController, 'create', user(Role.Reader))),
    ).toBe(false);
  });

  it('allows Researcher research actions and blocks paper commands', () => {
    expect(
      guard.canActivate(
        contextFor(StrategyLibraryCertificationController, 'certify', user(Role.Researcher)),
      ),
    ).toBe(true);
    expect(
      guard.canActivate(
        contextFor(ResearchControlCenterController, 'startExecution', user(Role.Researcher)),
      ),
    ).toBe(true);
    expect(
      guard.canActivate(
        contextFor(TradingSessionCommandController, 'create', user(Role.Researcher)),
      ),
    ).toBe(false);
  });

  it('allows Trader paper-trading actions and blocks role administration', () => {
    expect(
      guard.canActivate(contextFor(TradingSessionCommandController, 'create', user(Role.Trader))),
    ).toBe(true);
    expect(guard.canActivate(contextFor(AuthController, 'admin', user(Role.Trader)))).toBe(false);
    expect(guard.canActivate(contextFor(PeopleController, 'assignRole', user(Role.Trader)))).toBe(
      false,
    );
    expect(guard.canActivate(contextFor(PeopleController, 'list', user(Role.Trader)))).toBe(false);
  });

  it('allows Admin administration and still denies live commands', () => {
    expect(guard.canActivate(contextFor(AuthController, 'admin', user(Role.Admin)))).toBe(true);
    expect(guard.canActivate(contextFor(PeopleController, 'assignRole', user(Role.Admin)))).toBe(
      true,
    );
    expect(guard.canActivate(contextFor(PeopleController, 'list', user(Role.Admin)))).toBe(true);
    expect(guard.canActivate(contextFor(LiveTradingController, 'start', user(Role.Admin)))).toBe(
      false,
    );
  });

  it('blocks Reader from assigning roles', () => {
    expect(guard.canActivate(contextFor(PeopleController, 'assignRole', user(Role.Reader)))).toBe(
      false,
    );
    expect(guard.canActivate(contextFor(PeopleController, 'list', user(Role.Reader)))).toBe(false);
  });

  it('allows Reader projections and own-workspace actions', () => {
    expect(
      guard.canActivate(
        contextFor(MarketProfileProductController, 'listLatest', user(Role.Reader)),
      ),
    ).toBe(true);
    expect(guard.canActivate(contextFor(WorkspaceController, 'list', user(Role.Reader)))).toBe(
      true,
    );
    expect(guard.canActivate(contextFor(AuthController, 'me', user(Role.Reader)))).toBe(true);
  });

  it('denies missing permission and unknown permission on classified routes', () => {
    expect(
      guard.canActivate(contextFor(QualificationProductController, 'request', user(Role.Reader))),
    ).toBe(false);
    expect(guard.canActivate(contextFor(LiveTradingController, 'start', user(Role.Trader)))).toBe(
      false,
    );
  });

  it('keeps public endpoints public without a session', () => {
    expect(guard.canActivate(contextFor(AuthController, 'register'))).toBe(true);
    expect(guard.canActivate(contextFor(AuthController, 'login'))).toBe(true);
    expect(guard.canActivate(contextFor(HealthController, 'getHealth'))).toBe(true);
    expect(guard.canActivate(contextFor(AppController, 'getRoot'))).toBe(true);
  });
});
