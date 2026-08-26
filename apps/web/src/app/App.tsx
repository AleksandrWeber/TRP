import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CommandCenterPage, CreateBotWizardPage, SessionDetailPage } from '../command-center';
import { AppLayout } from '../layout/AppLayout';
import { AiPage } from '../pages/AiPage';
import { CampaignResultsPage } from '../pages/CampaignResultsPage';
import { CampaignRunPage } from '../pages/CampaignRunPage';
import { HomePage } from '../pages/HomePage';
import { KnowledgePage } from '../pages/KnowledgePage';
import { LoginPage } from '../pages/LoginPage';
import { SessionsPage } from '../pages/SessionsPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { PasswordPage } from '../pages/PasswordPage';
import { PeoplePage } from '../pages/PeoplePage';
import { MultiDatasetCampaignPage } from '../pages/MultiDatasetCampaignPage';
import { WalkForwardCampaignPage } from '../pages/WalkForwardCampaignPage';
import { PortfolioPage } from '../pages/PortfolioPage';
import { PositionDetailPage } from '../pages/PositionDetailPage';
import { PositionsPage } from '../pages/PositionsPage';
import { OrderDetailPage } from '../pages/OrderDetailPage';
import { OrdersPage } from '../pages/OrdersPage';
import { RiskPage } from '../pages/RiskPage';
import { PaperTradingPage } from '../pages/PaperTradingPage';
import { ResearchPage as Stage0ResearchPage } from '../pages/ResearchPage';
import { StrategiesPage } from '../pages/StrategiesPage';
import { StrategyLibraryDetailPage, StrategyLibraryPage } from '../strategy-library';
import {
  CertificationHistoryPage,
  CertificationResultPage,
  CertificationWizardPage,
} from '../certification';
import {
  RuntimeValidationHistoryPage,
  RuntimeValidationPage,
  RuntimeValidationResultPage,
} from '../runtime-validation';
import {
  DeploymentDetailPage,
  DeploymentHistoryPage,
  DeploymentListPage,
  DeploymentWizardPage,
} from '../deployment';
import {
  OrchestratorHistoryPage,
  OrchestratorPlanDetailPage,
  OrchestratorPlansPage,
  OrchestratorRunPage,
  OrchestratorWizardPage,
} from '../orchestrator';
import { ReportingDetailPage, ReportingHistoryPage, ReportingHomePage } from '../reporting';
import {
  KnowledgeLakeDetailPage,
  KnowledgeLakeHistoryPage,
  KnowledgeLakeHomePage,
} from '../knowledge-lake';
import {
  AiAnalyticsDetailPage,
  AiAnalyticsHistoryPage,
  AiAnalyticsHomePage,
} from '../ai-analytics';
import {
  NotificationChannelDetailPage,
  NotificationChannelHistoryPage,
  NotificationChannelsPage,
  NotificationDetailPage,
  NotificationHistoryPage,
  NotificationSettingsPage,
} from '../notifications';
import { ConnectionsPage } from '../connections/ConnectionsPage';
import { MarketDataPage } from '../market-data/MarketDataPage';
import { WorkflowsPage } from '../pages/WorkflowsPage';
import {
  LazyAnalyticsPage,
  LazyDiagnosticsPage,
  LazyEngineeringPage,
  LazyOptimizationDetailPage,
  LazyOptimizationPage,
  LazyResearchDashboardPage,
  LazyResearchDetailPage,
  LazyResearchPage,
  LazySettingsPage,
  ResearchControlLayout,
  ResearchControlQueryProvider,
} from '../research-control/ResearchControlShell';
import { ClusterDetailPage, ClusterHomePage } from '../clusters';
import {
  QualificationHistoryPage,
  QualificationHomePage,
  QualificationRunPage,
  QualificationTargetPage,
} from '../qualification';
import {
  MarketProfileHistoryPage,
  MarketProfileHomePage,
  MarketProfileTargetPage,
  MarketProfileVersionPage,
} from '../market-profile';
import {
  MarketStateHistoryPage,
  MarketStateHomePage,
  MarketStateTargetPage,
  MarketStateVersionPage,
} from '../market-state';
import { RequireAuth } from './RequireAuth';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route
              element={
                <ResearchControlQueryProvider>
                  <ResearchControlLayout />
                </ResearchControlQueryProvider>
              }
            >
              <Route path="dashboard" element={<LazyResearchDashboardPage />} />
              <Route path="research" element={<LazyResearchPage />} />
              <Route path="research/:id" element={<LazyResearchDetailPage />} />
              <Route path="optimization" element={<LazyOptimizationPage />} />
              <Route path="optimization/:id" element={<LazyOptimizationDetailPage />} />
              <Route path="analytics" element={<LazyAnalyticsPage />} />
              <Route path="engineering" element={<LazyEngineeringPage />} />
              <Route path="diagnostics" element={<LazyDiagnosticsPage />} />
              <Route path="settings" element={<LazySettingsPage />} />
            </Route>

            <Route path="account/sessions" element={<SessionsPage />} />
            <Route path="account/password" element={<PasswordPage />} />
            <Route path="people" element={<PeoplePage />} />

            <Route index element={<HomePage />} />
            <Route path="workflows" element={<WorkflowsPage />} />
            <Route path="lab" element={<Stage0ResearchPage />} />
            <Route path="strategies" element={<StrategiesPage />} />
            <Route path="strategy-library/certify" element={<CertificationWizardPage />} />
            <Route path="strategy-library/certifications" element={<CertificationHistoryPage />} />
            <Route
              path="strategy-library/certifications/:attemptId"
              element={<CertificationResultPage />}
            />
            <Route path="strategy-library" element={<StrategyLibraryPage />} />
            <Route
              path="strategy-library/:libraryEntryId"
              element={<StrategyLibraryDetailPage />}
            />
            <Route path="runtime-validation/history" element={<RuntimeValidationHistoryPage />} />
            <Route
              path="runtime-validation/:validationId"
              element={<RuntimeValidationResultPage />}
            />
            <Route path="runtime-validation" element={<RuntimeValidationPage />} />
            <Route path="deployments/new" element={<DeploymentWizardPage />} />
            <Route path="deployments/history" element={<DeploymentHistoryPage />} />
            <Route path="deployments/:deploymentId" element={<DeploymentDetailPage />} />
            <Route path="deployments" element={<DeploymentListPage />} />
            <Route path="orchestrator/plans/:planId" element={<OrchestratorPlanDetailPage />} />
            <Route path="orchestrator/plans" element={<OrchestratorPlansPage />} />
            <Route path="orchestrator/history" element={<OrchestratorHistoryPage />} />
            <Route path="orchestrator/runs/:runId" element={<OrchestratorRunPage />} />
            <Route path="orchestrator" element={<OrchestratorWizardPage />} />
            <Route path="reporting/history" element={<ReportingHistoryPage />} />
            <Route path="reporting/:reportRunId" element={<ReportingDetailPage />} />
            <Route path="reporting" element={<ReportingHomePage />} />
            <Route path="notifications/history" element={<NotificationHistoryPage />} />
            <Route
              path="notifications/channels/:channelId/history"
              element={<NotificationChannelHistoryPage />}
            />
            <Route
              path="notifications/channels/:channelId"
              element={<NotificationChannelDetailPage />}
            />
            <Route path="notifications/channels" element={<NotificationChannelsPage />} />
            <Route path="notifications/:deliveryId" element={<NotificationDetailPage />} />
            <Route path="notifications" element={<NotificationSettingsPage />} />
            <Route path="connections" element={<ConnectionsPage />} />
            <Route path="market-data" element={<MarketDataPage />} />
            <Route
              path="telegram/history"
              element={<Navigate to="/notifications/channels/telegram/history" replace />}
            />
            <Route
              path="telegram"
              element={<Navigate to="/notifications/channels/telegram" replace />}
            />
            <Route path="campaigns/run" element={<CampaignRunPage />} />
            <Route path="campaigns/results" element={<CampaignResultsPage />} />
            <Route path="campaigns/multi" element={<MultiDatasetCampaignPage />} />
            <Route path="campaigns/walk-forward" element={<WalkForwardCampaignPage />} />
            <Route path="knowledge" element={<KnowledgePage />} />
            <Route path="knowledge-lake/history" element={<KnowledgeLakeHistoryPage />} />
            <Route path="knowledge-lake/:entryId" element={<KnowledgeLakeDetailPage />} />
            <Route path="knowledge-lake" element={<KnowledgeLakeHomePage />} />
            <Route path="ai-analytics/history" element={<AiAnalyticsHistoryPage />} />
            <Route path="ai-analytics/:analysisId" element={<AiAnalyticsDetailPage />} />
            <Route path="ai-analytics" element={<AiAnalyticsHomePage />} />
            <Route path="qualification/history" element={<QualificationHistoryPage />} />
            <Route
              path="qualification/runs/:qualificationRunId"
              element={<QualificationRunPage />}
            />
            <Route path="qualification/targets/:targetId" element={<QualificationTargetPage />} />
            <Route path="qualification" element={<QualificationHomePage />} />
            <Route
              path="market-profile/targets/:targetId/versions/:version"
              element={<MarketProfileVersionPage />}
            />
            <Route path="market-profile/targets/:targetId" element={<MarketProfileTargetPage />} />
            <Route path="market-profile/history" element={<MarketProfileHistoryPage />} />
            <Route path="market-profile" element={<MarketProfileHomePage />} />
            <Route
              path="market-state/targets/:targetId/versions/:version"
              element={<MarketStateVersionPage />}
            />
            <Route path="market-state/targets/:targetId" element={<MarketStateTargetPage />} />
            <Route path="market-state/history" element={<MarketStateHistoryPage />} />
            <Route path="market-state" element={<MarketStateHomePage />} />
            <Route path="clusters/:exchangeScopeId" element={<ClusterDetailPage />} />
            <Route path="clusters" element={<ClusterHomePage />} />
            <Route path="command-center/new" element={<CreateBotWizardPage />} />
            <Route path="command-center/sessions/:sessionId" element={<SessionDetailPage />} />
            <Route path="command-center" element={<CommandCenterPage />} />
            <Route path="trading/portfolio" element={<PortfolioPage />} />
            <Route path="trading/positions" element={<PositionsPage />} />
            <Route path="trading/positions/:id" element={<PositionDetailPage />} />
            <Route path="trading/orders" element={<OrdersPage />} />
            <Route path="trading/orders/:id" element={<OrderDetailPage />} />
            <Route path="trading/risk" element={<RiskPage />} />
            <Route path="trading/paper" element={<PaperTradingPage />} />
            <Route path="ai" element={<AiPage />} />

            <Route path="production" element={<Navigate to="/" replace />} />
            <Route path="trading/live" element={<Navigate to="/trading/paper" replace />} />
            <Route path="trading/exchanges" element={<Navigate to="/command-center" replace />} />
            <Route path="command-center/review-epic3" element={<Navigate to="/" replace />} />
            <Route path="command-center/review-epic4" element={<Navigate to="/" replace />} />
            <Route path="command-center/review-epic5" element={<Navigate to="/" replace />} />
            <Route path="command-center/review-epic6" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
