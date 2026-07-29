import { Module } from '@nestjs/common';
import { ExecutionEngineModule } from '../execution-engine';
import { LedgerModule } from '../ledger';
import { OrdersModule } from '../orders';
import { RiskModule } from '../risk';
import {
  CANONICAL_ORDER_PATH_PORT,
  CanonicalOrderPathService,
} from './canonical-order-path.service';

/**
 * US222 — wires proposed Orders into the existing Risk + Execution Engine path.
 * Not a parallel execution pipeline; Runtime is never imported.
 */
@Module({
  imports: [OrdersModule, RiskModule, LedgerModule, ExecutionEngineModule],
  providers: [
    CanonicalOrderPathService,
    {
      provide: CANONICAL_ORDER_PATH_PORT,
      useExisting: CanonicalOrderPathService,
    },
  ],
  exports: [CanonicalOrderPathService, CANONICAL_ORDER_PATH_PORT],
})
export class CanonicalOrderPathModule {}
