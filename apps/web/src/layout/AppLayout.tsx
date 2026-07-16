import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { clearAccessToken } from '../shared/auth';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/workflows', label: 'Workflows' },
  { to: '/research', label: 'Research' },
  { to: '/campaigns/run', label: 'Campaign' },
  { to: '/campaigns/multi', label: 'Multi-Dataset' },
  { to: '/campaigns/walk-forward', label: 'Walk-Forward' },
  { to: '/knowledge', label: 'Knowledge' },
  { to: '/production', label: 'Production' },
  { to: '/ai', label: 'AI' },
];

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  function logout() {
    clearAccessToken();
    navigate('/login');
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">TRP</p>
            <h1 className="text-lg font-semibold">Trading Research Platform</h1>
          </div>
          <nav className="flex flex-wrap items-center justify-end gap-3">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm ${
                  location.pathname === link.to ? 'text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={logout}
              className="text-sm text-slate-400 hover:text-white"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
