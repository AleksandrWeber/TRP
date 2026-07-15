import { Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">TRP</p>
            <h1 className="text-lg font-semibold">Trading Research Platform</h1>
          </div>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
            Sprint 0
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
