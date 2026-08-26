export type NavBandId = 'research' | 'paper-trading' | 'administration';

export type NavLink = {
  to: string;
  label: string;
};

export type NavGroup = {
  id: string;
  label: string;
  links: readonly NavLink[];
};

export type NavBand = {
  id: NavBandId;
  label: string;
  ariaLabel: string;
  size: 'primary' | 'secondary';
  groups: readonly NavGroup[];
};

export type JourneyStep = {
  id: string;
  label: string;
  path: string;
  description: string;
};

export type ProductChrome = {
  id: string;
  label: string;
  path: string;
  band: NavBandId;
  next?: { to: string; label: string };
  historyTo?: string;
  loadingLabel: string;
};

/** Canonical Version 2 paper-first operator journey (PC-20). */
export const OPERATOR_JOURNEY: readonly JourneyStep[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    path: '/',
    description: 'Select the workspace in the header, then start research.',
  },
  {
    id: 'research',
    label: 'Research',
    path: '/research',
    description: 'Produce evidence in Research, Lab, and Campaign.',
  },
  {
    id: 'certification',
    label: 'Certification',
    path: '/strategy-library/certify',
    description: 'Admit a research candidate into Strategy Library.',
  },
  {
    id: 'strategy-library',
    label: 'Strategy Library',
    path: '/strategy-library',
    description: 'Browse certified membership. Not the research editor.',
  },
  {
    id: 'runtime-validation',
    label: 'Runtime Validation',
    path: '/runtime-validation',
    description: 'Run the fail-closed Gate before Deployment.',
  },
  {
    id: 'deployment',
    label: 'Deployment',
    path: '/deployments',
    description: 'Bind a certified version. This does not start a session.',
  },
  {
    id: 'orchestrator',
    label: 'Trading Orchestrator',
    path: '/orchestrator',
    description: 'Coordinate selection and emit a Session Handoff Intent.',
  },
  {
    id: 'trading-session',
    label: 'Trading Session',
    path: '/command-center',
    description: 'Operate a paper Bot from Command Center.',
  },
  {
    id: 'reporting',
    label: 'Reporting',
    path: '/reporting',
    description: 'Inspect ReportRuns. These are projections, not the ledger.',
  },
  {
    id: 'notification',
    label: 'Notification',
    path: '/notifications',
    description: 'Route delivery. Notification does not trade.',
  },
  {
    id: 'notification-channels',
    label: 'Notification Channels',
    path: '/notifications/channels',
    description: 'Telegram is the active channel. Reserved channels stay reserved.',
  },
  {
    id: 'ai-analytics',
    label: 'AI Analytics',
    path: '/ai-analytics',
    description: 'Narratives from existing reports. Explanation, not an order.',
  },
  {
    id: 'knowledge-lake',
    label: 'Knowledge Lake',
    path: '/knowledge-lake',
    description: 'Read-only warehouse. Not Research Knowledge search.',
  },
  {
    id: 'command-center',
    label: 'Command Center',
    path: '/command-center',
    description: 'Operate the paper fleet. Live trading is not offered.',
  },
];

