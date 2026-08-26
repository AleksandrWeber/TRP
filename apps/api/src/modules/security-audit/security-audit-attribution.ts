import type { SecurityAuditAttribution } from './security-audit-record';

type AttributionRule = Readonly<{
  workspaceId?: true;
  actorId?: true;
  subjectId?: true;
  resourceType?: true;
  resourceId?: true;
}>;

const ATTRIBUTION_RULES: Readonly<Record<string, AttributionRule>> = Object.freeze({
  'auth.login': {},
  'auth.session': { actorId: true },
  'auth.recover': { actorId: true },
  'authz.role-change': {
    actorId: true,
    subjectId: true,
    resourceType: true,
  },
  'authz.deny': { actorId: true },
  'vault.lifecycle': {
    workspaceId: true,
    actorId: true,
    resourceType: true,
    resourceId: true,
  },
  'vault.access-denied': {
    workspaceId: true,
    actorId: true,
    resourceType: true,
    resourceId: true,
  },
  'connection.validation': {
    workspaceId: true,
    actorId: true,
    resourceType: true,
    resourceId: true,
  },
  'connection.lifecycle': {
    workspaceId: true,
    actorId: true,
    resourceType: true,
    resourceId: true,
  },
  'platform.abuse.throttled': {},
  'platform.deny.shaped': {},
  'continuity.recovery-completed': {},
  'continuity.owner-ready': {
    resourceType: true,
    resourceId: true,
  },
  'continuity.owner-degraded': {
    resourceType: true,
    resourceId: true,
  },
  'continuity.owner-unavailable': {
    resourceType: true,
    resourceId: true,
  },
});

/** Normalizes attribution and enforces required investigation fields per event type. */
export function normalizeSecurityAuditAttribution(
  eventType: string,
  attribution: SecurityAuditAttribution | undefined,
  correlationId?: string,
): SecurityAuditAttribution {
  const normalized = Object.freeze({
    ...(attribution ?? {}),
    ...(correlationId?.trim() ? { correlationId: correlationId.trim() } : {}),
  });
  assertRequiredAttribution(eventType, normalized);
  return normalized;
}

function assertRequiredAttribution(eventType: string, attribution: SecurityAuditAttribution): void {
  const rule = ATTRIBUTION_RULES[eventType];
  if (!rule) return;
  for (const [field, required] of Object.entries(rule) as Array<
    [keyof AttributionRule, true | undefined]
  >) {
    if (!required) continue;
    const value = attribution[field];
    if (typeof value !== 'string' || !value.trim()) {
      throw new Error(`Security Audit requires attribution.${field} for ${eventType}.`);
    }
  }
}
