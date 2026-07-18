export { ExecutionAdapterModule } from './execution-adapter.module';
export {
  EXECUTION_ADAPTER,
  type AdapterCancellationResult,
  type AdapterFilledResult,
  type AdapterAcknowledgedResult,
  type AdapterOrderQueryResult,
  type AdapterSubmissionAcknowledgement,
  type AdapterSubmissionResult,
  type ExecutionAdapterCapabilities,
  type ExecutionAdapterHealth,
  type ExecutionAdapterPort,
  type PaperCancelCommand,
  type PaperExecutionCommand,
  type PaperQueryCommand,
} from './execution-adapter.port';
export {
  matchPaperOrder,
  type PaperFillFact,
  type PaperMatchInput,
  type PaperMatchResult,
  type PaperMatchSide,
  type PaperMatchType,
} from './paper-matching';
export { PaperExecutionAdapter, createExecutionAdapterBinding } from './paper-execution.adapter';
export {
  M2_PAPER_FILL_CONFIGURATION,
  PaperLimitFillPolicy,
  PaperMarketFillPolicy,
  assertPaperFillConfiguration,
  createPaperFillConfiguration,
  paperExecutionContextHash,
  paperRoundingContext,
  type PaperFillConfiguration,
  type PaperRoundingContext,
} from './paper-fill-configuration';
