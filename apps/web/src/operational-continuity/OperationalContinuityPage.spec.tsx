import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { OperationalContinuityView } from './OperationalContinuityView';
import type { OperationalContinuityReadinessView } from '../shared/api';

const ready: OperationalContinuityReadinessView = {
  platformState: 'Ready',
  ownerStates: [
    {
      owner: 'strategy-library',
      state: 'Ready',
      recoveryRequired: true,
      dependencyOwners: [],
    },
    {
      owner: 'reporting',
      state: 'Ready',
      recoveryRequired: true,
      dependencyOwners: ['knowledge-lake'],
    },
  ],
  unavailableOwners: [],
  degradedOwners: [],
  recoveryTimestamp: '2026-08-26T12:00:00.000Z',
  recoveryDurationMs: 42,
  notificationQueue: {
    operationalState: 'Ready',
    ownerReadiness: 'ready',
    recoveryTimestamp: '2026-08-26T12:00:00.000Z',
    recoveryDurationMs: 42,
    openCount: 0,
    abandonedCount: 0,
    channelUnavailable: false,
    integrityVerified: true,
    workspaceIds: [],
  },
  killSwitch: {
    operationalState: 'Ready',
    ownerReadiness: 'ready',
    recoveryTimestamp: '2026-08-26T12:00:00.000Z',
    recoveryDurationMs: 42,
    restoredCount: 0,
    armedCount: 0,
    integrityVerified: true,
    workspaceIds: [],
  },
  monitoringHealth: {
    operationalState: 'Ready',
    ownerReadiness: 'ready',
    recoveryTimestamp: '2026-08-26T12:00:00.000Z',
    recoveryDurationMs: 42,
    restoredCount: 0,
    securityHealthAnchorCount: 0,
    connectionHealthAnchorCount: 0,
    integrityVerified: true,
    workspaceIds: [],
  },
  exchangeConnectivity: {
    operationalState: 'Ready',
    ownerReadiness: 'ready',
    recoveryTimestamp: '2026-08-26T12:00:00.000Z',
    recoveryDurationMs: 42,
    restoredCount: 0,
    connectionAnchorCount: 0,
    adapterAnchorCount: 0,
    integrityVerified: true,
    workspaceIds: [],
  },
  bybitExchangeConnectivity: {
    operationalState: 'Ready',
    ownerReadiness: 'ready',
    recoveryTimestamp: '2026-08-26T12:00:00.000Z',
    recoveryDurationMs: 42,
    restoredCount: 0,
    connectionAnchorCount: 0,
    adapterAnchorCount: 0,
    integrityVerified: true,
    workspaceIds: [],
  },
  okxExchangeConnectivity: {
    operationalState: 'Ready',
    ownerReadiness: 'ready',
    recoveryTimestamp: '2026-08-26T12:00:00.000Z',
    recoveryDurationMs: 42,
    restoredCount: 0,
    connectionAnchorCount: 0,
    adapterAnchorCount: 0,
    integrityVerified: true,
    workspaceIds: [],
  },
  krakenExchangeConnectivity: {
    operationalState: 'Ready',
    ownerReadiness: 'ready',
    recoveryTimestamp: '2026-08-26T12:00:00.000Z',
    recoveryDurationMs: 42,
    restoredCount: 0,
    connectionAnchorCount: 0,
    adapterAnchorCount: 0,
    integrityVerified: true,
    workspaceIds: [],
  },
  venuePermissionVerification: {
    operationalState: 'Ready',
    ownerReadiness: 'ready',
    recoveryTimestamp: '2026-08-26T12:00:00.000Z',
    recoveryDurationMs: 42,
    restoredCount: 0,
    verifiedAnchorCount: 0,
    integrityVerified: true,
    workspaceIds: [],
  },
  telegramNotification: {
    operationalState: 'Ready',
    ownerReadiness: 'ready',
    recoveryTimestamp: '2026-08-26T12:00:00.000Z',
    recoveryDurationMs: 42,
    restoredCount: 0,
    canonicalAnchorCount: 0,
    integrityVerified: true,
    workspaceIds: [],
  },
  emailNotification: {
    operationalState: 'Ready',
    ownerReadiness: 'ready',
    recoveryTimestamp: '2026-08-26T12:00:00.000Z',
    recoveryDurationMs: 42,
    restoredCount: 0,
    canonicalAnchorCount: 0,
    integrityVerified: true,
    workspaceIds: [],
  },
  slackDiscordTeamsNotification: {
    operationalState: 'Ready',
    ownerReadiness: 'ready',
    recoveryTimestamp: '2026-08-26T12:00:00.000Z',
    recoveryDurationMs: 42,
    restoredCount: 0,
    canonicalAnchorCount: 0,
    integrityVerified: true,
    workspaceIds: [],
  },
  pushNotification: {
    operationalState: 'Ready',
    ownerReadiness: 'ready',
    recoveryTimestamp: '2026-08-26T12:00:00.000Z',
    recoveryDurationMs: 42,
    restoredCount: 0,
    canonicalAnchorCount: 0,
    integrityVerified: true,
    workspaceIds: [],
  },
};

