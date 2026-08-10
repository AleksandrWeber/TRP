import { describe, expect, it } from 'vitest';
import { projectResearchOutcome } from './project-research-outcome';
import type { ResearchAnalyticalOutcome } from './research-analytical-outcome';
import { KNOWLEDGE_LAKE_RESEARCH_LAB_PRODUCER } from './research-lab-producer-registry';

function campaign(
  overrides: Partial<Extract<ResearchAnalyticalOutcome, { kind: 'campaign_completed' }>> = {},
): Extract<ResearchAnalyticalOutcome, { kind: 'campaign_completed' }> {
  return Object.freeze({
    kind: 'campaign_completed',
    eventId: 'research-lab:CampaignSession:cs-1:campaign_completed',
    occurredAt: '2026-08-10T14:00:00.000Z',
    workspaceId: 'ws-1',
    campaignSessionId: 'cs-1',
    status: 'COMPLETED',
    campaignId: 'camp-1',
    strategyId: 'strat-1',
    datasetId: 'ds-1',
    verdict: 'PASS',
    passCount: 2,
    failCount: 0,
    needsReviewCount: 0,
    totalRuns: 2,
    ...overrides,
  });
}

describe('RC-21 Epic 4 — projectResearchOutcome', () => {
  it('projects campaign completion with research-lab producer and sourceRef', () => {
    const fact = projectResearchOutcome(campaign());
    expect(fact?.producer).toBe('research-lab');
    expect(fact?.category).toBe('Research');
    expect(fact?.mode).toBe('research');
    expect(fact?.sourceRef).toEqual({
      ownerType: 'CampaignSession',
      id: 'cs-1',
    });
    expect((fact?.payload as { outcomeKind: string }).outcomeKind).toBe('campaign_completed');
  });

  it('projects failed campaign markers as System', () => {
    const fact = projectResearchOutcome(campaign({ status: 'FAILED', verdict: 'FAIL' }));
    expect(fact?.category).toBe('System');
    expect(fact?.producer).toBe('research-lab');
  });

  it('projects experiment and validation completions with Experiment sourceRef', () => {
    const experiment = projectResearchOutcome(
      Object.freeze({
        kind: 'experiment_completed',
        eventId: 'research-lab:Experiment:exp-1:experiment_completed',
        occurredAt: '2026-08-10T14:01:00.000Z',
        workspaceId: 'ws-1',
        experimentId: 'exp-1',
        verdict: 'pass',
        strategyId: 'strat-1',
        datasetId: 'ds-1',
        configHash: 'abc',
      }),
    );
    const validation = projectResearchOutcome(
      Object.freeze({
        kind: 'validation_completed',
        eventId: 'research-lab:Experiment:exp-1:validation_completed',
        occurredAt: '2026-08-10T14:01:00.000Z',
        workspaceId: 'ws-1',
        experimentId: 'exp-1',
        verdict: 'pass',
        reasons: Object.freeze(['ok']),
      }),
    );

    expect(experiment?.category).toBe('Research');
    expect(experiment?.sourceRef).toEqual({
      ownerType: 'Experiment',
      id: 'exp-1',
    });
    expect(validation?.sourceRef).toEqual({
      ownerType: 'Experiment',
      id: 'exp-1',
    });
    expect((validation?.payload as { reasons: string[] }).reasons).toEqual(['ok']);
  });

  it('projects evidence generated as KnowledgeEntry sourceRef without cloning payload body', () => {
    const fact = projectResearchOutcome(
      Object.freeze({
        kind: 'evidence_generated',
        eventId: 'research-lab:KnowledgeEntry:ke-1:evidence_generated',
        occurredAt: '2026-08-10T14:02:00.000Z',
        workspaceId: 'ws-1',
        knowledgeEntryId: 'ke-1',
        experimentId: 'exp-1',
        status: 'created',
        validationStatus: 'pass',
      }),
    );

    expect(fact?.category).toBe('Research');
    expect(fact?.sourceRef).toEqual({
      ownerType: 'KnowledgeEntry',
      id: 'ke-1',
    });
    const payload = fact?.payload as Record<string, unknown>;
    expect(payload.outcomeKind).toBe('evidence_generated');
    expect(payload.experimentId).toBe('exp-1');
    expect(payload).not.toHaveProperty('hypothesis');
    expect(payload).not.toHaveProperty('evidence');
    expect(payload).not.toHaveProperty('insights');
    expect(payload).not.toHaveProperty('recommendations');
  });

  it('registers research-lab producer with Research/System categories only', () => {
    expect(KNOWLEDGE_LAKE_RESEARCH_LAB_PRODUCER.producerId).toBe('research-lab');
    expect(KNOWLEDGE_LAKE_RESEARCH_LAB_PRODUCER.categories).toEqual(['Research', 'System']);
    expect(KNOWLEDGE_LAKE_RESEARCH_LAB_PRODUCER.feedbackToSoT).toBe(false);
    expect(KNOWLEDGE_LAKE_RESEARCH_LAB_PRODUCER.clonesResearchEntities).toBe(false);
    expect(KNOWLEDGE_LAKE_RESEARCH_LAB_PRODUCER.outcomeKinds).toEqual([
      'campaign_completed',
      'experiment_completed',
      'validation_completed',
      'evidence_generated',
    ]);
  });
});
