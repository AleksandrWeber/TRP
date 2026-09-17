import { Module } from '@nestjs/common';
import { EXECUTION_ADAPTER } from './execution-adapter.port';
import { PaperExecutionAdapter } from './paper-execution.adapter';
import { LiveVenueExecutionAdapter } from './live-venue/live-venue-execution.adapter';
import { RoutingExecutionAdapter } from './live-venue/routing-execution.adapter';

/**
 * Canonical ExecutionAdapterPort binding (ADP1).
 * Routes paper → PaperExecutionAdapter, live → LiveVenueExecutionAdapter.
 * Live real venue I/O remains disabled (allowRealVenueIo=false).
 */
@Module({
  providers: [
    PaperExecutionAdapter,
    {
      provide: LiveVenueExecutionAdapter,
      useFactory: () =>
        new LiveVenueExecutionAdapter({
          allowRealVenueIo: false,
        }),
    },
    {
      provide: EXECUTION_ADAPTER,
      useFactory: (paper: PaperExecutionAdapter, live: LiveVenueExecutionAdapter) =>
        new RoutingExecutionAdapter(paper, live),
      inject: [PaperExecutionAdapter, LiveVenueExecutionAdapter],
    },
  ],
  exports: [EXECUTION_ADAPTER, PaperExecutionAdapter, LiveVenueExecutionAdapter],
})
export class ExecutionAdapterModule {}
