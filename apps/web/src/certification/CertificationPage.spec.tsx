import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { CertificationAttemptView, Strategy } from '../shared/api';
import { CertificationHistoryView } from './CertificationHistoryView';
import { CertificationResultView } from './CertificationResultView';
import { CertificationWizardView } from './CertificationWizardView';
import type { CertificationWizardDraft } from './certification-wizard';

const candidate: Strategy = {
  id: 'st-1',
  workspaceId: 'ws-1',
  name: 'Momentum',
  description: '',
  status: 'active',
  tradingPair: 'BTCUSDT',
  timeframe: '1h',
  direction: 'BOTH',
  positionSize: 100,
  stopLossPercent: 2,
  takeProfitPercent: 5,
  parameters: {},
  createdAt: '2026-08-15T12:00:00.000Z',
  updatedAt: '2026-08-15T12:00:00.000Z',
};

const draft: CertificationWizardDraft = {
  candidate,
  version: '1.0.0',
  notes: '',
  evidence: [
    { type: 'backtesting', sourceId: 'bt-1' },
    { type: 'walk-forward', sourceId: 'wf-1' },
  ],
};

const certified: CertificationAttemptView = {
  attemptId: 'attempt-1',
  workspaceId: 'ws-1',
  outcome: 'certified',
  progress: 'complete',
  reasons: [],
  libraryEntryId: 'lib-entry-1',
  certificationId: 'cert-1',
  certifiedBy: 'operator-alice',
  certifiedAt: '2026-08-15T13:00:00.000Z',
  createdAt: '2026-08-15T13:00:00.000Z',
  notes: 'Admit',
  metadata: {
    strategyFamilyId: 'fam-st-1',
    name: 'Momentum',
    version: '1.0.0',
    contentHash: 'research:st-1:1.0.0',
    registryRef: 'st-1',
    evidenceTypes: ['backtesting', 'walk-forward'],
    envelopeVersion: '1',
  },
};

const rejected: CertificationAttemptView = {
  ...certified,
  attemptId: 'attempt-0',
  outcome: 'rejected',
  reasons: ['missing_evidence_walk_forward'],
  libraryEntryId: null,
  certificationId: null,
  certifiedAt: null,
  metadata: { ...certified.metadata, evidenceTypes: ['backtesting'] },
};

describe('Certification UI (PC-02)', () => {
  it('renders the wizard candidate, evidence, and irreversible confirm steps', () => {
    const candidateHtml = renderToStaticMarkup(
      <MemoryRouter>
        <CertificationWizardView
          step="candidate"
          draft={{ ...draft, candidate: null }}
          candidates={[candidate]}
          loading={false}
          submitting={false}
          error={null}
          onSelectCandidate={() => undefined}
          onVersion={() => undefined}
          onNotes={() => undefined}
          onEvidence={() => undefined}
          onBack={() => undefined}
          onNext={() => undefined}
          onSubmit={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(candidateHtml).toContain('Certify a strategy');
    expect(candidateHtml).toContain('Momentum');
    expect(candidateHtml).toContain('data-testid="wizard-step-candidate"');
    expect(candidateHtml).not.toContain('Coming Soon');

    const confirmHtml = renderToStaticMarkup(
      <MemoryRouter>
        <CertificationWizardView
          step="confirm"
          draft={draft}
          candidates={[candidate]}
          loading={false}
          submitting={true}
          error={null}
          onSelectCandidate={() => undefined}
          onVersion={() => undefined}
          onNotes={() => undefined}
          onEvidence={() => undefined}
          onBack={() => undefined}
          onNext={() => undefined}
          onSubmit={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(confirmHtml).toContain('Confirm irreversible admit');
    expect(confirmHtml).toContain('Validating evidence and admitting into Strategy Library');
    expect(confirmHtml).toContain('data-testid="wizard-submit"');
  });

  it('shows certification history, failure reasons, and success metadata', () => {
    const history = renderToStaticMarkup(
      <MemoryRouter>
        <CertificationHistoryView items={[certified, rejected]} loading={false} error={null} />
      </MemoryRouter>,
    );
    expect(history).toContain('Certification history');
    expect(history).toContain('Certified');
    expect(history).toContain('Rejected');
    expect(history).toContain('Walk-forward evidence is required.');

    const success = renderToStaticMarkup(
      <MemoryRouter>
        <CertificationResultView record={certified} loading={false} error={null} />
      </MemoryRouter>,
    );
    expect(success).toContain('Success summary');
    expect(success).toContain('Certification metadata');
    expect(success).toContain('href="/strategy-library/lib-entry-1"');
    expect(success).not.toContain('Failure reasons');

    const failure = renderToStaticMarkup(
      <MemoryRouter>
        <CertificationResultView record={rejected} loading={false} error={null} />
      </MemoryRouter>,
    );
    expect(failure).toContain('Failure reasons');
    expect(failure).toContain('Walk-forward evidence is required.');
  });
});
