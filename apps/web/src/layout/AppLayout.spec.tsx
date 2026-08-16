import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { WorkspaceProvider } from '../app/WorkspaceContext';
import { setActiveWorkspace } from '../shared/auth';
import { AppLayout } from './AppLayout';

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

function renderShell() {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={['/']}>
      <WorkspaceProvider>
        <AppLayout />
      </WorkspaceProvider>
    </MemoryRouter>,
  );
}

describe('PC-19 Operator Shell', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createMemoryStorage(),
    });
    setActiveWorkspace({ id: 'ws-1', name: 'Default Workspace' });
  });

  it('presents paper-first Version 2 navigation bands', () => {
    const html = renderShell();

    expect(html).toContain('Paper-first operator');
    expect(html).toContain('Skip to content');
    expect(html).toContain('aria-label="Research"');
    expect(html).toContain('aria-label="Paper trading"');
    expect(html).toContain('aria-label="Administration"');
    expect(html).toContain('Certified path');
    expect(html).toContain('Evidence and delivery');
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('href="/lab"');
    expect(html).toContain('href="/strategy-library"');
    expect(html).toContain('Strategy Library');
    expect(html).toContain('Certification');
    expect(html).toContain('href="/strategy-library/certify"');
    expect(html).toContain('Runtime Validation');
    expect(html).toContain('href="/runtime-validation"');
    expect(html).toContain('Deployment');
    expect(html).toContain('href="/deployments"');
    expect(html).toContain('Trading Orchestrator');
    expect(html).toContain('href="/orchestrator"');
    expect(html).toContain('Qualification');
    expect(html).toContain('href="/qualification"');
    expect(html).toContain('Market Profile');
    expect(html).toContain('href="/market-profile"');
    expect(html).toContain('Market State');
    expect(html).toContain('href="/market-state"');
    expect(html).toContain('Reporting');
    expect(html).toContain('href="/reporting"');
    expect(html).toContain('href="/notifications"');
    expect(html).toContain('Notifications');
    expect(html).toContain('href="/notifications/channels"');
    expect(html).toContain('Notification Channels');
    expect(html).not.toContain('href="/telegram"');
    expect(html).toContain('Research strategies');
    expect(html).toContain('href="/command-center"');
    expect(html).toContain('href="/clusters"');
    expect(html).toContain('Cluster');
    expect(html).toContain('href="/trading/paper"');
    expect(html).toContain('href="/settings"');
    expect(html).toContain('href="/account/sessions"');
    expect(html).toContain('Sign-in sessions');
    expect(html).toContain('href="/account/password"');
    expect(html).toContain('Password');
    expect(html).toContain('href="/people"');
    expect(html).toContain('People');
    expect(html).toContain('Logout');
    expect(html).toContain('Switch workspace');
    expect(html).toContain('Default Workspace');
  });

  it('hides live, retired, and placeholder product capabilities', () => {
    const html = renderShell();

    expect(html).not.toContain('Live Bots');
    expect(html).not.toContain('href="/trading/live"');
    expect(html).not.toContain('href="/production"');
    expect(html).not.toContain('href="/trading/exchanges"');
    expect(html).not.toContain('Coming Soon');
    expect(html).not.toContain('review-epic');
    expect(html).not.toContain('Invite teammate');
    expect(html).not.toContain('Credential Vault');
    expect(html).not.toContain('API keys');
    expect(html).toContain('Knowledge Lake');
    expect(html).toContain('href="/knowledge-lake"');
    expect(html).toContain('AI Analytics');
    expect(html).toContain('href="/ai-analytics"');
  });
});
