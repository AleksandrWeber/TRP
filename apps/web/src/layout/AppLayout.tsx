import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { COMMAND_CENTER_PATH } from '../command-center';
import { clearAccessToken } from '../shared/auth';
import { WorkspaceSwitcher } from '../workspace';

/** Research tools the operator can actually run today. Lake / RC-24 remain later packages. */
const researchLinks = [
  { to: '/', label: 'Overview' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/research', label: 'Research' },
  { to: '/lab', label: 'Lab' },
  { to: '/optimization', label: 'Optimization' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/engineering', label: 'Engineering' },
  { to: '/diagnostics', label: 'Diagnostics' },
  { to: '/workflows', label: 'Workflows' },
  { to: '/strategy-library', label: 'Strategy Library' },
  { to: '/strategy-library/certify', label: 'Certify' },
  { to: '/runtime-validation', label: 'Runtime Validation' },
  { to: '/deployments', label: 'Deployment' },
  { to: '/orchestrator', label: 'Orchestrator' },
  { to: '/qualification', label: 'Qualification' },
  { to: '/market-profile', label: 'Profile' },
  { to: '/market-state', label: 'Market State' },
  { to: '/reporting', label: 'Reporting' },
  { to: '/strategies', label: 'Research strategies' },
  { to: '/campaigns/run', label: 'Campaign' },
  { to: '/knowledge', label: 'Knowledge' },
  { to: '/ai', label: 'AI' },
];

/** Paper path only. Live Bots, adapter Exchanges, and Production are not product. Cluster is Exchange Scope. */
const paperTradingLinks = [
  { to: COMMAND_CENTER_PATH, label: 'Command Center' },
  { to: '/clusters', label: 'Cluster' },
  { to: '/trading/paper', label: 'Paper Bots' },
  { to: '/trading/portfolio', label: 'Portfolio' },
  { to: '/trading/positions', label: 'Positions' },
  { to: '/trading/orders', label: 'Orders' },
  { to: '/trading/risk', label: 'Risk' },
];

/** RCC preferences remain Settings. Notifications are PC-06; Channels are PC-07. */
const administrationLinks = [
  { to: '/notifications', label: 'Notifications' },
  { to: '/notifications/channels', label: 'Channels' },
  { to: '/settings', label: 'Settings' },
];

export function AppLayout() {
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

  function linkClass(to: string, size: 'primary' | 'secondary') {
    const active = isActive(to);
    if (size === 'primary') {
      return `rounded px-2 py-1 text-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400 ${
        active ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
      }`;
    }
    return `text-xs focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400 ${
      active ? 'text-slate-300' : 'text-slate-600 hover:text-slate-400'
    }`;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">TRP</p>
            <h1 className="text-lg font-semibold">Paper-first operator</h1>
            <WorkspaceSwitcher />
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
          aria-label="Research"
        >
          <span className="text-xs uppercase tracking-wide text-slate-500">Research</span>
          {researchLinks.map((link) => (
            <Link key={link.to} to={link.to} className={linkClass(link.to, 'primary')}>
              {link.label}
            </Link>
          ))}
        </nav>
        <nav
          className="mx-auto mt-2 flex max-w-6xl flex-wrap items-center gap-3"
          aria-label="Paper trading"
        >
          <span className="text-xs uppercase tracking-wide text-slate-600">Paper trading</span>
          {paperTradingLinks.map((link) => (
            <Link key={link.to} to={link.to} className={linkClass(link.to, 'secondary')}>
              {link.label}
            </Link>
          ))}
        </nav>
        <nav
          className="mx-auto mt-2 flex max-w-6xl flex-wrap items-center gap-3"
          aria-label="Administration"
        >
          <span className="text-xs uppercase tracking-wide text-slate-600">Administration</span>
          {administrationLinks.map((link) => (
            <Link key={link.to} to={link.to} className={linkClass(link.to, 'secondary')}>
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
