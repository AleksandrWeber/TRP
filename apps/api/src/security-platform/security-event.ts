import type { Logger } from '../logging/logger';
import type { SecurityAuditService } from '../modules/security-audit/security-audit.service';
import { persistSecurityAuditEvent } from '../modules/security-audit/security-audit-persist';

export type PlatformSecurityEventType = 'platform.abuse.throttled' | 'platform.deny.shaped';

export type PlatformSecurityEvent = Readonly<{
  type: PlatformSecurityEventType;
  ip?: string;
  path?: string;
  statusCode?: number;
}>;

/**
 * Non-secret platform security signals for later audit products (V3-S04-e).
 * Emits structured logs only; searchable audit UI remains V3-S05.
 */
export function emitPlatformSecurityEvent(
  logger: Logger,
  event: PlatformSecurityEvent,
  audit?: SecurityAuditService,
): void {
  const context = {
    event: event.type,
    outcome: platformOutcomeFor(event.type),
    ip: event.ip,
    path: event.path,
    statusCode: event.statusCode,
  };
  logger.warn('Platform security event', context);
  void persistSecurityAuditEvent(audit, event.type, context, 'security-platform');
}

function platformOutcomeFor(type: PlatformSecurityEventType): string {
  if (type === 'platform.abuse.throttled') return 'throttled';
  return 'denied';
}