const degraded: OperationalContinuityReadinessView = {
  platformState: 'Degraded',
  ownerStates: [
    {
      owner: 'knowledge-lake',
      state: 'Unavailable',
      recoveryRequired: true,
      dependencyOwners: [],
      reason: 'hydrate failed',
    },
    {
      owner: 'reporting',
      state: 'Degraded',
      recoveryRequired: true,
      dependencyOwners: ['knowledge-lake'],
    },
    {
      owner: 'notification-delivery',
      state: 'Ready',
      recoveryRequired: true,
      dependencyOwners: [],
    },
  ],
  unavailableOwners: ['knowledge-lake'],
  degradedOwners: ['reporting'],
  recoveryTimestamp: '2026-08-26T12:01:00.000Z',
  recoveryDurationMs: 100,
  notificationQueue: {
    operationalState: 'Ready',
    ownerReadiness: 'ready',
    recoveryTimestamp: '2026-08-26T12:01:00.000Z',
    recoveryDurationMs: 100,
    openCount: 0,
    abandonedCount: 0,
    channelUnavailable: false,
    integrityVerified: true,
    workspaceIds: [],
  },
  killSwitch: {
    operationalState: 'Ready',
    ownerReadiness: 'ready',
    recoveryTimestamp: '2026-08-26T12:01:00.000Z',
    recoveryDurationMs: 100,
    restoredCount: 1,
    armedCount: 0,
    integrityVerified: true,
    workspaceIds: ['ws-1'],
  },
  monitoringHealth: {
    operationalState: 'Ready',
    ownerReadiness: 'ready',
    recoveryTimestamp: '2026-08-26T12:01:00.000Z',
    recoveryDurationMs: 100,
    restoredCount: 1,
    securityHealthAnchorCount: 1,
    connectionHealthAnchorCount: 0,
    integrityVerified: true,
    workspaceIds: ['ws-1'],
  },
  exchangeConnectivity: {
    operationalState: 'Ready',
    ownerReadiness: 'ready',
    recoveryTimestamp: '2026-08-26T12:01:00.000Z',
    recoveryDurationMs: 100,
    restoredCount: 1,
    connectionAnchorCount: 1,
    adapterAnchorCount: 0,
    integrityVerified: true,
    workspaceIds: ['ws-1'],
  },
  bybitExchangeConnectivity: {
    operationalState: 'Ready',
    ownerReadiness: 'ready',
    recoveryTimestamp: '2026-08-26T12:01:00.000Z',
    recoveryDurationMs: 100,
    restoredCount: 1,
    connectionAnchorCount: 1,
    adapterAnchorCount: 0,
    integrityVerified: true,
    workspaceIds: ['ws-1'],
  },
  okxExchangeConnectivity: {
    operationalState: 'Ready',
    ownerReadiness: 'ready',
    recoveryTimestamp: '2026-08-26T12:01:00.000Z',
    recoveryDurationMs: 100,
    restoredCount: 1,
    connectionAnchorCount: 1,
    adapterAnchorCount: 0,
    integrityVerified: true,
    workspaceIds: ['ws-1'],
  },
  krakenExchangeConnectivity: {
    operationalState: 'Ready',
    ownerReadiness: 'ready',
    recoveryTimestamp: '2026-08-26T12:01:00.000Z',
    recoveryDurationMs: 100,
    restoredCount: 1,
    connectionAnchorCount: 1,
    adapterAnchorCount: 0,
    integrityVerified: true,
    workspaceIds: ['ws-1'],
  },
  venuePermissionVerification: {
    operationalState: 'Ready',
    ownerReadiness: 'ready',
    recoveryTimestamp: '2026-08-26T12:01:00.000Z',
    recoveryDurationMs: 100,
    restoredCount: 1,
    verifiedAnchorCount: 1,
    integrityVerified: true,
    workspaceIds: ['ws-1'],
  },
  telegramNotification: {
    operationalState: 'Ready',
    ownerReadiness: 'ready',
    recoveryTimestamp: '2026-08-26T12:01:00.000Z',
    recoveryDurationMs: 100,
    restoredCount: 1,
    canonicalAnchorCount: 1,
    integrityVerified: true,
    workspaceIds: ['ws-1'],
  },
  emailNotification: {
    operationalState: 'Ready',
    ownerReadiness: 'ready',
    recoveryTimestamp: '2026-08-26T12:01:00.000Z',
    recoveryDurationMs: 100,
    restoredCount: 1,
    canonicalAnchorCount: 1,
    integrityVerified: true,
    workspaceIds: ['ws-1'],
  },
  slackDiscordTeamsNotification: {
    operationalState: 'Ready',
    ownerReadiness: 'ready',
    recoveryTimestamp: '2026-08-26T12:01:00.000Z',
    recoveryDurationMs: 100,
    restoredCount: 1,
    canonicalAnchorCount: 1,
    integrityVerified: true,
    workspaceIds: ['ws-1'],
  },
  pushNotification: {
    operationalState: 'Ready',
    ownerReadiness: 'ready',
    recoveryTimestamp: '2026-08-26T12:01:00.000Z',
    recoveryDurationMs: 100,
    restoredCount: 1,
    canonicalAnchorCount: 1,
    integrityVerified: true,
    workspaceIds: ['ws-1'],
  },
};