export const PRODUCT_CHROME: readonly ProductChrome[] = [
  {
    id: 'overview',
    label: 'Overview',
    path: '/',
    band: 'research',
    next: { to: '/research', label: 'Research' },
    loadingLabel: 'Loading overview…',
  },
  {
    id: 'research',
    label: 'Research',
    path: '/research',
    band: 'research',
    next: { to: '/strategy-library/certify', label: 'Certification' },
    loadingLabel: 'Loading research…',
  },
  {
    id: 'lab',
    label: 'Lab',
    path: '/lab',
    band: 'research',
    next: { to: '/campaigns/run', label: 'Campaign' },
    loadingLabel: 'Loading lab…',
  },
  {
    id: 'campaign',
    label: 'Campaign',
    path: '/campaigns/run',
    band: 'research',
    next: { to: '/strategy-library/certify', label: 'Certification' },
    historyTo: '/campaigns/results',
    loadingLabel: 'Loading campaign…',
  },
  {
    id: 'research-strategies',
    label: 'Research strategies',
    path: '/strategies',
    band: 'research',
    next: { to: '/strategy-library/certify', label: 'Certification' },
    loadingLabel: 'Loading research strategies…',
  },
  {
    id: 'qualification',
    label: 'Qualification',
    path: '/qualification',
    band: 'research',
    next: { to: '/market-profile', label: 'Market Profile' },
    historyTo: '/qualification/history',
    loadingLabel: 'Loading Qualification…',
  },
  {
    id: 'market-profile',
    label: 'Market Profile',
    path: '/market-profile',
    band: 'research',
    next: { to: '/market-state', label: 'Market State' },
    historyTo: '/market-profile/history',
    loadingLabel: 'Loading Market Profile…',
  },
  {
    id: 'market-state',
    label: 'Market State',
    path: '/market-state',
    band: 'research',
    next: { to: '/orchestrator', label: 'Trading Orchestrator' },
    historyTo: '/market-state/history',
    loadingLabel: 'Loading Market State…',
  },
  {
    id: 'knowledge-lake',
    label: 'Knowledge Lake',
    path: '/knowledge-lake',
    band: 'research',
    next: { to: '/reporting', label: 'Reporting' },
    historyTo: '/knowledge-lake/history',
    loadingLabel: 'Loading Knowledge Lake…',
  },
  {
    id: 'paper-trading-foundation',
    label: 'Paper Trading',
    path: '/paper-trading',
    band: 'paper-trading',
    next: { to: '/trading/paper', label: 'Paper Bots' },
    loadingLabel: 'Loading Paper Trading…',
  },
  {
    id: 'certification',
    label: 'Certification',
    path: '/strategy-library/certify',
    band: 'paper-trading',
    next: { to: '/strategy-library', label: 'Strategy Library' },
    historyTo: '/strategy-library/certifications',
    loadingLabel: 'Loading certification…',
  },
  {
    id: 'strategy-library',
    label: 'Strategy Library',
    path: '/strategy-library',
    band: 'paper-trading',
    next: { to: '/runtime-validation', label: 'Runtime Validation' },
    historyTo: '/strategy-library/certifications',
    loadingLabel: 'Loading Strategy Library…',
  },
  {
    id: 'runtime-validation',
    label: 'Runtime Validation',
    path: '/runtime-validation',
    band: 'paper-trading',
    next: { to: '/deployments', label: 'Deployment' },
    historyTo: '/runtime-validation/history',
    loadingLabel: 'Loading Runtime Validation…',
  },
  {
    id: 'deployment',
    label: 'Deployment',
    path: '/deployments',
    band: 'paper-trading',
    next: { to: '/orchestrator', label: 'Trading Orchestrator' },
    historyTo: '/deployments/history',
    loadingLabel: 'Loading deployments…',
  },
  {
    id: 'orchestrator',
    label: 'Trading Orchestrator',
    path: '/orchestrator',
    band: 'paper-trading',
    next: { to: '/command-center', label: 'Command Center' },
    historyTo: '/orchestrator/history',
    loadingLabel: 'Loading Trading Orchestrator…',
  },
  {
    id: 'command-center',
    label: 'Command Center',
    path: '/command-center',
    band: 'paper-trading',
    next: { to: '/reporting', label: 'Reporting' },
    loadingLabel: 'Loading Command Center…',
  },
  {
    id: 'cluster',
    label: 'Cluster',
    path: '/clusters',
    band: 'paper-trading',
    next: { to: '/command-center', label: 'Command Center' },
    loadingLabel: 'Loading Clusters…',
  },
  {
    id: 'reporting',
    label: 'Reporting',
    path: '/reporting',
    band: 'administration',
    next: { to: '/notifications', label: 'Notifications' },
    historyTo: '/reporting/history',
    loadingLabel: 'Loading report runs…',
  },
  {
    id: 'ai-analytics',
    label: 'AI Analytics',
    path: '/ai-analytics',
    band: 'administration',
    next: { to: '/knowledge-lake', label: 'Knowledge Lake' },
    historyTo: '/ai-analytics/history',
    loadingLabel: 'Loading AI Analytics…',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    path: '/notifications',
    band: 'administration',
    next: { to: '/notifications/channels', label: 'Notification Channels' },
    historyTo: '/notifications/history',
    loadingLabel: 'Loading notification settings…',
  },
  {
    id: 'notification-channels',
    label: 'Notification Channels',
    path: '/notifications/channels',
    band: 'administration',
    next: { to: '/ai-analytics', label: 'AI Analytics' },
    loadingLabel: 'Loading notification channels…',
  },
  {
    id: 'connections',
    label: 'Connections',
    path: '/connections',
    band: 'administration',
    loadingLabel: 'Loading connections…',
  },
  {
    id: 'market-data',
    label: 'Market Data',
    path: '/market-data',
    band: 'administration',
    loadingLabel: 'Loading Market Data…',
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    band: 'administration',
    loadingLabel: 'Loading settings…',
  },
  {
    id: 'sign-in-sessions',
    label: 'Sign-in sessions',
    path: '/account/sessions',
    band: 'administration',
    loadingLabel: 'Loading sign-in sessions…',
  },
  {
    id: 'password',
    label: 'Password',
    path: '/account/password',
    band: 'administration',
    loadingLabel: 'Loading password…',
  },
  {
    id: 'people',
    label: 'People',
    path: '/people',
    band: 'administration',
    loadingLabel: 'Loading people…',
  },
];

