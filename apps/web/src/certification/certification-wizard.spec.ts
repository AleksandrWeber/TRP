import { describe, expect, it } from 'vitest';
import type { Strategy } from '../shared/api';
import {
  buildCertifyRequest,
  evidenceChecklistComplete,
  nextWizardStep,
  previousWizardStep,
  researchContentHash,
} from './certification-wizard';

const strategy: Strategy = {
  id: 'st-1',
  workspaceId: 'ws-1',
  name: 'Momentum',
  description: 'Breakout',
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

describe('Certification wizard helpers (PC-02)', () => {
  it('requires backtesting and walk-forward evidence before confirm', () => {
    expect(evidenceChecklistComplete([{ type: 'backtesting', sourceId: 'bt-1' }])).toBe(false);
    expect(
      evidenceChecklistComplete([
        { type: 'backtesting', sourceId: 'bt-1' },
        { type: 'walk-forward', sourceId: 'wf-1' },
      ]),
    ).toBe(true);
    expect(nextWizardStep('candidate')).toBe('evidence');
    expect(previousWizardStep('confirm')).toBe('evidence');
  });

  it('builds a certify command from a research candidate without owning Library', () => {
    const request = buildCertifyRequest({
      candidate: strategy,
      version: '1.0.0',
      notes: 'Admit',
      evidence: [
        { type: 'backtesting', sourceId: 'bt-1' },
        { type: 'walk-forward', sourceId: 'wf-1' },
      ],
    });
    expect(request.family.registryRef).toBe('st-1');
    expect(request.version.contentHash).toBe(researchContentHash('st-1', '1.0.0'));
    expect(request.tacticalEnvelope.allowedSymbols).toEqual(['BTCUSDT']);
    expect(request.evidence.map((item) => item.type)).toEqual(['backtesting', 'walk-forward']);
  });
});
