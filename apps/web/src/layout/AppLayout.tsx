import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../app/WorkspaceContext';
import { clearAccessToken } from '../shared/auth';

const primaryLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/research', label: 'Research' },
  { to: '/optimization', label: 'Optimization' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/engineering', label: 'Engineering' },
  { to: '/diagnostics', label: 'Diagnostics' },
  { to: '/settings', label: 'Settings' },
];

const legacyLinks = [
  { to: '/', label: 'Overview' },
  { to: '/lab', label: 'Lab' },
  { to: '/workflows', label: 'Workflows' },
  { to: '/strategies', label: 'Strategies' },
  { to: '/campaigns/run', label: 'Campaign' },
  { to: '/knowledge', label: 'Knowledge' },
  { to: '/production', label: 'Production' },
  { to: '/ai', label: 'AI' },
];

const tradingLinks = [
  { to: '/trading/portfolio', label: 'Portfolio' },
  { to: '/trading/positions', label: 'Positions' },
  { to: '/trading/orders', label: 'Orders' },
  { to: '/trading/risk', label: 'Risk' },
  { to: '/trading/paper', label: 'Paper Trading' },
  { to: '/trading/live', label: 'Live Trading' },
  { to: '/trading/exchanges', label: 'Exchanges' },
];

export function AppLayout() {
  const { activeWorkspace } = useWorkspace();
  const location = useLocation();
  const navigate = useNavigate();

  function logout() {
    clearAccessToken();
    navigate('/login');
  }

  function isActive(to: string) {
    if (to === '/') return location.pathname === '/';
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">TRP</p>
            <h1 className="text-lg font-semibold">Research Control Center</h1>
            <p className="mt-1 text-xs text-slate-500">{activeWorkspace.name}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-sm text-slate-400 hover:text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
          >
            Logout
          </button>
        </div>
        <nav
          className="mx-auto mt-4 flex max-w-6xl flex-wrap items-center gap-3"
          aria-label="Primary"
        >
          {primaryLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded px-2 py-1 text-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400 ${
                isActive(link.to) ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <nav
          className="mx-auto mt-2 flex max-w-6xl flex-wrap items-center gap-3"
          aria-label="Trading"
        >
          <span className="text-xs uppercase tracking-wide text-slate-600">Trading</span>
          {tradingLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-xs focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400 ${
                isActive(link.to) ? 'text-slate-300' : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <nav
          className="mx-auto mt-2 flex max-w-6xl flex-wrap items-center gap-3"
          aria-label="Legacy laboratory"
        >
          {legacyLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-xs focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400 ${
                isActive(link.to) ? 'text-slate-300' : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
