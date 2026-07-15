import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../layout/AppLayout';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { ProductionPage } from '../pages/ProductionPage';
import { ResearchPage } from '../pages/ResearchPage';
import { RequireAuth } from './RequireAuth';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="research" element={<ResearchPage />} />
            <Route path="production" element={<ProductionPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
