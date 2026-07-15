import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { clearAccessToken } from '../shared/auth';

const links = [
  { to: '/', label: 'Home' },
  { to: '/research', label: 'Research' },
  { to: '/production', label: 'Production' },
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
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">TRP</p>
            <h1 className="text-lg font-semibold">Trading Research Platform</h1>
          </div>
          <nav className="flex items-center gap-4">
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
            <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs text-sky-300">
              Stage 1
            </span>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
