import { Module } from '@nestjs/common';
import { EXECUTION_ADAPTER } from './execution-adapter.port';
import { PaperExecutionAdapter } from './paper-execution.adapter';

@Module({
  providers: [
    PaperExecutionAdapter,
    {
      provide: EXECUTION_ADAPTER,
      useExisting: PaperExecutionAdapter,
    },
  ],
  exports: [EXECUTION_ADAPTER],
})
export class ExecutionAdapterModule {}
