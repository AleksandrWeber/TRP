import 'reflect-metadata';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import {
  CreateOrchestrationPlanBodyDto,
  EmitSessionHandoffBodyDto,
  ListOrchestrationHistoryQueryDto,
  ProposeSelectionBodyDto,
  RequestOrchestrationRunBodyDto,
} from './orchestration.dto';

describe('Orchestration DTOs (PC-11)', () => {
  it('accepts a paper plan', () => {
    const dto = Object.assign(new CreateOrchestrationPlanBodyDto(), {
      marketSymbol: 'BTCUSDT',
      exchangeScopeId: 'binance-spot',
      modeContext: 'paper',
      objective: 'Coordinate a certified paper selection',
    });
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('rejects live mode on the product transport', () => {
    const dto = Object.assign(new CreateOrchestrationPlanBodyDto(), {
      marketSymbol: 'BTCUSDT',
      modeContext: 'live',
      objective: 'trade live',
    });
    expect(validateSync(dto).length).toBeGreaterThan(0);
  });

  it('accepts a run request and a selection tactic point', () => {
    const run = Object.assign(new RequestOrchestrationRunBodyDto(), {
      marketSymbol: 'BTCUSDT',
      orchestrationPlanId: 'plan-1',
    });
    expect(validateSync(run)).toHaveLength(0);
    const selection = Object.assign(new ProposeSelectionBodyDto(), {
      libraryEntryId: 'lib-entry-1',
      strategyVersionId: '1.0.0',
      envelopeVersion: 'env-1',
      tacticPoint: { symbol: 'BTCUSDT', timeframe: '1h' },
    });
    expect(validateSync(selection)).toHaveLength(0);
  });

  it('requires a deployment bind ref for handoff and rejects oversized history', () => {
    const missing = Object.assign(new EmitSessionHandoffBodyDto(), {
      selectionDecisionId: 'sel-1',
    });
    expect(validateSync(missing).length).toBeGreaterThan(0);
    const handoff = Object.assign(new EmitSessionHandoffBodyDto(), {
      selectionDecisionId: 'sel-1',
      deploymentBindRef: 'dep-1',
    });
    expect(validateSync(handoff)).toHaveLength(0);
    const history = Object.assign(new ListOrchestrationHistoryQueryDto(), { limit: 201 });
    expect(validateSync(history).length).toBeGreaterThan(0);
  });
});
