import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { WorkspaceProvider } from '../app/WorkspaceContext';
import { AppLayout } from '../layout/AppLayout';
import { setActiveWorkspace } from '../shared/auth';
import { ActiveSessionsPanel } from './panels/ActiveSessionsPanel';
import { BotOverviewPanel } from './panels/BotOverviewPanel';
import { EmergencyControlsPanel } from './panels/EmergencyControlsPanel';
import { ExchangeOverviewPanel } from './panels/ExchangeOverviewPanel';
import { GlobalSystemStatusPanel } from './panels/GlobalSystemStatusPanel';
import { RunningPaperTradingPanel } from './panels/RunningPaperTradingPanel';
import { SessionDetailInspectorPanel } from './panels/SessionDetailInspectorPanel';
import { CommandCenterPage } from './CommandCenterPage';
import { COMMAND_CENTER_PANELS, COMMAND_CENTER_PATH } from './types';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (index) => [...store.keys()][index] ?? null,
    removeItem: (key) => store.delete(key),
    setItem: (key, value) => store.set(key, String(value)),
  };
}

function renderPage() {
  return renderToStaticMarkup(<CommandCenterPage />);
}

describe('Command Center foundation (RC-20 Epic 1)', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createMemoryStorage(),
    });
    setActiveWorkspace({ id: 'ws-1', name: 'Default Workspace' });
  });

  it('exposes the Command Center route path constant', () => {
    expect(COMMAND_CENTER_PATH).toBe('/command-center');
  });

  it('registers Command Center in application navigation', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={[COMMAND_CENTER_PATH]}>
        <WorkspaceProvider>
          <AppLayout />
        </WorkspaceProvider>
      </MemoryRouter>,
    );

    expect(html).toContain(`href="${COMMAND_CENTER_PATH}"`);
    expect(html).toContain('Command Center');
    expect(html).toContain('href="/trading/paper"');
    expect(html).toContain('href="/trading/live"');
    expect(html).toContain('href="/dashboard"');
  });

  it('renders the Command Center page', () => {
    const html = renderPage();
    expect(html).toContain('data-testid="command-center-page"');
    expect(html).toContain('Command Center');
  });

  it('renders layout regions matching the UI Contract', () => {
    const html = renderPage();
    expect(html).toContain('data-testid="cc-top-bar"');
    expect(html).toContain('data-testid="cc-workspace"');
    expect(html).toContain('data-testid="cc-status-area"');
    expect(html).toContain('data-testid="cc-operations-area"');
    expect(html).toContain('data-testid="cc-inspector-area"');
    expect(html).toContain('data-testid="cc-footer"');
    expect(html).toContain('data-testid="cc-manual-refresh"');
    expect(html).toContain('non-authoritative projections');
  });

  it('renders all required panels P1–P7', () => {
    const html = renderPage();
    for (const panelId of COMMAND_CENTER_PANELS) {
      expect(html).toContain(`data-testid="cc-panel-${panelId.toLowerCase()}"`);
      expect(html).toContain(`data-panel-id="${panelId}"`);
    }

    expect(html).toContain('Global System Status');
    expect(html).toContain('Exchange Overview');
    expect(html).toContain('Bot Overview');
    expect(html).toContain('Active Sessions');
    expect(html).toContain('Running Paper Trading');
    expect(html).toContain('Emergency Controls');
    expect(html).toContain('Session / Bot Detail');
  });

  it('shows loading / empty foundation states without executable emergency mutations on first paint', () => {
    const html = renderPage();
    expect(html).toContain('data-testid="panel-skeleton"');
    expect(html).toContain('data-testid="panel-empty-state"');
    expect(html).toContain('Select a bot/session');
    expect(html).toContain('Emergency Controls');
    expect(html).toContain('data-availability="unavailable"');
    expect(html).not.toContain('Kill Switch armed');
    expect(html).not.toContain('>Pause<');
    expect(html).not.toContain('>Resume<');
  });

  it('supports loading skeletons and empty states on panels', () => {
    const loading = renderToStaticMarkup(<GlobalSystemStatusPanel presentation="loading" />);
    expect(loading).toContain('data-testid="panel-skeleton"');
    expect(loading).toContain('Global System Status');

    const empty = renderToStaticMarkup(<ActiveSessionsPanel presentation="empty" />);
    expect(empty).toContain('data-testid="panel-empty-state"');
    expect(empty).toContain('No active sessions');

    const panels = [
      <ExchangeOverviewPanel key="p2" presentation="empty" />,
      <BotOverviewPanel key="p3" presentation="empty" />,
      <EmergencyControlsPanel key="p6" presentation="loading" />,
      <RunningPaperTradingPanel key="p5" presentation="empty" />,
      <SessionDetailInspectorPanel key="p7" presentation="loading" />,
    ];

    for (const panel of panels) {
      const markup = renderToStaticMarkup(panel);
      expect(markup).toMatch(/panel-empty-state|panel-skeleton/);
    }
  });

  it('does not introduce reporting, AI, or analytics surfaces', () => {
    const html = renderPage();
    expect(html.toLowerCase()).not.toContain('ai analyst');
    expect(html).not.toContain('Strategy Library');
    expect(html).not.toContain('equity curve');
  });
});
