import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../layout/AppLayout';
import { AiPage } from '../pages/AiPage';
import { HomePage } from '../pages/HomePage';
import { KnowledgePage } from '../pages/KnowledgePage';
import { LoginPage } from '../pages/LoginPage';
import { ProductionPage } from '../pages/ProductionPage';
import { ResearchPage } from '../pages/ResearchPage';
import { WorkflowsPage } from '../pages/WorkflowsPage';
import { RequireAuth } from './RequireAuth';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="workflows" element={<WorkflowsPage />} />
            <Route path="research" element={<ResearchPage />} />
            <Route path="knowledge" element={<KnowledgePage />} />
            <Route path="production" element={<ProductionPage />} />
            <Route path="ai" element={<AiPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
