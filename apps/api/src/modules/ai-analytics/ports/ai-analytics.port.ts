/**
 * RC-24 Epic 5 — AI Analytics application ports (active).
 *
 * Contract: docs/project/rc-24-api-contract.md §6
 * Consumes Reporting query surfaces only — never Lake / SoT directly.
 */

import type { AnalyticalNarrative } from '../domain/analytical-narrative';

/** Nest injection token for AIAnalyticsPort (Epic 5+). */
export const AI_ANALYTICS_PORT = Symbol('AI_ANALYTICS_PORT');

/** Reporting query consumer token (Epic 5+). */
export const REPORTING_QUERY_CONSUMER = Symbol('REPORTING_QUERY_CONSUMER');

export type AiAnalyticsReportRequest = Readonly<{
  workspaceId: string;
  reportRunId: string;
  focus?: string;
  requestedAt?: string;
}>;

/**
 * AI Analytics port (API Contract §6).
 *
 * Narrative only. Never trades / certifies / enforces / mutates reports.
 */
export interface AIAnalyticsPort {
  explain(cmd: AiAnalyticsReportRequest): AnalyticalNarrative;
  summarize(cmd: AiAnalyticsReportRequest): AnalyticalNarrative;
  identifyTrends(cmd: AiAnalyticsReportRequest): AnalyticalNarrative;
  generateNarrative(cmd: AiAnalyticsReportRequest): AnalyticalNarrative;
}

/** Epic 5 posture: narrative ports active over Reporting reads. */
export const AI_ANALYTICS_PORTS_ACTIVE = Object.freeze({
  explain: true,
  summarize: true,
  identifyTrends: true,
  generateNarrative: true,
  persistence: false,
  rest: false,
} as const);
