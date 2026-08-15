import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type {
  RuntimeValidationView as RuntimeValidationRecord,
  StrategyLibraryRecordView,
} from '../shared/api';
import { RuntimeValidationHistoryView } from './RuntimeValidationHistoryView';
import { RuntimeValidationResultView } from './RuntimeValidationResultView';
import { RuntimeValidationView } from './RuntimeValidationView';

const entry: StrategyLibraryRecordView = {
  authorityClass: 'source_of_truth',
  membershipStatus: 'certified',
  strategy: {
    strategyFamilyId: 'fam-momentum',
    name: 'Momentum',
    description: null,
    registryRef: null,
    workspaceId: 'ws-1',
    createdAt: '2026-08-15T12:00:00.000Z',
  },
  version: {
    libraryEntryId: 'lib-entry-1',
    strategyFamilyId: 'fam-momentum',
    version: '1.0.0',
    contentHash: 'sha256:abc',
    market: 'crypto-spot',
    supportedExchangeScopeIds: ['binance-spot'],
    supportedTimeframes: ['1h'],
    supportedUniverse: { kind: 'symbols', symbols: ['BTCUSDT'] },
    workspaceId: 'ws-1',
    createdAt: '2026-08-15T12:00:00.000Z',
    immutable: true,
  },
  certification: null,
  eligibility: null,
  tacticalEnvelope: null,
  envelopeState: 'empty',
};

const passed: RuntimeValidationRecord = {
  validationId: 'val-1',
  workspaceId: 'ws-1',
  progress: 'complete',
  outcome: 'pass',
  validation: 'VALID',
  reasons: [],
  libraryEntryId: 'lib-entry-1',
  strategyFamilyId: 'fam-momentum',
  strategyVersion: '1.0.0',
  strategyName: 'Momentum',
  purpose: 'deployment_bind',
  exchangeScopeId: null,
  certificationStatus: 'active',
  eligibilityOutcome: 'eligible',
  checkedAt: '2026-08-15T16:00:00.000Z',
  createdAt: '2026-08-15T16:00:00.000Z',
};

const failed: RuntimeValidationRecord = {
  ...passed,
  validationId: 'val-0',
  outcome: 'fail',
  validation: 'INVALID',
  reasons: ['strategy_not_found'],
  libraryEntryId: null,
  strategyVersion: '9.9.9',
  strategyName: null,
};

describe('Runtime Validation UI (PC-04)', () => {
  it('renders the validation page without deploy or override controls', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <RuntimeValidationView
          entries={[entry]}
          selected={entry}
          exchangeScopeId=""
          loading={false}
          submitting={true}
          error={null}
          onSelect={() => undefined}
          onExchangeScope={() => undefined}
          onSubmit={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(html).toContain('Run validation');
    expect(html).toContain('Running Runtime Validation…');
    expect(html).toContain('Momentum');
    expect(html).toContain('does not deploy');
    expect(html).not.toContain('Force deploy');
    expect(html).not.toContain('Coming Soon');
    expect(html).not.toContain('soft-pass');
  });

  it('renders PASS / FAIL, reasons, version, and timestamp', () => {
    const passHtml = renderToStaticMarkup(
      <MemoryRouter>
        <RuntimeValidationResultView record={passed} loading={false} error={null} />
      </MemoryRouter>,
    );
    expect(passHtml).toContain('PASS');
    expect(passHtml).toContain('1.0.0');
    expect(passHtml).toContain('2026-08-15');

    const failHtml = renderToStaticMarkup(
      <MemoryRouter>
        <RuntimeValidationResultView record={failed} loading={false} error={null} />
      </MemoryRouter>,
    );
    expect(failHtml).toContain('FAIL');
    expect(failHtml).toContain('The strategy family was not found in Strategy Library.');
    expect(failHtml).not.toContain('Force deploy');
  });

  it('renders validation history', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <RuntimeValidationHistoryView items={[passed, failed]} loading={false} error={null} />
      </MemoryRouter>,
    );
    expect(html).toContain('Validation history');
    expect(html).toContain('PASS');
    expect(html).toContain('FAIL');
    expect(html).toContain('data-testid="validation-history-link"');
  });
});
