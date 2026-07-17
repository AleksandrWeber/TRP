import type { CampaignSession } from '../campaign-session/campaign-session';
import type { Insight } from '../insight/insight';
import type { KnowledgeEntry } from '../knowledge/knowledge-entry';
import type { CrossCampaignFinding } from './cross-campaign-finding';

export type CrossCampaignAnalysisBundle = {
  sessions: CampaignSession[];
  knowledgeEntries: KnowledgeEntry[];
  insights: Insight[];
  experimentIds: string[];
};

/**
 * Deterministic cross-campaign findings (US097).
 * No LLM / AI providers — rule-based only.
 */
export function compareCampaignBundles(
  bundle: CrossCampaignAnalysisBundle,
): CrossCampaignFinding[] {
  const findings: CrossCampaignFinding[] = [];
  const sessions = bundle.sessions;
  if (sessions.length === 0) {
    return [
      {
        kind: 'unique_observation',
        title: 'No campaigns to compare',
        summary: 'Cross-campaign analysis received zero CampaignSessions',
        confidence: 1,
        campaignIds: [],
        knowledgeEntryIds: [],
        experimentIds: [],
      },
    ];
  }

  const campaignIds = sessions.map((s) => s.id);
  const knowledgeByCampaign = groupKnowledgeByCampaign(bundle);

  findings.push(...findRepeatedFindings(knowledgeByCampaign, campaignIds));
  findings.push(...findRecurringPatterns(sessions));
  findings.push(...findConflictingConclusions(sessions));
  findings.push(...findStableTrends(sessions));
  findings.push(...findUniqueObservations(knowledgeByCampaign, campaignIds));

  return findings;
}

function groupKnowledgeByCampaign(
  bundle: CrossCampaignAnalysisBundle,
): Map<string, KnowledgeEntry[]> {
  const byCampaign = new Map<string, KnowledgeEntry[]>();
  const sessionIds = new Set(bundle.sessions.map((s) => s.id));

  for (const entry of bundle.knowledgeEntries) {
    // Prefer explicit campaign linkage via matching experiment id lists is unavailable;
    // attach by scanning insights first, else put under 'unscoped'.
    const linkedCampaignIds = bundle.insights
      .filter((insight) => insight.knowledgeEntryIds.includes(entry.knowledgeId))
      .map((insight) => insight.campaignSessionId)
      .filter((id): id is string => typeof id === 'string' && sessionIds.has(id));

    const targets =
      linkedCampaignIds.length > 0
        ? unique(linkedCampaignIds)
        : guessCampaignsForKnowledge(entry, bundle.sessions);

    for (const campaignId of targets) {
      const list = byCampaign.get(campaignId) ?? [];
      list.push(entry);
      byCampaign.set(campaignId, list);
    }
  }

  return byCampaign;
}

function guessCampaignsForKnowledge(entry: KnowledgeEntry, sessions: CampaignSession[]): string[] {
  const matches = sessions.filter(
    (session) =>
      session.report.strategyId === entry.metadata.strategyId &&
      session.report.datasetId === entry.metadata.datasetId,
  );
  if (matches.length > 0) return matches.map((s) => s.id);
  // If metadata missing, associate with all compared campaigns (shared corpus).
  return sessions.map((s) => s.id);
}

function findRepeatedFindings(
  knowledgeByCampaign: Map<string, KnowledgeEntry[]>,
  campaignIds: string[],
): CrossCampaignFinding[] {
  const titleToCampaigns = new Map<string, { campaigns: Set<string>; ids: string[] }>();

  for (const [campaignId, entries] of knowledgeByCampaign) {
    for (const entry of entries) {
      const key = entry.title.trim().toLowerCase();
      const bucket = titleToCampaigns.get(key) ?? { campaigns: new Set(), ids: [] };
      bucket.campaigns.add(campaignId);
      bucket.ids.push(entry.knowledgeId);
      titleToCampaigns.set(key, bucket);
    }
  }

  const findings: CrossCampaignFinding[] = [];
  for (const [titleKey, bucket] of titleToCampaigns) {
    if (bucket.campaigns.size < 2) continue;
    findings.push({
      kind: 'repeated_finding',
      title: `Repeated finding across campaigns: ${titleKey}`,
      summary: `Knowledge title appears in ${bucket.campaigns.size} campaigns`,
      confidence: 0.85,
      campaignIds: [...bucket.campaigns],
      knowledgeEntryIds: unique(bucket.ids),
      experimentIds: [],
    });
  }

  if (findings.length === 0 && campaignIds.length >= 2) {
    return [];
  }
  return findings;
}

