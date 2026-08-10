import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { InMemoryKnowledgeLakeIngestionAdapter } from '../ingestion/in-memory-knowledge-lake-ingestion.adapter';
import type { AdmitResult, AnalyticalFactAdmission } from '../domain/analytical-fact-admission';
import type { KnowledgeLakeIngestionPort } from '../ports/knowledge-lake-ingestion.port';
import { bestEffortAdmit } from './best-effort-admit';
import { KnowledgeLakeResearchLabProjectionService } from './knowledge-lake-research-lab-projection.service';
import type { ResearchAnalyticalOutcome } from './research-analytical-outcome';
import {
  CampaignCompletedLakeProjectionAdapter,
  EvidenceGeneratedLakeProjectionAdapter,
  ExperimentCompletedLakeProjectionAdapter,
  ValidationCompletedLakeProjectionAdapter,
} from './research-lab-projection.adapters';

function buildService(ingestion: KnowledgeLakeIngestionPort) {
  return new KnowledgeLakeResearchLabProjectionService(
    new CampaignCompletedLakeProjectionAdapter(ingestion),
    new ExperimentCompletedLakeProjectionAdapter(ingestion),
    new ValidationCompletedLakeProjectionAdapter(ingestion),
    new EvidenceGeneratedLakeProjectionAdapter(ingestion),
  );
}

const outcomes: readonly ResearchAnalyticalOutcome[] = Object.freeze([
  Object.freeze({
    kind: 'campaign_completed',
    eventId: 'research-lab:CampaignSession:cs-1:campaign_completed',
    occurredAt: '2026-08-10T14:00:00.000Z',
    workspaceId: 'ws-1',
    campaignSessionId: 'cs-1',
    status: 'COMPLETED',
    verdict: 'PASS',
  }),
  Object.freeze({
    kind: 'experiment_completed',
    eventId: 'research-lab:Experiment:exp-1:experiment_completed',
    occurredAt: '2026-08-10T14:01:00.000Z',
    workspaceId: 'ws-1',
    experimentId: 'exp-1',
    verdict: 'pass',
  }),
  Object.freeze({
    kind: 'validation_completed',
    eventId: 'research-lab:Experiment:exp-1:validation_completed',
    occurredAt: '2026-08-10T14:01:00.000Z',
    workspaceId: 'ws-1',
    experimentId: 'exp-1',
    verdict: 'pass',
  }),
  Object.freeze({
    kind: 'evidence_generated',
    eventId: 'research-lab:KnowledgeEntry:ke-1:evidence_generated',
    occurredAt: '2026-08-10T14:02:00.000Z',
    workspaceId: 'ws-1',
    knowledgeEntryId: 'ke-1',
    experimentId: 'exp-1',
    status: 'created',
  }),
]);

describe('RC-21 Epic 4 — Research Lab Lake projections', () => {
  it('admits analytical facts from Research producers (all outcome kinds)', () => {
    const lake = new InMemoryKnowledgeLakeIngestionAdapter();
    const service = buildService(lake);

    expect(service.projectMany(outcomes)).toBe(4);
    expect(lake.peekSize()).toBe(4);

    for (const outcome of outcomes) {
      const stored = lake.peekByEventId(outcome.eventId);
      expect(stored?.producer).toBe('research-lab');
      expect(stored?.mode).toBe('research');
      expect(['Research', 'System']).toContain(stored?.category);
      expect(stored?.sourceRef).toBeDefined();
    }
  });

  it('stores immutable analytical copies only', () => {
    const lake = new InMemoryKnowledgeLakeIngestionAdapter();
    const service = buildService(lake);
    const outcome = outcomes[0]!;

    expect(service.project(outcome)).toBe(true);
    const stored = lake.peekByEventId(outcome.eventId);
    expect(stored).toBeDefined();
    expect(Object.isFrozen(stored)).toBe(true);
    expect(Object.isFrozen(stored?.payload)).toBe(true);
    expect(() => {
      (stored as { producer: string }).producer = 'knowledge';
    }).toThrow();
  });

  it('keeps Research authoritative — Lake facts are markers + sourceRef, not entity clones', () => {
    const lake = new InMemoryKnowledgeLakeIngestionAdapter();
    const service = buildService(lake);
    service.project(outcomes[3]!);

    const stored = lake.peekByEventId(outcomes[3]!.eventId);
    expect(stored?.sourceRef).toEqual({
      ownerType: 'KnowledgeEntry',
      id: 'ke-1',
    });
    const payload = stored?.payload as Record<string, unknown>;
    expect(payload.kind).toBe('research_analytical_marker');
    expect(JSON.stringify(payload)).not.toMatch(/hypothesis|conclusion|insights|recommendations/);
  });

  it('isolates Lake failure from the projection handler (producer path continues)', () => {
    const unavailable: KnowledgeLakeIngestionPort = {
      admit(): AdmitResult {
        throw new Error('knowledge lake unavailable');
      },
      admitMany(): AdmitResult[] {
        throw new Error('knowledge lake unavailable');
      },
    };
    const service = buildService(unavailable);

    expect(() => service.project(outcomes[1]!)).not.toThrow();
    expect(service.project(outcomes[1]!)).toBe(true);

    const result = bestEffortAdmit(unavailable, {
      eventId: 'evt-research-x',
      occurredAt: '2026-08-10T14:00:00.000Z',
      producer: 'research-lab',
      category: 'Research',
      mode: 'research',
      workspaceId: 'ws-1',
      payload: {},
      schemaVersion: '1',
    } satisfies AnalyticalFactAdmission);
    expect(result).toBeNull();
  });

  it('does not import Research SoT services into Lake projection adapters', () => {
    const root = join(__dirname);
    const files = [
      'research-lab-projection.adapters.ts',
      'knowledge-lake-research-lab-projection.service.ts',
      'project-research-outcome.ts',
      'research-analytical-outcome.ts',
    ];
    for (const file of files) {
      const source = readFileSync(join(root, file), 'utf8');
      expect(source).not.toMatch(/from '\.\.\/\.\.\/research-campaign'/);
      expect(source).not.toMatch(/from '\.\.\/\.\.\/experiments'/);
      expect(source).not.toMatch(/from '\.\.\/\.\.\/knowledge'/);
      expect(source).not.toMatch(/from '\.\.\/\.\.\/insight'/);
      expect(source).not.toMatch(/from '\.\.\/\.\.\/recommendation'/);
      expect(source).not.toMatch(
        /ResearchCampaignService|ExperimentsService|KnowledgeService|InsightDomainService|RecommendationDomainService/,
      );
      expect(source).not.toMatch(/execution-engine|ExecutionEngineService/);
    }
  });

  it('does not wire Knowledge Lake into Research SoT modules (no feedback)', () => {
    const modulesRoot = join(__dirname, '..', '..');
    const sotFiles = [
      'research-campaign/research-campaign.service.ts',
      'experiments/experiments.service.ts',
      'experiments/experiment-domain.service.ts',
      'knowledge/knowledge.service.ts',
      'knowledge/knowledge-domain.service.ts',
      'insight/insight-domain.service.ts',
      'recommendation/recommendation-domain.service.ts',
    ];
    for (const file of sotFiles) {
      const source = readFileSync(join(modulesRoot, file), 'utf8');
      expect(source).not.toMatch(/knowledge-lake|KnowledgeLake|KNOWLEDGE_LAKE/);
    }
  });
});
