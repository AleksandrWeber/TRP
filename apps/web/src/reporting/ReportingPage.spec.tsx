import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { ReportRunDetailView, ReportRunListItemView } from '../shared/api';
import { ReportingDetailView } from './ReportingDetailView';
import { ReportingHistoryView } from './ReportingHistoryView';
import { ReportingHomeView } from './ReportingHomeView';
import { buildProjectionExport, buildReportListQuery } from './reporting';

const item: ReportRunListItemView = {
  reportRunId: 'run-1',
  workspaceId: 'ws-1',
  reportDefinitionId: 'def-1',
  name: 'Ops Daily',
  kind: 'ops_daily',
  status: 'completed',
  modes: ['paper'],
  exchangeScopeId: 'binance-spot',
  tradingSessionId: 'session-1',
  libraryEntryId: null,
  windowFrom: '2026-08-15T00:00:00.000Z',
  windowTo: '2026-08-16T00:00:00.000Z',
  windowPreset: 'daily',
  factCount: 2,
  createdAt: '2026-08-15T18:00:00.000Z',
  deliveryOutcome: 'skipped',
  deliveryId: 'del-1',
  authorityClass: 'projection',
  ledgerSoT: false,
};

const detail: ReportRunDetailView = {
  ...item,
  description: 'Paper ops',
  metricKeys: ['fact_count'],
  compareEnabled: false,
  rejectionReasons: [],
  sourceSummary: {
    factCount: 2,
    lakeEventIds: ['evt-1'],
    sourceRefs: [{ ownerType: 'knowledge-lake', id: 'evt-1' }],
  },
  aggregations: [
    {
      sliceId: 'slice-1',
      reportRunId: 'run-1',
      metricKey: 'fact_count',
      mode: null,
      label: 'Facts',
      value: 2,
      comparison: null,
      sourceRefs: [{ ownerType: 'knowledge-lake', id: 'evt-1' }],
      visualizationHint: 'kpi',
      authorityClass: 'projection',
    },
  ],
  narrative: {
    reportRunId: 'run-1',
    workspaceId: 'ws-1',
    reportStatus: 'completed',
    reportOutcome: 'completed',
    narrativeId: 'nar-1',
    narrativeKind: 'narrative',
    narrativeText: 'Quiet paper session.',
    narrativeUnavailable: false,
    attached: true,
    reportMutated: false,
    forcesTrade: false,
    authorityClass: 'narrative',
  },
  delivery: {
    reportRunId: 'run-1',
    workspaceId: 'ws-1',
    userId: 'user-1',
    reportStatus: 'completed',
    reportOutcome: 'completed',
    invoked: true,
    notificationType: 'daily-report',
    deliveryId: 'del-1',
    outcome: 'skipped',
    skipReasons: ['channel-not-connected'],
    channelsAttempted: ['telegram'],
    telegramAdapterReached: false,
    reservedChannelSkips: [],
    attached: true,
    reportMutated: false,
    generatesReports: false,
    channelActivated: false,
    forcesTrade: false,
    authorityClass: 'notification-projection',
  },
  exportAvailable: true,
  exportKind: 'projection-json',
};

describe('Reporting UI (PC-05)', () => {
  it('renders home search, filters, empty, loading, and run links', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ReportingHomeView
          items={[item]}
          search=""
          status="all"
          kind="all"
          mode="all"
          loading={false}
          error={null}
          onSearch={() => undefined}
          onStatus={() => undefined}
          onKind={() => undefined}
          onMode={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(html).toContain('Report runs');
    expect(html).toContain('Ops Daily');
    expect(html).toContain('not the ledger Source of Truth');
    expect(html).toContain('data-testid="reporting-run-link"');
    expect(html).not.toContain('Coming Soon');
    expect(html).not.toMatch(/['"`]\/reports(?:\/|['"`?]|$)/);

    const empty = renderToStaticMarkup(
      <MemoryRouter>
        <ReportingHomeView
          items={[]}
          search=""
          status="all"
          kind="all"
          mode="all"
          loading={false}
          error={null}
          onSearch={() => undefined}
          onStatus={() => undefined}
          onKind={() => undefined}
          onMode={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(empty).toContain('No report runs in this workspace');

    const loading = renderToStaticMarkup(
      <MemoryRouter>
        <ReportingHomeView
          items={[]}
          search=""
          status="all"
          kind="all"
          mode="all"
          loading
          error="Could not load report runs."
          onSearch={() => undefined}
          onStatus={() => undefined}
          onKind={() => undefined}
          onMode={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(loading).toContain('Loading report runs');
    expect(loading).toContain('Could not load report runs.');
  });

  it('renders history, narrative, delivery, metadata, and projection export', () => {
    const history = renderToStaticMarkup(
      <MemoryRouter>
        <ReportingHistoryView items={[item]} loading={false} error={null} />
      </MemoryRouter>,
    );
    expect(history).toContain('Report history');
    expect(history).toContain('data-testid="reporting-history-link"');

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ReportingDetailView record={detail} loading={false} error={null} />
      </MemoryRouter>,
    );
    expect(html).toContain('Quiet paper session.');
    expect(html).toContain('Skipped');
    expect(html).toContain('Export projection (JSON)');
    expect(html).toContain('Facts');
    expect(html).not.toContain('Force');
    expect(html).not.toContain('Coming Soon');

    const exported = JSON.parse(buildProjectionExport(detail)) as { ledgerSoT: boolean };
    expect(exported.ledgerSoT).toBe(false);
    expect(
      buildReportListQuery({ search: 'ops', status: 'completed', kind: 'all', mode: 'paper' }),
    ).toEqual({
      q: 'ops',
      status: 'completed',
      mode: 'paper',
    });
  });
});