function findRecurringPatterns(sessions: CampaignSession[]): CrossCampaignFinding[] {
  if (sessions.length < 2) return [];

  const strategies = countBy(sessions.map((s) => s.report.strategyId));
  const findings: CrossCampaignFinding[] = [];

  for (const [strategyId, count] of strategies) {
    if (count < 2) continue;
    const campaignIds = sessions.filter((s) => s.report.strategyId === strategyId).map((s) => s.id);
    findings.push({
      kind: 'recurring_pattern',
      title: `Recurring strategy pattern: ${strategyId}`,
      summary: `Strategy "${strategyId}" used in ${count} compared campaigns`,
      confidence: 0.8,
      campaignIds,
      knowledgeEntryIds: [],
      experimentIds: [],
    });
  }

  return findings;
}

function findConflictingConclusions(sessions: CampaignSession[]): CrossCampaignFinding[] {
  if (sessions.length < 2) return [];

  const byKey = new Map<string, CampaignSession[]>();
  for (const session of sessions) {
    const key = `${session.report.strategyId}::${session.report.datasetId}`;
    const list = byKey.get(key) ?? [];
    list.push(session);
    byKey.set(key, list);
  }

  const findings: CrossCampaignFinding[] = [];
  for (const [key, group] of byKey) {
    if (group.length < 2) continue;
    const verdicts = unique(group.map((s) => s.report.verdict));
    if (verdicts.length < 2) continue;
    const [strategyId, datasetId] = key.split('::');
    findings.push({
      kind: 'conflicting_conclusion',
      title: `Conflicting conclusions: ${strategyId} on ${datasetId}`,
      summary: `Verdicts differ across campaigns: ${verdicts.join(', ')}`,
      confidence: 0.9,
      campaignIds: group.map((s) => s.id),
      knowledgeEntryIds: [],
      experimentIds: group
        .map((s) => s.report.bestExperimentId)
        .filter((id): id is string => Boolean(id)),
    });
  }

  return findings;
}

function findStableTrends(sessions: CampaignSession[]): CrossCampaignFinding[] {
  if (sessions.length < 2) return [];

  const verdicts = unique(sessions.map((s) => s.report.verdict));
  if (verdicts.length !== 1) return [];

  return [
    {
      kind: 'stable_trend',
      title: `Stable trend: ${verdicts[0]}`,
      summary: `All ${sessions.length} compared campaigns share verdict ${verdicts[0]}`,
      confidence: 0.95,
      campaignIds: sessions.map((s) => s.id),
      knowledgeEntryIds: [],
      experimentIds: sessions
        .map((s) => s.report.bestExperimentId)
        .filter((id): id is string => Boolean(id)),
    },
  ];
}

function findUniqueObservations(
  knowledgeByCampaign: Map<string, KnowledgeEntry[]>,
  campaignIds: string[],
): CrossCampaignFinding[] {
  const titleToCampaigns = new Map<string, { campaigns: Set<string>; entry: KnowledgeEntry }>();

  for (const [campaignId, entries] of knowledgeByCampaign) {
    for (const entry of entries) {
      const key = entry.title.trim().toLowerCase();
      const bucket = titleToCampaigns.get(key) ?? {
        campaigns: new Set<string>(),
        entry,
      };
      bucket.campaigns.add(campaignId);
      titleToCampaigns.set(key, bucket);
    }
  }

  const findings: CrossCampaignFinding[] = [];
  for (const [, bucket] of titleToCampaigns) {
    if (bucket.campaigns.size !== 1) continue;
    const campaignId = [...bucket.campaigns][0]!;
    findings.push({
      kind: 'unique_observation',
      title: `Unique observation: ${bucket.entry.title}`,
      summary: `Knowledge title appears only in campaign ${campaignId}`,
      confidence: 0.7,
      campaignIds: [campaignId],
      knowledgeEntryIds: [bucket.entry.knowledgeId],
      experimentIds: [bucket.entry.experimentId],
    });
  }

  // Cap unique observations to keep analysis focused when corpus is large.
  return findings.slice(0, Math.max(3, campaignIds.length));
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function countBy(values: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}
