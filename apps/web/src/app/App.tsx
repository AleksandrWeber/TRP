import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../layout/AppLayout';
import { HomePage } from '../pages/HomePage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
