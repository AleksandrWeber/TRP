import { Module } from '@nestjs/common';
import { AccountingReconciliationService } from './accounting-reconciliation.service';

@Module({
  providers: [AccountingReconciliationService],
  exports: [AccountingReconciliationService],
})
export class AccountingReconciliationModule {}
