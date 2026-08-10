/**
 * RC-24 Epic 3 — ReportDefinition (projection config).
 *
 * Domain Model Contract §4.
 * Template describing what a report may aggregate — not generation behaviour.
 * Changing a definition must not mutate historical ReportRuns (snapshot on run).
 */

import {
  REPORTING_DOMAIN_AUTHORITY_CLASS,
  assertIsoTimestamp,
  assertNonEmptyString,
  deepFreeze,
  isReportDefinitionKind,
  isReportingAllowedMetricKey,
  isReportingFactMode,
  isReportingForbiddenMetricKey,
  type ReportDefinitionKind,
  type ReportingFactMode,
  type ReportingMetricKey,
} from './reporting-domain-shared';

export type ReportDefinition = Readonly<{
  reportDefinitionId: string;
  workspaceId: string;
  name: string;
  description?: string;
  kind: ReportDefinitionKind;
  defaultModes: readonly ReportingFactMode[];
  metricKeys: readonly ReportingMetricKey[];
  compareEnabled?: boolean;
  authorityClass: typeof REPORTING_DOMAIN_AUTHORITY_CLASS;
  createdAt: string;
  updatedAt?: string;
}>;

export type CreateReportDefinitionInput = Readonly<{
  reportDefinitionId: string;
  workspaceId: string;
  name: string;
  description?: string;
  kind: string;
  defaultModes: readonly string[];
  metricKeys: readonly string[];
  compareEnabled?: boolean;
  createdAt: string;
  updatedAt?: string;
}>;

/**
 * Create an immutable ReportDefinition.
 * Does not generate reports. Does not aggregate Lake facts.
 */
export function createReportDefinition(input: CreateReportDefinitionInput): ReportDefinition {
  const reportDefinitionId = assertNonEmptyString(input.reportDefinitionId, 'reportDefinitionId');
  const workspaceId = assertNonEmptyString(input.workspaceId, 'workspaceId');
  const name = assertNonEmptyString(input.name, 'name');
  const kindRaw = assertNonEmptyString(input.kind, 'kind');
  if (!isReportDefinitionKind(kindRaw)) {
    throw new Error(`kind must be a known ReportDefinitionKind`);
  }
  const createdAt = assertIsoTimestamp(input.createdAt, 'createdAt');

  if (!input.defaultModes || input.defaultModes.length === 0) {
    throw new Error('defaultModes must be non-empty');
  }
  const defaultModes = input.defaultModes.map((mode) => {
    const trimmed = mode.trim();
    if (!isReportingFactMode(trimmed)) {
      throw new Error(`unknown reporting mode: ${mode}`);
    }
    return trimmed;
  });

  if (!input.metricKeys || input.metricKeys.length === 0) {
    throw new Error('metricKeys must be non-empty');
  }
  const metricKeys = input.metricKeys.map((key) => {
    const trimmed = key.trim();
    if (isReportingForbiddenMetricKey(trimmed)) {
      throw new Error(`forbidden metric key (shadow accounting): ${trimmed}`);
    }
    if (!isReportingAllowedMetricKey(trimmed)) {
      throw new Error(`metric key not in allowlist: ${trimmed}`);
    }
    return trimmed;
  });

  const description =
    input.description !== undefined && input.description.trim() !== ''
      ? input.description.trim()
      : undefined;
  const updatedAt =
    input.updatedAt !== undefined ? assertIsoTimestamp(input.updatedAt, 'updatedAt') : undefined;

  return deepFreeze({
    reportDefinitionId,
    workspaceId,
    name,
    ...(description !== undefined ? { description } : {}),
    kind: kindRaw,
    defaultModes: Object.freeze([...defaultModes]),
    metricKeys: Object.freeze([...metricKeys]),
    ...(input.compareEnabled !== undefined ? { compareEnabled: input.compareEnabled } : {}),
    authorityClass: REPORTING_DOMAIN_AUTHORITY_CLASS,
    createdAt,
    ...(updatedAt !== undefined ? { updatedAt } : {}),
  });
}

/**
 * Freeze a definition snapshot for a ReportRun.
 * Snapshots are independent of later definition edits.
 */
export function snapshotReportDefinition(definition: ReportDefinition): ReportDefinition {
  return deepFreeze({
    ...definition,
    defaultModes: Object.freeze([...definition.defaultModes]),
    metricKeys: Object.freeze([...definition.metricKeys]),
  });
}
