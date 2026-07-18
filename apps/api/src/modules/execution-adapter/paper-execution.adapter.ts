import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { FinancialDecimal } from '../financial';
import type {
  AdapterCancellationResult,
  AdapterOrderQueryResult,
  AdapterSubmissionAcknowledgement,
  ExecutionAdapterCapabilities,
  ExecutionAdapterHealth,
  ExecutionAdapterPort,
  PaperCancelCommand,
  PaperExecutionCommand,
  PaperQueryCommand,
} from './execution-adapter.port';
import {
  assertPaperFillConfiguration,
  paperExecutionContextHash,
  paperRoundingContext,
} from './paper-fill-configuration';

@Injectable()
export class PaperExecutionAdapter implements ExecutionAdapterPort {
  async submit(command: PaperExecutionCommand): Promise<AdapterSubmissionAcknowledgement> {
    assertPaperCommand(command);
    const configuration = assertPaperFillConfiguration(command.configuration);
    return Object.freeze({
      outcome: 'acknowledged',
      mode: 'paper',
      adapterOrderId: stableAdapterOrderId(
        command.workspaceId,
        command.orderId,
        command.clientOrderId,
      ),
      clientOrderId: command.clientOrderId,
      executionContextHash: paperExecutionContextHash({
        configuration,
        orderIntentHash: command.intentHash,
        marketEventId: command.marketState.eventId,
        marketSequence: command.marketState.sequence,
      }),
      roundingContext: paperRoundingContext(configuration),
    });
  }

  async cancel(command: PaperCancelCommand): Promise<AdapterCancellationResult> {
    assertPaperMode(command.mode);
    return Object.freeze({
      outcome: 'cancel_acknowledged',
      mode: 'paper',
      adapterOrderId: required(command.adapterOrderId, 'adapter order id'),
      idempotencyKey: required(command.idempotencyKey, 'idempotency key'),
    });
  }

  async query(command: PaperQueryCommand): Promise<AdapterOrderQueryResult> {
    assertPaperMode(command.mode);
    return Object.freeze({
      outcome: 'unknown',
      mode: 'paper',
      adapterOrderId: required(command.adapterOrderId, 'adapter order id'),
      reconciliationRequired: true,
    });
  }

  capabilities(): ExecutionAdapterCapabilities {
    return Object.freeze({
      mode: 'paper',
      marketOrders: true,
      limitOrders: true,
      cancellation: true,
      reconciliation: true,
      partialFills: false,
      liveCapital: false,
    });
  }

  health(): ExecutionAdapterHealth {
    return Object.freeze({
      mode: 'paper',
      status: 'healthy',
      credentialsConfigured: false,
    });
  }
}

export function createExecutionAdapterBinding(input: {
  mode: string;
  credentials?: Readonly<Record<string, string>>;
}): ExecutionAdapterPort {
  if (input.mode !== 'paper') throw new Error('RC-16 execution adapter mode must be paper');
  if (input.credentials && Object.keys(input.credentials).length > 0) {
    throw new Error('paper execution adapter does not accept trading credentials');
  }
  return new PaperExecutionAdapter();
}

function assertPaperCommand(command: PaperExecutionCommand): void {
  assertPaperMode(command.mode);
  required(command.workspaceId, 'workspace id');
  required(command.orderId, 'order id');
  required(command.clientOrderId, 'client order id');
  required(command.intentHash, 'intent hash');
  required(command.instrument, 'instrument');
  FinancialDecimal.from(command.quantity).assertPositive('quantity');
  if (command.type === 'limit') {
    FinancialDecimal.from(command.limitPrice ?? '').assertPositive('limit price');
  } else if (command.limitPrice !== null) {
    throw new Error('market execution command cannot include limit price');
  }
  FinancialDecimal.from(command.marketState.referencePrice).assertPositive('reference price');
  required(command.marketState.streamId, 'market stream id');
  required(command.marketState.eventId, 'market event id');
  if (!Number.isSafeInteger(command.marketState.sequence) || command.marketState.sequence < 0) {
    throw new Error('market sequence must be a non-negative integer');
  }
  if (new Date(command.marketState.occurredAt).toISOString() !== command.marketState.occurredAt) {
    throw new Error('market occurredAt must be canonical ISO-8601');
  }
}

function assertPaperMode(mode: string): asserts mode is 'paper' {
  if (mode !== 'paper') throw new Error('execution adapter command mode must be paper');
}

function stableAdapterOrderId(workspaceId: string, orderId: string, clientOrderId: string): string {
  const hash = createHash('sha256')
    .update(
      `${required(workspaceId, 'workspace id')}:${required(orderId, 'order id')}:${required(
        clientOrderId,
        'client order id',
      )}`,
    )
    .digest('hex')
    .slice(0, 24);
  return `paper_${hash}`;
}

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (normalized === '') throw new Error(`${label} is required`);
  return normalized;
}
