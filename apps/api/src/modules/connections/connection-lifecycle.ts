import { ConflictException } from '@nestjs/common';
import type { ConnectionStatus } from './connections.service';

const TRANSITIONS: Readonly<Record<ConnectionStatus, readonly ConnectionStatus[]>> = {
  DISCONNECTED: ['PENDING_VALIDATION', 'DISABLED', 'REVOKED'],
  PENDING_VALIDATION: [
    'CONNECTED',
    'VALIDATION_FAILED',
    'HANDSHAKE_TIMEOUT',
    'PROVIDER_UNAVAILABLE',
    'AUTHENTICATION_FAILED',
  ],
  CONNECTED: ['DISCONNECTED', 'DISABLED', 'REVOKED'],
  VALIDATION_FAILED: ['DISCONNECTED', 'PENDING_VALIDATION', 'DISABLED', 'REVOKED'],
  HANDSHAKE_TIMEOUT: ['DISCONNECTED', 'PENDING_VALIDATION', 'DISABLED', 'REVOKED'],
  PROVIDER_UNAVAILABLE: ['DISCONNECTED', 'PENDING_VALIDATION', 'DISABLED', 'REVOKED'],
  AUTHENTICATION_FAILED: ['DISCONNECTED', 'PENDING_VALIDATION', 'DISABLED', 'REVOKED'],
  DISABLED: ['REVOKED'],
  REVOKED: ['DISCONNECTED'],
};

const VALIDATION_START_STATUSES: readonly ConnectionStatus[] = [
  'DISCONNECTED',
  'VALIDATION_FAILED',
  'HANDSHAKE_TIMEOUT',
  'PROVIDER_UNAVAILABLE',
  'AUTHENTICATION_FAILED',
];

const DISABLE_STATUSES: readonly ConnectionStatus[] = [
  'DISCONNECTED',
  'CONNECTED',
  'VALIDATION_FAILED',
  'HANDSHAKE_TIMEOUT',
  'PROVIDER_UNAVAILABLE',
  'AUTHENTICATION_FAILED',
];

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

export function canStartConnectionValidation(status: ConnectionStatus): boolean {
  return VALIDATION_START_STATUSES.includes(status);
}

export function canDisableConnection(status: ConnectionStatus): boolean {
  return DISABLE_STATUSES.includes(status);
}
