import type { ReportSectionType } from './report-section-type';

/**
 * Structured section of a ResearchReport (US099).
 * References entity ids only — no narrative / formatting / export content.
 */
export type ReportSection = {
  type: ReportSectionType;
  /** Entity ids belonging to this section. */
  itemIds: string[];
};
