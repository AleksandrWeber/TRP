/**
 * V3-L02-S-ADP1 — Routes paper → PaperExecutionAdapter, live → LiveVenueExecutionAdapter.
 * Canonical EXECUTION_ADAPTER may bind this router. No parallel SoT.
 */

import type {
  AdapterCancellationResult,
  AdapterOrderQueryResult,
  AdapterSubmissionResult,
  CancelCommand,
  ExecutionAdapterCapabilities,
  ExecutionAdapterHealth,
  ExecutionAdapterPort,
  ExecutionCommand,
  QueryCommand,
} from '../execution-adapter.port';

export class RoutingExecutionAdapter implements ExecutionAdapterPort {
  constructor(
    private readonly paper: ExecutionAdapterPort,
    private readonly live: ExecutionAdapterPort,
  ) {}

  async submit(command: ExecutionCommand): Promise<AdapterSubmissionResult> {
    if (command.mode === 'live') return this.live.submit(command);
    return this.paper.submit(command);
  }

  async cancel(command: CancelCommand): Promise<AdapterCancellationResult> {
    if (command.mode === 'live') return this.live.cancel(command);
    return this.paper.cancel(command);
  }

  async query(command: QueryCommand): Promise<AdapterOrderQueryResult> {
    if (command.mode === 'live') return this.live.query(command);
    return this.paper.query(command);
  }

  capabilities(): ExecutionAdapterCapabilities {
    const paper = this.paper.capabilities();
    const live = this.live.capabilities();
    return Object.freeze({
      mode: 'routing',
      marketOrders: true as const,
      limitOrders: true as const,
      cancellation: true as const,
      reconciliation: true as const,
      partialFills: false as const,
      liveCapital: false,
      venues: live.venues,
    });
  }

  health(): ExecutionAdapterHealth {
    const live = this.live.health();
    return Object.freeze({
      mode: 'routing',
      status: live.status,
      credentialsConfigured: live.credentialsConfigured,
      realVenueIoEnabled: live.realVenueIoEnabled,
    });
  }
}
