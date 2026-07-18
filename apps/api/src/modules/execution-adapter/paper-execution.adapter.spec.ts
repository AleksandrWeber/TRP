import { describe, expect, it } from 'vitest';
import { M2_PAPER_FILL_CONFIGURATION, createExecutionAdapterBinding } from './index';
import { PaperExecutionAdapter } from './paper-execution.adapter';

const command = Object.freeze({
  mode: 'paper' as const,
  workspaceId: 'workspace-us166',
  orderId: 'order-us166',
  clientOrderId: 'client-us166',
  intentHash: 'intent-us166',
  instrument: 'BTCUSDT',
  side: 'buy' as const,
  type: 'market' as const,
  quantity: '1.25',
  limitPrice: null,
  marketState: Object.freeze({
    streamId: 'mark:BTCUSDT',
    eventId: 'market-event-us166',
    sequence: 11,
    referencePrice: '50000.25',
    occurredAt: '2026-07-18T18:20:00.000Z',
  }),
  configuration: M2_PAPER_FILL_CONFIGURATION,
});

describe('US166 — paper-only Execution Adapter boundary', () => {
  it('binds only the paper adapter and structurally rejects live mode or credentials', () => {
    expect(createExecutionAdapterBinding({ mode: 'paper' })).toBeInstanceOf(PaperExecutionAdapter);
    expect(() => createExecutionAdapterBinding({ mode: 'live' })).toThrow(/must be paper/);
    expect(() =>
      createExecutionAdapterBinding({
        mode: 'paper',
        credentials: { apiSecret: 'must-not-be-accepted' },
      }),
    ).toThrow(/does not accept trading credentials/);
  });

  it('returns immutable adapter facts without mutating the command or domain state', async () => {
    const before = structuredClone(command);
    const adapter = new PaperExecutionAdapter();
    const acknowledgement = await adapter.submit(command);

    expect(command).toEqual(before);
    expect(Object.isFrozen(acknowledgement)).toBe(true);
    expect(Object.isFrozen(acknowledgement.roundingContext)).toBe(true);
    expect(acknowledgement).toMatchObject({
      outcome: 'filled',
      mode: 'paper',
      clientOrderId: command.clientOrderId,
    });
    expect(adapter.capabilities()).toMatchObject({
      mode: 'paper',
      partialFills: false,
      liveCapital: false,
    });
    expect(adapter.health()).toEqual({
      mode: 'paper',
      status: 'healthy',
      credentialsConfigured: false,
    });
  });

  it('keeps cancellation and reconciliation provider-neutral and paper-only', async () => {
    const adapter = new PaperExecutionAdapter();
    const cancellation = await adapter.cancel({
      mode: 'paper',
      workspaceId: command.workspaceId,
      orderId: command.orderId,
      clientOrderId: command.clientOrderId,
      adapterOrderId: 'paper-order-us166',
      idempotencyKey: 'cancel-us166',
    });
    expect(cancellation.outcome).toBe('cancel_acknowledged');
    expect(
      await adapter.query({
        mode: 'paper',
        workspaceId: command.workspaceId,
        adapterOrderId: cancellation.adapterOrderId,
      }),
    ).toEqual({
      outcome: 'unknown',
      mode: 'paper',
      adapterOrderId: cancellation.adapterOrderId,
      reconciliationRequired: true,
    });
  });
});
