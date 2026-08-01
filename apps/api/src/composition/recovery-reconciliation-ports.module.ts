import { Global, Module } from '@nestjs/common';
import { OrdersModule } from '../modules/orders';
import { ExecutionEngineModule } from '../modules/execution-engine';
import { AccountingReconciliationModule } from '../modules/positions/reconciliation/accounting-reconciliation.module';
import { RECOVERY_RECONCILIATION_PORTS } from '../modules/trading-session';
import { RealRecoveryReconciliationPorts } from './real-recovery-reconciliation.ports';

/**
 * US291 — production binding for recovery reconciliation ports.
 *
 * Global so Trading Session can inject `RECOVERY_RECONCILIATION_PORTS` without
 * importing Orders / Execution / Positions (ADR-017 boundary). Stub is not the
 * production authority.
 */
@Global()
@Module({
  imports: [OrdersModule, ExecutionEngineModule, AccountingReconciliationModule],
  providers: [
    RealRecoveryReconciliationPorts,
    {
      provide: RECOVERY_RECONCILIATION_PORTS,
      useExisting: RealRecoveryReconciliationPorts,
    },
  ],
  exports: [RECOVERY_RECONCILIATION_PORTS, RealRecoveryReconciliationPorts],
})
export class RecoveryReconciliationPortsModule {}
