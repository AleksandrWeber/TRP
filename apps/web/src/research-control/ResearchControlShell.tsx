import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense, lazy, type ReactNode, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LoadingOverlay } from './components';

export function ResearchControlQueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

export function ResearchControlLayout() {
  const location = useLocation();
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches;
  const isRestrictedMobileRoute =
    isMobile && !location.pathname.startsWith('/dashboard') && location.pathname !== '/';

  return (
    <div className="relative min-h-[70vh]">
      {isRestrictedMobileRoute ? (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 md:hidden">
          Mobile view is read-only for the dashboard. Use tablet or desktop to execute research.
          <div className="mt-2">
            <Link
              to="/dashboard"
              className="text-sky-300 underline focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
            >
              Go to dashboard
            </Link>
          </div>
        </div>
      ) : null}

      <div className={isRestrictedMobileRoute ? 'hidden md:block' : undefined}>
        <Suspense
          fallback={
            <div className="relative min-h-40">
              <LoadingOverlay visible label="Loading page…" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}

export const LazyResearchDashboardPage = lazy(() =>
  import('./pages/ResearchDashboardPage').then((m) => ({
    default: m.ResearchDashboardPage,
  })),
);
export const LazyResearchPage = lazy(() =>
  import('./pages/ResearchPage').then((m) => ({ default: m.ResearchPage })),
);
export const LazyResearchDetailPage = lazy(() =>
  import('./pages/ResearchDetailPage').then((m) => ({ default: m.ResearchDetailPage })),
);
export const LazyOptimizationPage = lazy(() =>
  import('./pages/OptimizationPage').then((m) => ({ default: m.OptimizationPage })),
);
export const LazyOptimizationDetailPage = lazy(() =>
  import('./pages/OptimizationPage').then((m) => ({ default: m.OptimizationDetailPage })),
);
export const LazyAnalyticsPage = lazy(() =>
  import('./pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })),
);
export const LazyEngineeringPage = lazy(() =>
  import('./pages/EngineeringPage').then((m) => ({ default: m.EngineeringPage })),
);
export const LazyDiagnosticsPage = lazy(() =>
  import('./pages/DiagnosticsPage').then((m) => ({ default: m.DiagnosticsPage })),
);
export const LazySettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