export const NAV_BANDS: readonly NavBand[] = [
  {
    id: 'research',
    label: 'Research',
    ariaLabel: 'Research',
    size: 'primary',
    groups: [
      {
        id: 'overview',
        label: 'Start',
        links: [
          { to: '/', label: 'Overview' },
          { to: '/dashboard', label: 'Dashboard' },
        ],
      },
      {
        id: 'evidence',
        label: 'Evidence',
        links: [
          { to: '/research', label: 'Research' },
          { to: '/lab', label: 'Lab' },
          { to: '/campaigns/run', label: 'Campaign' },
          { to: '/strategies', label: 'Research strategies' },
        ],
      },
      {
        id: 'market',
        label: 'Market context',
        links: [
          { to: '/qualification', label: 'Qualification' },
          { to: '/market-profile', label: 'Market Profile' },
          { to: '/market-state', label: 'Market State' },
          { to: '/knowledge-lake', label: 'Knowledge Lake' },
        ],
      },
      {
        id: 'tools',
        label: 'Research tools',
        links: [
          { to: '/optimization', label: 'Optimization' },
          { to: '/analytics', label: 'Analytics' },
          { to: '/engineering', label: 'Engineering' },
          { to: '/diagnostics', label: 'Diagnostics' },
          { to: '/workflows', label: 'Workflows' },
          { to: '/knowledge', label: 'Knowledge' },
          { to: '/ai', label: 'AI' },
        ],
      },
    ],
  },
  {
    id: 'paper-trading',
    label: 'Paper trading',
    ariaLabel: 'Paper trading',
    size: 'secondary',
    groups: [
      {
        id: 'certified-path',
        label: 'Certified path',
        links: [
          { to: '/strategy-library', label: 'Strategy Library' },
          { to: '/strategy-library/certify', label: 'Certification' },
          { to: '/runtime-validation', label: 'Runtime Validation' },
          { to: '/deployments', label: 'Deployment' },
          { to: '/orchestrator', label: 'Trading Orchestrator' },
        ],
      },
      {
        id: 'operate',
        label: 'Operate',
        links: [
          { to: '/paper-trading', label: 'Paper Trading' },
          { to: '/command-center', label: 'Command Center' },
          { to: '/clusters', label: 'Cluster' },
          { to: '/trading/paper', label: 'Paper Bots' },
          { to: '/trading/portfolio', label: 'Portfolio' },
          { to: '/trading/positions', label: 'Positions' },
          { to: '/trading/orders', label: 'Orders' },
          { to: '/trading/risk', label: 'Risk' },
        ],
      },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    ariaLabel: 'Administration',
    size: 'secondary',
    groups: [
      {
        id: 'delivery',
        label: 'Evidence and delivery',
        links: [
          { to: '/reporting', label: 'Reporting' },
          { to: '/ai-analytics', label: 'AI Analytics' },
          { to: '/notifications', label: 'Notifications' },
          { to: '/notifications/channels', label: 'Notification Channels' },
          { to: '/connections', label: 'Connections' },
          { to: '/market-data', label: 'Market Data' },
        ],
      },
      {
        id: 'preferences',
        label: 'Preferences',
        links: [
          { to: '/people', label: 'People' },
          { to: '/settings', label: 'Settings' },
          { to: '/account/sessions', label: 'Sign-in sessions' },
          { to: '/account/password', label: 'Password' },
        ],
      },
    ],
  },
];

export function allNavLinks(): NavLink[] {
  return NAV_BANDS.flatMap((band) => band.groups.flatMap((group) => [...group.links]));
}

export function productChrome(id: string): ProductChrome | undefined {
  return PRODUCT_CHROME.find((item) => item.id === id);
}

export function productChromeByPath(pathname: string): ProductChrome | undefined {
  const exact = PRODUCT_CHROME.find((item) => item.path === pathname);
  if (exact) return exact;
  return PRODUCT_CHROME.filter((item) => item.path !== '/' && pathname.startsWith(`${item.path}/`))
    .sort((a, b) => b.path.length - a.path.length)
    .at(0);
}

export function bandLabel(band: NavBandId): string {
  if (band === 'paper-trading') return 'Paper trading';
  if (band === 'administration') return 'Administration';
  return 'Research';
}

/**
 * True when this nav target is the current product, without lighting up a sibling.
 * `/notifications/channels` is not Notifications. `/strategy-library/certify` is not Library.
 */
export function isNavTargetActive(pathname: string, to: string): boolean {
  if (to === '/') return pathname === '/';
  if (pathname === to) return true;
  if (!pathname.startsWith(`${to}/`)) return false;
  return !allNavLinks().some(
    (link) =>
      link.to !== to &&
      (pathname === link.to || pathname.startsWith(`${link.to}/`)) &&
      link.to.startsWith(`${to}/`),
  );
}

export function nextJourneyStep(pathname: string): JourneyStep | undefined {
  const index = OPERATOR_JOURNEY.findIndex(
    (step, i) =>
      pathname === step.path ||
      (step.path !== '/' && pathname.startsWith(`${step.path}/`)) ||
      (i === 0 && pathname === '/'),
  );
  if (index < 0) return OPERATOR_JOURNEY[0];
  return OPERATOR_JOURNEY[index + 1];
}
