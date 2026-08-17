/**
 * Fail-closed plaintext persist (V3-S03-b).
 * Ciphertext is the only allowed persist form. Production-like and process-memory
 * both refuse plaintext.
 */

import { VaultUnavailableError } from './vault-errors';

export const PersistMode = {
  ProcessMemory: 'process_memory',
  ProductionLike: 'production_like',
} as const;

export type PersistMode = (typeof PersistMode)[keyof typeof PersistMode];

export function refusePlaintextDurablePersist(_mode: PersistMode): void {
  throw new VaultUnavailableError('Vault cannot persist plaintext secrets.');
}

export function isProductionLikePersist(nodeEnv: string | undefined): boolean {
  return nodeEnv === 'production';
}
