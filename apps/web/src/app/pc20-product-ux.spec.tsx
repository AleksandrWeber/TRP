import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  NAV_BANDS,
  OPERATOR_JOURNEY,
  PageHeader,
  SuccessBanner,
  allNavLinks,
  isNavTargetActive,
} from '../shared/product-ui';

function readSrc(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), 'utf8');
}

describe('PC-20 Product UX Polish', () => {
  it('keeps every completed product reachable exactly once in nav', () => {
    const links = allNavLinks();
    const paths = links.map((link) => link.to);
    expect(new Set(paths).size).toBe(paths.length);
    expect(NAV_BANDS.map((band) => band.id)).toEqual([
      'research',
      'paper-trading',
      'administration',
    ]);
    expect(paths).toContain('/strategy-library');
    expect(paths).toContain('/strategy-library/certify');
    expect(paths).toContain('/runtime-validation');
    expect(paths).toContain('/deployments');
    expect(paths).toContain('/orchestrator');
    expect(paths).toContain('/command-center');
    expect(paths).toContain('/reporting');
    expect(paths).toContain('/ai-analytics');
    expect(paths).toContain('/knowledge-lake');
    expect(paths).toContain('/notifications');
    expect(paths).toContain('/notifications/channels');
    expect(paths).toContain('/knowledge');
    expect(paths).toContain('/ai');
    expect(paths).not.toContain('/telegram');
    expect(paths).not.toContain('/trading/live');
    expect(paths).not.toContain('/production');
  });

  it('uses canonical product names', () => {
    const labels = allNavLinks().map((link) => link.label);
    expect(labels).toContain('Certification');
    expect(labels).toContain('Trading Orchestrator');
    expect(labels).toContain('Market Profile');
    expect(labels).toContain('Notification Channels');
    expect(labels).not.toContain('Certify');
    expect(labels).not.toContain('Orchestrator');
    expect(labels).not.toContain('Profile');
    expect(labels).not.toContain('Channels');
  });

  it('does not treat sibling product routes as nested active states', () => {
    expect(isNavTargetActive('/notifications/channels', '/notifications')).toBe(false);
    expect(isNavTargetActive('/notifications/channels', '/notifications/channels')).toBe(true);
    expect(isNavTargetActive('/strategy-library/certify', '/strategy-library')).toBe(false);
    expect(isNavTargetActive('/strategy-library/abc', '/strategy-library')).toBe(true);
    expect(isNavTargetActive('/strategy-library/certify', '/strategy-library/certify')).toBe(true);
  });

  it('covers the paper-first operator journey without dead ends', () => {
    expect(OPERATOR_JOURNEY.map((step) => step.id)).toEqual([
      'workspace',
      'research',
      'certification',
      'strategy-library',
      'runtime-validation',
      'deployment',
      'orchestrator',
      'trading-session',
      'reporting',
      'notification',
      'notification-channels',
      'ai-analytics',
      'knowledge-lake',
      'command-center',
    ]);
    for (const step of OPERATOR_JOURNEY) {
      expect(step.path.startsWith('/')).toBe(true);
      expect(step.description.length).toBeGreaterThan(8);
    }
  });

  it('unifies empty, loading, error, and success chrome', () => {
    const empty = renderToStaticMarkup(
      <MemoryRouter>
        <EmptyState
          title="Nothing yet"
          description="Start research."
          actionTo="/lab"
          actionLabel="Open Lab"
        />
      </MemoryRouter>,
    );
    const loading = renderToStaticMarkup(<LoadingState label="Loading overview…" />);
    const error = renderToStaticMarkup(<ErrorBanner message="Gate failed" />);
    const success = renderToStaticMarkup(<SuccessBanner message="Preferences saved." />);
    const header = renderToStaticMarkup(
      <MemoryRouter>
        <PageHeader
          productId="strategy-library"
          title="Strategy Library"
          description="Certified membership."
        />
      </MemoryRouter>,
    );

    expect(empty).toContain('Nothing yet');
    expect(empty).toContain('Open Lab');
    expect(loading).toContain('role="status"');
    expect(error).toContain('role="alert"');
    expect(success).toContain('Preferences saved.');
    expect(header).toContain('Overview');
    expect(header).toContain('Paper trading');
    expect(header).toContain('Next: Runtime Validation');
  });

  it('does not add APIs, domains, or live trading chrome', () => {
    const app = readSrc('./App.tsx');
    const layout = readSrc('../layout/AppLayout.tsx');
    const api = readSrc('../shared/api.ts');
    expect(app).not.toContain('LiveTradingPage');
    expect(layout).not.toContain('Coming Soon');
    expect(layout).not.toContain('Live Bots');
    expect(api).toContain('listCampaignHistory');
    expect(api).toContain('/campaign-history');
    expect(api).toContain('/campaign-history/${sessionId}/export');
  });
});
