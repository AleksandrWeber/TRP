import type {
  SecurityAuditIncident,
  SecurityAuditIncidentLifecycleEntry,
} from './security-audit-incident';

export function deriveIncidentFromLifecycle(
  base: Readonly<{
    id: string;
    workspaceId: string;
    openedAt: string;
    openedByActorId?: string;
  }>,
  lifecycle: readonly SecurityAuditIncidentLifecycleEntry[],
): SecurityAuditIncident {
  const latest = [...lifecycle]
    .sort((left, right) => Date.parse(left.occurredAt) - Date.parse(right.occurredAt))
    .at(-1);
  const status = !latest || latest.status === 'open' ? 'open' : 'closed';
  return Object.freeze({
    id: base.id,
    workspaceId: base.workspaceId,
    openedAt: base.openedAt,
    status,
    ...(base.openedByActorId ? { openedByActorId: base.openedByActorId } : {}),
    ...(status === 'closed' && latest
      ? {
          closedAt: latest.occurredAt,
          ...(latest.actorId ? { closedByActorId: latest.actorId } : {}),
        }
      : {}),
  });
}
