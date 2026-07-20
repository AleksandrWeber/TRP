export { HistoricalResearchModule } from './historical-research.module';
export { HistoricalResearchController } from './historical-research.controller';
export {
  HistoricalResearchService,
  type HistoricalResultFilter,
  type RunHistoricalResearchInput,
} from './historical-research.service';
export { HistoricalReplayEngine } from './historical-replay.engine';
export type {
  HistoricalDataset,
  HistoricalReplayInput,
  HistoricalReplayResult,
  HistoricalResearchReport,
  ResearchPerformanceMetrics,
  ResearchValidationSummary,
} from './domain/historical-research';
