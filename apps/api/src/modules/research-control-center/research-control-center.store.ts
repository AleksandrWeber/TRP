import { Injectable } from '@nestjs/common';
import {
  emptyDiagnostics,
  type AnalyticsRecord,
  type EngineeringRecord,
  type OptimizationRecord,
  type ResearchControlSettings,
  type ResearchExecutionRecord,
} from './research-execution-record';

const DEFAULT_SETTINGS: ResearchControlSettings = Object.freeze({
  autoRefreshSeconds: 5,
  defaultStrategyId: 'research-control-strategy',
  maxListedExecutions: 100,
});

/**
 * In-memory store for Research Control Center (US192).
 * Process-scoped; no persistence.
 */
@Injectable()
export class ResearchControlCenterStore {
  private readonly research = new Map<string, ResearchExecutionRecord>();
  private readonly optimizations = new Map<string, OptimizationRecord>();
  private readonly analytics = new Map<string, AnalyticsRecord>();
  private readonly engineering = new Map<string, EngineeringRecord>();
  private settings: ResearchControlSettings = DEFAULT_SETTINGS;

  getSettings(): ResearchControlSettings {
    return this.settings;
  }

  updateSettings(patch: Partial<ResearchControlSettings>): ResearchControlSettings {
    this.settings = Object.freeze({
      autoRefreshSeconds: patch.autoRefreshSeconds ?? this.settings.autoRefreshSeconds,
      defaultStrategyId: patch.defaultStrategyId ?? this.settings.defaultStrategyId,
      maxListedExecutions: patch.maxListedExecutions ?? this.settings.maxListedExecutions,
    });
    return this.settings;
  }

  putResearch(record: ResearchExecutionRecord): ResearchExecutionRecord {
    this.research.set(record.id, record);
    return record;
  }

  getResearch(id: string): ResearchExecutionRecord | null {
    return this.research.get(id) ?? null;
  }

  listResearch(workspaceId: string, limit = 100): ResearchExecutionRecord[] {
    return this.sorted(
      [...this.research.values()].filter((r) => r.workspaceId === workspaceId),
      limit,
    );
  }

  putOptimization(record: OptimizationRecord): OptimizationRecord {
    this.optimizations.set(record.id, record);
    return record;
  }

  getOptimization(id: string): OptimizationRecord | null {
    return this.optimizations.get(id) ?? null;
  }

  listOptimizations(workspaceId: string, limit = 100): OptimizationRecord[] {
    return this.sorted(
      [...this.optimizations.values()].filter((r) => r.workspaceId === workspaceId),
      limit,
    );
  }

  putAnalytics(record: AnalyticsRecord): AnalyticsRecord {
    this.analytics.set(record.id, record);
    return record;
  }

  getAnalytics(id: string): AnalyticsRecord | null {
    return this.analytics.get(id) ?? null;
  }

  listAnalytics(workspaceId: string, limit = 100): AnalyticsRecord[] {
    return this.sorted(
      [...this.analytics.values()].filter((r) => r.workspaceId === workspaceId),
      limit,
    );
  }

  putEngineering(record: EngineeringRecord): EngineeringRecord {
    this.engineering.set(record.id, record);
    return record;
  }

  getEngineering(id: string): EngineeringRecord | null {
    return this.engineering.get(id) ?? null;
  }

  listEngineering(workspaceId: string, limit = 100): EngineeringRecord[] {
    return this.sorted(
      [...this.engineering.values()].filter((r) => r.workspaceId === workspaceId),
      limit,
    );
  }

  listActive(
    workspaceId: string,
  ): Array<ResearchExecutionRecord | OptimizationRecord | EngineeringRecord | AnalyticsRecord> {
    const all = [
      ...this.research.values(),
      ...this.optimizations.values(),
      ...this.analytics.values(),
      ...this.engineering.values(),
    ];
    return all.filter(
      (r) => r.workspaceId === workspaceId && (r.status === 'pending' || r.status === 'running'),
    );
  }

  collectDiagnostics(workspaceId: string): {
    warnings: string[];
    anomalies: string[];
    recommendations: string[];
    eventEmission: Readonly<Record<string, unknown>>[];
  } {
    const warnings: string[] = [];
    const anomalies: string[] = [];
    const recommendations: string[] = [];
    const eventEmission: Readonly<Record<string, unknown>>[] = [];

    const records = [
      ...this.listResearch(workspaceId, 50),
      ...this.listOptimizations(workspaceId, 50),
      ...this.listAnalytics(workspaceId, 50),
      ...this.listEngineering(workspaceId, 50),
    ];

    for (const record of records) {
      const diag = record.diagnostics ?? emptyDiagnostics();
      warnings.push(...diag.warnings);
      anomalies.push(...diag.anomalies);
      recommendations.push(...diag.recommendations);
      eventEmission.push(...diag.eventEmission);
      if (record.status === 'failed' && record.error) {
        anomalies.push(`${record.id}: ${record.error}`);
        recommendations.push(`Inspect failed run ${record.id} and re-execute if needed`);
      }
    }

    return {
      warnings: [...new Set(warnings)],
      anomalies: [...new Set(anomalies)],
      recommendations: [...new Set(recommendations)],
      eventEmission,
    };
  }

  private sorted<T extends { createdAt: string }>(items: T[], limit: number): T[] {
    return items
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
      .slice(0, limit);
  }
}
