import type { LogContext } from '../../logging/logger';
import { toSecurityAuditWrite } from './security-audit-emitter.adapter';
import type { SecurityAuditService } from './security-audit.service';

/** Internal append path for structured security emitters (V3-S05-a). */
export async function persistSecurityAuditEvent(
  audit: SecurityAuditService | undefined,
  eventType: string,
  context: LogContext | undefined,
  source: string,
): Promise<void> {
  if (!audit) return;
  const write = toSecurityAuditWrite(eventType, context, source);
  if (write) await audit.record(write);
}
