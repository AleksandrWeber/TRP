import { ConflictException } from '@nestjs/common';
import type { ConnectionStatus } from './connections.service';

const TRANSITIONS: Readonly<Record<ConnectionStatus, readonly ConnectionStatus[]>> = {
  DISCONNECTED: ['PENDING_VALIDATION', 'DISABLED', 'REVOKED'],
  PENDING_VALIDATION: ['CONNECTED', 'VALIDATION_FAILED'],
  CONNECTED: ['DISCONNECTED', 'DISABLED', 'REVOKED'],
  VALIDATION_FAILED: ['DISCONNECTED', 'PENDING_VALIDATION', 'DISABLED', 'REVOKED'],
  DISABLED: ['REVOKED'],
  REVOKED: ['DISCONNECTED'],
};

export function assertConnectionTransition(
  from: ConnectionStatus,
  to: ConnectionStatus,
): ConnectionStatus {
  if (!TRANSITIONS[from].includes(to)) {
    throw new ConflictException('Connection cannot transition to the requested state.');
  }
  return to;
}

export function canTransitionConnection(from: ConnectionStatus, to: ConnectionStatus): boolean {
  return TRANSITIONS[from].includes(to);
}
