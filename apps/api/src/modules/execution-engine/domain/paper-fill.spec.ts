import { describe, expect, it } from 'vitest';
import type { PaperFillFact } from '../../execution-adapter';
import {
  createPaperFill,
  deterministicFillIdentity,
  type CreatePaperFillInput,
} from './paper-fill';

const fact: PaperFillFact = Object.freeze({
  adapterFillId: 'fill_abc',
  sequence: 1,
  instrument: 'BTCUSDT',
  side: 'buy',
  price: '100.05',
  quantity: '2',
  grossNotional: '200.1',
  fee: '0.2001',
  occurredAt: '2026-07-18T18:30:00.000Z',
});

const input: CreatePaperFillInput = Object.freeze({
  workspaceId: 'ws-fill',
  orderId: 'ord-fill',
  paperAccountId: 'acct-fill',
  tradingSessionId: 'sess-fill',
  adapterOrderId: 'paper_order_fill',
  executionContextHash: 'ctx-hash',
  configurationId: 'm2-paper-fill',
  configurationVersion: 1,
  configurationHash: 'cfg-hash',
  fact,
  recordedAt: '2026-07-18T18:30:00.100Z',
});

describe('US171 — immutable, append-only Fill facts', () => {
  it('derives a stable identity from workspace, order, and adapter fill id', () => {
    const fill = createPaperFill(input);
    expect(fill.id).toBe(deterministicFillIdentity('ws-fill', 'ord-fill', 'fill_abc'));
    expect(createPaperFill(input).id).toBe(fill.id);
  });

  it('preserves canonical decimal financial values and links to one Order', () => {
    const fill = createPaperFill(input);
    expect(fill).toMatchObject({
      orderId: 'ord-fill',
      price: '100.05',
      quantity: '2',
      grossNotional: '200.1',
      fee: '0.2001',
    });
    expect(Object.isFrozen(fill)).toBe(true);
  });

  it('rejects non-positive price or quantity and negative fee', () => {
    expect(() => createPaperFill({ ...input, fact: { ...fact, price: '0' } })).toThrow(
      /fill price/,
    );
    expect(() => createPaperFill({ ...input, fact: { ...fact, quantity: '0' } })).toThrow(
      /fill quantity/,
    );
    expect(() => createPaperFill({ ...input, fact: { ...fact, fee: '-1' } })).toThrow(/fill fee/);
  });

  it('requires a positive fill sequence', () => {
    expect(() => createPaperFill({ ...input, fact: { ...fact, sequence: 0 } })).toThrow(
      /fill sequence/,
    );
  });
});
