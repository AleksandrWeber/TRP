import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../layout/AppLayout';
import { HomePage } from '../pages/HomePage';
import { ProductionPage } from '../pages/ProductionPage';
import { ResearchPage } from '../pages/ResearchPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="research" element={<ResearchPage />} />
          <Route path="production" element={<ProductionPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
