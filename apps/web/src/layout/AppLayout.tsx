import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../shared/api';
import { clearAccessToken } from '../shared/auth';
import { NAV_BANDS, isNavTargetActive } from '../shared/product-ui';
import { WorkspaceSwitcher } from '../workspace';

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  async function logout() {
    try {
      await api.logout();
    } catch {
      // Client still signs out even if the server session is already gone.
    }
    clearAccessToken();
    navigate('/login');
  }

  function linkClass(to: string, size: 'primary' | 'secondary') {
    const active = isNavTargetActive(location.pathname, to);
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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-slate-900 focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>
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
        {NAV_BANDS.map((band, index) => (
          <nav
            key={band.id}
            className={`mx-auto flex max-w-6xl flex-col gap-2 ${index === 0 ? 'mt-4' : 'mt-2'}`}
            aria-label={band.ariaLabel}
          >
            <span className="text-xs uppercase tracking-wide text-slate-500">{band.label}</span>
            <div className="flex flex-col gap-2">
              {band.groups.map((group) => (
                <div key={group.id} className="flex flex-wrap items-center gap-3">
                  <span className="text-[10px] uppercase tracking-wide text-slate-600">
                    {group.label}
                  </span>
                  {group.links.map((link) => (
                    <Link key={link.to} to={link.to} className={linkClass(link.to, band.size)}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </nav>
        ))}
      </header>
      <main id="main-content" className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
