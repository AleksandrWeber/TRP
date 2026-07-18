import type { PaperFillConfiguration, PaperRoundingContext } from './paper-fill-configuration';

export const EXECUTION_ADAPTER = Symbol('EXECUTION_ADAPTER');

export type PaperExecutionCommand = Readonly<{
  mode: 'paper';
  workspaceId: string;
  orderId: string;
  clientOrderId: string;
  intentHash: string;
  instrument: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  quantity: string;
  limitPrice: string | null;
  marketState: Readonly<{
    streamId: string;
    eventId: string;
    sequence: number;
    referencePrice: string;
    occurredAt: string;
  }>;
  configuration: PaperFillConfiguration;
}>;

export type PaperCancelCommand = Readonly<{
  mode: 'paper';
  workspaceId: string;
  orderId: string;
  clientOrderId: string;
  adapterOrderId: string;
  idempotencyKey: string;
}>;

export type PaperQueryCommand = Readonly<{
  mode: 'paper';
  workspaceId: string;
  adapterOrderId: string;
}>;

export type AdapterSubmissionAcknowledgement = Readonly<{
  outcome: 'acknowledged';
  mode: 'paper';
  adapterOrderId: string;
  clientOrderId: string;
  executionContextHash: string;
  roundingContext: PaperRoundingContext;
}>;

export type AdapterCancellationResult = Readonly<{
  outcome: 'cancel_acknowledged';
  mode: 'paper';
  adapterOrderId: string;
  idempotencyKey: string;
}>;

export type AdapterOrderQueryResult = Readonly<{
  outcome: 'unknown';
  mode: 'paper';
  adapterOrderId: string;
  reconciliationRequired: true;
}>;

export type ExecutionAdapterCapabilities = Readonly<{
  mode: 'paper';
  marketOrders: true;
  limitOrders: true;
  cancellation: true;
  reconciliation: true;
  partialFills: false;
  liveCapital: false;
}>;

export type ExecutionAdapterHealth = Readonly<{
  mode: 'paper';
  status: 'healthy';
  credentialsConfigured: false;
}>;

/**
 * ADR-012 execution adapter boundary. Only Execution Engine may call it.
 * Inputs and returned facts are immutable; the adapter owns no domain state.
 */
export interface ExecutionAdapterPort {
  submit(command: PaperExecutionCommand): Promise<AdapterSubmissionAcknowledgement>;
  cancel(command: PaperCancelCommand): Promise<AdapterCancellationResult>;
  query(command: PaperQueryCommand): Promise<AdapterOrderQueryResult>;
  capabilities(): ExecutionAdapterCapabilities;
  health(): ExecutionAdapterHealth;
}
