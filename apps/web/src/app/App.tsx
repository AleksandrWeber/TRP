import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CommandCenterPage } from '../command-center';
import { CommandCenterEpic3ReviewPage } from '../command-center/CommandCenterEpic3ReviewPage';
import { CommandCenterEpic4ReviewPage } from '../command-center/CommandCenterEpic4ReviewPage';
import { CommandCenterEpic5ReviewPage } from '../command-center/CommandCenterEpic5ReviewPage';
import { CommandCenterEpic6ReviewPage } from '../command-center/CommandCenterEpic6ReviewPage';
import { AppLayout } from '../layout/AppLayout';
import { AiPage } from '../pages/AiPage';
import { CampaignResultsPage } from '../pages/CampaignResultsPage';
import { CampaignRunPage } from '../pages/CampaignRunPage';
import { HomePage } from '../pages/HomePage';
import { KnowledgePage } from '../pages/KnowledgePage';
import { LoginPage } from '../pages/LoginPage';
import { MultiDatasetCampaignPage } from '../pages/MultiDatasetCampaignPage';
import { WalkForwardCampaignPage } from '../pages/WalkForwardCampaignPage';
import { ProductionPage } from '../pages/ProductionPage';
import { PortfolioPage } from '../pages/PortfolioPage';
import { PositionDetailPage } from '../pages/PositionDetailPage';
import { PositionsPage } from '../pages/PositionsPage';
import { OrderDetailPage } from '../pages/OrderDetailPage';
import { OrdersPage } from '../pages/OrdersPage';
import { RiskPage } from '../pages/RiskPage';
import { PaperTradingPage } from '../pages/PaperTradingPage';
import { ExchangesPage } from '../pages/ExchangesPage';
import { LiveTradingPage } from '../pages/LiveTradingPage';
import { ResearchPage as Stage0ResearchPage } from '../pages/ResearchPage';
import { StrategiesPage } from '../pages/StrategiesPage';
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
import { RequireAuth } from './RequireAuth';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* Static Epic 3 screenshot review surface (fixture data; no auth). */}
        <Route
          path="/command-center/review-epic3"
          element={
            <div className="min-h-screen bg-[#0b0f14] px-6 py-8 text-[#e6edf3]">
              <div className="mx-auto max-w-6xl">
                <CommandCenterEpic3ReviewPage />
              </div>
            </div>
          }
        />
        <Route
          path="/command-center/review-epic4"
          element={
            <div className="min-h-screen bg-[#0b0f14] px-6 py-8 text-[#e6edf3]">
              <div className="mx-auto max-w-6xl">
                <CommandCenterEpic4ReviewPage />
              </div>
            </div>
          }
        />
        <Route
          path="/command-center/review-epic5"
          element={
            <div className="min-h-screen bg-[#0b0f14] px-6 py-8 text-[#e6edf3]">
              <div className="mx-auto max-w-6xl">
                <CommandCenterEpic5ReviewPage />
              </div>
            </div>
          }
        />
        <Route
          path="/command-center/review-epic6"
          element={
            <div className="min-h-screen bg-[#0b0f14] px-6 py-8 text-[#e6edf3]">
              <div className="mx-auto max-w-6xl">
                <CommandCenterEpic6ReviewPage />
              </div>
            </div>
          }
        />
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

            <Route index element={<HomePage />} />
            <Route path="workflows" element={<WorkflowsPage />} />
            <Route path="lab" element={<Stage0ResearchPage />} />
            <Route path="strategies" element={<StrategiesPage />} />
            <Route path="campaigns/run" element={<CampaignRunPage />} />
            <Route path="campaigns/results" element={<CampaignResultsPage />} />
            <Route path="campaigns/multi" element={<MultiDatasetCampaignPage />} />
            <Route path="campaigns/walk-forward" element={<WalkForwardCampaignPage />} />
            <Route path="knowledge" element={<KnowledgePage />} />
            <Route path="production" element={<ProductionPage />} />
            <Route path="command-center" element={<CommandCenterPage />} />
            <Route path="trading/portfolio" element={<PortfolioPage />} />
            <Route path="trading/positions" element={<PositionsPage />} />
            <Route path="trading/positions/:id" element={<PositionDetailPage />} />
            <Route path="trading/orders" element={<OrdersPage />} />
            <Route path="trading/orders/:id" element={<OrderDetailPage />} />
            <Route path="trading/risk" element={<RiskPage />} />
            <Route path="trading/paper" element={<PaperTradingPage />} />
            <Route path="trading/live" element={<LiveTradingPage />} />
            <Route path="trading/exchanges" element={<ExchangesPage />} />
            <Route path="ai" element={<AiPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