describe('OperationalContinuityView', () => {
  it('shows platform readiness, recovery timestamp, and duration', () => {
    const html = renderToStaticMarkup(<OperationalContinuityView readiness={ready} />);
    expect(html).toContain('Ready');
    expect(html).toContain('2026-08-26T12:00:00.000Z');
    expect(html).toContain('42 ms');
    expect(html).toContain('strategy-library');
  });

  it('shows degraded and unavailable owners honestly', () => {
    const html = renderToStaticMarkup(<OperationalContinuityView readiness={degraded} />);
    expect(html).toContain('Degraded');
    expect(html).toContain('knowledge-lake');
    expect(html).toContain('reporting');
    expect(html).toContain('notification-delivery');
    expect(html).not.toContain('Incident');
    expect(html).not.toContain('Cluster');
    expect(html).not.toContain('Replication');
  });

  it('shows notification queue operational state, owner readiness, and recovery timing', () => {
    const html = renderToStaticMarkup(<OperationalContinuityView readiness={ready} />);
    expect(html).toContain('Notification queue');
    expect(html).toContain('Queue operational state');
    expect(html).toContain('Owner readiness');
    expect(html).not.toContain('Retry');
    expect(html).not.toContain('Scheduler');
  });

  it('shows kill switch operational state, owner readiness, and recovery timing', () => {
    const html = renderToStaticMarkup(<OperationalContinuityView readiness={ready} />);
    expect(html).toContain('Kill switch');
    expect(html).toContain('Kill switch operational state');
    expect(html).toContain('Restored workspaces');
    expect(html).toContain('Armed workspaces');
    expect(html).not.toContain('Arm kill switch');
    expect(html).not.toContain('Command Center');
  });

  it('shows monitoring health operational state within platform readiness only', () => {
    const html = renderToStaticMarkup(<OperationalContinuityView readiness={ready} />);
    expect(html).toContain('Monitoring &amp; security health');
    expect(html).toContain('Monitoring operational state');
    expect(html).toContain('Security health anchors');
    expect(html).not.toContain('Dashboard');
    expect(html).not.toContain('Alert');
  });

  it('shows exchange connectivity operational state within platform readiness only', () => {
    const html = renderToStaticMarkup(<OperationalContinuityView readiness={ready} />);
    expect(html).toContain('Exchange connectivity');
    expect(html).toContain('Exchange connectivity operational state');
    expect(html).toContain('Connection anchors');
    expect(html).not.toContain('Connected');
    expect(html).not.toContain('Binance');
  });

  it('shows Bybit exchange connectivity operational state within platform readiness only', () => {
    const html = renderToStaticMarkup(<OperationalContinuityView readiness={ready} />);
    expect(html).toContain('Bybit exchange connectivity');
    expect(html).toContain('Bybit exchange connectivity operational state');
    expect(html).toContain('Connection anchors');
    expect(html).not.toContain('Connected');
    expect(html).not.toContain('Bybit Connected');
  });

  it('shows OKX exchange connectivity operational state within platform readiness only', () => {
    const html = renderToStaticMarkup(<OperationalContinuityView readiness={ready} />);
    expect(html).toContain('OKX exchange connectivity');
    expect(html).toContain('OKX exchange connectivity operational state');
    expect(html).toContain('Connection anchors');
    expect(html).not.toContain('Connected');
    expect(html).not.toContain('OKX Connected');
  });

  it('shows Kraken exchange connectivity operational state within platform readiness only', () => {
    const html = renderToStaticMarkup(<OperationalContinuityView readiness={ready} />);
    expect(html).toContain('Kraken exchange connectivity');
    expect(html).toContain('Kraken exchange connectivity operational state');
    expect(html).toContain('Connection anchors');
    expect(html).not.toContain('Connected');
    expect(html).not.toContain('Kraken Connected');
  });

  it('shows Venue Permission Verification operational state within platform readiness only', () => {
    const html = renderToStaticMarkup(<OperationalContinuityView readiness={ready} />);
    expect(html).toContain('Venue Permission Verification');
    expect(html).toContain('Venue Permission Verification operational state');
    expect(html).toContain('Verified anchors');
    expect(html).not.toContain('Permission verified');
    expect(html).not.toContain('Live Trading');
  });

  it('shows Telegram Notification operational state within platform readiness only', () => {
    const html = renderToStaticMarkup(<OperationalContinuityView readiness={ready} />);
    expect(html).toContain('Telegram Notification');
    expect(html).toContain('Telegram Notification operational state');
    expect(html).toContain('Canonical anchors');
    expect(html).not.toContain('Delivering');
    expect(html).not.toContain('Bot API');
  });

  it('shows Email Notification operational state within platform readiness only', () => {
    const html = renderToStaticMarkup(<OperationalContinuityView readiness={ready} />);
    expect(html).toContain('Email Notification');
    expect(html).toContain('Email Notification operational state');
    expect(html).toContain('Canonical anchors');
    expect(html).not.toContain('Delivering');
    expect(html).not.toContain('SMTP');
  });

  it('shows Slack / Discord / Teams Notification operational state within platform readiness only', () => {
    const html = renderToStaticMarkup(<OperationalContinuityView readiness={ready} />);
    expect(html).toContain('Slack / Discord / Teams Notification');
    expect(html).toContain('Slack / Discord / Teams Notification operational state');
    expect(html).toContain('Canonical anchors');
    expect(html).not.toContain('Delivering');
    expect(html).not.toContain('Webhook');
  });

  it('shows Push Notification operational state within platform readiness only', () => {
    const html = renderToStaticMarkup(<OperationalContinuityView readiness={ready} />);
    expect(html).toContain('Push Notification');
    expect(html).toContain('Push Notification operational state');
    expect(html).toContain('Canonical anchors');
    expect(html).not.toContain('Delivering');
    expect(html).not.toContain('FCM');
    expect(html).not.toContain('Web Push');
  });
});
