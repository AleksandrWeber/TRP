export type ResearchKnowledgePayload = {
  dedupeKey: string;
  // Identifies the configuration under test (what changed).
  // Stable across engine/validation interpretation changes.
  configIdentityKey: string;
  // Identifies how the result was calculated/validated (which versions interpreted it).
  // Different engine/validation versions must not be treated as duplicates.
  resultIdentityKey: string;

  researchEngineVersion: string;
  validationVersion: string;
  // Changes when the Knowledge payload format/semantics change.
  knowledgeSchemaVersion: number;
  provenance: {
    gitCommit: string | null;
  };

  hypothesis: string;
  evidence: {
    metrics: Record<string, unknown>;
    validation: Record<string, unknown>;
    dataset: {
      symbol: string;
      timeframe: string;
      barCount: number;
      contentHash: string;
    };
    experimentCreatedAt: string;
  };
  conclusion: string;
  strategyId: string;
  params: Record<string, unknown>;
  datasetId: string;
  metrics: Record<string, unknown>;
  validation: Record<string, unknown>;
  configHash: string;

  // Immutable lineage. Old knowledge should not be overwritten;
  // new knowledge records point to the previous one.
  supersedesKnowledgeId?: string;
  supersededByKnowledgeId?: string | null;
};

export type LegacyKnowledgePayload = {
  dedupeKey?: unknown;
  configIdentityKey?: unknown;
  resultIdentityKey?: unknown;
  researchEngineVersion?: unknown;
  validationVersion?: unknown;
};

export function buildConfigIdentityKey(strategyId: string, datasetId: string, configHash: string) {
  return `${strategyId}:${datasetId}:${configHash}`;
}

export function buildResultIdentityKey(
  configIdentityKey: string,
  researchEngineVersion: string,
  validationVersion: string,
) {
  return `${configIdentityKey}:${researchEngineVersion}:${validationVersion}`;
}

export function buildDedupeKey(
  strategyId: string,
  datasetId: string,
  configHash: string,
  researchEngineVersion: string,
  validationVersion: string,
) {
  const configIdentityKey = buildConfigIdentityKey(strategyId, datasetId, configHash);
  return buildResultIdentityKey(configIdentityKey, researchEngineVersion, validationVersion);
}

export function isLegacyKnowledgePayload(payload: LegacyKnowledgePayload): boolean {
  const hasConfigIdentityKey = typeof payload.configIdentityKey === 'string';
  const hasResultIdentityKey = typeof payload.resultIdentityKey === 'string';
  const hasResearchEngineVersion = typeof payload.researchEngineVersion === 'string';
  const hasValidationVersion = typeof payload.validationVersion === 'string';

  if (
    hasConfigIdentityKey ||
    hasResultIdentityKey ||
    hasResearchEngineVersion ||
    hasValidationVersion
  ) {
    return false;
  }

  return typeof payload.dedupeKey === 'string';
}

export function formatParams(params: Record<string, unknown>): string {
  return Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');
}

export function buildHypothesis(
  strategyId: string,
  params: Record<string, unknown>,
  symbol: string,
  timeframe: string,
): string {
  const paramText = formatParams(params);
  return `${strategyId} (${paramText}) on ${symbol} ${timeframe} can achieve validated performance`;
}

export function buildConclusion(
  strategyId: string,
  symbol: string,
  timeframe: string,
  verdict: string,
  reasons: string[],
): string {
  const verdictLabel = verdict.replace('_', ' ').toUpperCase();
  const reasonText = reasons.length > 0 ? reasons.join('; ') : 'No validation reasons recorded';
  return `${strategyId} on ${symbol} ${timeframe}: ${verdictLabel}. ${reasonText}`;
}

export function buildResearchPayload(input: {
  strategyId: string;
  params: Record<string, unknown>;
  datasetId: string;
  configHash: string;
  researchEngineVersion: string;
  validationVersion: string;
  knowledgeSchemaVersion: number;
  gitCommit: string | null;
  metrics: Record<string, unknown>;
  validation: Record<string, unknown>;
  verdict: string;
  dataset: {
    symbol: string;
    timeframe: string;
    barCount: number;
    contentHash: string;
  };
  experimentCreatedAt: Date;
  supersedesKnowledgeId?: string;
}): ResearchKnowledgePayload {
  const reasons = Array.isArray(input.validation.reasons)
    ? (input.validation.reasons as string[])
    : [];

  const configIdentityKey = buildConfigIdentityKey(
    input.strategyId,
    input.datasetId,
    input.configHash,
  );
  const resultIdentityKey = buildResultIdentityKey(
    configIdentityKey,
    input.researchEngineVersion,
    input.validationVersion,
  );

  return {
    // Composite result identity (used for deduplication).
    dedupeKey: resultIdentityKey,

    // Identity split (configuration vs calculation/validation versions).
    configIdentityKey,
    resultIdentityKey,

    researchEngineVersion: input.researchEngineVersion,
    validationVersion: input.validationVersion,
    knowledgeSchemaVersion: input.knowledgeSchemaVersion,
    provenance: {
      gitCommit: input.gitCommit,
    },

    hypothesis: buildHypothesis(
      input.strategyId,
      input.params,
      input.dataset.symbol,
      input.dataset.timeframe,
    ),
    evidence: {
      metrics: input.metrics,
      validation: input.validation,
      dataset: input.dataset,
      experimentCreatedAt: input.experimentCreatedAt.toISOString(),
    },
    conclusion: buildConclusion(
      input.strategyId,
      input.dataset.symbol,
      input.dataset.timeframe,
      input.verdict,
      reasons,
    ),
    strategyId: input.strategyId,
    params: input.params,
    datasetId: input.datasetId,
    metrics: input.metrics,
    validation: input.validation,
    configHash: input.configHash,

    // Immutable lineage: only new knowledge points to the previous one.
    supersedesKnowledgeId: input.supersedesKnowledgeId,
    supersededByKnowledgeId: null,
  };
}
