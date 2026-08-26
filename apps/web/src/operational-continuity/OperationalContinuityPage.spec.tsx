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
});
