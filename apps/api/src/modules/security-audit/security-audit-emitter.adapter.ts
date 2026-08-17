import type { LogContext } from '../../logging/logger';
import type { SecurityAuditWrite } from './security-audit-record';
import { isClassifiedSecurityAuditEvent } from './security-audit-classification';

/**
 * Adapts the approved S01–S04 structured-event vocabulary without making
 * logging a source of truth. Unknown and technical log entries are excluded.
 */
export function toSecurityAuditWrite(
  eventType: string,
  context: LogContext | undefined,
  source: string,
  occurredAt?: string,
): SecurityAuditWrite | undefined {
  if (!isClassifiedSecurityAuditEvent(eventType)) return undefined;
  const event = context?.event;
  if (event !== eventType || typeof context?.outcome !== 'string') return undefined;

  const { outcome } = context;
  if (!isInvestigationValuableOutcome(eventType, outcome)) return undefined;
  const payload = safePayload(context);
  return {
    eventType,
    outcome,
    source,
    occurredAt,
    attribution: {
      workspaceId: stringValue(context.workspaceId),
      actorId: stringValue(context.actorUserId) ?? stringValue(context.userId),
      subjectId: stringValue(context.subjectUserId),
      resourceType: resourceTypeFor(eventType),
      resourceId: resourceIdFor(eventType, context),
    },
    payload,
  };
}

function isInvestigationValuableOutcome(eventType: string, outcome: string): boolean {
  // Event Minimalism: routine refresh churn is technical noise, not audit history.
  if (eventType === 'auth.session' && outcome === 'refresh') return false;
  return true;
}

function safePayload(context: LogContext): Readonly<Record<string, unknown>> {
  const admitted = [
    'ip',
    'userAgent',
    'sessionId',
    'permission',
    'reason',
    'role',
    'fromRole',
    'toRole',
    'path',
    'statusCode',
    'type',
    'purpose',
  ];
  return Object.fromEntries(
    admitted.flatMap((key) => (context[key] === undefined ? [] : [[key, context[key]]])),
  );
}

function resourceTypeFor(eventType: string): string | undefined {
  if (eventType === 'auth.session') return 'session';
  if (eventType === 'authz.role-change') return 'user-role';
  if (eventType === 'vault.lifecycle' || eventType === 'vault.access-denied') {
    return 'vault-slot';
  }
  return undefined;
}

function resourceIdFor(eventType: string, context: LogContext): string | undefined {
  const sessionId = stringValue(context.sessionId);
  if (sessionId) return sessionId;
  if (eventType === 'vault.lifecycle' || eventType === 'vault.access-denied') {
    const type = stringValue(context.type);
    const purpose = stringValue(context.purpose);
    if (type && purpose) return `${type}:${purpose}`;
  }
  return undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
