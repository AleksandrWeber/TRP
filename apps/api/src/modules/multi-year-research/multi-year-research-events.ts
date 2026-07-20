/**
 * Application events for US195 Multi-Year Research.
 *
 * Collected in-memory by MultiYearResearchService. No transport layer
 * and no message bus.
 */

type MultiYearResearchEventBase<Type extends string> = Readonly<{
  eventType: Type;
  researchId: string;
  occurredAt: string;
}>;

export type MultiYearResearchStarted = MultiYearResearchEventBase<'MultiYearResearchStarted'> &
  Readonly<{
    totalDatasets: number;
  }>;

export type DatasetCompleted = MultiYearResearchEventBase<'DatasetCompleted'> &
  Readonly<{
    datasetId: string;
    succeeded: boolean;
    totalWindows: number;
    completedWindows: number;
    failedWindows: number;
    reason: string | null;
  }>;

export type MultiYearResearchCompleted = MultiYearResearchEventBase<'MultiYearResearchCompleted'> &
  Readonly<{
    datasetsProcessed: number;
    datasetsSucceeded: number;
    datasetsFailed: number;
    completedAt: string;
  }>;

export type MultiYearResearchFailed = MultiYearResearchEventBase<'MultiYearResearchFailed'> &
  Readonly<{
    datasetId: string;
    reason: string;
    failedAt: string;
  }>;

export type MultiYearResearchEvent =
  | MultiYearResearchStarted
  | DatasetCompleted
  | MultiYearResearchCompleted
  | MultiYearResearchFailed;
